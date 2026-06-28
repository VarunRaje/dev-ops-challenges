# Linux Process Troubleshooting

## Technical Overview

A **process** is an executing instance of a program in memory, managed by the Linux kernel. A core task of systems administrators and DevOps engineers is ensuring that system services start and run reliably. When a service fails, it is often due to resource constraints, permission locks, configuration errors, or process-level conflicts (e.g., port collisions).

Diagnosing these failures requires understanding how to audit running processes, send signals to control execution, and inspect diagnostic logs.

This guide outlines core process monitoring utilities, explains Unix process signals (`kill`), details the steps to identify a service port conflict on Nautilus App Servers where `sendmail` is blocking Apache `httpd` on port `5004`, and details how to resolve the conflict and start Apache.

---

## Core Process Diagnostic Utilities

### 1. Inspecting Process States
* **`ps` (Process Status):** Displays a snapshot of current active processes.
  * `ps aux`: Displays all processes running in the system (`a` = all users, `u` = user-oriented format, `x` = processes without controlling terminals).
  * `ps -ef`: Displays all processes with full command details (`e` = select all processes, `f` = full format listing).
* **`top` / `htop` (Table of Processes):** Provides a real-time, interactive view of running processes, displaying system resource usage (CPU, memory, load average) and sorting tasks by activity.
* **`pstree`:** Displays running processes as a tree structure, visually mapping parent-child relationships (e.g., finding the parent process that launched a zombie or orphan process).

---

### 2. Process Termination & Signals (`kill`)
Linux uses signals to communicate instructions directly to processes. The `kill` command is used to send these signals using either their symbolic names or numeric IDs:

| Signal Number | Signal Name | Description |
| :---: | :--- | :--- |
| **`1`** | `SIGHUP` | Hangup. Commonly used to instruct a daemon to reload its configuration files without restarting. |
| **`2`** | `SIGINT` | Interrupt. Sent when the user presses `Ctrl+C` in the terminal to request process termination. |
| **`15`** (Default) | `SIGTERM` | Terminate. Requests a process to shut down gracefully, allowing it to save its state and close open files. |
| **`9`** | `SIGKILL` | Kill. Immediately and unconditionally terminates the process at the kernel level. The process cannot catch or ignore this signal (used when a process is unresponsive). |

#### Target Commands:
* **`kill <PID>`:** Sends a signal (defaults to `SIGTERM`) to a specific process ID.
* **`pkill <process_name>`:** Sends a signal to all processes matching the specified name.
* **`killall <process_name>`:** Kills all processes matching the exact name.

---

## Infrastructure & Configuration Requirements
* **Target Hosts:** Nautilus Application Servers (`stapp01`, `stapp02`, `stapp03`)
* **SSH Users:** Standard administrative users (e.g., `tony`, `steve`, `banner`)
* **Target Port:** `5004` (to be used by Apache `httpd`)
* **Conflicting Service:** `sendmail` (found listening on port `5004`)

---

## Step-by-Step Implementation

### Step 1: Identify the Faulty Application Host
SSH into each of the application servers and check the status of the Apache (`httpd`) service:
```bash
# SSH into App Server 1
ssh tony@stapp01
sudo systemctl status httpd
```

On App Server 1 (`stapp01`), the service status shows as **failed** with a binding error in the system logs:
```text
(98)Address already in use: AH00072: make_sock: could not bind to address [::]:5004
no listening sockets available, shutting down
```

---

### Step 2: Audit Port Occupancy
To identify which process is currently occupying port `5004`, run a socket check:
```bash
sudo netstat -tulnp | grep :5004
# Or using ss:
sudo ss -tulpn | grep :5004
```
*Expected output showing Sendmail occupying the port:*
```text
tcp        0      0 127.0.0.1:5004          0.0.0.0:*               LISTEN      777/sendmail: MTA:
```

---

### Step 3: Terminate the Conflicting Process
Because `sendmail` is running on the port reserved for our web server, stop the `sendmail` daemon:
```bash
# Stop the service
sudo systemctl stop sendmail

# Disable the service to prevent it starting on boot
sudo systemctl disable sendmail
```
*(If a phantom process remains stuck on the port, force kill it using its PID: `sudo kill -9 <PID>`)*.

Verify that port `5004` is now free:
```bash
sudo netstat -tulnp | grep :5004
```

---

### Step 4: Verify and Start the Apache Web Server
1. Open the Apache configuration file to ensure the `Listen` directive matches port `5004`:
   ```bash
   sudo vi /etc/httpd/conf/httpd.conf
   ```
   Ensure the line reads:
   ```text
   Listen 5004
   ```
2. Start and enable the Apache service:
   ```bash
   sudo systemctl enable --now httpd
   ```
3. Verify the status:
   ```bash
   sudo systemctl status httpd
   ```

---

### Step 5: Validate Across Remaining Hosts
Ensure that the `httpd` service is running and listening on port `5004` on the other app hosts:
```bash
# Connect to App Server 2
ssh steve@stapp02
sudo systemctl status httpd
sudo netstat -tulnp | grep :5004

# Connect to App Server 3
ssh banner@stapp03
sudo systemctl status httpd
sudo netstat -tulnp | grep :5004
```

---

## Post-Deployment Verification

### 1. Test Service Port Sockets
Confirm Apache is listening on port `5004` across all app hosts:
```bash
sudo netstat -tulnp | grep :5004
```
*Expected output:*
```text
tcp        0      0 0.0.0.0:5004            0.0.0.0:*               LISTEN      917/httpd
```

### 2. Verify Remote Accessibility
From the Jump Host, query the HTTP headers of the app servers to verify successful connections:
```bash
curl -I http://stapp01:5004
curl -I http://stapp02:5004
curl -I http://stapp03:5004
```
*Expected output:*
```text
HTTP/1.1 200 OK
...
Server: Apache/2.4.6 (CentOS)
```

Log out of the Application Server:
```bash
exit
```

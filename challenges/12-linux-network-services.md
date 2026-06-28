# Linux Network Services

## Technical Overview
In production server administration, network services must run on their configured ports without interference. A common network conflict occurs when two daemons attempt to bind to the same IP address and TCP/UDP port combination. The operating system allows only one process to listen on a specific port at any given time; the second process trying to bind to that port will fail to start and throw an `Address already in use` error.

To resolve these conflicts, systems administrators must be proficient with Linux network diagnostics and service management utilities.

This guide provides detailed documentation of standard diagnostic tools—**`systemctl`**, **`netstat`**, and **`lsof`**—outlines the steps to resolve a port conflict on Nautilus App Server 1 where `sendmail` is blocking the Apache `httpd` web server on port `3004`, and details the firewall configuration to allow public traffic.

---

## Core Linux Diagnostic Utilities

### 1. `systemctl` (Systemd Control)
Systemd is the default init system for most modern Linux distributions, responsible for bootstrapping user space and managing system processes.
* **`systemctl status <service>`:** Displays the operational state (active, inactive, failed), PID, CPU/Memory usage, and recent log traces for a service.
* **`systemctl start/stop/restart <service>`:** Controls the runtime state of a daemon.
* **`systemctl enable/disable <service>`:** Configures a service to start or skip starting automatically during system boot.

---

### 2. `netstat` (Network Statistics) & `ss` (Socket Statistics)
These utilities inspect active network sockets, routing tables, and interface configurations:
* **Common Flags:**
  * `-t`: Display TCP connections.
  * `-u`: Display UDP connections.
  * `-l`: Show only listening sockets (ready to accept connections).
  * `-n`: Show numerical addresses and ports (prevents resolving DNS names or service mappings like `http` or `ssh`, which speeds up the command).
  * `-p`: Display the PID and program name owning the socket (requires `sudo` privileges).
* **Usage:**
  ```bash
  sudo netstat -tulnp
  # Modern alternative (ss is faster and queries kernel space directly):
  sudo ss -tulpn
  ```

---

### 3. `lsof` (List Open Files)
In Unix-like systems, "everything is a file" (including hardware devices, directories, and network sockets). The `lsof` command lists all open files and the processes that opened them:
* **`lsof -i :<port>`:** Filters results to show only processes listening or communicating on a specific port.
  ```bash
  sudo lsof -i :3004
  ```
* **`lsof -p <PID>`:** Lists all files, libraries, and network sockets opened by a specific process ID.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus App Server 1 (`stapp01`)
* **SSH User:** `tony`
* **Target Web Port:** `3004` (to be used by Apache `httpd`)
* **Conflicting Service:** `sendmail` (listening on port `3004` instead of standard port `25`)
* **Sendmail Config Path:** `/etc/mail/sendmail.mc`

---

## Step-by-Step Implementation

### Step 1: Connect to the Application Server
SSH into App Server 1 from the Jump Host:
```bash
ssh tony@stapp01
```

---

### Step 2: Diagnose the Port Occupancy
When trying to start Apache `httpd`, the service fails. Inspect which process is currently occupying the target web port `3004`:
```bash
sudo netstat -tulnp | grep :3004
# Or using lsof:
sudo lsof -i :3004
```
*Expected output showing Sendmail occupying the port:*
```text
tcp        0      0 127.0.0.1:3004          0.0.0.0:*               LISTEN      1423/sendmail: MTA:
```

---

### Step 3: Reconfigure Sendmail to Use Default Port 25
Instead of disabling Sendmail, reconfigure its listening port back to the standard SMTP port (`25`):

1. **Open the Sendmail macro configuration file:**
   ```bash
   sudo vi /etc/mail/sendmail.mc
   ```
2. **Locate the daemon options directive** configured for port 3004:
   ```text
   DAEMON_OPTIONS(`Port=3004,Addr=127.0.0.1, Name=MTA')dnl
   ```
3. **Modify the port number** to `25`:
   ```text
   DAEMON_OPTIONS(`Port=25,Addr=127.0.0.1, Name=MTA')dnl
   ```
4. **Save and exit** the editor.
5. **Recompile the configuration:** Rebuild the main `/etc/mail/sendmail.cf` file using the `m4` compiler:
   ```bash
   sudo make -C /etc/mail
   # Alternatively: sudo m4 /etc/mail/sendmail.mc > /etc/mail/sendmail.cf
   ```

---

### Step 4: Restart Sendmail and Release Port 3004
Restart the Sendmail service to apply the configuration change:
```bash
sudo systemctl restart sendmail
```

Verify that port `3004` has been released and `sendmail` is now listening on port `25`:
```bash
sudo netstat -tulnp | grep -E ":3004|:25"
```

---

### Step 5: Start the Apache Web Server
With the port conflict cleared, start the Apache `httpd` daemon:
```bash
sudo systemctl start httpd
```

Verify that `httpd` is active and successfully listening on port `3004`:
```bash
sudo systemctl status httpd
sudo netstat -tulnp | grep :3004
```

---

### Step 6: Configure Firewall (Iptables)
If the web service is running but unreachable from other nodes, configure the local firewall to allow incoming TCP traffic on port `3004`:

```bash
# Add input rule to accept TCP traffic on port 3004
sudo iptables -A INPUT -p tcp --dport 3004 -j ACCEPT

# Save the iptables state to persist across boots
sudo service iptables save
# Or: sudo iptables-save > /etc/sysconfig/iptables
```

---

## Post-Deployment Verification

### 1. Test Web Server Accessibility
From the Jump Host, query the App Server on port `3004` using `curl` to ensure it responds correctly:
```bash
curl -I http://stapp01:3004
```
*Expected response:*
```text
HTTP/1.1 200 OK
...
Server: Apache/2.4.6 (CentOS)
```

Log out of the Application Server:
```bash
exit
```

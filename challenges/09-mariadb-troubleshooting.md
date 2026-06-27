# MariaDB Troubleshooting

## Technical Overview
**MariaDB** is a popular open-source relational database management system (RDBMS) derived from MySQL. In production environments, database services must start reliably and secure data paths. When a database service fails to start, it is critical to follow a logical troubleshooting methodology to isolate and resolve the root cause quickly, minimizing system downtime.

This guide outlines a comprehensive troubleshooting workflow for MariaDB, addresses a common runtime directory permission conflict, explains how Linux handles temporary filesystems, and details the steps to restore the service on Nautilus database servers.

---

## MariaDB Troubleshooting Methodology

When database daemons fail to start or reject connections, follow this systematic diagnostic flow:

### 1. Check Service Status
Query systemd to check the current operational state of the service:
```bash
sudo systemctl status mariadb
```
Look for state indicators like `failed`, `activating (start-post)`, or error codes (e.g., `code=exited, status=1/FAILURE`).

### 2. Inspect Diagnostic Logs
When systemd status indicates a failure, extract detailed startup logs:
* **Systemd Journal:** Check the unit-specific logs to view stdout/stderr streams:
  ```bash
  sudo journalctl -xeu mariadb.service
  ```
* **MariaDB Error Log:** Read the database-specific log file, which contains details about query parsing, storage engine (InnoDB) operations, socket binding, and folder read/write tests:
  ```bash
  sudo tail -n 100 /var/log/mariadb/mariadb.log
  # Note: The log path may be /var/log/mysql/error.log on some distributions.
  ```

### 3. Common MariaDB Failures & Diagnostics

* **Port Conflict:** Verify if another service (or a zombie MySQL process) is already bound to the standard database port `3306`:
  ```bash
  sudo ss -tulpn | grep :3306
  ```
* **Disk Space & Inode Exhaustion:** Databases cannot write logs or commit transactions if the filesystem is full:
  ```bash
  df -h  # Check disk space usage
  df -i  # Check inode usage
  ```
* **Directory Ownership & Permissions:** The `mysql` system daemon runs under the unprivileged system user `mysql`. If database files under `/var/lib/mysql/` or socket/PID directories under `/run/mariadb/` are owned by `root`, the service will fail to launch:
  ```bash
  ls -la /var/lib/mysql
  ls -la /run/mariadb
  ```

---

## Focus Case: `/run/mariadb/` Runtime Directory & tmpfs

A common source of failure on database hosts is the inability of the MariaDB daemon to write its Process ID (PID) file (e.g., `mariadb.pid`) upon startup.

```text
[ERROR] Can't start server: can't create PID file: Permission denied
```

### Why this happens:
1. On modern Linux distributions, `/run/` (historically `/var/run/`) is mounted as a **`tmpfs`** (a temporary, in-memory RAM filesystem).
2. Because `tmpfs` lives purely in RAM, **its entire contents are wiped upon system reboot**.
3. On boot, systemd uses the **`systemd-tmpfiles`** service to parse configuration templates (located in `/usr/lib/tmpfiles.d/` and `/etc/tmpfiles.d/`) and automatically recreate necessary runtime directories with the correct owner and permissions.
4. If a configuration file like `/usr/lib/tmpfiles.d/mariadb.conf` is missing, misconfigured, or has incorrect permissions, `/run/mariadb/` will be created with `root:root` ownership by default instead of `mysql:mysql`. This prevents the `mysql` process from creating its PID file, causing the database startup to crash.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus Database Server (`stdb01`) (or your designated database host)
* **SSH User:** `peter` (or designated sudo user)
* **Troubled Directory:** `/run/mariadb/`
* **Correct Directory Owner:** `mysql` (user and group)

---

## Step-by-Step Implementation

### Step 1: Connect to the Database Server
From the Jump Host, log in to the database server via SSH:
```bash
ssh peter@stdb01
```

---

### Step 2: Diagnose the Service Failure
Check the status of the MariaDB service:
```bash
sudo systemctl status mariadb
```

Inspect the tail end of the MariaDB error log to identify the error:
```bash
sudo tail -n 20 /var/log/mariadb/mariadb.log
```
*Expected log error indicating the issue:*
```text
[ERROR] Could not create unix socket lock file /run/mariadb/mariadb.sock.lock: Permission denied
[ERROR] Can't start server: Bind on unix socket: Permission denied
[ERROR] Do you already have another mysqld server running on socket: /run/mariadb/mariadb.sock ?
[ERROR] Aborting
```

---

### Step 3: Check Directory Permissions
List the ownership of the `/run/mariadb` parent directory:
```bash
ls -ld /run/mariadb
```
*Output showing incorrect root ownership:*
```text
drwxr-xr-x 2 root root 40 Jun 27 18:00 /run/mariadb
```

---

### Step 4: Fix Ownership and Permissions
Modify the directory ownership to grant read, write, and execute privileges back to the `mysql` daemon user:
```bash
sudo chown -R mysql:mysql /run/mariadb/
```

Verify that ownership has updated correctly:
```bash
ls -ld /run/mariadb
```
*Expected output:*
```text
drwxr-xr-x 2 mysql mysql 40 Jun 27 18:00 /run/mariadb
```

---

### Step 5: Start the MariaDB Service
With directory permissions restored, start the database service:
```bash
sudo systemctl start mariadb
```

Verify that the service has successfully transitioned to an `active (running)` state:
```bash
sudo systemctl status mariadb
```

---

## Post-Deployment Verification

Verify that the PID file and socket files have been successfully created under the runtime directory:
```bash
ls -la /run/mariadb
```

*Expected output structure:*
```text
srwxrwxrwx 1 mysql mysql  0 Jun 27 18:15 mariadb.sock
-rw-rw---- 1 mysql mysql  5 Jun 27 18:15 mariadb.pid
```

Log out of the Database Server:
```bash
exit
```

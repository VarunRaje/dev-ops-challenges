# Create a Cron Job

## Technical Overview
Automating routine administrative tasks is a core practice in DevOps and system administration. In Unix-like operating systems, the **cron** daemon (`crond`) serves as a time-based job scheduler. It enables users to run shell commands, scripts, or system tasks automatically at specific times, dates, or intervals.

Individual user schedules are managed using **crontabs** (cron tables). These are configuration files containing lists of commands and their execution schedules. The system daemon constantly runs in the background and checks the system's crontab files once per minute to determine if any jobs are scheduled for execution.

This guide outlines the complete syntax of the cron expression format, details the steps to install and enable the cron daemon on Nautilus application servers, sets up a cron job for the `root` user that writes to a temporary file every 5 minutes, and verifies its execution.

---

## Understanding the Cron Format

A cron job is defined by a single line containing five time and date fields, followed by the command to execute:

```text
.---------------- minute (0 - 59)
|  .------------- hour (0 - 23)
|  |  .---------- day of month (1 - 31)
|  |  |  .------- month (1 - 12) OR jan,feb,mar,apr...
|  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
|  |  |  |  |
*  *  *  *  *  command to be executed
```

### Cron Operators
To schedule complex intervals, you can use specialized operator characters:

| Operator | Name | Description | Example |
| :---: | :--- | :--- | :--- |
| **`*`** | Wildcard | Represents all possible values in that field. | `*` in the hour field means "every hour". |
| **`,`** | Value List | Specifies a list of discrete values for execution. | `1,3,5` in the hour field means "at 1 AM, 3 AM, and 5 AM". |
| **`-`** | Range | Defines a range of consecutive values. | `1-5` in the day-of-week field means "Monday to Friday". |
| **`/`** | Step / Interval | Specifies step values or repeating intervals. | `*/5` in the minute field means "every 5 minutes". |

### Common Cron Schedule Examples

* **Every minute:** `* * * * *`
* **Every 5 minutes:** `*/5 * * * *`
* **At the top of every hour:** `0 * * * *`
* **Daily at midnight:** `0 0 * * *`
* **Every Sunday at 4:30 AM:** `30 4 * * 0`
* **First day of every month at 2:00 AM:** `0 2 1 * *`
* **Weekday working hours (9 AM to 5 PM, Mon-Fri):** `0 9-17 * * 1-5`

---

## Infrastructure & Configuration Requirements
* **Target Hosts:** Nautilus Application Servers (e.g., `stapp01`, `stapp02`, `stapp03`)
* **SSH Users:** Standard administrative users (e.g., `tony`, `steve`, `banner`)
* **Cron Execution Identity:** `root`
* **Cron Schedule:** Every 5 minutes (`*/5 * * * *`)
* **Target Command:** `echo hello > /tmp/cron_text`

---

## Step-by-Step Implementation

Apply the following setup instructions to **each** of your application servers:

### Step 1: Connect to the Server
SSH into the target application server from the Jump Host:
```bash
# Example for App Server 1
ssh tony@stapp01
```

---

### Step 2: Install the Cron Utility
By default, some minimal server environments might not have the cron package pre-installed. Install `cronie` (the standard cron daemon for RHEL/CentOS):
```bash
sudo yum install -y cronie
```

---

### Step 3: Start and Enable the Cron Service
Ensure the cron daemon is configured to start automatically on system boot and start the service in the current session:
```bash
# Start and enable the service
sudo systemctl enable --now crond
```

Verify that the daemon is active and running:
```bash
sudo systemctl status crond
```

---

### Step 4: Configure the Cron Job for the Root User
Open the crontab editor for the `root` user. Using the `crontab` tool ensures that your configuration is syntax-validated before saving:
```bash
sudo crontab -e
```

Add the following line to the crontab configuration:
```text
*/5 * * * * echo hello > /tmp/cron_text
```

Save and close the editor. If you are using the default `vi` editor:
1. Press `Esc`.
2. Type `:wq` and press `Enter`.
3. The terminal should display: `crontab: installing new crontab`.

---

## Post-Deployment Verification

### 1. Inspect the Active Crontab
Verify that the cron job was successfully written and is active for the `root` user:
```bash
sudo crontab -l
```
*Expected output:*
```text
*/5 * * * * echo hello > /tmp/cron_text
```

### 2. Monitor Log Execution
Check the cron utility logs under `/var/log/cron` to verify that the cron daemon is executing the scheduled job:
```bash
sudo tail -f /var/log/cron
```
*Expected execution trace snippet:*
```text
Jun 27 12:00:01 stapp01 CROND[10245]: (root) CMD (echo hello > /tmp/cron_text)
```

### 3. Check the Output File
Wait at least 5 minutes for the job to fire, and verify that the output file `/tmp/cron_text` has been created with the expected content:
```bash
cat /tmp/cron_text
```
*Expected output:*
```text
hello
```

Log out of the Application Server to return to the Jump Host:
```bash
exit
```

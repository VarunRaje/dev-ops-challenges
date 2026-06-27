# SELinux Installation and Configuration

## Technical Overview
Security-Enhanced Linux (**SELinux**) is a Linux kernel security module that provides support for access control security policies, including mandatory access controls (MAC). It classifies system operations into policies to restrict resource access to only what is explicitly permitted.

SELinux operates in one of three states:
1. **Enforcing:** Default state. Policies are active, and any access violating the policy is denied and logged.
2. **Permissive:** Policies are loaded, but violations are only logged as warnings without being blocked.
3. **Disabled:** SELinux is completely turned off. No security policies are loaded or logged.

While SELinux provides robust security, it can sometimes conflict with custom system setups, non-standard application paths, or containerized environments. In legacy setups or during validation phases, it is common to permanently disable SELinux. Changing this setting in `/etc/selinux/config` ensures that the configuration persists across system reboots.

This guide outlines the steps to install standard SELinux packages on RHEL/CentOS application servers, update the boot configuration to permanently disable SELinux, and verify the changes.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus App Server (e.g., `stapp01`, `stapp02`, `stapp03`)
* **SSH User:** Standard administrative user (e.g., `tony`, `steve`, `banner`)
* **SELinux Configuration File:** `/etc/selinux/config`
* **Target Policy Value:** `SELINUX=disabled`
* **Required Package Dependencies:** `policycoreutils`, `selinux-policy`, `selinux-policy-targeted`

---

## Step-by-Step Implementation

### Step 1: Connect to the Target Host
Access the designated application server via SSH from the Jump Host:
```bash
# Example for App Server 1
ssh tony@stapp01
```

---

### Step 2: Install SELinux Packages
Install the required SELinux policy packages using the `yum` package manager:
```bash
sudo yum install -y policycoreutils selinux-policy selinux-policy-targeted
```

---

### Step 3: Configure SELinux to be Permanently Disabled
Open the main SELinux configuration file with superuser privileges:
```bash
sudo vi /etc/selinux/config
```

Locate the line starting with `SELINUX=` (often defaults to `SELINUX=enforcing` or `SELINUX=permissive`). Modify it to:

```text
SELINUX=disabled
```

Save and exit the file (in `vi`, press `Esc`, type `:wq`, and press `Enter`).

> [!WARNING]
> Be careful not to confuse `SELINUX=` with `SELINUXTYPE=`. Modifying the wrong directive can result in system boot failures.

---

### Step 4: Verify the Configuration Changes
To ensure the configuration was saved correctly without restarting the server immediately (which is usually scheduled for a maintenance window), inspect the file content:
```bash
cat /etc/selinux/config | grep -E "^SELINUX="
```

*Expected output:*
```text
SELINUX=disabled
```

---

## Post-Deployment Verification

### Checking Current Runtime State vs. Config State
To inspect the current operational status of SELinux, execute:
```bash
sestatus
```
Alternatively, get the current mode:
```bash
getenforce
```

*Expected post-deployment behavior:*
1. The config file change ensures that after the next system reboot, `sestatus` will report `SELinux status: disabled` and `getenforce` will return `Disabled`.
2. During the current live session, the status may show as `enforcing` or `permissive` if the system hasn't rebooted yet. In KodeKloud challenges, the evaluation script checks the `/etc/selinux/config` file directly to validate the target state.

Log out of the Application Server to return to the Jump Host:
```bash
exit
```

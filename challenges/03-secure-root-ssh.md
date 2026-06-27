# Secure Root SSH Access

## Technical Overview
By default, standard Linux installations may allow the `root` administrative account to log in directly via SSH. Because `root` is a universally known username across all Linux distributions, it is the primary target for malicious automated dictionary and brute-force attacks. 

Disabling direct root SSH access is a fundamental step in securing Linux server infrastructure. Instead, developers and system administrators should log in using their own unprivileged personal accounts and elevate their permissions as needed using the `sudo` privilege layer. This architecture:
* **Prevents direct brute-force attacks** against the superuser account.
* **Enforces accountability** by ensuring all administrative actions are logged under a specific user identity in `/var/log/secure` or `/var/log/auth.log`.
* **Reduces the risk** of accidental commands executed with administrative privileges.

This guide outlines the steps to connect to the **Application Servers**, disable direct root SSH access by modifying the SSH daemon configuration (`sshd_config`), and restart the service to apply the security policy.

---

## Infrastructure & Configuration Requirements
* **Target Hosts:** Application Servers (e.g., `stapp01`, `stapp02`, `stapp03`)
* **SSH Configuration File:** `/etc/ssh/sshd_config`
* **Configuration Directive:** `PermitRootLogin`
* **Secure Value:** `no`

---

## Step-by-Step Implementation

Apply the following steps to **each** of the target application servers:

### Step 1: Connect to the Application Server
From the Jump Host, SSH into the target application server using your standard user credentials:
```bash
# Example for App Server 1
ssh tony@stapp01
```

---

### Step 2: Edit the SSH Daemon Configuration File
Open the SSH daemon configuration file with superuser privileges using your preferred text editor (e.g., `vi` or `nano`):
```bash
sudo vi /etc/ssh/sshd_config
```

Locate the `PermitRootLogin` directive inside the file.
* If the line is commented out with a hash symbol (e.g., `#PermitRootLogin yes`), remove the `#` to uncomment it.
* Update the value to `no`:

```text
PermitRootLogin no
```

Save and exit the text editor (in `vi`, press `Esc`, type `:wq`, and press `Enter`).

---

### Step 3: Restart the SSH Service
For the changes to take effect, restart the SSH daemon (`sshd`) using systemd:
```bash
sudo systemctl restart sshd
```

Verify that the SSH service is active and running correctly:
```bash
sudo systemctl status sshd
```

---

### Step 4: Repeat on Other App Servers
Repeat Steps 1-3 on all other application servers in your environment (e.g., `stapp02` and `stapp03`):
```bash
# Connect to App Server 2
ssh steve@stapp02

# Connect to App Server 3
ssh banner@stapp03
```

---

## Post-Deployment Verification

### 1. Test Direct Root SSH Login (Should Fail)
From the Jump Host, attempt to SSH directly into the target server using the `root` account. The server should immediately reject the connection:

```bash
ssh root@stapp01
```
*Expected output:*
```text
Permission denied (publickey,gssapi-keyex,gssapi-with-mic,password).
```
Even if you enter the correct password, access will be denied.

### 2. Test Standard User SSH Login with Sudo (Should Pass)
Verify that standard users can still successfully log in and run commands with elevated privileges:

```bash
# 1. SSH into the server as standard user
ssh tony@stapp01

# 2. Elevate privileges using sudo
sudo -i
```
The standard user should be authenticated and successfully switch to the root prompt: `root@stapp01:~#`.

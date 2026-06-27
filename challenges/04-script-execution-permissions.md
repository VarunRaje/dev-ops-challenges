# Script Execution Permissions

## Technical Overview
In Linux operating systems, security is enforced through file permissions. Each file has permission bits grouped into three sets of owners: **Owner** (user), **Group**, and **Others** (all other users). Each set can have **Read** (`r`), **Write** (`w`), and **Execute** (`x`) privileges.

For a shell script (e.g., a Bash script) to run successfully, two conditions must be met:
1. **Execute Permission (`x`):** The operating system must be allowed to execute the file as a program.
2. **Read Permission (`r`):** The shell interpreter (e.g., `/bin/bash`) must be able to open and read the commands written inside the script to execute them.

A common system administration pitfall is granting only execute permissions (`chmod +x`) while leaving read permissions restricted. This leads to a `Permission denied` error when standard users attempt to run the script, because the interpreter cannot read the command sequence inside the file. To make a script universally executable, it must be given both read and execute permissions for all users (`r-x`).

This guide details the steps to modify file permissions on `/tmp/xfusioncorp.sh` using both symbolic and numeric (octal) notation, and verify successful script execution.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus App Server (e.g., `stapp01`, `stapp02`, `stapp03`)
* **SSH User:** Standard administrative user (e.g., `tony`, `steve`, `banner`)
* **Script Path:** `/tmp/xfusioncorp.sh`
* **Target Permissions:** Read and execute (`r-x`) for all users (Owner, Group, and Others)

---

## Step-by-Step Implementation

### Step 1: Connect to the Target Host
SSH into the assigned application server from the Jump Host:
```bash
# Example for App Server 1
ssh tony@stapp01
```

---

### Step 2: Inspect Current Script Permissions
Locate the script and inspect its current owner, group, and permissions using the long listing command:
```bash
ls -l /tmp/xfusioncorp.sh
```
*Example starting output showing restricted permissions:*
```text
-r-------- 1 root root 128 Jun 27 11:30 /tmp/xfusioncorp.sh
```
*(In this example, only the root owner can read the file; no other users have read or execute access.)*

---

### Step 3: Grant Read and Execute Permissions
To allow all users to read and execute the script, use the `chmod` utility. You can apply this using either symbolic or numeric mode:

#### Option A: Symbolic Mode (Recommended for targeted updates)
Add read (`r`) and execute (`x`) permissions to all (`a`) users:
```bash
sudo chmod a+rx /tmp/xfusioncorp.sh
```
*Alternatively, you can target specific categories: `sudo chmod u+rx,g+rx,o+rx /tmp/xfusioncorp.sh`.*

#### Option B: Numeric (Octal) Mode (Sets explicit absolute permissions)
Assign `7` (read, write, execute) to the owner, and `5` (read, execute) to the group and others:
```bash
sudo chmod 755 /tmp/xfusioncorp.sh
```

---

### Step 4: Verify the Updated Permissions
Verify that the permission bits have been updated correctly:
```bash
ls -l /tmp/xfusioncorp.sh
```

*Expected output structure:*
```text
-rwxr-xr-x 1 root root 128 Jun 27 11:30 /tmp/xfusioncorp.sh
```
The permission string `rwxr-xr-x` confirms:
* **User (owner):** `rwx` (read, write, execute)
* **Group:** `r-x` (read, execute)
* **Others:** `r-x` (read, execute)

---

## Post-Deployment Verification

### 1. Test Script Execution
Attempt to execute the script directly from the shell path:
```bash
/tmp/xfusioncorp.sh
```
Or navigate to `/tmp` and run it:
```bash
cd /tmp
./xfusioncorp.sh
```
If the permissions are correct, the script should execute successfully and output its designated text or side-effect without throwing a `Permission denied` error.

Log out of the Application Server to return to the Jump Host:
```bash
exit
```

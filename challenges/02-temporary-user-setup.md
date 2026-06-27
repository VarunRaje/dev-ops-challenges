# Temporary User Setup with Expiry

## Technical Overview
In production systems, granting temporary or contract access to engineers or external vendors is a common requirement. Leaving these accounts active indefinitely after the engagement ends creates a severe security vulnerability.

Linux supports native **account aging and expiration** policies. By configuring an explicit expiration date on a user account, the operating system will automatically lock (disable) the account when the specified date is reached, preventing any subsequent login attempts without deleting the user's home directory or files.

This guide outlines the commands to create a new user with a predefined expiration date, modify existing user account aging parameters, and verify expiration details using `useradd` and `chage`.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus App Server 1 (`stapp01`) (or your designated target host)
* **SSH User:** `tony` (or server administrative user)
* **Target User:** `rose` (or the specified temporary user account)
* **Account Expiry Date:** `2026-12-31` (in `YYYY-MM-DD` format)

---

## Step-by-Step Implementation

### Step 1: Connect to the Target Host
Establish an SSH session to the application server:
```bash
ssh tony@stapp01
```

---

### Step 2: Create a New User with an Expiration Date
To create a new user account and simultaneously configure it to expire on a specific date, use the `useradd` command with the `-e` flag:
```bash
sudo useradd -e 2026-12-31 rose
```

**Flag Breakdown:**
* `-e YYYY-MM-DD`: Sets the date on which the user account will be disabled.

Set a password for the newly created user to allow authentication:
```bash
sudo passwd rose
```

---

### Step 3: Configure Expiration on an Existing User
If a user account already exists on the system and you need to set or update its expiration date, use the `chage` (change age) command with the `-E` flag:
```bash
sudo chage -E 2026-12-31 rose
```

**Flag Breakdown:**
* `-E YYYY-MM-DD`: Modifies the account expiration date. Setting this to `0` will immediately expire the account, while setting it to `-1` removes the expiration constraint (sets it to "never").

---

### Step 4: Verify Account Aging and Expiration Info
To confirm that the expiration policy has been applied correctly to the user, query the account aging database using the `chage` listing command:
```bash
sudo chage -l rose
```

**Expected Output:**
```text
Last password change					: Jun 27, 2026
Password expires					: never
Password inactive					: never
Account expires						: Dec 31, 2026
Minimum number of days between password change		: 0
Maximum number of days between password change		: 99999
Number of days of warning before password expires	: 7
```

Verify that the **Account expires** field shows the correct target date.

---

## Post-Deployment Verification
Once the account expiration date has passed, any attempts to log in as the temporary user will be blocked:
```bash
ssh rose@stapp01
```
*Expected console error during expired session attempt:*
```text
Connection closed by stapp01 [preauth]
```
Admin logs will capture the expired login attempt under `/var/log/secure` or `/var/log/auth.log`.
To unlock or re-enable the expired account, simply update the expiry date to a future date:
```bash
sudo chage -E 2027-12-31 rose
```

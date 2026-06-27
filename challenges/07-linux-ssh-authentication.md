# Linux SSH Authentication

## Technical Overview
Secure Shell (**SSH**) key-based authentication provides a cryptographically secure, password-less method to authenticate remote Linux hosts. It relies on asymmetric cryptography, which uses a pair of mathematically linked keys:
1. **Private Key:** Stored securely on the local source system (the client or jump host). This key must never be shared and should be protected with strict local permissions (`600`).
2. **Public Key:** Copied to any remote servers you wish to log into. The public key is appended to the remote user's `~/.ssh/authorized_keys` file.

During the authentication challenge, the remote server encrypts a random challenge message using your public key. If the client can decrypt this message using the matching private key, authentication succeeds without sending sensitive passwords over the network. 

In automated DevOps environments (like Ansible controllers, CI/CD workers, or jump hosts), password-less SSH is critical to enable automated scripting, inventory execution, and secure shell access.

This guide details the steps to generate an RSA key pair as the `thor` user on the **Jump Host**, distribute the public key to all **Nautilus Application Servers**, and verify password-less authentication.

---

## Infrastructure & Configuration Requirements
* **Source Host:** Jump Host (`jump_host`)
* **Source User:** `thor`
* **Destination Hosts & Administrative Identities:**
  * App Server 1: `tony@stapp01`
  * App Server 2: `steve@stapp02`
  * App Server 3: `banner@stapp03`
* **Key Encryption Standard:** RSA (default)

---

## Step-by-Step Implementation

### Step 1: Access the Jump Host
Log in to the Jump Host as the `thor` user:
```bash
ssh thor@jump_host
```

---

### Step 2: Generate an SSH Key Pair
On the Jump Host, generate a new RSA public/private key pair:
```bash
ssh-keygen -t rsa
```

**Interaction Prompt Guidelines:**
1. **Enter file in which to save the key:** Press `Enter` to accept the default file path (`/home/thor/.ssh/id_rsa`).
2. **Enter passphrase:** Press `Enter` to leave it empty (required for password-less automation).
3. **Enter same passphrase again:** Press `Enter` again to confirm.

*Expected terminal output:*
```text
Generating public/private rsa key pair.
Your identification has been saved in /home/thor/.ssh/id_rsa.
Your public key has been saved in /home/thor/.ssh/id_rsa.pub.
The key fingerprint is:
SHA256:d1gK93+J28b... thor@jump_host
The key's randomart image is:
+---[RSA 3072]----+
|      .+=o.      |
|     .o*++       |
|    . ==o..      |
|     +o=o+       |
+----[SHA256]-----+
```

---

### Step 3: Distribute the Public Key to all App Servers
Use the helper utility `ssh-copy-id` to append the Jump Host's public key to the remote user's `authorized_keys` directory on each application server. You will be prompted to enter the destination user's password once for each host:

```bash
# 1. Copy public key to App Server 1
ssh-copy-id tony@stapp01

# 2. Copy public key to App Server 2
ssh-copy-id steve@stapp02

# 3. Copy public key to App Server 3
ssh-copy-id banner@stapp03
```

During each command execution, you will see a prompt to confirm the host key authenticity:
```text
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
tony@stapp01's password: <enter_password>
```
*Expected confirmation output:*
```text
Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'tony@stapp01'"
and check to make sure that only the key(s) you wanted were added.
```

---

## Post-Deployment Verification

### Test Password-less SSH Connection
Verify that you can log in to all target application servers from the Jump Host without being prompted for a password:

```bash
# Test connection to App Server 1
ssh tony@stapp01
```
Upon successful connection, the shell prompt should change immediately to indicate you are logged in:
```text
[tony@stapp01 ~]$
```
Repeat the check for the remaining app servers to ensure all keys are authorized:
```bash
# Exit from stapp01 and check stapp02
exit
ssh steve@stapp02

# Exit from stapp02 and check stapp03
exit
ssh banner@stapp03
```

If all three connections succeed without password prompts, the Linux SSH Authentication task is fully verified and operational.

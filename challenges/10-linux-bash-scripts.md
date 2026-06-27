# Linux Bash Scripts (Automated Backups)

## Technical Overview
In production environments, automated data backup is a critical component of disaster recovery (DR) plans. Automating these procedures using **Bash scripts** reduces human error, guarantees schedule consistency, and speeds up recovery times.

A typical backup automation workflow involves:
1. **Locating Source Data:** Identifying the target files, folders, or databases to back up (e.g., website files under `/var/www/html/`).
2. **Archiving & Compression:** Packing and compressing the directory to reduce storage space and network transfer times (e.g., using `tar` or `zip`).
3. **Local Staging:** Saving the compressed archive in a local storage path (e.g., `/backup/`).
4. **Remote Transfer:** Copying the staging file over a secure network channel to a dedicated backup server (using `scp` or `rsync`).
5. **Security Integration:** Configuring password-less public-key SSH authentication between the servers to ensure the script executes non-interactively without stalling for user inputs.

This guide outlines the steps to configure password-less SSH between an application server and the central backup server, write a robust Bash script (`ecommerce_backup.sh`), and verify automated file delivery.

---

## Infrastructure & Configuration Requirements
* **Source Host:** Nautilus App Server (e.g., `stapp01`, `stapp02`, `stapp03`)
* **SSH User:** Standard administrative user (e.g., `tony`, `steve`, `banner`)
* **Destination Host:** Nautilus Backup Server (`stbkp01`)
* **Destination User:** Backup server identity (e.g., `clinton`)
* **Source Directory:** `/var/www/html/ecommerce/`
* **Local Staging Path:** `/backup/`
* **Script Location:** `/scripts/ecommerce_backup.sh`
* **Compressed Archive Name:** `xfusioncorp_ecommerce.zip`

---

## Step-by-Step Implementation

### Step 1: Connect to the Application Server
SSH into the assigned application server from the Jump Host:
```bash
# Example for App Server 2
ssh steve@stapp02
```

---

### Step 2: Configure Password-less SSH to the Backup Server
To allow the backup script to run automatically without prompting for password credentials during the file transfer step:

1. **Generate SSH Key Pair** on the App Server (press `Enter` through all prompt defaults):
   ```bash
   ssh-keygen -t rsa
   ```
2. **Copy the Public Key** to the target backup server. You will be prompted to enter the backup user's password once:
   ```bash
   # Example copying to user clinton on backup server stbkp01
   ssh-copy-id clinton@stbkp01
   ```
3. **Verify Connection:** Test that you can SSH to the backup server without entering a password:
   ```bash
   ssh clinton@stbkp01
   ```
   *Expected result: Immediate terminal prompt switch to `[clinton@stbkp01 ~]$` without a password challenge. Type `exit` to return to the App Server.*

---

### Step 3: Create Local Staging & Script Directories
Create the folders required to house the script and store the local backup files. Set appropriate ownership if necessary:
```bash
sudo mkdir -p /scripts /backup
sudo chown -R $USER:$USER /scripts /backup
```

---

### Step 4: Install the Compression Utility
Ensure the `zip` utility package is installed on the server:
```bash
sudo yum install -y zip
```

---

### Step 5: Write the Backup Script
Create the backup script file using a text editor:
```bash
vi /scripts/ecommerce_backup.sh
```

Paste the following script content into the file. It zips the target directory and transfers it to the remote server using `scp`:
```bash
#!/bin/bash

# Define variables
SOURCE_DIR="/var/www/html/ecommerce"
BACKUP_DIR="/backup"
ARCHIVE_NAME="xfusioncorp_ecommerce.zip"
BACKUP_SERVER="stbkp01"
BACKUP_USER="clinton"

# 1. Compress the website files into a local zip archive
zip -r "${BACKUP_DIR}/${ARCHIVE_NAME}" "${SOURCE_DIR}"

# 2. Transfer the archive to the remote backup server
scp "${BACKUP_DIR}/${ARCHIVE_NAME}" "${BACKUP_USER}@${BACKUP_SERVER}:${BACKUP_DIR}/"
```

Save and exit the file (in `vi`, press `Esc`, type `:wq`, and press `Enter`).

---

### Step 6: Grant Execution Permissions
Make the script executable so it can be run directly:
```bash
chmod +x /scripts/ecommerce_backup.sh
```

---

## Post-Deployment Verification

### 1. Test Run the Script
Manually execute the script to verify that it completes without warnings or prompts:
```bash
/scripts/ecommerce_backup.sh
```

### 2. Verify Local Staging Archive
Confirm that the compressed `.zip` archive exists in the local backup folder:
```bash
ls -lh /backup/
```
*Expected output:*
```text
-rw-r--r-- 1 steve steve 12M Jun 27 18:20 xfusioncorp_ecommerce.zip
```

### 3. Verify Remote Transfer
SSH into the backup server and check that the file has been successfully copied into the target backup folder:
```bash
ssh clinton@stbkp01 "ls -lh /backup/"
```
*Expected output:*
```text
-rw-r--r-- 1 clinton clinton 12M Jun 27 18:20 xfusioncorp_ecommerce.zip
```

Log out of the Application Server:
```bash
exit
```

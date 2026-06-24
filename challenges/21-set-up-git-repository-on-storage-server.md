# Git Repository Setup on Storage Server

## Technical Overview
Git is a distributed version control system designed to handle everything from small to very large projects with speed and efficiency. In a professional DevOps pipeline, a central server is typically designated to host repositories, acting as the single source of truth for development teams. 

When setting up a central Git repository on a remote server, it is standard practice to initialize it as a **bare repository** (using the `--bare` flag). Unlike a standard repository, a bare repository does not contain a working directory—meaning you cannot directly edit or create files within it. Instead, it contains only the Git administrative and tracking metadata (such as history, branches, configuration, and hooks). This architecture prevents accidental edits or merge conflicts directly on the central storage server, ensuring secure and clean synchronization when developers clone, push, or pull code.

This guide outlines the steps to install Git on the **Storage Server** (`ststor01`), initialize a bare repository at the specified path, and verify the repository structure.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Storage Server (`ststor01`)
* **SSH User:** `natasha`
* **Jump Host:** Jump Host (`jump_host`)
* **Repository Path:** `/opt/news.git`
* **Repository Type:** Bare Repository

---

## Step-by-Step Implementation

### Step 1: Connect to the Storage Server
From the Jump Host, establish an SSH session to the Storage Server (`ststor01`) using the `natasha` credentials:
```bash
ssh natasha@ststor01
```

---

### Step 2: Switch to the Root User
To install system packages and create directories under the protected `/opt` directory, elevate your privileges to the root user:
```bash
sudo su -
```

---

### Step 3: Install Git
Install the Git package using the `yum` package manager:
```bash
yum install -y git
```

Verify that Git is successfully installed and check its version:
```bash
git --version
```

---

### Step 4: Create and Initialize the Bare Repository
Create the directory for the repository at the required path (`/opt/news.git`) and initialize it as a bare Git repository:
```bash
# 1. Create the repository directory structure
mkdir -p /opt/news.git

# 2. Navigate to the repository directory
cd /opt/news.git

# 3. Initialize as a bare repository
git init --bare
```

---

### Step 5: Verify the Repository Configuration
Ensure the bare repository has been successfully initialized. Since it is a bare repository, the root of the directory should contain the administrative directories and configuration files directly, rather than a working tree.

List the contents of the repository directory:
```bash
ls -l /opt/news.git
```

*Expected output snippet:*
```text
total 16
-rw-r--r-- 1 root root   23 Jun 24 22:15 HEAD
drwxr-xr-x 2 root root    6 Jun 24 22:15 branches
-rw-r--r-- 1 root root   66 Jun 24 22:15 config
-rw-r--r-- 1 root root   73 Jun 24 22:15 description
drwxr-xr-x 2 root root  121 Jun 24 22:15 hooks
drwxr-xr-x 2 root root   21 Jun 24 22:15 info
drwxr-xr-x 4 root root   30 Jun 24 22:15 objects
drwxr-xr-x 4 root root   31 Jun 24 22:15 refs
```

Alternatively, verify using the `file` command on the repository path or configuration:
```bash
file /opt/news.git
```

---

## Post-Deployment Verification

Log out of the Storage Server to return to the Jump Host:
```bash
exit # Exit from root session
exit # Exit from ststor01 SSH session
```

At this point, developers can push and pull from this repository using the SSH path:
```bash
git clone ssh://natasha@ststor01/opt/news.git
```

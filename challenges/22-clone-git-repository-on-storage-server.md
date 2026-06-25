# Clone Git Repository on Storage Server

## Technical Overview
Cloning is the process of creating a complete, local copy of a remote Git repository, including all of its history, commits, branches, and tags. In a centralized Git workflow, developers clone a central repository to their local environment or deployment servers to collaborate, test, or deploy changes.

Unlike working with a central **bare repository** (which has no working directory), cloning a bare repository produces a non-bare local repository with a checkout of the default branch's files (unless specified otherwise). In multi-tier systems, repositories are often cloned to specific storage or application server directories so that scripts or deployment workers can access and execute application source files. When executing local clones or system integrations, it is critical to perform these operations as the correct unprivileged system user to prevent ownership conflicts and access control errors.

This guide outlines the steps to SSH into the **Storage Server** (`ststor01`), clone a designated repository from `/opt/` into the destination directory `/usr/src/kodekloudrepos` as the unprivileged user `natasha`, and verify the local clone structure.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Storage Server (`ststor01`)
* **SSH User:** `natasha`
* **Jump Host:** Jump Host (`jump_host`)
* **Source Repository Path:** `/opt/xfusioncorp_official.git` (or the specified repository path in your lab, e.g., `/opt/official.git` or `/opt/apps.git`)
* **Destination Directory:** `/usr/src/kodekloudrepos`

---

## Step-by-Step Implementation

### Step 1: Connect to the Storage Server
From the Jump Host, establish an SSH session to the Storage Server (`ststor01`) using the `natasha` user credentials:
```bash
ssh natasha@ststor01
```

---

### Step 2: Navigate to the Destination Directory
Change your active directory context to the requested destination path where the repository must be cloned:
```bash
cd /usr/src/kodekloudrepos
```

---

### Step 3: Clone the Git Repository
Clone the target bare repository from `/opt/` into the current directory. 

> [!IMPORTANT]
> To avoid validation failures and files being owned by root, run the command directly as the `natasha` user without `sudo` privileges. Run `git clone` from inside `/usr/src/kodekloudrepos`.

```bash
git clone /opt/xfusioncorp_official.git
```
*(Note: Replace `/opt/xfusioncorp_official.git` with the specific repository path assigned to you, such as `/opt/official.git` or `/opt/apps.git`.)*

During the cloning process, you might see the following warning:
```text
warning: You appear to have cloned an empty repository.
```
This warning is **expected and normal** if the source repository is a newly created bare repository without any initial commits or files.

---

### Step 4: Verify the Cloned Repository
Ensure the repository has been cloned successfully under the correct path. List the contents of the destination directory:
```bash
ls -la /usr/src/kodekloudrepos
```

*Expected output snippet (assuming `xfusioncorp_official` was cloned):*
```text
drwxr-xr-x 3 natasha natasha 4096 Jun 25 21:55 .
drwxr-xr-x 3 root    root    4096 Jun 25 21:50 ..
drwxr-xr-x 3 natasha natasha 4096 Jun 25 21:55 xfusioncorp_official
```

Navigate inside the cloned repository directory to inspect the hidden `.git` folder structure and check its status:
```bash
cd xfusioncorp_official
git status
```

---

## Post-Deployment Verification

Log out of the Storage Server to return to the Jump Host:
```bash
exit
```

# Git Create Branches

## Technical Overview
Branches are one of the most powerful features in Git. A branch represents an independent line of development. By using branches, developers can work on new features, experiment, or fix bugs in isolation without modifying the main codebase (typically the `master` or `main` branch).

In a DevOps workflow:
* **Feature Isolation:** Work is done on short-lived feature branches, preventing broken code from affecting the production branch.
* **Collaboration:** Multiple developers can work on different parts of the same repository simultaneously.
* **Pull Requests & Code Reviews:** Once work on a branch is complete, it is proposed for merging into `master` via a pull request, allowing for automated testing and peer code reviews.

This guide outlines the steps to SSH into the **Storage Server** (`ststor01`), navigate to the specified repository under `/usr/src/kodekloudrepos/`, switch to the `master` branch, and create a new feature branch named `xfusioncorp_media`.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Storage Server (`ststor01`)
* **SSH User:** `natasha`
* **Jump Host:** Jump Host (`jump_host`)
* **Repository Path:** `/usr/src/kodekloudrepos/media` (or the repository assigned in your lab)
* **New Branch Name:** `xfusioncorp_media`
* **Base Branch:** `master`

---

## Step-by-Step Implementation

### Step 1: Connect to the Storage Server
From the Jump Host, establish an SSH session to the Storage Server (`ststor01`) using the `natasha` user credentials:
```bash
ssh natasha@ststor01
```

---

### Step 2: Navigate to the Repository Directory
Navigate to the path of the target repository:
```bash
cd /usr/src/kodekloudrepos/media
```
*(Note: Replace `media` with the specific repository directory assigned to you in the task description.)*

---

### Step 3: Handle Directory Ownership Permissions (If Required)
If you encounter git warnings about "dubious ownership" because the files are owned by a different user, configure Git to trust this repository directory globally:
```bash
git config --global --add safe.directory /usr/src/kodekloudrepos/media
```

If you face permission issues writing to the git repository configuration or directory, prefix your git commands with `sudo` (e.g., `sudo git checkout master`).

---

### Step 4: Ensure You Are on the Master Branch
Switch to the base branch (`master`) before branching off, ensuring you have the latest baseline:
```bash
git checkout master
```

Verify your current active branch:
```bash
git branch
```
*Expected output snippet:*
```text
* master
```

---

### Step 5: Create and Switch to the New Branch
Create and switch to the new feature branch `xfusioncorp_media` using the checkout command:
```bash
git checkout -b xfusioncorp_media
```

*Expected output snippet:*
```text
Switched to a new branch 'xfusioncorp_media'
```

---

### Step 6: Verify Branch Creation
List all local branches to confirm that the new branch exists and is currently active (marked with an asterisk `*`):
```bash
git branch
```

*Expected output snippet:*
```text
  master
* xfusioncorp_media
```

---

## Post-Deployment Verification
Verify the branch status inside the repository:
```bash
git status
```
The output should confirm you are on the `xfusioncorp_media` branch with no commits or untracked changes:
```text
On branch xfusioncorp_media
nothing to commit, working tree clean
```

Log out of the Storage Server to return to the Jump Host:
```bash
exit
```

# Git Revert Some Changes

## Technical Overview

In collaborative software development, mistakes occur—buggy code gets committed, config files get broken, or features get abandoned. To roll back changes safely, developers must choose between rewriting history or preserving it.

---

### Git Revert vs. Git Reset

Understanding when to use `git revert` versus `git reset` is one of the most critical history management practices in Git:

| Feature | `git revert` (Safe / Public) | `git reset` (Destructive / Local) |
| :--- | :--- | :--- |
| **Operational Mechanism** | Applies the exact **inverse** of the targeted commit as a new commit at the tip of the branch. | Moves the current branch pointer (`HEAD`) backward to a previous target commit. |
| **History Effect** | **Preserves history.** No existing commits are deleted or modified. | **Rewrites history.** Commits newer than the target are removed from the branch timeline. |
| **Collaboration Impact** | **Safe for shared/public branches.** Since it only adds new commits, team members can pull the changes without conflicts. | **Dangerous for shared branches.** Force pushing (`git push --force`) a reset branch diverges other developers' work, causing synchronization conflicts. |
| **Working Directory** | Does not modify untracked or local uncommitted changes unless there is a conflict. | Can discard local changes depending on flags (e.g. `--hard` discards, `--soft` keeps them in staging). |

---

### Common Revert Commands and Scenarios

* **Revert the Latest Commit (`HEAD`):**
  ```bash
  git revert HEAD
  ```
  Undoes the changes introduced by the most recent commit on the active branch and automatically launches a text editor to write the commit message.
* **Revert a Specific Historic Commit:**
  ```bash
  git revert <commit_hash>
  ```
  Applies inverse changes for a specific commit in the middle of your history. If the changes overlap with later work, Git will halt and ask you to resolve merge conflicts.
* **Revert Without Committing (`--no-commit`):**
  ```bash
  git revert -n <commit_hash>
  # Alternatively: git revert --no-commit HEAD
  ```
  Applies the inverse changes directly to your Working Directory and Staging Area (index) but **does not create a commit**. This allows you to inspect the changes or combine multiple reverts into a single commit.

This guide outlines the steps to log in to the **Nautilus Storage Server**, locate the designated repository, audit commit history, and execute a safe rollback by reverting the latest commit.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus Storage Server (`ststor01`)
* **SSH User:** `natasha` (or designated sudo user)
* **Local Repo Path:** `/usr/src/kodekloudrepos/cluster` (or designated repository name)
* **Revert Target:** The latest commit (`HEAD`)
* **Target Commit Message:** `revert cluster`

---

## Step-by-Step Implementation

### Step 1: Connect to the Storage Server
From the Jump Host, SSH into the storage server:
```bash
ssh natasha@ststor01
```

---

### Step 2: Navigate to the Repository
Change directory to the designated local git repository:
```bash
cd /usr/src/kodekloudrepos/cluster
```

---

### Step 3: Inspect the Commit History
Display the recent commit log to identify the latest commit (`HEAD`) and view its description:
```bash
git log --oneline -n 5
```
*Example history log showing the target commit at the top:*
```text
f3a8b2c (HEAD -> master) Add cluster configuration details
e8c3a1b Initial commit
```

---

### Step 4: Revert the Latest Commit
Execute the revert command targeting the latest commit (`HEAD`):
```bash
git revert HEAD
```

**Git Editor Prompt:**
1. Git will automatically launch the default text editor (usually `vi` or `nano`) populated with a default commit message (e.g., `Revert "Add cluster configuration details"`).
2. Delete the default text and enter the requested message:
   ```text
   revert cluster
   ```
3. Save the file and close the editor (in `vi`, press `Esc`, type `:wq`, and press `Enter`).

*Expected terminal output upon saving:*
```text
[master 6d2fa4a] revert cluster
 1 file changed, 1 deletion(-)
 delete mode 100644 cluster_spec.json
```

---

## Post-Deployment Verification

### 1. Inspect the Updated Commit History
Verify that a new revert commit has been added to the top of the branch history:
```bash
git log --oneline -n 5
```
*Expected output:*
```text
6d2fa4a (HEAD -> master) revert cluster
f3a8b2c Add cluster configuration details
e8c3a1b Initial commit
```
*The history shows that the target commit (`f3a8b2c`) remains in place, but the new commit (`6d2fa4a`) has effectively undone its changes.*

### 2. Confirm Working Directory State
List the files in the directory to verify that the file introduced by the reverted commit (e.g., `cluster_spec.json`) has been deleted:
```bash
ls -lh
```

Log out of the Storage Server:
```bash
exit
```

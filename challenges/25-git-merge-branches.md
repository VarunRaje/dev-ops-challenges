# Git Merge Branches

## Technical Overview
In distributed version control systems like **Git**, development is performed in isolation using branches. **Merging** is the process of integrating changes from one branch (typically a feature or hotfix branch) back into another branch (usually the default branch, such as `master` or `main`).

### Types of Merges

1. **Fast-Forward Merge (`ff`):**
   * **When it occurs:** The target branch (`master`) has no new commits since the source branch (`nautilus`) was created.
   * **How Git handles it:** Instead of merging history, Git simply moves the `master` branch pointer forward to the commit at the tip of the `nautilus` branch. No new merge commit is created.
   * **Visual representation:**
     ```text
     Before:  A --- B (master)
                     \
                      C --- D (nautilus)

     After:   A --- B --- C --- D (master, nautilus)
     ```

2. **Three-Way Merge (Non-Fast-Forward):**
   * **When it occurs:** The target branch (`master`) has diverged and received new commits after the source branch (`nautilus`) was branched.
   * **How Git handles it:** Git uses a common base commit (the shared ancestor) and the latest commits of both branches to create a new **"merge commit"** that integrates the history of both paths.
   * **Visual representation:**
     ```text
     Before:  A --- B --- E (master)
                     \
                      C --- D (nautilus)

     After:   A --- B --- E --- F (master)
                     \         /
                      C ----- D (nautilus)
     ```

### Managing Merge Conflicts
A **merge conflict** occurs when the same line of the same file has been modified differently in both branches. Git cannot automatically determine which version is correct, so it halts the merge process and marks the file as conflicted:

```text
<<<<<<< HEAD
<h1>This is the master branch title</h1>
=======
<h1>This is the feature branch title</h1>
>>>>>>> nautilus
```

* **`<<<<<<< HEAD`**: Indicates the beginning of changes in the current checked-out branch.
* **`=======`**: Serves as the divider line between the two versions.
* **`>>>>>>> nautilus`**: Indicates the end of changes in the branch being merged.

**Resolution Steps:**
1. Open the file and manually edit it to keep the desired code.
2. Remove the Git conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
3. Stage the resolved file: `git add <file>`.
4. Commit the resolution: `git commit -m "Resolve merge conflict"`.

This guide outlines the steps to connect to the **Nautilus Storage Server**, create a branch, add a file, merge it into `master`, and push the updates.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus Storage Server (`ststor01`)
* **SSH User:** `natasha` (or designated sudo user)
* **Target Repository Directory:** `/usr/src/kodekloudrepos/ecommerce`
* **Feature Branch Name:** `nautilus`
* **Destination Branch Name:** `master`
* **Target File to Merge:** `/tmp/index.html`

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
cd /usr/src/kodekloudrepos/ecommerce
```

---

### Step 3: Create and Switch to the Feature Branch
Create a new branch named `nautilus` and switch to it immediately:
```bash
git checkout -b nautilus
```
*Alternatively, you can use: `git branch nautilus && git checkout nautilus`.*

---

### Step 4: Add the Target File and Commit
Copy the staging file into the repository, stage it, and create a commit on the `nautilus` branch:
```bash
# 1. Copy the file from /tmp to the repository folder
cp /tmp/index.html .

# 2. Stage the new file
git add index.html

# 3. Commit the changes
git commit -m "Add index.html on nautilus branch"
```

---

### Step 5: Switch Back to the Destination Branch
Navigate back to the main branch (`master`) where the changes will be merged:
```bash
git checkout master
```

---

### Step 6: Merge the Feature Branch
Merge the changes from the `nautilus` branch into the current checked-out branch (`master`):
```bash
git merge nautilus
```
Since `master` has not received any updates in this interval, Git will perform a **Fast-Forward** merge.

---

### Step 7: Push Branches to Remote Origin
Push both the updated `master` branch and the new `nautilus` branch to the central remote repository:
```bash
# 1. Push master branch updates
git push origin master

# 2. Push nautilus branch
git push origin nautilus
```

---

## Post-Deployment Verification

### 1. View the Branch Log Graph
Display a visual representation of your branch history and commits:
```bash
git log --graph --oneline --all
```
*Expected output showing the commit integrated into master:*
```text
* d3b49c0 (HEAD -> master, origin/nautilus, origin/master, nautilus) Add index.html on nautilus branch
* b82e01a Initial commit
```

### 2. Confirm Remote Branches
Verify that the remote repository tracking branches are up to date:
```bash
git branch -a
```
*Expected output:*
```text
* master
  nautilus
  remotes/origin/master
  remotes/origin/nautilus
```

Log out of the Storage Server:
```bash
exit
```

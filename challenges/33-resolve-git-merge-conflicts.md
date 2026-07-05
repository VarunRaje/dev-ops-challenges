# Resolve Git Merge Conflicts

## Technical Overview

In collaborative environments, multiple developers frequently edit the same files concurrently. If two developers modify the same lines of a file in different ways and one developer pushes their changes, Git cannot automatically reconcile the differences when the second developer attempts to merge or pull. This triggers a **Git Merge Conflict**, pausing the merge operation so that an engineer can review and resolve the lines manually.

---

### What is a Git Merge Conflict and Why does it Occur?

A merge conflict occurs when Git is unable to automatically resolve differences in code between two commits. When Git runs into a conflict, it pauses the merge process, marks the conflicted files in the index, and modifies the files in the working directory to display the conflicting segments.

#### Common Causes:
1. **Concurrent line modifications:** Two branches have edited the exact same line of a file.
2. **File deletion conflicts:** One developer deletes a file while another developer modifies the contents of that same file on a different branch.

---

### Anatomy of Conflict Markers

When a conflict is triggered, Git inserts standard conflict markers directly into the affected files to isolate the competing edits:

```text
<<<<<<< HEAD
This is Max's local content (representing your current branch tip)
=======
This is Sarah's remote content (representing the incoming commits being merged)
>>>>>>> origin/master
```

* **`<<<<<<< HEAD`**: Indicates the start of your local changes (on the active branch you are currently working on).
* **`=======`**: The divider line separating the local modifications from the incoming remote modifications.
* **`>>>>>>> <branch_name>`**: Indicates the end of the incoming changes from the remote tracking branch.

To resolve the conflict, you must manually edit the file to select the desired lines, correct any typos, and remove all three marker lines (`<<<<<<<`, `=======`, and `>>>>>>>`) before committing.

---

## Infrastructure & Configuration Requirements

* **Target Host:** Nautilus Storage Server (`ststor01`)
* **SSH User:** `max` (credentials: `max` / `Max_pass123`)
* **Local Repo Path:** `/home/max/story-blog`
* **Target File:** `story-index.txt`
* **Resolution Rule:** Include all four story titles in the correct order, and fix the typo in the third title:
  - Correct title: `The Lion and the Mouse`
  - Typo to fix: `The Lion and the Mooose`

---

## Step-by-Step Implementation

### Step 1: Connect to the Storage Server
From the Jump Host, SSH into the Nautilus storage server as developer `max`:
```bash
ssh max@ststor01
```
*(Enter password `Max_pass123` when prompted).*

---

### Step 2: Navigate to the Repository
Switch directory to Max's local clone of the `story-blog` repository:
```bash
cd /home/max/story-blog
```

---

### Step 3: Trigger the Merge Conflict
Attempt to pull incoming commits from the remote `master` branch. Because Sarah has already pushed her edits to `story-index.txt`, Git will report a conflict:
```bash
git pull origin master
```

*Expected output:*
```text
remote: Enumerating objects: 5, done.
remote: Counting objects: 100% (5/5), done.
remote: Compressing objects: 100% (3/3), done.
remote: Total 3 (delta 1), reused 0 (delta 0)
Unpacking objects: 100% (3/3), done.
From http://git.stratos.local/sarah/story-blog
 * branch            master     -> FETCH_HEAD
Auto-merging story-index.txt
CONFLICT (content): Merge conflict in story-index.txt
Automatic merge failed; fix conflicts and then commit the result.
```

---

### Step 4: Manually Resolve the Conflict
Open the conflicted file `story-index.txt` using a text editor (e.g. `vi` or `nano`):
```bash
vi story-index.txt
```

*Inside the editor, the file will look similar to this:*
```text
The Fox and the Grapes
<<<<<<< HEAD
The Crow and the Pitcher
=======
The Tortoise and the Hare
The Lion and the Mooose
>>>>>>> f8e9d2c56a1b...
```

#### How to resolve:
1. Reconcile the stories so all four exist in the list.
2. Edit the line `The Lion and the Mooose` to correct the typo: `The Lion and the Mouse`.
3. Delete the conflict markers (`<<<<<<< HEAD`, `=======`, and `>>>>>>> f8e9d2c56a1b...`).

*The final, clean file content must look exactly like this:*
```text
The Fox and the Grapes
The Tortoise and the Hare
The Lion and the Mouse
The Crow and the Pitcher
```
*Save and close the file.*

---

### Step 5: Commit and Push the Merge Resolution
Stage the resolved file, commit the merge conflict resolution, and push the update to origin:
```bash
git add story-index.txt
git commit -m "Resolved merge conflicts on story-index.txt and corrected spelling typo"
git push origin master
```

*Expected output:*
```text
Counting objects: 6, done.
Delta compression using up to 4 threads.
Compressing objects: 100% (4/4), done.
Writing objects: 100% (6/6), 625 bytes | 625.00 KiB/s, done.
Total 6 (delta 1), reused 0 (delta 0)
To http://git.stratos.local/sarah/story-blog.git
   f8e9d2c..9a8b7c6  master -> master
```

---

## Post-Deployment Verification

### 1. Verify Log History
Confirm that the merge conflict commit is added and history has converged cleanly:
```bash
git log --oneline --graph -n 5
```
*Expected output showing the merge commit:*
```text
*   9a8b7c6 (HEAD -> master, origin/master) Resolved merge conflicts on story-index.txt and corrected spelling typo
|\  
| * f8e9d2c Sarah's commit: Add Lion and Moose story
* | 1a2b3c4 Max's commit: Add Crow and Pitcher story
|/  
* 0c1d2e3 Initial commit
```

### 2. Verify Final File Contents
Verify that the `story-index.txt` contains exactly 4 lines with the corrected typo:
```bash
cat story-index.txt
```
*Expected output:*
```text
The Fox and the Grapes
The Tortoise and the Hare
The Lion and the Mouse
The Crow and the Pitcher
```

Log out of the Storage Server:
```bash
exit
```

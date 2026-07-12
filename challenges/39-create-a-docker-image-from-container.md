# Create a Docker Image From Container

## Technical Overview

When working with Docker, images are traditionally built using a declarative `Dockerfile` containing configuration steps. However, there are scenarios—such as debugging an interactive sandbox, patching files on the fly, or preserving state during troubleshooting—where you need to save the current state of a running container as a new image. 

Docker provides the `docker commit` command for this exact purpose.

### Deep Dive: How `docker commit` Works

Every Docker container consists of a stack of read-only image layers, topped with a thin, writable **container layer** (often called the "Read-Write layer"). 

When you run, modify, install packages, or create files inside a container, those changes are written exclusively to this Read-Write layer.

```mermaid
graph TD
    subgraph Container State (Running)
        RO1[Base Layer 1: Read-Only] --> RO2[Base Layer 2: Read-Only]
        RO2 --> RW[Container Layer: Read-Write (Modifications/Packages)]
    end
    subgraph Docker Commit Action
        RW -->|docker commit| NewRO[New Image Layer: Read-Only]
    end
    subgraph Committed Image (beta:devops)
        RO1_new[Base Layer 1: Read-Only] --> RO2_new[Base Layer 2: Read-Only]
        RO2_new --> NewRO
    end
```

When you execute `docker commit`:
1. The Docker daemon temporarily pauses the container (by default) to prevent data corruption or inconsistencies while reading the storage layers.
2. It packages the Read-Write container layer, transforming it into a new, immutable **read-only image layer**.
3. It merges the base layers with this new layer and assigns a new **Image ID**, repository name, and tag.

---

## Detailed `docker commit` Reference

### Command Syntax
```bash
docker commit [OPTIONS] CONTAINER [REPOSITORY[:TAG]]
```

### Common Command Options

| Flag | Name | Description |
| :--- | :--- | :--- |
| **`-m`**, **`--message`** | Message | Commit message describing the changes made inside the container (similar to Git commit messages). |
| **`-c`**, **`--change`** | Change | Applies specified Dockerfile instructions to the newly created image (e.g., `ENV`, `CMD`, `ENTRYPOINT`, `EXPOSE`). |
| **`-p`**, **`--pause`** | Pause | Pauses the container during commit (default is `true`). Set to `false` if you wish to commit a live container without pausing execution. |

### Docker Commit Limitations and Best Practices

> [!WARNING]
> While `docker commit` is highly useful for ad-hoc debugging, quick patches, and diagnostics, it is **not recommended** for standard production pipelines:
> 
> * **Black Box Images:** Committing a container creates an undocumented image. There is no code-based audit trail (like a `Dockerfile`) explaining how the image was built.
> * **Image Bloat:** Temporary files, cache folders, and log files created during the interactive session are committed directly, resulting in unnecessarily large image sizes.
> * **Lack of Reproducibility:** You cannot easily recreate the image if the base image updates or if the host architecture changes.
> 
> **Standard Practice:** Use `docker commit` for staging/debugging. Once verified, document the changes in a proper `Dockerfile` and rebuild the image cleanly.

---

## Infrastructure & Configuration Requirements

* **Target Host:** Nautilus App Server 1 (`stapp01`) *(can vary in labs, e.g., `stapp01`, `stapp02`, `stapp03`)*
* **SSH User:** `tony` *(associated with `stapp01`; `steve` for `stapp02`, `banner` for `stapp03`)*
* **Running Container Name:** `ubuntu_latest`
* **Output Image Name:** `beta:devops`

---

## Step-by-Step Implementation

### Step 1: Connect to the Application Server
SSH from the Jump Host to App Server 1:
```bash
ssh tony@stapp01
```
*Provide the server password when prompted.*

---

### Step 2: Verify the Running Container
Locate the container name (`ubuntu_latest`) and check its current status:
```bash
docker ps
```
*Expected Output:*
```text
CONTAINER ID   IMAGE     COMMAND                  CREATED          STATUS          PORTS     NAMES
2d84a7e9e51c   ubuntu    "tail -f /dev/null"      15 minutes ago   Up 15 minutes             ubuntu_latest
```

---

### Step 3: Commit the Container State
Commit the current state of the running `ubuntu_latest` container into a new image named `beta:devops`:
```bash
docker commit ubuntu_latest beta:devops
```
*Alternatively, add metadata using the author and message flags:*
```bash
docker commit -a "Jane Mils" -m "Patched dependencies in container" ubuntu_latest beta:devops
```
*If permissions require, prepend with `sudo`:*
```bash
sudo docker commit ubuntu_latest beta:devops
```

---

## Post-Deployment Verification

### 1. Verify New Image Creation
List the local Docker images to verify that the new image `beta:devops` has been created:
```bash
docker images
```
*Expected Output:*
```text
REPOSITORY   TAG       IMAGE ID       CREATED          SIZE
beta         devops    a1b2c3d4e5f6   10 seconds ago   72.8MB
ubuntu       latest    2d84a7e9e51c   2 weeks ago      72.8MB
```

### 2. Inspect Image Layers
Verify that the committed image has a new layer corresponding to the commit by inspecting the image history:
```bash
docker history beta:devops
```
*This command displays the build layers, showing the new layer created at the top of the layer stack.*

Log out of the Application Server:
```bash
exit
```

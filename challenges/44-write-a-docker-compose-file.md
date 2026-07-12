# Write a Docker Compose File

## Technical Overview

Managing multi-container applications using standard `docker run` commands can quickly become complex, verbose, and error-prone. Each container requires separate flags for port exposures, environment variables, network attachments, and volume mounts. 

**Docker Compose** is a tool that simplifies this process by allowing developers and system administrators to define and manage multi-container Docker applications declaratively using a single **YAML** file (typically named `docker-compose.yml`).

### Core Concepts of Docker Compose

A standard Docker Compose file is structured around three key configurations:

1. **Services (`services`):**
   Defines the distinct containers that make up your application (e.g., a database service, a caching service, and a web server service). You specify the base image, build contexts, environment configurations, and restart policies within each service.
   
2. **Volumes (`volumes`):**
   Defines persistent storage resources that can be shared between multiple services or mounted directly to directories on the host system (bind mounts).
   
3. **Networks (`networks`):**
   Defines virtual isolated networks. By default, Docker Compose sets up a single default network for your application. Each container for a service joins this network and is both reachable and discoverable by other containers using their service name as the hostname.

```mermaid
graph TD
    subgraph Host Machine (Port 6100)
        HostDir["Host Directory (/opt/data/)"]
    end
    subgraph Docker Compose Environment
        httpd["Apache Container (httpd)"]
        httpd -->|Maps Port 80 to Host Port 6100| Host
        HostDir -->|Volume Bind Mount| WebRoot["Container Web Root (/usr/local/apache2/htdocs/)"]
    end
```

---

## Docker Compose Command Reference

Below are the essential commands used to manage environments defined by Docker Compose:

* **`docker compose up`:**
  Builds, (re)creates, starts, and attaches to containers for a service.
  * Use `-d` (detached) mode to run containers in the background: `docker compose up -d`
* **`docker compose down`:**
  Stops and removes containers, networks, volumes, and images created by `up`.
* **`docker compose ps`:**
  Lists the status of running containers managed by the current Compose file.
* **`docker compose logs`:**
  Streams output logs from all running containers in the stack.
* **`docker compose exec <service> <command>`:**
  Executes a command inside the running container of a specific service.

---

## Infrastructure & Configuration Requirements

* **Target Host:** Nautilus App Server 3 (`stapp03`) *(can vary in labs, e.g., `stapp01`, `stapp02`, `stapp03`)*
* **SSH User:** `banner` *(associated with `stapp03`; `tony` for `stapp01`, `steve` for `stapp02`)*
* **File Location (Host):** `/opt/docker/docker-compose.yml`
* **Service Name:** `httpd`
* **Container Name:** `httpd`
* **Base Image:** `httpd:latest`
* **Port Mapping:** Host Port `6100` mapped to Container Port `80`
* **Volume Mount:** Host Directory `/opt/data` mounted to Container Web Root `/usr/local/apache2/htdocs`

---

## Step-by-Step Implementation

### Step 1: Connect to the Application Server
Establish an SSH connection from the Jump Host to App Server 3:
```bash
ssh banner@stapp03
```
*Provide the server password when prompted.*

---

### Step 2: Create the Target Directory
Ensure the target directory exists for the Docker Compose configuration:
```bash
sudo mkdir -p /opt/docker
```

---

### Step 3: Create the docker-compose.yml File
Create and edit the YAML file using a text editor (e.g., `vi`):
```bash
sudo vi /opt/docker/docker-compose.yml
```

Add the following configuration block:
```yaml
version: '3.8'
services:
  httpd:
    image: httpd:latest
    container_name: httpd
    ports:
      - "6100:80"
    volumes:
      - /opt/data:/usr/local/apache2/htdocs
    restart: always
```
*Save and exit the text editor (`:wq`).*

---

### Step 4: Deploy the Stack using Docker Compose
Navigate to the directory containing the Compose file and start the stack in detached mode:
```bash
cd /opt/docker
sudo docker compose up -d
```
*If using older versions of Docker Compose, run `sudo docker-compose up -d` instead.*

---

## Post-Deployment Verification

### 1. Verify Container Status
Check if the service container is active and running:
```bash
docker compose ps
# or
docker ps
```
*Expected Output:*
```text
CONTAINER ID   IMAGE          COMMAND              CREATED         STATUS         PORTS                  NAMES
2a3b4c5d6e7f   httpd:latest   "httpd-foreground"   5 seconds ago   Up 5 seconds   0.0.0.0:6100->80/tcp   httpd
```

### 2. Verify Volume Mount and Service Response
Create a test file in the host data directory and verify that it is served correctly by the web server:
```bash
# Write test file on Host
echo "Nautilus DevOps Team - Challenge 44" | sudo tee /opt/data/index.html

# Query the HTTP service on host port 6100
curl http://localhost:6100
```
*Expected Output:*
```text
Nautilus DevOps Team - Challenge 44
```

Log out of the Application Server:
```bash
exit
```

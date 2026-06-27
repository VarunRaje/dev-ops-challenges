# Install Ansible

## Technical Overview
**Ansible** is an open-source, enterprise-grade IT automation engine that automates infrastructure provisioning, configuration management, application deployment, and cloud orchestration. It allows system administrators and DevOps engineers to describe their target environments in declarative configuration files rather than writing complex, system-specific shell scripts.

### Core Concepts & Architecture

1. **Agentless Architecture:** 
   Unlike traditional systems (such as Chef, Puppet, or SaltStack) which require client-side agents to be installed, running, and updated on every target host, Ansible is completely **agentless**. It connects to target hosts over standard secure channels—principally **SSH** for Linux/Unix and **WinRM** or SSH for Windows. Once connected, Ansible pushes small programs called "Ansible modules" to the nodes, executes them, and removes them when finished. This eliminates the agent footprint, reduces system resource overhead, and minimizes the security attack surface.

2. **Idempotence:** 
   Ansible works on the principle of idempotency. This means that executing an Ansible playbook or module multiple times on a target system will yield the exact same result. If the system is already in the desired state, Ansible will make no changes, preventing configuration drift and unintended side effects.

3. **Declarative Configuration (Playbooks):** 
   Ansible configurations are written in **YAML** (Yet Another Markup Language). These files, known as **Playbooks**, are simple and human-readable. They serve as executable documentation that describes the desired state of a server rather than the sequence of steps to get there.

### Typical Use Cases
* **Configuration Management:** Standardizing package versions, configuring files, managing users, and locking down service parameters across thousands of servers.
* **Continuous Deployment:** Orchestrating rolling application updates across multi-tier clusters.
* **Orchestration:** Executing tasks in a strict sequence (e.g., stopping load balancers, database migration, updating application nodes, and restarting load balancers).
* **Ad-Hoc Task Execution:** Querying system uptime, disk usage, or pushing urgent hotfixes to a group of servers simultaneously.

This guide outlines the steps to connect to the **Jump Host**, update dependencies, globally install **Ansible 4.10.0** using Python `pip3`, and verify its availability system-wide.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Jump Host (`jump_host`)
* **SSH User:** `thor`
* **Installation Tool:** `pip3` (Python Package Installer)
* **Required Version:** `4.10.0`
* **Installation Scope:** Global / System-wide (Accessible by all system users)

---

## Step-by-Step Implementation

### Step 1: Connect to the Jump Host
From your local terminal, log in to the Jump Host as the `thor` user:
```bash
ssh thor@jump_host
```

---

### Step 2: Install and Upgrade Python Pip
Before installing Ansible, ensure that Python 3 and its package installer `pip3` are present on the host and upgraded to the latest version:
```bash
# 1. Install pip3 if not present
sudo yum install -y python3-pip

# 2. Upgrade pip to the latest version globally
sudo pip3 install --upgrade pip
```

---

### Step 3: Install Ansible Globally
To ensure Ansible is globally available to all users on the Jump Host (e.g., standard users and administrators), run the `pip3` installation command prefixed with `sudo`. 

Explicitly specify the required version `4.10.0`:
```bash
sudo pip3 install ansible==4.10.0
```

> [!IMPORTANT]
> If you omit `sudo` and run `pip3 install --user ansible==4.10.0`, the binaries will be placed in a user-local directory (e.g., `/home/thor/.local/bin/`). This will fail the validation check since other users will not be able to execute `ansible` commands.

---

### Step 4: Verify the Global Installation
To confirm that Ansible was installed system-wide, verify that the executable path points to a global location (like `/usr/local/bin/ansible` or `/usr/bin/ansible`) instead of a user's home directory:

```bash
which ansible
```
*Expected output:*
```text
/usr/local/bin/ansible
```

---

## Post-Deployment Verification

Verify the Ansible version and its Python bindings:
```bash
ansible --version
```

*Expected output snippet:*
```text
ansible [core 2.11.12]
  config file = None
  configured module search path = ['/home/thor/.ansible/plugins/modules', '/usr/share/ansible/plugins/modules']
  ansible python module location = /usr/local/lib/python3.9/site-packages/ansible
  ansible collection location = /home/thor/.ansible/collections:/usr/share/ansible/collections
  executable location = /usr/local/bin/ansible
  python version = 3.9.16 (default, Dec  8 2022, 00:00:00) [GCC 11.3.1 20221121 (Red Hat GCC 11.3.1-4)]
```

Log out of the Jump Host:
```bash
exit
```

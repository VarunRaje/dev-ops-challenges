# Apache Custom Port and Virtual Directories Configuration Guide

## Technical Overview
Apache HTTP Server (`httpd`) is a highly modular, open-source web server capable of hosting multiple distinct websites, applications, and directories. In enterprise DevOps environments, web servers are often configured to host multiple static assets or micro-frontends on custom ports to accommodate network routing rules, internal staging processes, or Dockerized reverse-proxy configurations.

This guide details the step-by-step procedure to configure Apache on **App Server 2** (`stapp02`) to serve multiple static websites on a custom port (**5004**), referencing content from backups transferred from the Jump Host.

---

## Infrastructure & Configuration Requirements
* **Target Host:** App Server 2 (`stapp02`)
* **Jump Host:** Jump Host (`jump_host`)
* **Listen Port:** `5004` (Custom Port)
* **Backups Source:** `/home/thor/official` and `/home/thor/apps` on Jump Host
* **Web Directory Mappings:**
  * Official site -> `http://localhost:5004/official/` (Mapped to `/var/www/html/official`)
  * Apps site -> `http://localhost:5004/apps/` (Mapped to `/var/www/html/apps`)

---
å
## Step-by-Step Implementation

### Step 1: Connect to App Server 2
Access the App Server 2 (`stapp02`) from the Jump Host via SSH:
```bash
ssh steve@stapp02
```

---

### Step 2: Install Apache HTTP Server
Update repository packages and install the Apache `httpd` package and its dependencies:
```bash
# Install the httpd package
sudo yum install -y httpd

# Start the Apache service and enable it to persist across reboots
sudo systemctl enable httpd
sudo systemctl start httpd
```

---

### Step 3: Configure Apache to Listen on Port 5004
By default, Apache listens on port 80. Edit the main configuration file to modify the listening port:
```bash
sudo vi /etc/httpd/conf/httpd.conf
```
Locate the `Listen` directive:
```apache
Listen 80
```
Update it to:
```apache
Listen 5004
```

---

### Step 4: Transfer and Deploy Website Backups
First, exit the SSH session on **App Server 2** to return to the **Jump Host**:
```bash
exit
```
On the **Jump Host**, transfer the static website backups to the target app server using `scp`:
```bash
scp -r /home/thor/official steve@stapp02:/tmp/
scp -r /home/thor/apps steve@stapp02:/tmp/
```
Now, log back into **App Server 2**:
```bash
ssh steve@stapp02
```
Move the transferred directories into Apache's document root `/var/www/html/`:
```bash
sudo mv /tmp/official /var/www/html/
sudo mv /tmp/apps /var/www/html/
```
Ensure directory permissions allow Apache to read the files:
```bash
sudo chmod -R 755 /var/www/html/official
sudo chmod -R 755 /var/www/html/apps
```

---

### Step 5: Configure Apache VirtualHost
To ensure Apache correctly serves request routes over port 5004, append a VirtualHost configuration to `/etc/httpd/conf/httpd.conf`:
```bash
sudo vi /etc/httpd/conf/httpd.conf
```
Append the following block at the bottom of the file:
```apache
<VirtualHost *:5004>
    DocumentRoot /var/www/html
    <Directory "/var/www/html">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

---

### Step 6: Restart and Verify the Service
Restart the Apache service to apply the configuration modifications:
```bash
sudo systemctl restart httpd
```
Verify the service status is active:
```bash
sudo systemctl status httpd
```

---

## Post-Deployment Verification

Verify that the websites are reachable and serving content properly on the custom port using `curl`:

```bash
# Test the official website path
curl http://localhost:5004/official/

# Test the apps website path
curl http://localhost:5004/apps/
```

Expected outputs should return the HTML index page content for each respective site backup.

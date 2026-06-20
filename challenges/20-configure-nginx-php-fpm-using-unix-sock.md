# Nginx and PHP-FPM Unix Socket Configuration Guide

## Technical Overview
In high-performance web architectures, Nginx and PHP-FPM can communicate using either TCP sockets (e.g., `127.0.0.1:9000`) or Unix domain sockets (e.g., `unix:/var/run/php-fpm/default.sock`). Unix domain sockets are local to the host and bypass the network stack, avoiding the overhead of loopback routing, TCP headers, and port allocation limits. This yields lower latency and higher throughput, making it the preferred setup for applications deployed on single servers.

This guide outlines the steps to install Nginx and PHP-FPM 8.3 on **App Server 2** (`stapp02`), configure them to communicate over a Unix socket, and verify the setup from the **Jump Host**.

---

## Infrastructure & Configuration Requirements
* **Target Host:** App Server 2 (`stapp02`)
* **Jump Host:** Jump Host (`jump_host`)
* **Nginx Port:** `8092`
* **Nginx Document Root:** `/var/www/html`
* **PHP-FPM Version:** `8.3` (Remi Repository)
* **Unix Socket Path:** `/var/run/php-fpm/default.sock`
* **Static Assets:** `index.php` and `info.php` (already present under `/var/www/html`)

---

## Step-by-Step Implementation

### Step 1: Connect to App Server 2
Access App Server 2 (`stapp02`) from the Jump Host via SSH:
```bash
ssh steve@stapp02
```

---

### Step 2: Install Nginx
Update packages and install the Nginx web server:
```bash
sudo yum install -y nginx
```

---

### Step 3: Configure Nginx to Listen on Port 8092 and Use Unix Socket
Open the main Nginx configuration file:
```bash
sudo vi /etc/nginx/nginx.conf
```

Locate the default `server` block in `/etc/nginx/nginx.conf` and update it to listen on port `8092`, set the document root, and configure PHP-FPM request routing via FastCGI. 

> [!WARNING]
> Ensure you only modify the main HTTP server block. Do not modify any TLS or SSL server blocks if present.

Update the `server` block to look like the following:

```nginx
server {
    listen 8092;
    listen [::]:8092;
    server_name  stapp02;
    root /var/www/html;
    index index.php index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Pass PHP scripts to FastCGI server listening on Unix socket
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/var/run/php-fpm/default.sock;
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }

    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}
```

Start and enable the Nginx service:
```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

Verify that Nginx is active and listening on port `8092`:
```bash
sudo systemctl status nginx
sudo ss -tulpn | grep 8092
```

---

### Step 4: Install PHP-FPM 8.3
By default, the standard CentOS/RHEL app stream may contain older PHP versions. To install PHP-FPM 8.3, enable the EPEL and Remi repositories:

```bash
# Install EPEL repository
sudo dnf install epel-release -y

# Install Remi RPM repository
sudo dnf install https://rpms.remirepo.net/enterprise/remi-release-9.rpm -y

# Enable the PHP 8.3 module from Remi
sudo dnf module list php
sudo dnf module enable php:remi-8.3 -y

# Install PHP, PHP-FPM, and necessary extensions
sudo dnf install php-fpm php php-cli php-common php-mysqlnd php-gd php-xml php-mbstring php-pdo php-opcache -y
```

---

### Step 5: Configure PHP-FPM to use the Unix Socket
By default, PHP-FPM is configured to run as the `apache` user and listen on a TCP port. Update these settings to match Nginx's privileges and use the Unix socket:

Open the default www pool configuration file:
```bash
sudo vi /etc/php-fpm.d/www.conf
```

Locate and modify the following parameters:

1. **User and Group:** Change execution identity to `nginx`
   ```ini
   user = nginx
   group = nginx
   ```

2. **Listening Address:** Point to the specified Unix socket path
   ```ini
   listen = /var/run/php-fpm/default.sock
   ```

3. **Socket Permissions:** Uncomment and configure owner, group, and permissions for the socket file so that Nginx has access to read and write to it
   ```ini
   listen.owner = nginx
   listen.group = nginx
   listen.mode = 0660
   ```

---

### Step 6: Create Socket Parent Directory & Restructure Permissions
Unix sockets are generated dynamically by the PHP-FPM process on startup. If the parent directory `/var/run/php-fpm` does not exist or has incorrect permissions, PHP-FPM will fail to start or cannot initialize the socket.

Create the parent directory and configure Nginx as the owner:
```bash
# Create target directory
sudo mkdir -p /var/run/php-fpm

# Set owner/group to nginx
sudo chown -R nginx:nginx /var/run/php-fpm
```

---

### Step 7: Start PHP-FPM and Restart Nginx
Start and enable the PHP-FPM service, then restart Nginx to bind to the newly created Unix socket:

```bash
# Start and enable PHP-FPM
sudo systemctl enable --now php-fpm
sudo systemctl restart php-fpm

# Restart Nginx
sudo systemctl restart nginx
```

Verify that the socket file has been successfully created with the correct permissions:
```bash
ls -la /var/run/php-fpm/default.sock
```

*Expected output snippet:*
```text
srw-rw---- 1 nginx nginx 0 Jun 20 17:35 /var/run/php-fpm/default.sock
```

---

## Post-Deployment Verification

Log out of App Server 2 to return to the Jump Host:
```bash
exit
```

From the **Jump Host**, query the PHP application endpoints using `curl`:

```bash
# Test the index.php page
curl http://stapp02:8092/index.php

# Test the info.php page (if validation required)
curl http://stapp02:8092/info.php
```

### Expected Output
The first curl request should output the content of the `index.php` page, typically containing:
```text
Welcome to xFusionCorp Industries!
```

If the responses return successfully, the Nginx and PHP-FPM Unix Socket configuration is complete and operational.

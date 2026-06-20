# MariaDB Installation and Configuration Guide

## Technical Overview
MariaDB is a community-developed, commercially supported fork of the MySQL relational database management system (RDBMS). It is a critical component of modern multi-tier web applications, acting as the primary transactional data store. In production environments, such as the Stratos Datacenter, configuring dedicated databases and users with granular permissions ensures security boundary isolation and prevents unauthorized cross-database access.

This guide outlines the step-by-step procedures for installing, configuring, and securing MariaDB on the **Nautilus DB Server**, provisioning the `kodekloud_db10` database, creating the dedicated `kodekloud_roy` user, and allocating full administrative privileges.

---

## Architecture & Credentials Summary
* **Target Host:** Nautilus DB Server (`stdb01`)
* **Environment:** Stratos Datacenter (CentOS / RHEL based)
* **Database Name:** `kodekloud_db10`
* **Database User:** `kodekloud_roy`
* **Authentication Method:** Password-based (`LQfKeWWxWD`)
* **Privilege Scope:** Full administrative privileges (ALL PRIVILEGES) on `kodekloud_db10`

---

## Step-by-Step Implementation

### Step 1: Securely Connect to Nautilus DB Server
Access the target database server (`stdb01`) via SSH using administrative credentials:

```bash
# SSH from Jump Host to the DB Server
ssh peter@stdb01
```

Once connected, escalate privileges to the root account to perform package management and service administration:
```bash
sudo su -
```

---

### Step 2: Install MariaDB Server
Update the local package index and install the MariaDB server package (`mariadb-server`):

```bash
# Update repository packages
yum update -y

# Install MariaDB server and client packages
yum install -y mariadb-server mariadb
```

---

### Step 3: Initialize and Enable the MariaDB Service
Enable the MariaDB service daemon to start automatically on system boot, and initiate the service immediately:

```bash
# Enable the service for system boot persistence
systemctl enable mariadb

# Start the MariaDB service
systemctl start mariadb

# Verify the operational status of the service
systemctl status mariadb
```

*Expected Output snippet showing the service is active:*
```text
● mariadb.service - MariaDB database server
   Loaded: loaded (/usr/lib/systemd/system/mariadb.service; enabled; vendor preset: disabled)
   Active: active (running) since Tue 2026-06-16 20:18:22 UTC; 5s ago
   Main PID: 12456 (mysqld_safe)
```

---

### Step 4: Secure MariaDB Installation (Recommended for Production)
Execute the security script to restrict database access, set a root password, remove anonymous users, and disable remote root login:

```bash
mysql_secure_installation
```

> [!NOTE]
> During the interactive prompt:
> * Enter current password for root (press Enter for none).
> * Set root password? Select **Y** and define a secure password.
> * Remove anonymous users? Select **Y**.
> * Disallow root login remotely? Select **Y**.
> * Remove test database and access to it? Select **Y**.
> * Reload privilege tables now? Select **Y**.

---

### Step 5: Database and User Provisioning
Log into the MariaDB interactive terminal using the root credential established during the previous step:

```bash
mysql -u root -p
```
*Enter your root password when prompted.*

Once the MariaDB monitor prompt is active (`MariaDB [(none)]>`), execute the following commands:

#### 1. Create the Target Database
Initialize an isolated database named `kodekloud_db10` with proper character sets and collations for compatibility:
```sql
CREATE DATABASE kodekloud_db10 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2. Create the Database User
Provision the user identity `kodekloud_roy`. Depending on the access strategy required by application servers:

* **For local access only (same server):**
  ```sql
  CREATE USER 'kodekloud_roy'@'localhost' IDENTIFIED BY 'LQfKeWWxWD';
  ```
* **For remote access (from any host, e.g., Stratos App Servers):**
  ```sql
  CREATE USER 'kodekloud_roy'@'%' IDENTIFIED BY 'LQfKeWWxWD';
  ```

#### 3. Grant Permissions
Grant full privileges to `kodekloud_roy` strictly constrained to the `kodekloud_db10` database:

* **For local access:**
  ```sql
  GRANT ALL PRIVILEGES ON kodekloud_db10.* TO 'kodekloud_roy'@'localhost';
  ```
* **For remote access:**
  ```sql
  GRANT ALL PRIVILEGES ON kodekloud_db10.* TO 'kodekloud_roy'@'%';
  ```

#### 4. Apply Privilege Configuration
Flush the internal privilege tables to apply the access control changes instantly:
```sql
FLUSH PRIVILEGES;
```

#### 5. Exit the Shell
```sql
EXIT;
```

---

## Step 6: Post-Deployment Verification

Verify that the user `kodekloud_roy` can authenticate and possesses full access to the database.

### 1. Test Local Authentication
Authenticate as the newly created user:
```bash
mysql -u kodekloud_roy -pLQfKeWWxWD -d kodekloud_db10
```

### 2. Verify Schema Manipulation Privileges (DDL Validation)
Once connected, create a temporary validation table to confirm write permissions, read the metadata, and drop it:

```sql
-- Use the database
USE kodekloud_db10;

-- Create a verification table
CREATE TABLE test_table (
    id INT AUTO_INCREMENT PRIMARY KEY,
    test_val VARCHAR(50) NOT NULL
);

-- Insert dummy record
INSERT INTO test_table (test_val) VALUES ('Nautilus Validation');

-- Query the table
SELECT * FROM test_table;

-- Clean up/Drop the verification table
DROP TABLE test_table;

-- Terminate connection
EXIT;
```

*Expected Terminal Log:*
```text
MariaDB [kodekloud_db10]> CREATE TABLE test_table (id INT AUTO_INCREMENT PRIMARY KEY, test_val VARCHAR(50) NOT NULL);
Query OK, 0 rows affected (0.01 sec)

MariaDB [kodekloud_db10]> INSERT INTO test_table (test_val) VALUES ('Nautilus Validation');
Query OK, 1 row affected (0.00 sec)

MariaDB [kodekloud_db10]> SELECT * FROM test_table;
+----+---------------------+
| id | test_val            |
+----+---------------------+
|  1 | Nautilus Validation |
+----+---------------------+
1 row in set (0.00 sec)

MariaDB [kodekloud_db10]> DROP TABLE test_table;
Query OK, 0 rows affected (0.01 sec)
```

The database user provisioning and privilege mapping are now complete and fully verified.

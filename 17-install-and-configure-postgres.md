# PostgreSQL Installation and Configuration Guide

## Technical Overview
PostgreSQL is a transactional, SQL-compliant, relational database management system (RDBMS) utilized to persist, organize, and query structured data reliably. In production DevOps environments, establishing isolated database boundaries and distinct user identities with constrained access privileges is fundamental to ensuring multi-tenant data isolation and data integrity.

This implementation guide outlines the precise technical steps required to provision a dedicated database user, create an isolated database entity, and assign full administrative permissions to that user for the specified database within a Red Hat Enterprise Linux (RHEL) or CentOS database infrastructure layer.

---

## Prerequisites & Architecture Details
* **Target Node:** Nautilus Database Server (`stdb01`)
* **Service Context:** PostgreSQL service is pre-installed and running.
* **Administrative Boundary:** Modifying PostgreSQL server configurations or service states (e.g., restarting the `postgresql` daemon) is strictly prohibited to prevent runtime service disruption.

---

## Implementation Guide

### Step 1: Secure Server Access & PostgreSQL Authentication
Establish an encrypted SSH session to the target database host using administrative credentials. Once on the host, shift context to the PostgreSQL administrative command-line interface (`psql`) via the `sudo` privilege layer.

```bash
# 1. Access the target database server via SSH
ssh peter@stdb01

# 2. Enter the PostgreSQL interactive shell using administrative privileges
sudo -u postgres psql
```

Upon successful authentication, the terminal prompt will change to indicate an active session within the master database console:
```sql
postgres=#
```

### Step 2: Database User Provisioning
Within the PostgreSQL architecture, the `CREATE USER` directive acts as a specialized alias for `CREATE ROLE` that automatically appends the `LOGIN` attribute, allowing the newly created identity to authenticate against the database server.

Execute the statement below, replacing placeholders with your target infrastructure credentials:

```sql
-- Create a dedicated database user with an explicit password binding
CREATE USER <db-user> WITH PASSWORD '<db-password>';
```
*Expected Output:*
```sql
CREATE ROLE
```

#### User Verification
To inspect and verify the system's role database and confirm the user exists with appropriate login capabilities, execute the internal meta-command:

```sql
\du
```

---

### Step 3: Database Creation & Privilege Allocation
Create an independent logical database environment and establish access control boundaries by granting full schema privileges to the newly created user identity.

```sql
-- 1. Initialize a new isolated database environment
CREATE DATABASE <db-name>;
```
*Expected Output:*
```sql
CREATE DATABASE
```

```sql
-- 2. Allocate comprehensive permissions on the target database to the designated user
GRANT ALL PRIVILEGES ON DATABASE <db-name> TO <db-user>;
```
*Expected Output:*
```sql
GRANT
```

#### Database Verification
To view the catalog of active databases, their structural encodings, ownership properties, and distinct access control strings, execute the listing meta-command:

```sql
\l
```

---

### Step 4: Verification & Transport Security Validation

To ensure the isolation model and privilege chains are functioning flawlessly, terminate the current administrative session, map a local port loopback connection, and execute an integration check under the identity of the newly created service user.

#### 1. Terminate Administrative Console Session
```sql
\q
```

#### 2. Execute Authenticated Connection Mapping
Initiate a targeted loopback connection explicitly specifying the user identity, targeted database, host binding, and password prompt flag:

```bash
psql -U <db-user> -d <db-name> -h localhost -W
```
*Provide the `<db-password>` when prompted by the runtime interface.*

#### 3. Perform Functional DDL Testing
Validate schema read/write permissions by executing a Data Definition Language (DDL) transaction pattern consisting of an atomic table instantiation followed by a structural teardown:

```sql
-- Instantiate a transient verification relation matrix
CREATE TABLE test_privilege (id serial PRIMARY KEY);

-- Prune the verification relation matrix to restore state cleanliness
DROP TABLE test_privilege;
```

*Expected Verification Output Execution:*
```sql
CREATE TABLE
DROP TABLE
```

The successful execution of these DDL operations without throwing access violation or permission exceptions (`42501`) confirms that the database instance deployment and security profile configurations are production-ready.
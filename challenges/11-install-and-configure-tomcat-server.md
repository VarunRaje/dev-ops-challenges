# Install and Configure Tomcat Server

## Technical Overview
**Apache Tomcat** is an open-source web server and Java Servlet container developed by the Apache Software Foundation. Unlike full Java EE (Enterprise Edition) application servers (like JBoss/WildFly, WebSphere, or WebLogic), Tomcat is a lightweight container implementing only the core Java Web technologies: **Java Servlets**, **JavaServer Pages (JSP)**, **Java Expression Language (EL)**, and **Java WebSockets**.

### Core Architecture & Components

1. **Catalina (Servlet Container):** 
   Catalina is Tomcat’s implementation of the Java Servlet specification. It is the engine that handles web request routing, instantiates servlet objects, manages user sessions, and invokes servlet lifecycle methods (such as `init()`, `service()`, and `destroy()`).

2. **Coyote (HTTP Connector):** 
   Coyote is Tomcat's HTTP/1.1 connector component. It listens for incoming TCP network requests on a designated port (default `8080`), decodes the HTTP protocol streams, wraps them into Java request and response objects, and forwards them to the Catalina engine for processing.

3. **Jasper (JSP Engine):** 
   Jasper is Tomcat's JSP compiler engine. When a client requests a `.jsp` page, Jasper dynamically parses the file and compiles it into a Java Servlet class file, which is then compiled into bytecode and executed by the JVM.

### Use Cases
* **Hosting Java Web Applications:** Running enterprise Java applications packaged as **WAR** (Web Archive) files.
* **REST API Services:** Hosting backend Java APIs built with frameworks like Spring Boot, Jersey, Struts, or Quarkus.
* **Microservices Hosting:** Deploying small, scalable Java-based services behind a reverse proxy (e.g., Nginx or Apache HTTP Server) which handles SSL termination and load balancing.

This guide details the steps to copy the application `ROOT.war` archive from the Jump Host, install Tomcat on the application server, change its connector port to `8085` in `server.xml`, deploy the archive, and verify page delivery.

---

## Infrastructure & Configuration Requirements
* **Target Host:** Nautilus App Server 1 (`stapp01`)
* **SSH User:** `tony`
* **Application Package:** `ROOT.war` (Located at `/tmp/ROOT.war` on the Jump Host)
* **Tomcat Port Configuration:** `8085` (configured in `/etc/tomcat/server.xml`)
* **Tomcat Webapps Directory:** `/usr/share/tomcat/webapps/`

---

## Step-by-Step Implementation

### Step 1: Copy the WAR File to the Application Server
From the Jump Host, copy the `ROOT.war` package to the target server's temporary storage directory using `scp`:
```bash
scp /tmp/ROOT.war tony@stapp01:/tmp/
```

---

### Step 2: Connect to the Application Server
SSH into App Server 1 from the Jump Host:
```bash
ssh tony@stapp01
```

---

### Step 3: Install Apache Tomcat
Install Tomcat along with its administrative web apps and helper tools using the `yum` package manager:
```bash
sudo yum install -y tomcat tomcat-webapps tomcat-admin-webapps
```

---

### Step 4: Configure the Tomcat Listening Port
Open the primary Tomcat configuration file (`server.xml`):
```bash
sudo vi /etc/tomcat/server.xml
```

Locate the connector configuration block (usually searching for port `8080`). Modify the `port` attribute value to `8085`:

```xml
<Connector port="8085" protocol="HTTP/1.1"
           connectionTimeout="20000"
           redirectPort="8443" />
```

Save and exit the file (in `vi`, press `Esc`, type `:wq`, and press `Enter`).

---

### Step 5: Deploy the Web Application Archive (WAR)
Copy the `ROOT.war` file from `/tmp/` to the Tomcat `webapps/` deployment directory. In a standard CentOS installation, Tomcat automatically extracts (deploys) `.war` files placed in this folder.

1. **Delete any existing default ROOT folder** in `webapps`:
   ```bash
   sudo rm -rf /usr/share/tomcat/webapps/ROOT
   ```
2. **Move the new ROOT.war file** to the deployment directory:
   ```bash
   sudo cp /tmp/ROOT.war /usr/share/tomcat/webapps/
   ```
3. **Set correct ownership** so the `tomcat` service user can read and modify the files:
   ```bash
   sudo chown tomcat:tomcat /usr/share/tomcat/webapps/ROOT.war
   ```

---

### Step 6: Start and Enable the Tomcat Service
Configure the Tomcat systemd service to start automatically during system boot and run it in the current session:
```bash
# Start and enable the service
sudo systemctl enable --now tomcat
```

Check the service status to verify that it is running successfully:
```bash
sudo systemctl status tomcat
```

---

## Post-Deployment Verification

### 1. Check Listening Ports
Verify that the Java process is listening on the newly configured port `8085`:
```bash
sudo ss -tulpn | grep :8085
```
*Expected output:*
```text
tcp   LISTEN 0      100    [::]:8085            [::]:*                   users:(("java",pid=12345,fd=43))
```

### 2. Query the Deployed Web Application
Run a local HTTP query using `curl` to confirm the application responds correctly on port `8085`:
```bash
curl -I http://localhost:8085
```
*Expected HTTP response header snippet:*
```text
HTTP/1.1 200 OK
Content-Type: text/html;charset=UTF-8
```

Log out of the Application Server to return to the Jump Host:
```bash
exit
```

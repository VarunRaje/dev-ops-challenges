# KodeKloud Engineer Day 14: Linux Process Troubleshooting

* **Author:** Varun Deshpande
* **Date:** June 08, 2026
* **Series:** 100 Days of DevOps (KodeKloud Engineer Daily Challenge)

---

Hey Everyone! 

I have taken up the KodeKloud Engineer daily challenge **[100 Days of DevOps]** and through this series, we shall slowly but steadily start solving the daily challenges.

* **Challenge Link:** [KodeKloud Engineer Practice](https://engineer.kodekloud.com/practice)
* **Infrastructure Details Reference:** [Nautilus Infrastructure Documentation](https://kodekloudhub.github.io/kodekloud-engineer/docs/projects/nautilus#infrastructure-details)

---

## Day #14 Task: Linux Process Troubleshooting

The production support team of `xFusionCorp Industries` has deployed some of the latest monitoring tools to keep an eye on every service, application, etc. running on the systems. One of the monitoring systems reported Apache service unavailability on one of the app servers in `Stratos DC`.

### Objectives
1. **Identify the faulty app host and fix the issue:** Make sure the Apache service is up and running on all app hosts. They might not have hosted any code yet on these servers, so you don't need to worry if Apache isn't serving any pages. Just make sure the service is up and running.
2. **Port Configuration:** Ensure Apache is running on port **5004** on all app servers. 
*(Note: There is a minor contradiction in the original text mentioning port 8085 in the summary, but the system command verification uses port **5004**, which aligns with the technical environment details).*

---

## Technical Breakdown & Requirements

* **Identify the server where Apache is failing:** A monitoring system flagged that Apache is not available on one of the app hosts (e.g., `stapp01`, `stapp02`, `stapp03`). We need to identify which app server has the Apache service down or in a failed state.
* **Fix Apache on the faulty host:** Bring the service back up. It doesn't matter if it serves content—only that the service is active.
* **Port Validation:** Ensure the configuration (`Listen` directive) is correct on all hosts and is actively using port **5004**.

---

## Step-by-Step Implementation

### Step 1: Identify the server in which the Apache service is failing

SSH into each of the app servers and check the status of the Apache (`httpd`) service.

```bash
thor@jumphost ~$ ssh <app-server-user>@<app-server-name>
```

For instance, checking the service status on `stapp01`:
```bash
[tony@stapp01 ~]$ sudo systemctl status httpd -l
```
*In this problem instance, the service was found in a **failed** state on the first app server (`stapp01`).*

---

### Step 2: Verify why the service is failing and apply the fix

On inspecting the logs, you will likely see a binding error indicating that the address is already in use:

```text
(98)Address already in use: AH00072: make_sock: could not bind to address 0.0.0.0:5004
no listening sockets available, shutting down
AH00015: Unable to open logs
```

This indicates another process is occupying port `5004`. Let's identify the conflicting process:

```bash
[tony@stapp01 ~]$ sudo netstat -tulnp | grep 5004
```
**Output:**
```text
tcp        0      0 127.0.0.1:5004          0.0.0.0:* LISTEN      777/sendmail: accep
```

The output shows that the `sendmail` process is using port `5004`. To free up the port for Apache, we will stop the `sendmail` service:

```bash
# Stop the sendmail process
[tony@stapp01 ~]$ sudo systemctl stop sendmail

# Verify it is successfully stopped
[tony@stapp01 ~]$ sudo systemctl status sendmail
```

**Service Status Output:**
```text
● sendmail.service - Sendmail Mail Transport Agent
   Loaded: loaded (/usr/lib/systemd/system/sendmail.service; enabled; vendor preset: disabled)
   Active: inactive (dead) since Sun 2025-11-23 11:04:34 UTC; 11s ago
  Process: 776 ExecStart=/usr/sbin/sendmail -bd $SENDMAIL_OPTS $SENDMAIL_OPTARG (code=exited, status=0/SUCCESS)
  Process: 772 ExecStartPre=/etc/mail/make aliases (code=exited, status=0/SUCCESS)
  Process: 771 ExecStartPre=/etc/mail/make (code=exited, status=0/SUCCESS)
 Main PID: 777 (code=exited, status=0/SUCCESS)
```

Confirm that the port is now free:
```bash
[tony@stapp01 ~]$ sudo netstat -tulnp | grep 5004
```

Now, verify the configuration file (`/etc/httpd/conf/httpd.conf`) to ensure it's set to listen on port `5004`, then start the Apache service:

```bash
# Open configuration to verify or edit port directives
[tony@stapp01 ~]$ sudo vi /etc/httpd/conf/httpd.conf

# Start the Apache service
[tony@stapp01 ~]$ sudo systemctl start httpd

# Verify Apache status
[tony@stapp01 ~]$ sudo systemctl status httpd
```

**Apache Status Output:**
```text
● httpd.service - The Apache HTTP Server
   Loaded: loaded (/usr/lib/systemd/system/httpd.service; disabled; vendor preset: disabled)
   Active: active (running) since Sun 2025-11-23 11:08:39 UTC; 10s ago
     Docs: man:httpd(8)
           man:apachectl(8)
  Process: 803 ExecStop=/bin/kill -WINCH ${MAINPID} (code=exited, status=1/FAILURE)
 Main PID: 917 (httpd)
   Status: "Total requests: 0; Current requests/sec: 0; Current traffic: 0 B/sec"
   CGroup: /docker/43b41c3c2bd5a5c9731ff6a027e0fe517444d9223913c2e5409a09f6f04c34aa/system.slice/httpd.service
           ├─917 /usr/sbin/httpd -DFOREGROUND
           ├─918 /usr/sbin/httpd -DFOREGROUND
           ├─919 /usr/sbin/httpd -DFOREGROUND
           ├─920 /usr/sbin/httpd -DFOREGROUND
           ├─921 /usr/sbin/httpd -DFOREGROUND
           └─922 /usr/sbin/httpd -DFOREGROUND
```

Verify that Apache is actively listening on port `5004`:
```bash
[tony@stapp01 ~]$ sudo netstat -tulnp | grep 5004
```
**Output:**
```text
tcp        0      0 0.0.0.0:5004            0.0.0.0:* LISTEN      917/httpd
```

---

### Step 3: Validate all other app servers

You must ensure that Apache is up and running on port `5004` across all alternative application hosts using one of the following two approaches:

#### Approach #1: Manual SSH Verification
Log into each individual app server to manually inspect the active port:

```bash
thor@jumphost ~$ ssh <app-server-user>@<app-server-name>
[steve@stapp02 ~]$ sudo systemctl status httpd
[steve@stapp02 ~]$ sudo netstat -tulnp | grep 5004
```

#### Approach #2: Remote HTTP Check
If network and firewall rules permit, verify accessibility directly from the `jumphost` using `curl`:

```bash
thor@jumphost ~$ curl http://<app-server-name>:5004
```

---

That's it for Day #14. Let's hop on to the next challenge! 

See you there! Toodaloo!

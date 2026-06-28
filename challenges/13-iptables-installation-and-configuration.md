# IPtables Installation and Configuration

## Technical Overview

### What is a Firewall?
A **firewall** is a network security system that monitors, filters, and controls incoming and outgoing network traffic based on predetermined security rules. It acts as a barrier between a trusted internal network (e.g., your private subnet) and an untrusted external network (e.g., the internet), preventing unauthorized access and mitigating network-based attacks.

---

### What is IPtables?
**IPtables** is a user-space command-line utility used to configure the IP packet filter rules of the Linux kernel firewall, implemented via the **Netfilter** framework. In Netfilter, packets passing through the network stack are inspected, altered, or routed based on rules grouped into tables and chains.

#### 1. IPtables Tables
Tables group rules based on the type of packet processing decisions being made:
* **`filter` (Default):** Used for standard packet filtering (deciding whether a packet should reach its destination).
* **`nat` (Network Address Translation):** Used to redirect packets or modify source/destination IP addresses and ports (e.g., port forwarding or masquerading).
* **`mangle`:** Used for specialized packet alteration (modifying IP header fields like TTL or TOS).
* **`raw`:** Used to configure exceptions for packet connection tracking (conntrack).

#### 2. IPtables Chains
Each table contains built-in **chains** that represent checkpoints in the network stack where packets are processed:
* **`INPUT`:** Processes incoming packets destined for local sockets (entering the server).
* **`OUTPUT`:** Processes outgoing packets generated locally on the server and leaving.
* **`FORWARD`:** Processes packets that are routed through the server (not destined for the server itself, e.g., in a router or gateway).
* **`PREROUTING`:** Processes packets immediately as they arrive at the network interface (before routing decisions are made).
* **`POSTROUTING`:** Processes packets just before they leave the network interface (after routing decisions are made).

#### 3. Targets (Actions)
When a packet matches a rule, it is directed to a specific target:
* **`ACCEPT`:** Allows the packet to pass through.
* **`DROP`:** Silently discards the packet (the sender receives no response and timeouts occur).
* **`REJECT`:** Discards the packet and sends an error response back to the sender (e.g., an ICMP destination port unreachable message).
* **`LOG`:** Logs details about the matching packet to syslog for audit purposes, then passes the packet to the next rule.

#### 4. Rule Ordering (Top-Down Evaluation)
IPtables rules inside a chain are evaluated sequentially from **top to bottom**. When a packet matches a rule, the designated action is applied immediately, and further rules in the chain are ignored. 

> [!IMPORTANT]
> Because rules are evaluated sequentially, you must place specific allow (`ACCEPT`) rules **before** broad deny (`REJECT` or `DROP`) rules. For example, if you place a generic block-all rule at the top, a later rule allowing a specific IP will never be reached.

This guide outlines the steps to install `iptables`, configure rules to restrict access to a web port so that only the Load Balancer IP can connect, and persist those settings across reboots.

---

## Infrastructure & Configuration Requirements
* **Target Hosts:** Nautilus Application Servers (e.g., `stapp01`, `stapp02`, `stapp03`)
* **SSH Users:** Standard administrative users (e.g., `tony`, `steve`, `banner`)
* **Load Balancer (LBR) IP:** `172.16.238.14` (or your designated LBR IP)
* **Application Port:** `8083` (or your designated Apache port)
* **Firewall Requirement:** Only allow incoming TCP traffic on port `8083` from the Load Balancer. Reject all other traffic on this port.

---

## Step-by-Step Implementation

Apply these configuration steps to **each** application server:

### Step 1: Connect to the Application Server
SSH into the assigned application server from the Jump Host:
```bash
# Example for App Server 1
ssh tony@stapp01
```

---

### Step 2: Install IPtables Services
CentOS/RHEL systems default to `firewalld` as the front-end manager. To use native `iptables` rules, install the service management package:
```bash
sudo yum install -y iptables-services
```

Start and enable the `iptables` service:
```bash
sudo systemctl enable --now iptables
```

Verify the service status:
```bash
sudo systemctl status iptables
```

---

### Step 3: Configure Firewall Rules
Configure the rules sequentially in the `INPUT` chain of the default `filter` table:

1. **Allow incoming traffic** from the Load Balancer IP to the application port:
   ```bash
   sudo iptables -A INPUT -p tcp -s 172.16.238.14 --dport 8083 -j ACCEPT
   ```
   * *`-A INPUT`*: Append to the INPUT chain.
   * *`-p tcp`*: Filter TCP packets.
   * *`-s 172.16.238.14`*: Match traffic originating from this source IP.
   * *`--dport 8083`*: Match traffic destined for this port.
   * *`-j ACCEPT`*: Jump to the ACCEPT target.

2. **Reject all other incoming traffic** on the application port:
   ```bash
   sudo iptables -A INPUT -p tcp --dport 8083 -j REJECT
   ```
   * This rule ensures that any packet attempting to connect to port `8083` from any IP address other than the Load Balancer will be rejected.

---

### Step 4: Persist the Rules Across Boots
By default, rules configured in memory will be lost when the server reboots. Save the active rule configuration to the system persistence file:
```bash
sudo service iptables save
```
*Expected output:*
```text
iptables: Saving firewall rules to /etc/sysconfig/iptables: [  OK  ]
```

Inspect the saved file to ensure the rules are recorded:
```bash
sudo cat /etc/sysconfig/iptables
```

---

## Post-Deployment Verification

### 1. Inspect Active Rules List
List the rules in the `INPUT` chain with numeric formats to verify ordering:
```bash
sudo iptables -L INPUT -n --line-numbers
```
*Expected output snippet:*
```text
Chain INPUT (policy ACCEPT)
num  target     prot opt source               destination
1    ACCEPT     tcp  --  172.16.238.14        0.0.0.0/0            tcp dpt:8083
2    REJECT     tcp  --  0.0.0.0/0            0.0.0.0/0            tcp dpt:8083 reject-with icmp-port-unreachable
```

### 2. Verify Connectivity (Acceptance)
From the Load Balancer host, test connection to the App Server:
```bash
curl -I http://stapp01:8083
```
*Expected output: Successful HTTP headers (200 OK).*

### 3. Verify Connectivity (Rejection)
From any other node (e.g., the Jump Host or a different database server), try to connect to the port:
```bash
curl -I http://stapp01:8083
```
*Expected output:*
```text
curl: (7) Failed connect to stapp01:8083; Connection refused
```

Log out of the Application Server:
```bash
exit
```

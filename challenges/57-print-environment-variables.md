# Print Environment Variables in Kubernetes

## Technical Overview

Modern applications should adhere to the **Twelve-Factor App methodology**, which dictates that configuration should be completely decoupled from application code and stored in the environment. Decoupling configuration allows the same application container image to be deployed across multiple environments (Development, Staging, Production) without modification.

In containerized environments, this is primarily achieved using **Environment Variables**. Kubernetes provides robust mechanisms to inject key-value pairs directly into running container processes.

```mermaid
graph TD
    subgraph Pod: print-envars-greeting
        spec[Pod Spec: env variables] -->|Injects GREETING=Welcome to| Container[Container: print-env-container]
        spec -->|Injects COMPANY=Nautilus| Container
        spec -->|Injects GROUP=Datacenter| Container
        Container -->|Executes shell command| Shell[sh -c 'echo \"$GREETING $COMPANY $GROUP\"']
        Shell -->|Outputs to stdout| Logs[Logs: Welcome to Nautilus Datacenter]
    end
```

### Environment Variable Interpolation in K8s
When running a command inside a container, you may need to utilize the value of an injected environment variable. Kubernetes supports **variable interpolation** directly inside the container `command` and `args` lists using the `$(VAR_NAME)` syntax. 

If the environment variable is declared inside the `env` list, Kubernetes will automatically expand it before launching the container process. Note that if you use the traditional Unix shell syntax `$VAR_NAME` without parentheses, it will rely on the container's shell process to evaluate the variable rather than the Kubernetes API controller.

---

## Kubernetes Environment Variables Deep Dive

Kubernetes allows variables to be injected into a Pod using multiple source types:

### 1. Static Key-Values
Defined directly in the Pod specification using the `value` field. Suitable for static settings that do not change between environments or contain sensitive data.

```yaml
env:
- name: ENVIRONMENT
  value: "production"
```

### 2. ConfigMaps (`configMapKeyRef`)
ConfigMaps store configurations centrally. You can inject a specific key-value pair from a ConfigMap as an environment variable, allowing dynamic configuration updates.

```yaml
env:
- name: DATABASE_HOST
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: db_host
```

### 3. Secrets (`secretKeyRef`)
Secrets hold sensitive information like passwords, tokens, or private keys. The values are stored as base64-encoded strings and are mounted securely in memory (tmpfs) within the container context.

```yaml
env:
- name: DATABASE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: database-credentials
      key: password
```

### 4. Downward API (`fieldRef`)
The Downward API allows container processes to obtain information about the Pod or Node they are running on, such as the Pod name, Pod IP, namespace, resource limits, or Node name, without querying the Kubernetes API server.

```yaml
env:
- name: MY_POD_NAME
  valueFrom:
    fieldRef:
      fieldPath: metadata.name
- name: MY_POD_IP
  valueFrom:
    fieldRef:
      fieldPath: status.podIP
```

---

## Infrastructure & Configuration Requirements

*   **Target Cluster:** Nautilus Kubernetes Cluster
*   **Jump Host User:** `thor`
*   **Namespace:** `default`
*   **Pod Name:** `print-envars-greeting`
*   **Container Name:** `print-env-container`
*   **Image:** `bash`
*   **Environment Variables:**
    *   `GREETING`: `Welcome to`
    *   `COMPANY`: `Nautilus`
    *   `GROUP`: `Datacenter`
*   **Command:** `["/bin/sh", "-c", 'echo "$(GREETING) $(COMPANY) $(GROUP)"']`
*   **Restart Policy:** `Never`

---

## Step-by-Step Implementation

### Step 1: Connect to the Kubernetes Jump Host
SSH from your workstation into the cluster command host:
```bash
ssh thor@jump_host_ip
```

---

### Step 2: Create the Pod Manifest File
Create a manifest file named `print-env.yaml` to define the Pod, the static environment variables, the command to output them, and configure the pod to run exactly once (`restartPolicy: Never`):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: print-envars-greeting
  labels:
    app: print-env
spec:
  restartPolicy: Never
  containers:
  - name: print-env-container
    image: bash
    command: ["/bin/sh", "-c", 'echo "$(GREETING) $(COMPANY) $(GROUP)"']
    env:
    - name: GREETING
      value: "Welcome to"
    - name: COMPANY
      value: "Nautilus"
    - name: GROUP
      value: "Datacenter"
```

---

### Step 3: Deploy the Pod
Create the Pod inside the default namespace:
```bash
kubectl apply -f print-env.yaml
```
*Expected Output:*
```text
pod/print-envars-greeting created
```

---

### Step 4: Monitor Pod Execution
Since `restartPolicy: Never` is specified, the Pod will run its print command and then transition into a terminal state.

Track the status in real time:
```bash
kubectl get pod print-envars-greeting -w
```
*Expected Output Transition:*
```text
NAME                     READY   STATUS              RESTARTS   AGE
print-envars-greeting   0/1     ContainerCreating   0          2s
print-envars-greeting   0/1     Running             0          4s
print-envars-greeting   0/1     Completed           0          5s
```

---

## Post-Deployment Verification

### 1. Confirm Completed Status
Ensure the Pod has successfully finished execution:
```bash
kubectl get pod print-envars-greeting
```
*Expected Output:*
```text
NAME                     READY   STATUS      RESTARTS   AGE
print-envars-greeting   0/1     Completed   0          30s
```

---

### 2. Verify Output Logs
Check the stdout logs of the container to confirm the environment variables were correctly read, concatenated, and printed:
```bash
kubectl logs print-envars-greeting
```
*Expected Output:*
```text
Welcome to Nautilus Datacenter
```

This confirms the environment variables were injected correctly and expanded dynamically by Kubernetes!

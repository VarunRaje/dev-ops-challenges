


In Linux environments, application services (e.g., Nginx, MySQL, custom microservices) should never run under a standard user account capable of interactive login. Restricting these accounts to a non-interactive shell mitigates privilege escalation risks if an application layer is compromised.

Choosing the Non-Interactive Shell: /sbin/nologin vs /bin/false
When an interactive login attempt is made on these shells, the session terminates immediately. However, they handle the termination differently:

| Shell Path	|Execution Behavior	|Log Output|
| -------- | -------- | -------- |
|/sbin/nologin	| Exits with status 1.	| Displays a default message: "This account is currently not available." and logs the attempt to syslog.|
|/bin/false	| Exits with status 1.| 	Silently terminates the connection without displaying any text output.|


Implementation Guide
1. Creating a New Non-Interactive System User
To provision a new system service user with its login shell explicitly set to /sbin/nologin, execute the following useradd command:

 Bash
`sudo useradd -r -s /sbin/nologin myapp `

Flag Breakdown:

-r: Creates a system account. This automatically assigns a UID/GID below the standard user threshold (typically < 1000) and skips creating a standard /home directory unless explicitly requested.

-s /sbin/nologin: Defines the default login shell configuration for the account.

2. Modifying an Existing User
If an existing user needs to be locked down to a non-interactive status, modify their configuration using usermod:

Bash
sudo usermod -s /sbin/nologin existinguser
3. Verification
Verify the shell assignment by querying the system's password file database:

Bash
grep "myapp" /etc/passwd
Expected Output Structure:

Plaintext
myapp:x:998:996::/home/myapp:/sbin/nologin
The final field confirms that /sbin/nologin is active.

4. Testing the Shell Restriction
Attempting an interactive switch-user (su) operation should fail immediately:

Bash
su - myapp
Expected Output:

Plaintext
This account is currently not available.
Executing Commands as a Non-Interactive User
Disabling the interactive shell does not prevent system managers or administrators from executing automation tasks or processes under that user identity.

Via systemd Service Units
System daemons leverage the User and Group directives within service configuration files to drop privileges cleanly:

Ini, TOML
[Service]
User=myapp
Group=myapp
ExecStart=/usr/bin/python3 /opt/myapp/app.py
Via Command Line (sudo)
Administrators can run specific binaries or maintenance scripts on behalf of the user by using the -u flag, which bypasses the target user's shell configuration:

Bash
sudo -u myapp /opt/myapp/bin/upgrade-db.sh

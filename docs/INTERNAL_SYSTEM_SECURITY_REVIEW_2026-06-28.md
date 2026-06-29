# Internal System Security Review

Date: 2026-06-28

Scope: local host and this checkout. This review used harmless validation only:
filesystem metadata, package/service inventory, Apache configuration, and local
HTTP `200/403` style reachability checks. No exploit payloads were developed.

## Executive Summary

The highest-risk issue found is not a kernel zero-day. It is an architecture and
installation trust-boundary failure:

- A SUID-root Packet Tracer binary is installed below a user-writable directory.
- Apache exposes source-control metadata, Adminer, Apache server status,
  cookie/session logs, and personal documents.
- Several privileged or externally reachable services are enabled on the host.
- The current user is in high-privilege groups including `sudo`, `docker`,
  `mysql`, and `vboxusers`.

These are the kinds of internal design flaws that can become bigger than a
single application bug because they connect local user privileges, web exposure,
service exposure, and privileged binaries.

## Critical Finding 1: User-Writable SUID Root Packet Tracer Tree

Confirmed evidence:

```text
/opt/pt/bin/updatepttp: mode 4755, owner root:root
/opt/pt: mode 775, owner karthikeyan:karthikeyan
/opt/pt/bin: mode 775, owner karthikeyan:karthikeyan
ELF RUNPATH: $ORIGIN
Package: packettracer 8.2.2
```

Why this matters:

`updatepttp` is SUID root, so it crosses from normal user privilege into root
privilege. It also has `RUNPATH=$ORIGIN`, meaning its runtime library search is
tied to its own directory. The containing directory is writable by the normal
user. That is a dangerous architecture pattern for any privileged executable.

Impact:

- Local privilege-boundary collapse risk.
- Any future bug or unsafe loader interaction in this binary has elevated impact.
- The installation layout itself violates the normal rule that SUID binaries and
  their runtime directories must not be user-writable.

Recommended fix:

```bash
sudo chmod u-s /opt/pt/bin/updatepttp
sudo chown -R root:root /opt/pt
sudo chmod -R go-w /opt/pt
```

If Packet Tracer breaks after removing SUID, reinstall it from a trusted source
and keep `/opt/pt` root-owned and non-user-writable.

## Critical Finding 2: Apache Public Web Root Exposes Sensitive Files

Confirmed reachable over local HTTP:

```text
http://127.0.0.1/pii/.git/config -> 200
http://127.0.0.1/shopping/.git/config -> 200
http://127.0.0.1/stolen_cookies.txt -> 200
http://127.0.0.1/pii/documents/114_aadhar.pdf -> 200
http://127.0.0.1/adminer/ -> 200
http://127.0.0.1/server-status -> 200
```

Apache vhosts:

```text
DocumentRoot /var/www/html
DocumentRoot /var/www/html/pii
DocumentRoot /var/www/html/shopping
AllowOverride All
Require all granted
```

Why this matters:

The web server is publishing source-control metadata, a database admin tool,
private documents, and a cookie/session text file. Port 80 is listening on all
interfaces, so this should be treated as exposed to anything that can reach the
machine unless firewall rules prove otherwise.

Impact:

- Source disclosure through `.git`.
- Session/cookie disclosure.
- Personal document disclosure.
- Adminer brute-force or database attack surface.
- Apache request metadata leakage through `/server-status`.

Recommended fixes:

```bash
sudo rm -rf /var/www/html/pii/.git /var/www/html/shopping/.git
sudo mv /var/www/html/stolen_cookies.txt /root/stolen_cookies.txt.quarantine
sudo a2disconf adminer
sudo a2dismod status
sudo systemctl reload apache2
```

Also move uploaded/private documents outside the document root and serve them
through authenticated controller endpoints only.

## High Finding 3: Publicly Bound Services Increase Attack Surface

Confirmed listeners:

```text
*:80      Apache
*:3389    GNOME Remote Desktop
*:8834    Nessus
```

Loopback-only services:

```text
127.0.0.1:3306   MySQL
127.0.0.1:5432   PostgreSQL
127.0.0.1:6379   Redis
127.0.0.1:27017  MongoDB
```

Recommended fixes:

```bash
sudo systemctl disable --now gnome-remote-desktop
sudo systemctl disable --now nessusd
```

If Nessus or remote desktop is required, bind it to localhost or restrict it
with firewall rules and strong authentication.

## High Finding 4: Current User Has Root-Equivalent Paths

Confirmed groups:

```text
sudo docker mysql vboxusers
```

Why this matters:

Membership in `docker` is commonly root-equivalent because Docker can start
containers with host filesystem access. `vboxusers` plus loaded VirtualBox kernel
modules expands kernel attack surface. `mysql` can increase database exposure
depending on local file permissions and socket configuration.

Recommended fix:

Remove routine users from privileged groups unless needed:

```bash
sudo gpasswd -d karthikeyan docker
sudo gpasswd -d karthikeyan mysql
sudo gpasswd -d karthikeyan vboxusers
```

Log out and back in after changing group membership.

## Medium Finding 5: Update Backlog Includes Security-Sensitive Packages

Upgradable packages observed:

```text
containerd
tar
amd64-microcode
fwupd
google-chrome-stable
mongodb-mongosh
libfprint
```

Recommended fix:

```bash
sudo apt update
sudo apt upgrade
```

Reboot after kernel, microcode, container runtime, or firmware-related updates.

## Medium Finding 6: Frontend Dependency Advisory Backlog

`npm audit` found:

```text
critical: 1
high: 12
moderate: 7
low: 1
```

Most relevant direct dependencies:

```text
jspdf
react-router-dom
vite
xlsx
postcss
```

Recommended fix:

```bash
cd frontend
npm audit fix
npm install jspdf@latest react-router-dom@latest vite@latest postcss@latest
```

For `xlsx`, evaluate replacing SheetJS Community with a maintained alternative
or isolate spreadsheet parsing to trusted files only.

## Repo Backend Notes

The OfficeGate backend has several good controls already:

- JWT secret validation at startup.
- Production guardrails for debug, OTP logging, and wildcard trusted proxies.
- Prepared PDO queries.
- CORS allow-list.
- Role middleware on privileged routes.
- Public scan routes require `X-Gate-Token`.
- Uploads use MIME checks and randomized names.

Primary repo risk is operational:

- `backend/.env` contains local/dev secrets and default seed passwords.
- `backend/storage/database.sqlite` is inside the repo tree.
- `backend/storage/logs/otp.log` exists and may contain OTPs in local mode.

Do not deploy the whole repo as a web root. Deploy only `backend/public` for the
API and the built frontend assets.

## Priority Order

1. Remove SUID and user-writable trust violation from `/opt/pt`.
2. Stop exposing `.git`, `stolen_cookies.txt`, private PDFs, Adminer, and
   `/server-status`.
3. Disable or firewall public Nessus and remote desktop.
4. Review high-privilege group membership.
5. Apply OS and frontend dependency updates.
6. Keep private uploads and app storage outside any public document root.

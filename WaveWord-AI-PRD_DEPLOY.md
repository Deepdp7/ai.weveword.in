# Product Requirements Document (PRD)
## WaveWord AI — Self-Hosted Production Infrastructure

| Field | Value |
|---|---|
| Project Name | WaveWord AI |
| Company | WaveWord |
| Document Owner | DevOps / Infrastructure Lead |
| Status | Draft v1.0 |
| Environment | Production |
| Hosting Model | Self-Hosted Home Server (Ubuntu Server LTS, VMware) |

---

## 1. Overview

### 1.1 Purpose
WaveWord AI is a self-hosted, production-grade web application deployed entirely on a home-based Ubuntu server. The platform serves the primary domain `waveword.in` and the AI subdomain `ai.waveword.in`, built on a MERN-adjacent stack (React/Vite frontend, Node.js/Express backend, MongoDB database), with Nginx as the reverse proxy and PM2 as the process manager.

### 1.2 Problem Statement
The project needs a fully terminal-managed, enterprise-grade deployment pipeline that avoids control panels, PaaS platforms, Docker/Kubernetes, and third-party tunneling services — while still meeting production standards for security, performance, and maintainability on constrained home-server hardware.

### 1.3 Goals
- Stand up a secure, stable, low-resource production environment for WaveWord AI.
- Establish a repeatable, manual Git + PM2 deployment workflow.
- Harden the server against common attack vectors from day one.
- Design the architecture so additional subdomains/services can be added later with minimal rework.

### 1.4 Non-Goals
- No Docker or containerization (unless explicitly requested later).
- No Kubernetes or orchestration platforms.
- No Cloudflare Tunnel or similar tunneling services.
- No control panels (cPanel, Plesk, CasaOS, Webmin, Cockpit).
- No PaaS or shared hosting.

---

## 2. Stakeholders

| Role | Responsibility |
|---|---|
| Senior DevOps Engineer | Server provisioning, deployment pipeline, PM2/Nginx config |
| Senior MERN Stack Engineer | Application code, API design, frontend build |
| Linux System Administrator | OS hardening, user/permission management, patching |
| Network Engineer | Router/port-forwarding, DNS, firewall rules |
| Cloud Infrastructure Architect | Overall architecture, scalability planning |

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB |
| Runtime | Node.js LTS |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |
| Package Manager | npm |
| Version Control | Git / GitHub |
| OS | Ubuntu Server LTS (VMware VM) |

**Repository:** `https://github.com/Deepdp7/ai.weveword.in.git`

---

## 4. System Architecture

```
Internet
   ↓
Domain (waveword.in / ai.waveword.in)
   ↓
Router
   ↓
Port Forwarding (80/443 → server)
   ↓
Ubuntu Server LTS (VMware)
   ↓
Nginx Reverse Proxy (SSL termination, routing, gzip, headers)
   ↓
React Production Build (static, served by Nginx)
   ↓
Node.js / Express API (managed by PM2)
   ↓
MongoDB
```

### 4.1 Folder Structure
```
/var/www/
└── ai-waveword/
    ├── frontend/     # React + Vite app
    ├── backend/      # Node.js + Express API
    ├── logs/         # PM2 / Nginx / app logs
    ├── backups/      # DB and config backups
    └── scripts/      # Deployment, backup, maintenance scripts
```

### 4.2 Service Configuration

| Component | Detail |
|---|---|
| Backend directory | `/var/www/ai-waveword/backend` |
| PM2 app name | `ai-backend` |
| Backend port | `5000` (internal, proxied by Nginx) |
| Frontend directory | `/var/www/ai-waveword/frontend` |
| Frontend build | `npm run build` → static assets served directly by Nginx |

---

## 5. Functional Requirements

### 5.1 Deployment Workflow
1. `git pull` — fetch latest code from GitHub.
2. `npm install` — install/update dependencies (frontend & backend).
3. Frontend build — `npm run build` to generate production static assets.
4. PM2 restart — reload the `ai-backend` process with zero/minimal downtime.
5. Website live — verify via Nginx-served domain.

### 5.2 Process Management
- Backend must run under PM2 with auto-restart on crash.
- PM2 process list must persist across server reboots (`pm2 save` + `pm2 startup`).
- Logs routed to `/var/www/ai-waveword/logs`.

### 5.3 Reverse Proxy & Routing
- Nginx serves the React build as static files for `waveword.in`.
- Nginx reverse-proxies API requests to the Express backend on port `5000` for `ai.waveword.in` (or `/api` path, per final routing decision).
- Nginx handles gzip compression and HTTP → HTTPS redirection.

### 5.4 Database
- MongoDB installed locally on the same Ubuntu server (unless offloaded later).
- Bound to localhost only; not exposed externally.
- Scheduled backups written to `/var/www/ai-waveword/backups`.

---

## 6. Non-Functional Requirements

### 6.1 Security Requirements
| Control | Requirement |
|---|---|
| Firewall | UFW enabled, default-deny inbound, allow only 22 (or custom SSH port), 80, 443 |
| SSH Hardening | Key-based auth only, disable password auth, non-default port (optional) |
| Root Login | Disabled (`PermitRootLogin no`) |
| Intrusion Prevention | Fail2Ban configured for SSH and Nginx |
| File Permissions | Least-privilege ownership for `/var/www/ai-waveword`, restricted `.env` access (600) |
| HTTPS | Let's Encrypt via Certbot for all domains/subdomains |
| HTTP → HTTPS | Enforced 301 redirect |
| Security Headers | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CSP (baseline) |
| Env Variables | `.env` excluded from Git, never logged, restricted file permissions |
| SSL Renewal | Certbot auto-renewal via systemd timer/cron, verified |

### 6.2 Performance Requirements
- Low RAM/CPU footprint suitable for home-server hardware constraints.
- Nginx gzip compression enabled for text-based assets.
- Static asset caching headers for React build output.
- PM2 cluster mode evaluated if CPU cores allow (optional, based on server specs).
- Target: sub-second Time-to-First-Byte for static content under normal load.
- Minimal downtime during deploys (PM2 reload, not hard restart, where possible).

### 6.3 Reliability
- PM2 auto-restart on process crash.
- Server boot persistence for PM2 and Nginx services.
- Documented rollback procedure (revert to previous Git commit + PM2 restart).

### 6.4 Maintainability
- Well-commented Nginx configs, PM2 ecosystem file, and deployment scripts.
- Centralized logging under `/var/www/ai-waveword/logs`.
- Documentation kept current with any infrastructure change.

---

## 7. Constraints & Explicit Exclusions

The following are **explicitly out of scope** per project requirements:
- Docker (unless separately requested)
- Kubernetes
- Cloudflare Tunnel
- PaaS hosting (Heroku, Vercel-style platforms, etc.)
- Shared hosting
- Control panels: cPanel, Plesk, CasaOS, Webmin, Cockpit

All server management must remain 100% terminal-based.

---

## 8. Future Scalability

The architecture must support adding new subdomains/services without major rework. Planned future subdomains:

| Subdomain | Purpose (planned) |
|---|---|
| `ai.waveword.in` | AI platform (current) |
| `api.waveword.in` | Centralized API service |
| `billing.waveword.in` | Billing/payments |
| `dashboard.waveword.in` | User/admin dashboard |
| `admin.waveword.in` | Admin panel |
| `files.waveword.in` | File storage/management |
| `cdn.waveword.in` | Static asset delivery |

**Scalability Principles:**
- Each service isolated (own directory, own PM2 process, own Nginx server block).
- Shared Ubuntu server and Nginx instance until resource constraints require splitting out.
- New services follow the same folder structure and deployment workflow pattern established here.

---

## 9. Milestones / Phased Rollout

| Phase | Deliverable |
|---|---|
| Phase 1 | Base OS hardening: UFW, SSH hardening, Fail2Ban, disable root login |
| Phase 2 | Install stack: Node.js LTS, npm, PM2, Nginx, MongoDB, Git |
| Phase 3 | Deploy backend (`ai-backend` on port 5000 via PM2) |
| Phase 4 | Deploy frontend (React build served via Nginx) |
| Phase 5 | Configure Nginx reverse proxy, gzip, security headers |
| Phase 6 | Issue SSL certificates (Certbot), enforce HTTPS, verify auto-renewal |
| Phase 7 | End-to-end deployment workflow test (git pull → build → PM2 restart) |
| Phase 8 | Backup strategy + monitoring/logging setup |
| Phase 9 | Documentation handoff |
| Phase 10 | Plan/provision first future subdomain (e.g., `api.waveword.in`) |

---

## 10. Success Criteria

- `waveword.in` and `ai.waveword.in` resolve over HTTPS with valid, auto-renewing certificates.
- Backend (`ai-backend`) runs stably under PM2 with auto-restart and boot persistence.
- Full deployment (git pull → build → restart) completable via a single documented script/command sequence.
- UFW, SSH hardening, and Fail2Ban verified active and correctly configured.
- No control panel, Docker, Kubernetes, or tunneling service present anywhere in the stack.
- Architecture documented clearly enough that a new subdomain/service can be onboarded following the same pattern.

---

## 11. Open Questions

- Confirm final home-server hardware specs (RAM/CPU/storage) to size PM2 cluster mode and MongoDB caching.
- Confirm ISP allows inbound port forwarding on 80/443 (some residential ISPs block these).
- Confirm dynamic vs. static public IP — if dynamic, a Dynamic DNS (DDNS) solution will be needed.
- Confirm backup retention policy and off-site/off-server backup destination.
- Confirm whether `ai.waveword.in` and `waveword.in` share one backend or require separate API instances.

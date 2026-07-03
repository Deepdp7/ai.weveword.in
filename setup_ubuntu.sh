#!/bin/bash
# Ubuntu Server Setup for WaveWord AI
# Run this script with sudo: sudo bash setup_ubuntu.sh

set -e

echo "======================================"
echo " WaveWord AI Server Setup (Part 1)"
echo "======================================"

# 1. Update and Upgrade
echo "[+] Updating system packages..."
apt update && apt upgrade -y

# 2. Basic Security: UFW & Fail2Ban
echo "[+] Configuring UFW Firewall and Fail2Ban..."
apt install -y ufw fail2ban
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Enable UFW without prompt
ufw --force enable
systemctl enable fail2ban
systemctl start fail2ban

# 3. Install Nginx and Git
echo "[+] Installing Nginx and Git..."
apt install -y nginx git curl software-properties-common

# 4. Install MongoDB
echo "[+] Installing MongoDB (Local)..."
apt install -y gnupg curl
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
   --dearmor --yes
# The VM is Ubuntu 26.04 (Noble/Next). We'll use the latest available repo (jammy or noble if available). Jammy is safe.
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update
apt install -y mongodb-org
systemctl enable mongod
systemctl start mongod

# 5. Install Node.js (LTS - 20.x)
echo "[+] Installing Node.js (v20 LTS)..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 6. Install PM2 globally
echo "[+] Installing PM2..."
npm install -g pm2

# 7. Setup Web Directory
echo "[+] Setting up web directory /var/www/ai-waveword..."
mkdir -p /var/www/ai-waveword
chown -R $SUDO_USER:$SUDO_USER /var/www/ai-waveword
chmod -R 755 /var/www/ai-waveword

echo "======================================"
echo " Setup complete!"
echo " Next step: Clone the code and start PM2"
echo "======================================"

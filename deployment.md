# Deployment Guide: Deploying to GoDaddy Node.js Services via GitHub

This guide provides step-by-step instructions to deploy this **AI Notes & Mail Assistant** application to **GoDaddy Hosting** using your **GitHub Repository**.

---

## Architecture Overview

- **Frontend:** React 19 + Vite (built to static assets in `/dist`)
- **Backend:** Node.js + Express (running `server.ts` via `tsx` or `app.js`)
- **Database:** GoDaddy MySQL Server (`118.139.180.163:3306`, DB: `khema_ainotes`)
- **Mail Integration:** Bluehost IMAP/SMTP (`cbraseth@khemahospital.com`)

---

## Table of Contents
1. [Preparing Your GitHub Repository](#1-preparing-your-github-repository)
2. [Method A: GoDaddy cPanel Hosting (Setup Node.js App)](#2-method-a-godaddy-cpanel-hosting-setup-nodejs-app)
3. [Method B: GoDaddy VPS / Dedicated Server (PM2 + Nginx)](#3-method-b-godaddy-vps--dedicated-server-pm2--nginx)
4. [Configuring GoDaddy Remote MySQL Access](#4-configuring-godaddy-remote-mysql-access)
5. [Automated CI/CD Deployment with GitHub Actions](#5-automated-cicd-deployment-with-github-actions)
6. [Troubleshooting & Verification](#6-troubleshooting--verification)

---

## 1. Preparing Your GitHub Repository

### Step 1.1: Verify `.gitignore`
Before committing to GitHub, ensure that `.env` and `node_modules` are ignored so your database passwords are not exposed:

```bash
# Check your git status
git status
```
Ensure `.env` is **never** staged or committed.

### Step 1.2: Commit and Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete AI Notes & Mail Assistant with GoDaddy MySQL"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 2. Method A: GoDaddy cPanel Hosting (Setup Node.js App)

Use this method if your GoDaddy plan has **cPanel Web Hosting** or **cPanel Business Hosting**.

### Step 2.1: Clone the Repo in cPanel via Git™ Version Control
1. Log into your **GoDaddy Account** -> Open **cPanel**.
2. Under the **Files** section, click **Git™ Version Control**.
3. Click the blue **Create** button:
   - **Clone a Repository:** Toggle ON.
   - **Clone URL:** Enter your GitHub repository HTTPS URL (e.g. `https://github.com/your-username/ai-notes.git`).
   - **Repository Path:** Enter the folder on your server (e.g. `repositories/ai-notes` or `public_html/ai-notes`).
   - **Repository Name:** `ai-notes`.
4. Click **Create**. cPanel will clone the repository from GitHub.

> **Tip:** If your GitHub repo is private, add your GoDaddy cPanel SSH public key (`cPanel > SSH Access > View Public Key`) to **GitHub > Settings > Deploy Keys**.

---

### Step 2.2: Setup the Node.js Application
1. In cPanel, navigate to the **Software** section and click **Setup Node.js App**.
2. Click **Create Application**.
3. Fill in the application settings:
   - **Node.js Version:** Select **Node.js 20.x** or **Node.js 22.x** (recommended).
   - **Application Mode:** Select **Production**.
   - **Application Root:** Enter the path where you cloned the repo (e.g., `repositories/ai-notes`).
   - **Application URL:** Select your domain or subdomain (e.g., `notes.yourdomain.com`).
   - **Application Startup File:** Enter `app.js` (a dedicated production wrapper included in the project root).
   - **Passenger Log File (optional):** `logs/passenger.log`.
4. Click **Create** at the top right.

---

### Step 2.3: Configure Production Environment Variables (`.env`)
In the same **Setup Node.js App** page, scroll down to the **Environment variables** section (or create a `.env` file inside your Application Root directory via cPanel **File Manager**):

| Variable Name | Production Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations |
| `PORT` | `3000` | Application internal port |
| `PRIMARY_DB` | `godaddy` | Locks GoDaddy as permanent primary DB |
| `PRIMARY_LOCKED` | `true` | Prevents fallback overwrite |
| `MYSQL_HOST` | `118.139.180.163` | GoDaddy MySQL IP address |
| `MYSQL_PORT` | `3306` | Default MySQL port |
| `MYSQL_USER` | `khema_dbuser` | MySQL database user |
| `MYSQL_PASSWORD` | `<your-password>` | GoDaddy MySQL password |
| `MYSQL_DATABASE` | `khema_ainotes` | MySQL database name |
| `MYSQL_SSL` | `false` | Standard direct TCP connection |
| `JWT_SECRET` | `<random-64-char-string>` | Secret key for login authentication |
| `GEMINI_API_KEY` | `<your-gemini-key>` | (Optional) For AI mail drafting |

Click **Save** or save the `.env` file in File Manager.

---

### Step 2.4: Install Dependencies & Build Frontend
1. At the top of the **Setup Node.js App** screen, you will see a command like:
   ```bash
   source /home/username/nodevenv/repositories/ai-notes/20/bin/activate && cd /home/username/repositories/ai-notes
   ```
2. Click **Terminal** in cPanel (or connect via SSH), paste that line and press Enter.
3. Install production dependencies and build the Vite frontend:
   ```bash
   # Install all packages
   npm install

   # Build Vite React frontend (creates the /dist directory)
   npm run build
   ```

---

### Step 2.5: Start / Restart the Application
1. Return to **cPanel > Setup Node.js App**.
2. Click **Restart** on your application.
3. Click the open URL link next to your domain. Your application is now live!

---

## 3. Method B: GoDaddy VPS / Dedicated Server (PM2 + Nginx)

If you are running a **GoDaddy Virtual Private Server (VPS)** with Ubuntu, Debian, or AlmaLinux:

### Step 3.1: Connect via SSH
```bash
ssh root@your-godaddy-server-ip
```

### Step 3.2: Install Node.js 20 LTS & PM2
```bash
# Install NodeSource Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx

# Install PM2 process manager globally
sudo npm install -g pm2
```

### Step 3.3: Clone Repository & Setup
```bash
# Navigate to web root
cd /var/www
git clone https://github.com/<your-username>/<your-repo-name>.git ainotes
cd ainotes

# Copy environment template and fill in your secrets
cp .env.example .env
nano .env
```

Paste your production credentials into `.env`:
```env
NODE_ENV=production
PORT=3000
PRIMARY_DB=godaddy
PRIMARY_LOCKED=true
MYSQL_HOST=118.139.180.163
MYSQL_PORT=3306
MYSQL_USER=khema_dbuser
MYSQL_PASSWORD=your_actual_password
MYSQL_DATABASE=khema_ainotes
MYSQL_SSL=false
JWT_SECRET=super_secret_jwt_random_key_here
```

### Step 3.4: Install & Build
```bash
npm install
npm run build
```

### Step 3.5: Run and Enable Auto-Start with PM2
```bash
# Start the server with PM2
pm2 start npm --name "ainotes" -- start

# Configure PM2 to restart automatically on server reboots
pm2 startup
pm2 save
```

### Step 3.6: Configure Nginx Reverse Proxy
Create an Nginx configuration file:
```bash
sudo nano /etc/nginx/sites-available/ainotes
```

Paste the following configuration:
```nginx
server {
    listen 80;
    server_name notes.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/ainotes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 3.7: Secure with Free SSL (Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d notes.yourdomain.com
```

---

## 4. Configuring GoDaddy Remote MySQL Access

Because your database is hosted on GoDaddy MySQL (`118.139.180.163`):

1. Log into your **GoDaddy cPanel** where the MySQL database resides.
2. Under the **Databases** category, click **Remote MySQL®**.
3. Under **Add Access Host**:
   - If hosting on the same GoDaddy server, add `127.0.0.1` and `localhost`.
   - If hosting on a separate server or VPS, add your server's Public IP address.
   - For universal access during setup, you can enter `%` (wildcard) and click **Add Host**.
4. Test the connection from your server:
   ```bash
   mysql -h 118.139.180.163 -u khema_dbuser -p khema_ainotes -e "SHOW TABLES;"
   ```

---

## 5. Automated CI/CD Deployment with GitHub Actions

To automatically deploy updates whenever you push code to GitHub:

Create a file named `.github/workflows/deploy.yml` in your repository:

```yaml
name: Deploy to GoDaddy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to GoDaddy Server via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.GODADDY_SERVER_HOST }}
          username: ${{ secrets.GODADDY_SERVER_USER }}
          key: ${{ secrets.GODADDY_SSH_PRIVATE_KEY }}
          port: ${{ secrets.GODADDY_SSH_PORT || 22 }}
          script: |
            cd /var/www/ainotes || cd ~/repositories/ai-notes
            git pull origin main
            npm install
            npm run build
            # If using PM2:
            pm2 reload ainotes || pm2 restart ainotes
            # If using cPanel Phusion Passenger:
            mkdir -p tmp && touch tmp/restart.txt
```

### GitHub Secrets Setup:
Go to **Your GitHub Repository > Settings > Secrets and variables > Actions** and add:
- `GODADDY_SERVER_HOST`: Your GoDaddy server IP or domain.
- `GODADDY_SERVER_USER`: Your SSH username (e.g. `root` or cPanel user).
- `GODADDY_SSH_PRIVATE_KEY`: Your private SSH key.

---

## 6. Troubleshooting & Verification

### How to verify the deployment is working:
1. **Health Check:** Visit `https://yourdomain.com/api/health` in your browser. It should return:
   ```json
   { "status": "ok", "dbConfigured": true }
   ```
2. **Database Status:** Visit the dashboard and verify the SQL indicator in the sidebar shows **GoDaddy MySQL (118.139.180.163:3306) Connected**.
3. **Mail Assistant:** Navigate to `/mail-assistant` to test IMAP sync and sending replies with history tracking.

### Common Issues & Quick Fixes:

- **Error: `./start-db.sh: line 23: apt-get: command not found` (or start crash loop):**
  - **Cause:** Earlier versions of `package.json` had `"start": "bash ./start-db.sh && node server.ts"`. GoDaddy cPanel/CloudLinux hosting is not Debian/Ubuntu and does not have `apt-get`. Furthermore, your primary database is the remote GoDaddy MySQL (`118.139.180.163:3306`), so local MariaDB installation must be bypassed.
  - **Fix:** Run `git pull origin main` on your GoDaddy server to get the updated `package.json` and `app.js`. The start script is now `"start": "node app.js"`, which boots directly with zero apt-get dependencies.
- **Error: `Cannot find module 'tsx'`:**
  - Fix: Run `npm install` inside your application directory on GoDaddy. `tsx` is now included in production `dependencies`.
- **Error: 503 Service Unavailable (cPanel):**
  - Check the log: `cat ~/repositories/ai-notes/logs/passenger.log` or `stderr.log`.
  - Ensure the **Application Startup File** is set to `app.js`.
  - Restart the app by running `touch tmp/restart.txt` inside the app root.
- **Error: ER_ACCESS_DENIED_ERROR for GoDaddy MySQL:**
  - Verify that your server IP is listed in GoDaddy cPanel -> **Remote MySQL**.
  - Check that the `MYSQL_PASSWORD` in `.env` does not contain unescaped quotes.
- **Blank page on frontend:**
  - Ensure you ran `npm run build` so the `dist/` folder exists.

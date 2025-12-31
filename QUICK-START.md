# Quick Start - Deploy OpenRift

Follow these steps to get OpenRift deployed on your VPS.

## Step 1: Push Code to GitHub

```bash
# Make sure you're on dev branch
git checkout dev

# Add all new files
git add .

# Commit
git commit -m "Add Docker configuration and deployment setup"

# Push to dev
git push origin dev

# Merge to main
git checkout main
git merge dev
git push origin main
```

## Step 2: Configure GitHub Secrets

Go to: `https://github.com/YOUR-USERNAME/YOUR-REPO/settings/secrets/actions`

Click "New repository secret" for each:

| Name | Value |
|------|-------|
| `VPS_HOST` | `72.62.151.89` |
| `VPS_USERNAME` | `root` |
| `VPS_SSH_KEY` | See step 3 below |
| `SECRET_KEY` | Generate: `python -c "import secrets; print(secrets.token_hex(32))"` |
| `CORS_ORIGINS` | `http://72.62.151.89` |
| `VITE_API_URL` | `http://72.62.151.89:8000` |

## Step 3: Setup SSH Key on VPS

SSH into your VPS:

```bash
ssh root@72.62.151.89
```

Generate SSH key for GitHub Actions:

```bash
# Generate key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions
# Press Enter for all prompts (no passphrase)

# Add to authorized keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys

# Display private key - COPY THIS ENTIRE OUTPUT
cat ~/.ssh/github-actions
```

Copy the entire private key output (including `-----BEGIN` and `-----END` lines) and paste it as the `VPS_SSH_KEY` secret in GitHub.

## Step 4: Clone Repository on VPS

Still on the VPS:

```bash
# Navigate to web directory
cd /var/www/openrift

# Clone repository (replace with your repo URL)
git clone https://github.com/YOUR-USERNAME/YOUR-REPO.git .

# Checkout main
git checkout main
```

## Step 5: Create .env File on VPS

```bash
# Create .env file
nano .env
```

Paste this (replace SECRET_KEY with the one you generated):

```env
SECRET_KEY=your-actual-secret-key-here
CORS_ORIGINS=http://72.62.151.89
VITE_API_URL=http://72.62.151.89:8000
ENVIRONMENT=production
```

Save: `Ctrl+X`, then `Y`, then `Enter`

## Step 6: Initial Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

This will:
- Build Docker containers
- Start backend on port 8000
- Start frontend on port 80
- Run health checks

## Step 7: Test the Application

Open in browser:
- **Frontend**: http://72.62.151.89
- **Backend API**: http://72.62.151.89:8000/docs
- **Health Check**: http://72.62.151.89:8000/health

## Step 8: Create Admin User

```bash
# Access backend container
docker compose exec backend bash

# Create your account via the website first, then:
python make_admin.py your_username

# Exit container
exit
```

## ✅ Done!

Now every time you push to `main` branch, GitHub Actions will automatically deploy!

### Development Workflow

```bash
# Work on dev branch
git checkout dev

# Make changes, commit, push
git add .
git commit -m "Add feature"
git push origin dev

# When ready to deploy, merge to main
git checkout main
git merge dev
git push origin main
# 🚀 Auto-deploys!
```

## Troubleshooting

### Check logs
```bash
ssh root@72.62.151.89
cd /var/www/openrift
docker compose logs -f
```

### Restart containers
```bash
docker compose restart
```

### Check GitHub Actions
Go to: `https://github.com/YOUR-USERNAME/YOUR-REPO/actions`

---

For full documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)

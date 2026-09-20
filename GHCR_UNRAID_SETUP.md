# 🚀 Automating GHCR (GitHub Container Registry) via GitHub Actions

This guide explains how your EquipKeep Docker container is automatically built, tagged, and published to **GitHub Container Registry (`ghcr.io`)** using GitHub Actions, and how to deploy it effortlessly to your **Unraid** server or local Docker host.

---

## 📁 Files Included

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage, multi-architecture (`linux/amd64`, `linux/arm64`) production build based on Alpine Node.js 20. |
| `.dockerignore` | Excludes `node_modules`, build artifacts, and local data from being sent to Docker daemon. |
| `.github/workflows/docker-publish.yml` | GitHub Actions workflow that automatically builds and pushes to `ghcr.io` on every commit, tag, or manual dispatch. |
| `docker-compose.yml` | Quick-start Docker Compose file for homelab / Portainer testing. |
| `unraid-template.xml` | Unraid Docker template XML for instant configuration in the Unraid WebGUI. |

---

## ⚙️ How the GitHub Actions Workflow Works

When you push this repository to GitHub, the workflow in `.github/workflows/docker-publish.yml` will trigger automatically:

1. **Triggers:**
   - Push to `main` or `master` branch &rarr; builds and updates `ghcr.io/<owner>/<repo>:latest` and branch tags.
   - Git Tag creation (e.g. `git tag v1.0.0 && git push origin v1.0.0`) &rarr; publishes SemVer tags (`:1.0.0`, `:1.0`, `:v1.0.0`).
   - Pull Requests &rarr; builds the image to ensure no compilation regressions, without pushing.
   - **Manual Trigger (`workflow_dispatch`)** &rarr; you can click **Run workflow** in the GitHub Actions tab at any time!

2. **Multi-Architecture Support:**
   - Uses Docker Buildx and QEMU to cross-compile for both **`linux/amd64`** (standard Intel/AMD Unraid servers) and **`linux/arm64`** (Raspberry Pi, Ampere, Apple Silicon).

3. **Built-in Authentication:**
   - Uses the native `${{ secrets.GITHUB_TOKEN }}` with `packages: write` permission. **No external API keys or Docker Hub secrets needed!**

---

## 🔑 1-Minute GitHub Setup

To ensure GitHub Actions has permission to publish container packages:

1. In your GitHub repository, go to **Settings** &rarr; **Actions** &rarr; **General**.
2. Scroll down to **Workflow permissions**.
3. Select **Read and write permissions**.
4. Click **Save**.

### Making the Package Public (Recommended for Unraid)
By default, GitHub creates new container images as **Private**. To allow your Unraid server to pull updates without entering a GitHub Personal Access Token:
1. On GitHub, navigate to your Profile or Organization &rarr; **Packages**.
2. Click on **`equipkeep`**.
3. Click **Package settings** on the right sidebar.
4. Scroll down to the **Danger Zone** &rarr; **Change package visibility** &rarr; Select **Public**.

*(If you prefer to keep the package private, run `docker login ghcr.io -u <github_username> -p <personal_access_token>` in your Unraid terminal).*

---

## 🖥️ Deploying to Unraid

### Option 1: Unraid WebGUI ("Add Container")
1. In the Unraid WebGUI, navigate to the **Docker** tab.
2. Click **Add Container** at the bottom.
3. Fill in the following fields:
   - **Name:** `EquipKeep`
   - **Repository:** `ghcr.io/<your-github-username>/<your-repo-name>:latest`
   - **Network Type:** `bridge`
   - **WebUI:** `http://[IP]:[PORT:3500]/`
   - **Icon URL:** `https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wrench.png`
4. Click **Add another Path, Port, Variable, or Device**:
   - **Port:**
     - Container Port: `3000`
     - Host Port: `3500` *(prevents conflict with existing port 3000 applications)*
   - **Path (Volume):**
     - Container Path: `/app/data`
     - Host Path: `/mnt/user/appdata/equipkeep`
     - Access Mode: `Read/Write`
5. *(Optional Variables)*:
   - `PUSHOVER_USER_KEY`: your Pushover User Key
   - `PUSHOVER_API_TOKEN`: your Pushover App API Token
6. Click **Apply**.

---

### Option 2: Unraid User Template XML
Copy `unraid-template.xml` from this repository to your Unraid flash drive:
```bash
cp unraid-template.xml /boot/config/plugins/dockerMan/templates-user/my-EquipKeep.xml
```
Then open the Unraid **Docker** tab &rarr; **Add Container** &rarr; select **EquipKeep** from the Template dropdown!

---

### Option 3: Docker CLI / Unraid Terminal
You can run this directly in the Unraid terminal:
```bash
docker run -d \
  --name equipkeep \
  --restart unless-stopped \
  -p 3500:3000 \
  -v /mnt/user/appdata/equipkeep:/app/data \
  -e NODE_ENV=production \
  ghcr.io/<your-github-username>/equipkeep:latest
```

---

## 🔄 Automatic Updates on Unraid
Once running from GHCR:
- Use the **Unraid CA Auto Update** plugin or **Watchtower** to automatically pull newer `:latest` images when GitHub Actions finishes a build!

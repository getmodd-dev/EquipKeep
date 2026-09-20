# 🛠️ EquipKeep

**EquipKeep** is a modern, lightweight, self-hosted documentation and preventative maintenance hub for home appliances, mechanical systems, large power equipment, and seasonal property projects.

EquipKeep organizes manuals, model & serial numbers, replacement filter sizes, warranty expirations, contractor contacts, and recurring service intervals with instant **Pushover** mobile push alerts.

![EquipKeep Banner](https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/wrench.svg)

---

## ✨ Features

- 📋 **Comprehensive Equipment Inventory**: Track HVAC units, water heaters, kitchen appliances, generators, lawn tractors, workshop tools, and heavy machinery with model numbers, serial numbers, install dates, purchase prices, and physical room locations.
- 👨‍🔧 **Contractor & Technician Directory**: Store assigned service contractors, preferred technicians, and direct phone numbers with one-click click-to-call dialing, dispatch notes, and auto-population when logging service history.
- 🛡️ **Warranty Management**: Monitor manufacturer, extended, and lifetime warranties with visual countdowns, policy numbers, claim phone lines, and proactive expiration alerts.
- 🔁 **Preventative Maintenance Schedules**: Define recurring maintenance tasks (filter replacements, anode rod checks, generator oil changes, blade sharpening) with interval tracking, overdue warnings, and step-by-step instructions.
- 📑 **Service Logs & Cost History**: Log completed maintenance, repairs, parts replaced, technician names, and dollar costs to maintain a lifetime audit trail of your home assets.
- 🏷️ **Printable QR Code Tags**: Generate scannable QR stickers for physical equipment (e.g. stick on your air handler or generator) for instant mobile access.
- 🔔 **Mobile Push Notifications via Pushover**: Receive alerts on your phone when maintenance tasks are due or warranties are within 30 days of expiration.
- 📁 **Organized Manual & Document Storage**: Upload PDF user manuals, warranty certificates, parts schematics, and receipts stored directly on your server.
- 🐳 **Self-Hosted & Unraid Ready**: Packaged as a minimal Docker container supporting both `linux/amd64` and `linux/arm64` with persistent local storage. Zero cloud lock-in.

---

## 🚀 Quick Start with Docker

### Option 1: Docker Compose (Recommended)

Save the following as `docker-compose.yml`:

```yaml
version: '3.8'

services:
  equipkeep:
    image: ghcr.io/yourusername/equipkeep:latest
    # Or build locally:
    # build: .
    container_name: equipkeep
    restart: unless-stopped
    ports:
      - "3500:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATA_DIR=/app/data
      # Optional: Pre-configured Pushover notifications
      # - PUSHOVER_USER_KEY=your_pushover_user_key
      # - PUSHOVER_API_TOKEN=your_pushover_api_token
    volumes:
      # Persistent JSON database and uploaded documents
      - ./data:/app/data
```

Start the container:
```bash
docker compose up -d
```

Open your browser at: **`http://localhost:3500`** (or `http://<SERVER-IP>:3500`).

---

### Option 2: Docker CLI

```bash
docker run -d \
  --name equipkeep \
  --restart unless-stopped \
  -p 3500:3000 \
  -v /path/to/persistent/data:/app/data \
  -e NODE_ENV=production \
  ghcr.io/yourusername/equipkeep:latest
```

> ⚠️ **Important Volume Path Notice**: Always ensure the container path starts with a leading slash: `:/app/data` (absolute path).

---

## 🎛️ Unraid Installation

### Method A: Unraid XML Template
1. Copy `unraid-template.xml` from this repository to your Unraid flash drive:
   ```bash
   /boot/config/plugins/dockerMan/templates-user/my-equipkeep.xml
   ```
2. In the Unraid WebGUI, navigate to the **Docker** tab and click **Add Container**.
3. In the **Template** dropdown, select **EquipKeep**.
4. The ports (`3500` ➔ `3000`), persistent path (`/mnt/user/appdata/equipkeep`), and settings will be pre-configured.
5. Click **Apply**.

### Method B: Docker Compose Manager on Unraid
1. Install the **Docker Compose Manager** plugin from Unraid Community Applications.
2. Go to **Docker** ➔ **Compose** ➔ **Add New Stack**. Name it `equipkeep`.
3. Paste the compose file configuration above, setting the volume to:
   ```yaml
   volumes:
     - /mnt/user/appdata/equipkeep/data:/app/data
   ```
4. Click **Compose Up**.

---

## ⚙️ Environment Variables

| Variable | Default | Description |
| :--- | :--- | :--- |
| `PORT` | `3000` | Internal container port (mapped to `3500` on host). |
| `NODE_ENV` | `production` | Node environment mode. |
| `DATA_DIR` | `/app/data` | Container directory where `database.json` and `documents/` are stored. |
| `PUSHOVER_USER_KEY` | *(empty)* | Optional default Pushover User Key for push alerts. Can also be set in the Web UI. |
| `PUSHOVER_API_TOKEN` | *(empty)* | Optional default Pushover App API Token. Can also be set in the Web UI. |
| `GEMINI_API_KEY` | *(empty)* | Optional Gemini API key for smart equipment manual parsing. |

---

## 💾 Data Persistence & Backups

All application state is saved as standard, human-readable files inside the mounted volume directory:

```
/mnt/user/appdata/equipkeep/data/
├── database.json        # Equipment, contractor info, projects, service logs, settings
└── documents/           # Uploaded manuals, warranty PDFs, invoices, and spec sheets
    ├── Carrier_Heat_Pump_eq-1/
    │   └── user-manual.pdf
    └── Rheem_Water_Heater_eq-2/
        └── warranty-certificate.pdf
```

To back up EquipKeep, simply back up the `/mnt/user/appdata/equipkeep` folder using standard Unraid Appdata Backup utilities or cron rsync.

---

## 🔨 Building from Source

To build and run the Docker image locally without relying on external registries:

```bash
# Clone the repository
git clone https://github.com/yourusername/equipkeep.git
cd equipkeep

# Build the production image
docker build -t equipkeep:latest .

# Run container locally
docker run -d \
  --name equipkeep \
  -p 3500:3000 \
  -v $(pwd)/data:/app/data \
  equipkeep:latest
```

---

## 🔒 Security & Privacy

- **No Remote Telemetry**: EquipKeep does not send tracking or analytics data to any external server.
- **Local Storage**: All records, contractor contact details, and warranty documents reside entirely within your self-hosted instance.
- **Push Notification Privacy**: When using Pushover, only equipment names and due dates are dispatched through Pushover's secure API.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

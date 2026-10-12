# 🇪🇹 QuickCard Ethiopia

> Ultra-lightweight Digital Identity, NFC Profiles, and Trade Fair Networking Platform tailored for Ethiopia.

QuickCard delivers instant, one-tap professional digital identity sharing built specifically for Ethiopian network infrastructure (Ethio Telecom 3G/4G/5G and Safaricom Ethiopia). Profiles render in **under 0.3 seconds** with a sub-30 KB total payload, zero client-side JavaScript frameworks, and offline-ready PWA caching.

---

## ⚡ Highlights

- **⚡ Sub-30 KB Payloads:** Pure server-rendered semantic HTML and inline CSS. Fully loads in ~0.29s on Ethio Telecom 3G networks.
- **🎛️ Mobile Quick Settings Tile & Floating HUD:** Swipe down Android notification shade or press iPhone Action Button to pop up a floating HUD widget in < 50ms with zero browser chrome or separate app.
- **📶 Web NFC + High-Contrast QR:** NTAG216 tactile wave beam + camera QR readable from 1.5m away under intense midday sun.
- **🤝 2-Way Contact Exchange:** Eliminates the SMS contradiction; strangers enter their info directly on the phone or profile, instantly recorded in the CRM.
- **💳 Ethiopian Fintech Ready:** 1-tap Telebirr Merchant QR and CBE Birr account numbers with copy triggers.
- **🪪 Trade Fair Badge Suite:** Print-ready lanyards, acrylic table tents, and UV-printed matte NFC cards with live SVG QR generation.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js `>= 18.0.0`
- npm `>= 9.0.0`

### Installation & Run
```bash
# Clone the repository
git clone <repository-url>
cd quickcard

# Install dependencies
npm install

# Start development server
npm start
```

Open your browser at **`http://localhost:3000`** to access the Master Studio.

---

## 🏭 Production Deployment

### Option 1: Docker (Recommended for Cloud / Containers)

Build and run using the optimized multi-stage Alpine Dockerfile:

```bash
# Build the Docker image
docker build -t quickcard:latest .

# Run container with persistent data volume
docker run -d \
  --name quickcard \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -v $(pwd)/data:/app/data \
  --restart unless-stopped \
  quickcard:latest
```

### Option 2: PM2 (Linux VPS / Ubuntu / Debian / EC2)

```bash
# Install PM2 globally
npm install -g pm2

# Start using the production ecosystem configuration
pm2 start ecosystem.config.js --env production

# Save process list for system reboot
pm2 save
pm2 startup
```

### Option 3: Systemd Service (`/etc/systemd/system/quickcard.service`)

```ini
[Unit]
Description=QuickCard Ethiopia Production Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/quickcard
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOST=0.0.0.0

[Install]
WantedBy=multi-user.target
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env` to configure your environment:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `development` | Set to `production` to enable static asset caching and disable debug output |
| `PORT` | `3000` | Port on which the HTTP server listens |
| `HOST` | `0.0.0.0` | Network interface binding (`0.0.0.0` for all interfaces) |
| `BASE_URL` | `http://localhost:3000` | Publicly accessible domain for QR code URL encoding (e.g. `https://qc.et`) |

---

## 🩺 Health Check & Monitoring

QuickCard provides a native monitoring endpoint for load balancers (AWS ALB, GCP, Cloudflare, Kubernetes):

```bash
# Health check HTTP request
curl -i http://localhost:3000/health

# Or via npm script (exits 0 if healthy, 1 if down)
npm run health
```

**Sample Response (`200 OK`):**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "timestamp": "2026-10-12T14:30:00.000Z",
  "env": "production",
  "version": "1.0.0",
  "memory": {
    "rss": "55 MB",
    "heapUsed": "9 MB"
  }
}
```

---

## 💾 Data Persistence & Backups

All application data is stored in JSON files under the `data/` directory:
- `data/profiles.json`: Active digital business card identities.
- `data/leads.json`: Captured inbound leads from trade fairs and 2-way HUD handshakes.

### Recommended Daily Backup Cron:
```bash
# Backup data directory to compressed archive
tar -czf /backups/quickcard-data-$(date +%F).tar.gz /var/www/quickcard/data/
```

---

## 📄 License
MIT License. Created for the Ethiopian Enterprise & Trade Fair Ecosystem.

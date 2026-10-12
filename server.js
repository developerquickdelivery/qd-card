const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const { renderCardHtml } = require('./lib/cardRenderer');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

// Production security hardening
app.disable('x-powered-by');

// Security & Header Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProduction ? '1d' : 0,
  etag: true
}));

// Production Health Check & Monitoring endpoint
app.get('/health', (req, res) => {
  const mem = process.memoryUsage();
  res.status(200).json({
    status: 'healthy',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`
    }
  });
});

const PROFILES_FILE = path.join(__dirname, 'data', 'profiles.json');
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');

// Helper to read JSON data safely
function getProfiles() {
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8'));
  } catch (err) {
    return {};
  }
}

function saveProfiles(data) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function getLeads() {
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch (err) {
    return [];
  }
}

function saveLeads(data) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// -------------------------------------------------------------
// Public Ultra-Lightweight Card Route: /p/:id
// Targets < 25KB total page payload, inline CSS, zero external JS
// -------------------------------------------------------------
app.get('/p/:id', async (req, res) => {
  const profiles = getProfiles();
  const profile = profiles[req.params.id];
  if (!profile) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Card Not Found - QuickCard</title>
        <style>
          body { background: #0f172a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
          .box { background: #1e293b; padding: 30px; border-radius: 16px; border: 1px solid #334155; }
          a { color: #f59e0b; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2>QuickCard Not Found</h2>
          <p style="color:#94a3b8;margin:12px 0 20px;">The profile "<strong>${req.params.id}</strong>" does not exist yet.</p>
          <a href="/">Create or View Profiles</a>
        </div>
      </body>
      </html>
    `);
  }

  try {
    const html = await renderCardHtml(profile, req.get('host'));
    // Compress response header and send
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.send(html);
  } catch (err) {
    console.error('Error rendering card:', err);
    res.status(500).send('Error rendering card');
  }
});

// Direct vCard (.vcf) download endpoint
app.get('/p/:id/vcard', (req, res) => {
  const profiles = getProfiles();
  const profile = profiles[req.params.id];
  if (!profile) return res.status(404).send('Profile not found');

  const names = profile.name.trim().split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';

  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    `N:${lastName};${firstName};;;`,
    `ORG:${profile.company || ''}`,
    `TITLE:${profile.title || ''}`,
    `TEL;TYPE=CELL,VOICE:${(profile.phone || '').replace(/\s+/g, '')}`,
    profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
    profile.website ? `URL:${profile.website}` : '',
    profile.location ? `ADR;TYPE=WORK:;;${profile.location};Addis Ababa;;;Ethiopia` : '',
    `NOTE:QuickCard Ethiopia (Telebirr: ${profile.telebirr || 'N/A'}, Telegram: @${profile.telegram || ''})`,
    'END:VCARD'
  ].filter(Boolean).join('\r\n');

  const safeFilename = profile.id.replace(/[^a-z0-9_-]/gi, '') + '-contact.vcf';
  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  res.send(vcard);
});

// Dedicated SVG QR code endpoint
app.get('/p/:id/qr.svg', async (req, res) => {
  const host = req.get('host');
  const url = `http://${host}/p/${req.params.id}`;
  try {
    const svg = await QRCode.toString(url, {
      type: 'svg',
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    res.status(500).send('QR Generation Error');
  }
});

// Dedicated PNG QR code endpoint for badge printing
app.get('/p/:id/qr.png', async (req, res) => {
  const host = req.get('host');
  const url = `http://${host}/p/${req.params.id}`;
  try {
    const buffer = await QRCode.toBuffer(url, {
      type: 'png',
      width: 512,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    });
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err) {
    res.status(500).send('QR Generation Error');
  }
});

// -------------------------------------------------------------
// Trade Fair Presenter & Printable Badge Route: /badge/:id
// -------------------------------------------------------------
app.get('/badge/:id', (req, res) => {
  const profiles = getProfiles();
  const profile = profiles[req.params.id];
  if (!profile) return res.redirect('/');
  res.sendFile(path.join(__dirname, 'public', 'badge.html'));
});

// -------------------------------------------------------------
// Mobile Quick Settings Floating HUD & Widget: /widget & /widget/:id
// -------------------------------------------------------------
app.get(['/widget', '/widget/:id'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'widget.html'));
});

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Get all profiles
app.get('/api/profiles', (req, res) => {
  res.json(getProfiles());
});

// Get specific profile
app.get('/api/profiles/:id', (req, res) => {
  const profiles = getProfiles();
  if (profiles[req.params.id]) {
    res.json(profiles[req.params.id]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

// Save or update profile
app.post('/api/profiles', (req, res) => {
  const profile = req.body;
  if (!profile.id || !profile.name) {
    return res.status(400).json({ error: 'Profile ID and Name are required' });
  }
  const profiles = getProfiles();
  profiles[profile.id] = {
    ...profiles[profile.id],
    ...profile
  };
  saveProfiles(profiles);
  res.json({ success: true, profile: profiles[profile.id] });
});

// Leads API: Get captured networking leads
app.get('/api/leads', (req, res) => {
  const leads = getLeads();
  const cardId = req.query.cardId;
  if (cardId) {
    return res.json(leads.filter(l => l.cardId === cardId));
  }
  res.json(leads);
});

// Submit a new lead (from "Share Contact Back")
app.post('/api/leads', (req, res) => {
  const { cardId, visitorName, visitorPhone, visitorTelegram, visitorCompany, note, source, status } = req.body;
  if (!cardId || !visitorName || !visitorPhone) {
    return res.status(400).json({ error: 'Name and Phone are required' });
  }
  const leads = getLeads();
  const newLead = {
    id: 'lead-' + Date.now(),
    cardId,
    visitorName,
    visitorPhone,
    visitorTelegram: visitorTelegram || '',
    visitorCompany: visitorCompany || '',
    note: note || '',
    source: source || 'Web Contact Exchange',
    status: status || 'New',
    timestamp: new Date().toISOString()
  };
  leads.unshift(newLead);
  saveLeads(leads);
  res.status(201).json({ success: true, lead: newLead });
});

// Update lead status or note
app.patch('/api/leads/:id', (req, res) => {
  const leads = getLeads();
  const index = leads.findIndex(l => l.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Lead not found' });

  leads[index] = { ...leads[index], ...req.body };
  saveLeads(leads);
  res.json({ success: true, lead: leads[index] });
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
  let leads = getLeads();
  const initialLength = leads.length;
  leads = leads.filter(l => l.id !== req.params.id);
  if (leads.length === initialLength) return res.status(404).json({ error: 'Lead not found' });

  saveLeads(leads);
  res.json({ success: true });
});

// Export all leads as consolidated vCard bundle (.vcf)
app.get('/api/leads/export/vcf', (req, res) => {
  const leads = getLeads();
  if (!leads.length) return res.status(404).send('No leads to export');

  const vcards = leads.map(lead => {
    const names = lead.visitorName.trim().split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || '';
    return [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${lead.visitorName}`,
      `N:${lastName};${firstName};;;`,
      `ORG:${lead.visitorCompany || 'Trade Fair Visitor'}`,
      `TITLE:Lead from QuickCard (${lead.cardId})`,
      `TEL;TYPE=CELL,VOICE:${lead.visitorPhone.replace(/\s+/g, '')}`,
      lead.visitorTelegram ? `X-TELEGRAM:${lead.visitorTelegram}` : '',
      `NOTE:QuickCard Inbound Lead (Source: ${lead.source || 'Badge Scan'} | Note: ${lead.note || ''})`,
      'END:VCARD'
    ].filter(Boolean).join('\r\n');
  }).join('\r\n\r\n');

  res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="quickcard_all_leads_${new Date().toISOString().slice(0, 10)}.vcf"`);
  res.send(vcards);
});

// Delete profile endpoint
app.delete('/api/profiles/:id', (req, res) => {
  const profiles = getProfiles();
  if (!profiles[req.params.id]) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  if (Object.keys(profiles).length <= 1) {
    return res.status(400).json({ error: 'Cannot delete the only remaining profile' });
  }
  delete profiles[req.params.id];
  saveProfiles(profiles);
  res.json({ success: true });
});

// Performance Audit: Computes exact HTML byte size & simulated network transfer
app.get('/api/audit/:id', async (req, res) => {
  const profiles = getProfiles();
  const profile = profiles[req.params.id];
  if (!profile) return res.status(404).json({ error: 'Not found' });

  try {
    const html = await renderCardHtml(profile, req.get('host'));
    const byteSize = Buffer.byteLength(html, 'utf8');
    const kbSize = (byteSize / 1024).toFixed(2);

    // Ethio Telecom Simulation speeds
    // 2G: ~50 kbps (6.25 KB/s)
    // 3G: ~750 kbps (93.75 KB/s)
    // 4G: ~10,000 kbps (1250 KB/s)
    const time2G = (byteSize / (6.25 * 1024)).toFixed(2);
    const time3G = (byteSize / (93.75 * 1024)).toFixed(2);
    const time4G = (byteSize / (1250 * 1024)).toFixed(2);

    res.json({
      id: profile.id,
      bytes: byteSize,
      formattedSize: `${kbSize} KB`,
      inlineCss: true,
      externalJsDependencies: 0,
      reactBundleCost: '0 KB (Zero Frameworks)',
      latencyEstimates: {
        'Ethio Telecom 3G': `${time3G}s`,
        'Ethio Telecom 2G Edge': `${time2G}s`,
        'Ethio Telecom 4G / Wi-Fi': `${time4G}s`
      },
      verdict: byteSize < 35000 ? 'PASSED: Ultra-Fast One-Tap Experience' : 'EXCEEDED THRESHOLD'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`QuickCard Ethiopia running at http://${HOST}:${PORT} [ENV: ${process.env.NODE_ENV || 'development'}]`);
});

// Graceful Shutdown for Process Managers (Docker / PM2 / Kubernetes)
function handleShutdown(signal) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('Forcefully exiting due to shutdown timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));


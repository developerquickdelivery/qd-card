const QRCode = require('qrcode');

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([\{\}:;,])\s*/g, '$1')
    .trim();
}

function minifyHtml(html) {
  return html
    .replace(/<style>([\s\S]*?)<\/style>/g, (m, css) => '<style>' + minifyCss(css) + '</style>')
    .replace(/<script>([\s\S]*?)<\/script>/g, (m, js) => '<script>' + js.replace(/\/\/[^\n]*/g, '').replace(/\s+/g, ' ').trim() + '</script>')
    .replace(/>\s+</g, '><')
    .trim();
}

// Generate the ultra-lightweight, standalone profile card HTML
// Targets < 25KB total transfer size, inline CSS, zero JS frameworks, instant first paint.
async function renderCardHtml(profile, reqHost = 'localhost:3000', options = {}) {
  const qrSvg = await QRCode.toString(`http://${reqHost}/p/${profile.id}`, {
    type: 'svg',
    margin: 1,
    color: {
      dark: '#000000',
      light: '#ffffff'
    },
    errorCorrectionLevel: 'M'
  });

  const qrDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(qrSvg)}`;

  // Theme palettes with rich luxury tones
  const themes = {
    gold: {
      accent: '#f59e0b',
      accentHover: '#d97706',
      accentGlow: 'rgba(245, 158, 11, 0.25)',
      gradient: 'radial-gradient(ellipse at 50% 0%, #292013 0%, #0c0f17 100%)',
      cardBg: '#151922',
      border: 'rgba(245, 158, 11, 0.28)',
      badgeBg: 'rgba(245, 158, 11, 0.14)',
      badgeText: '#fbbf24'
    },
    emerald: {
      accent: '#10b981',
      accentHover: '#059669',
      accentGlow: 'rgba(16, 185, 129, 0.25)',
      gradient: 'radial-gradient(ellipse at 50% 0%, #0a251b 0%, #0b0f17 100%)',
      cardBg: '#121b18',
      border: 'rgba(16, 185, 129, 0.28)',
      badgeBg: 'rgba(16, 185, 129, 0.14)',
      badgeText: '#34d399'
    },
    navy: {
      accent: '#3b82f6',
      accentHover: '#2563eb',
      accentGlow: 'rgba(59, 130, 246, 0.25)',
      gradient: 'radial-gradient(ellipse at 50% 0%, #0d1e3a 0%, #090c14 100%)',
      cardBg: '#111827',
      border: 'rgba(59, 130, 246, 0.28)',
      badgeBg: 'rgba(59, 130, 246, 0.14)',
      badgeText: '#60a5fa'
    },
    crimson: {
      accent: '#f43f5e',
      accentHover: '#e11d48',
      accentGlow: 'rgba(244, 63, 94, 0.25)',
      gradient: 'radial-gradient(ellipse at 50% 0%, #2d0e17 0%, #0c0e14 100%)',
      cardBg: '#191217',
      border: 'rgba(244, 63, 94, 0.28)',
      badgeBg: 'rgba(244, 63, 94, 0.14)',
      badgeText: '#fb7185'
    },
    purple: {
      accent: '#8b5cf6',
      accentHover: '#7c3aed',
      accentGlow: 'rgba(139, 92, 246, 0.25)',
      gradient: 'radial-gradient(ellipse at 50% 0%, #231238 0%, #0b0d14 100%)',
      cardBg: '#161322',
      border: 'rgba(139, 92, 246, 0.28)',
      badgeBg: 'rgba(139, 92, 246, 0.14)',
      badgeText: '#a78bfa'
    },
    obsidian: {
      accent: '#94a3b8',
      accentHover: '#64748b',
      accentGlow: 'rgba(148, 163, 184, 0.2)',
      gradient: 'radial-gradient(ellipse at 50% 0%, #1e2430 0%, #080a0f 100%)',
      cardBg: '#13161f',
      border: 'rgba(148, 163, 184, 0.25)',
      badgeBg: 'rgba(148, 163, 184, 0.14)',
      badgeText: '#e2e8f0'
    }
  };

  const t = themes[profile.theme] || themes.gold;

  // vCard 3.0 raw string
  const vcardRaw = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${profile.name}`,
    `N:${profile.name.split(' ').slice(1).join(' ')};${profile.name.split(' ')[0]};;;`,
    `ORG:${profile.company || ''}`,
    `TITLE:${profile.title || ''}`,
    `TEL;TYPE=CELL,VOICE:${(profile.phone || '').replace(/\s+/g, '')}`,
    profile.email ? `EMAIL;TYPE=INTERNET:${profile.email}` : '',
    profile.website ? `URL:${profile.website}` : '',
    profile.location ? `ADR;TYPE=WORK:;;${profile.location};Addis Ababa;;;Ethiopia` : '',
    `NOTE:QuickCard Ethiopia (Telebirr: ${profile.telebirr || 'N/A'}, Telegram: @${profile.telegram || ''})`,
    'END:VCARD'
  ].filter(Boolean).join('\\r\\n');

  const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${profile.name} | ${profile.company} - QuickCard Ethiopia</title>
  <meta name="description" content="${profile.title} at ${profile.company}. Instant 1-tap contact exchange and business identity.">
  <meta name="theme-color" content="#090d16">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    :root {
      --accent: ${t.accent};
      --accent-hover: ${t.accentHover};
      --accent-glow: ${t.accentGlow};
      --bg: #070a11;
      --card-bg: ${t.cardBg};
      --border: ${t.border};
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --badge-bg: ${t.badgeBg};
      --badge-text: ${t.badgeText};
      --font-main: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Ethiopic", sans-serif;
    }
    body {
      background: var(--bg);
      background-image: ${t.gradient};
      color: var(--text);
      font-family: var(--font-main);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 14px 44px;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }
    .container {
      width: 100%;
      max-width: 440px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .top-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 4px 2px;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      color: #cbd5e1;
      text-decoration: none;
      font-size: 12.5px;
      font-weight: 600;
      background: rgba(255, 255, 255, 0.05);
      padding: 5px 12px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      letter-spacing: -0.2px;
    }
    .brand-pill svg { width: 15px; height: 15px; fill: var(--accent); }
    .top-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .lang-btn {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.16);
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.2s;
    }
    .lang-btn:active { background: rgba(255, 255, 255, 0.2); transform: scale(0.96); }

    .profile-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 22px;
      padding: 22px 18px 20px;
      box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04);
      position: relative;
      overflow: hidden;
    }
    .profile-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
    }
    .avatar-wrap {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .avatar-box {
      position: relative;
      flex-shrink: 0;
    }
    .avatar {
      width: 76px;
      height: 76px;
      border-radius: 50%;
      object-fit: cover;
      border: 2.5px solid var(--accent);
      background: #1f2937;
      display: block;
      box-shadow: 0 4px 14px var(--accent-glow);
    }
    .ethio-flag-pill {
      position: absolute;
      bottom: -2px;
      right: -2px;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 10px;
      padding: 1px 4px;
      font-size: 11px;
      line-height: 1;
    }
    .headline {
      flex: 1;
      min-width: 0;
    }
    .name-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 3px;
    }
    .name {
      font-size: 21px;
      font-weight: 800;
      color: #fff;
      line-height: 1.2;
      letter-spacing: -0.4px;
    }
    .verified-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 17px;
      height: 17px;
      background: var(--accent);
      color: #000;
      border-radius: 50%;
      font-size: 10px;
      font-weight: 900;
      flex-shrink: 0;
    }
    .title {
      font-size: 13.5px;
      color: var(--badge-text);
      font-weight: 600;
      line-height: 1.35;
      margin-bottom: 3px;
    }
    .company {
      font-size: 12.5px;
      color: var(--text-muted);
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .bio {
      font-size: 13px;
      color: #cbd5e1;
      line-height: 1.55;
      margin-bottom: 16px;
      padding-top: 13px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .save-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      width: 100%;
      background: var(--accent);
      color: #090d16;
      font-size: 15px;
      font-weight: 800;
      padding: 14px 18px;
      border-radius: 14px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      box-shadow: 0 6px 20px var(--accent-glow);
      transition: transform 0.12s, background 0.15s, box-shadow 0.15s;
      letter-spacing: -0.2px;
    }
    .save-btn:active {
      transform: scale(0.98);
      background: var(--accent-hover);
    }
    .save-btn svg { width: 19px; height: 19px; fill: currentColor; }

    .action-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 12px;
    }
    .action-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: #fff;
      padding: 11px 12px;
      border-radius: 13px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .action-btn:active {
      background: rgba(255, 255, 255, 0.12);
    }
    .icon-box {
      width: 32px;
      height: 32px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .icon-box svg { width: 16px; height: 16px; fill: #fff; }
    .ib-call { background: #10b981; }
    .ib-telegram { background: #229ed9; }
    .ib-whatsapp { background: #25d366; }
    .ib-email { background: #6366f1; }
    .ib-web { background: #0ea5e9; }
    .ib-map { background: #f97316; }

    .payment-tray {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pay-card {
      border-radius: 13px;
      padding: 11px 13px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .pay-card.telebirr {
      background: rgba(0, 136, 204, 0.08);
      border-color: rgba(0, 136, 204, 0.28);
    }
    .pay-card.cbe {
      background: rgba(147, 51, 234, 0.08);
      border-color: rgba(147, 51, 234, 0.28);
    }
    .pay-left {
      display: flex;
      align-items: center;
      gap: 10px;
      min-width: 0;
    }
    .pay-badge {
      font-size: 11px;
      font-weight: 800;
      padding: 5px 8px;
      border-radius: 7px;
      color: #fff;
      letter-spacing: -0.3px;
      flex-shrink: 0;
    }
    .bg-telebirr { background: #0088cc; }
    .bg-cbe { background: #7c2d12; }
    .pay-info {
      min-width: 0;
    }
    .pay-label {
      font-size: 10.5px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .pay-num {
      font-size: 13.5px;
      font-weight: 700;
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .copy-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.18);
      color: #fff;
      font-size: 11.5px;
      font-weight: 700;
      padding: 6px 11px;
      border-radius: 8px;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.15s;
    }
    .copy-btn:active { background: var(--accent); color: #000; }

    .loc-banner {
      margin-top: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 13px;
      padding: 10px 12px;
      text-decoration: none;
      color: #fff;
    }

    .exchange-card {
      background: rgba(255, 255, 255, 0.025);
      border: 1px dashed rgba(255, 255, 255, 0.18);
      border-radius: 16px;
      padding: 15px;
      text-align: center;
    }
    .exc-title {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 3px;
    }
    .exc-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
      line-height: 1.45;
    }
    .exc-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-size: 13px;
      font-weight: 700;
      padding: 9px 18px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .exc-btn:active {
      background: rgba(255, 255, 255, 0.16);
    }

    .offline-qr-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 14px;
      padding: 11px 14px;
    }
    .oqb-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .qr-thumb-box {
      width: 42px;
      height: 42px;
      background: #fff;
      border-radius: 7px;
      padding: 2px;
      flex-shrink: 0;
      cursor: pointer;
    }
    .qr-thumb-box img { width: 100%; height: 100%; display: block; }
    .oqb-text { font-size: 12px; color: var(--text-muted); }
    .oqb-text strong { color: #fff; display: block; font-size: 12.5px; }
    .btn-qr-expand {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.12);
      padding: 5px 10px;
      border-radius: 7px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(6px);
      display: none;
      align-items: center;
      justify-content: center;
      padding: 16px;
      z-index: 999;
    }
    .modal-overlay.open { display: flex; }
    .modal-sheet {
      background: #141923;
      border: 1px solid #334155;
      border-radius: 20px;
      width: 100%;
      max-width: 390px;
      padding: 22px;
      box-shadow: 0 25px 40px -10px rgba(0, 0, 0, 0.7);
    }
    .modal-sheet h3 {
      font-size: 17px;
      color: #fff;
      margin-bottom: 4px;
      font-weight: 800;
    }
    .modal-sheet p {
      font-size: 12.5px;
      color: #94a3b8;
      margin-bottom: 16px;
      line-height: 1.45;
    }
    .input-grp {
      margin-bottom: 11px;
      text-align: left;
    }
    .input-grp label {
      display: block;
      font-size: 11px;
      color: #94a3b8;
      margin-bottom: 4px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .input-grp input, .input-grp textarea {
      width: 100%;
      background: #090d14;
      border: 1px solid #334155;
      color: #fff;
      font-size: 13.5px;
      padding: 9px 12px;
      border-radius: 9px;
      outline: none;
      font-family: inherit;
    }
    .input-grp input:focus, .input-grp textarea:focus {
      border-color: var(--accent);
    }
    .modal-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }
    .btn-submit {
      flex: 1;
      background: var(--accent);
      color: #090d16;
      font-weight: 800;
      border: none;
      padding: 11px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13.5px;
    }
    .btn-close {
      background: transparent;
      color: #94a3b8;
      border: 1px solid #334155;
      padding: 11px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-size: 13px;
    }

    .qr-modal-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .qr-modal-matrix {
      background: #fff;
      padding: 14px;
      border-radius: 18px;
      margin: 16px 0;
    }
    .qr-modal-matrix img {
      width: 210px;
      height: 210px;
      display: block;
    }

    .footer {
      font-size: 11.5px;
      color: #64748b;
      text-align: center;
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .footer a { color: var(--accent); text-decoration: none; font-weight: 600; }

    #toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(80px);
      background: #10b981;
      color: #fff;
      padding: 11px 22px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 700;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.5);
      transition: transform 0.25s ease-out;
      z-index: 1000;
      pointer-events: none;
      white-space: nowrap;
    }
    #toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
</head>
<body>

  <div class="container">
    <div class="top-nav">
      <a href="/" class="brand-pill" title="QuickCard Ethiopia">
        <svg viewBox="0 0 24 24"><path d="M21 4H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H3V6h18v12zm-9-9h7v2h-7zm0 4h5v2h-5z"/></svg>
        QuickCard.et
      </a>
      <div class="top-actions">
        <button class="lang-btn" id="langToggleBtn" onclick="toggleLanguage()">
          🌐 <span id="txtLangLabel">አማርኛ / EN</span>
        </button>
      </div>
    </div>

    <div class="profile-card">
      <div class="avatar-wrap">
        <div class="avatar-box">
          <img src="${profile.avatar || '/images/abebe.jpg'}" alt="${profile.name}" class="avatar" loading="eager" onerror="this.src='/images/abebe.jpg'">
          <span class="ethio-flag-pill">🇪🇹</span>
        </div>
        <div class="headline">
          <div class="name-row">
            <h1 class="name" id="txtName">${profile.name}</h1>
            <span class="verified-badge" title="Verified Digital Identity">✓</span>
          </div>
          <div class="title" id="txtTitle">${profile.title}</div>
          <div class="company" id="txtCompany">
            <span>🏢</span> ${profile.company}
          </div>
        </div>
      </div>

      <p class="bio" id="txtBio">${profile.bio}</p>

      <a href="/p/${profile.id}/vcard" class="save-btn" id="saveContactBtn" onclick="handleVCardDownload(event)">
        <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
        <span id="txtSaveBtn">Save to Contacts</span>
      </a>

      <div class="action-grid">
        ${profile.phone ? `
        <a href="tel:${profile.phone.replace(/\s+/g, '')}" class="action-btn">
          <div class="icon-box ib-call">
            <svg viewBox="0 0 24 24"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </div>
          <span id="txtCall">Direct Call</span>
        </a>` : ''}

        ${profile.telegram ? `
        <a href="https://t.me/${profile.telegram.replace('@', '')}" target="_blank" rel="noopener" class="action-btn">
          <div class="icon-box ib-telegram">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.37.74-.56 2.92-1.27 4.86-2.11 5.83-2.52 2.77-1.16 3.35-1.36 3.73-1.37.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .39z"/></svg>
          </div>
          <span>Telegram</span>
        </a>` : ''}

        ${profile.whatsapp ? `
        <a href="https://wa.me/${profile.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" rel="noopener" class="action-btn">
          <div class="icon-box ib-whatsapp">
            <svg viewBox="0 0 24 24"><path d="M16.75 13.96c.25.13.41.2.46.3.06.11.04.61-.21 1.18-.25.56-.98 1.03-1.6 1.1-.47.05-1.03.07-3.07-.72-2.3-.89-3.8-3.15-3.92-3.3-.11-.15-.95-1.27-.95-2.43 0-1.15.6-1.72.82-1.95.21-.24.47-.3.63-.3.16 0 .32 0 .46.01.15.01.35-.06.55.42.2.49.69 1.68.75 1.8.06.12.1.27.02.43-.08.16-.12.26-.24.4-.12.14-.25.32-.36.43-.12.12-.24.25-.1.5.14.24.62 1.02 1.33 1.65.91.81 1.68 1.06 1.92 1.18.24.12.38.1.52-.06.14-.17.6-.7.76-.94.16-.25.33-.21.55-.12zM12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2.1 21.9l5.01-1.26A9.95 9.95 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
          </div>
          <span>WhatsApp</span>
        </a>` : ''}

        ${profile.email ? `
        <a href="mailto:${profile.email}" class="action-btn">
          <div class="icon-box ib-email">
            <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
          </div>
          <span id="txtEmail">Email</span>
        </a>` : ''}

        ${profile.website ? `
        <a href="${profile.website}" target="_blank" rel="noopener" class="action-btn" style="grid-column: span 2;">
          <div class="icon-box ib-web">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <span>Visit Official Website</span>
        </a>` : ''}
      </div>

      <div class="payment-tray">
        ${profile.telebirr ? `
        <div class="pay-card telebirr">
          <div class="pay-left">
            <div class="pay-badge bg-telebirr">telebirr</div>
            <div class="pay-info">
              <div class="pay-label" id="txtTelebirrLbl">Telebirr Account</div>
              <div class="pay-num">${profile.telebirr} <span style="font-size:11px;font-weight:400;color:#94a3b8;">(${profile.telebirr_name || profile.name})</span></div>
            </div>
          </div>
          <button class="copy-btn" onclick="copyText('${profile.telebirr}', 'Telebirr number copied!')" id="txtCopyBtn">Copy</button>
        </div>` : ''}

        ${profile.cbebirr ? `
        <div class="pay-card cbe">
          <div class="pay-left">
            <div class="pay-badge bg-cbe">CBE Birr</div>
            <div class="pay-info">
              <div class="pay-label" id="txtCbeLbl">Commercial Bank of Ethiopia</div>
              <div class="pay-num">${profile.cbebirr} <span style="font-size:11px;font-weight:400;color:#94a3b8;">(${profile.cbebirr_name || profile.name})</span></div>
            </div>
          </div>
          <button class="copy-btn" onclick="copyText('${profile.cbebirr}', 'CBE account copied!')">Copy</button>
        </div>` : ''}
      </div>

      ${profile.location ? `
      <a href="${profile.maps_url || 'https://maps.google.com/?q=' + encodeURIComponent(profile.location)}" target="_blank" rel="noopener" class="loc-banner">
        <div class="icon-box ib-map">
          <svg viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        </div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:10.5px; color:#f97316; font-weight:700; text-transform:uppercase;" id="txtLocLbl">OFFICE / MEETING LOCATION</div>
          <div style="font-size:12.5px; white-space:nowrap; text-overflow:ellipsis; overflow:hidden;" id="txtLocation">${profile.location}</div>
        </div>
      </a>` : ''}
    </div>

    <div class="exchange-card">
      <div class="exc-title" id="txtRecTitle">🤝 Meet ${profile.name.split(' ')[0]} at this meeting or expo?</div>
      <div class="exc-desc" id="txtRecDesc">No paper card with you? Send your phone or Telegram directly back in 3 seconds.</div>
      <button class="exc-btn" onclick="openLeadModal()">
        <span>✉️</span>
        <span id="txtRecBtn">Share Your Contact Back</span>
      </button>
    </div>

    <div class="offline-qr-bar">
      <div class="oqb-left">
        <div class="qr-thumb-box" onclick="openQrModal()" title="Tap to expand QR">
          <img src="${qrDataUri}" alt="QR code" id="cardQrThumb">
        </div>
        <div class="oqb-text">
          <strong id="txtShareHeading">Quick QR Share</strong>
          <span id="txtShareSub">Tap QR to scan directly from this screen</span>
        </div>
      </div>
      <button class="btn-qr-expand" onclick="openQrModal()">🔍 Full QR</button>
    </div>

    <div class="footer">
      <div>Powered by <a href="/">QuickCard Ethiopia</a> · Ultra-Fast Digital Identity</div>
      <div style="color:#475569; font-size:10.5px;">Addis Ababa • Ethio Telecom 3G Optimized (Zero Frameworks)</div>
    </div>
  </div>

  <div class="modal-overlay" id="leadModal" onclick="if(event.target === this) closeLeadModal()">
    <div class="modal-sheet">
      <h3 id="txtModalTitle">Send Your Contact to ${profile.name}</h3>
      <p id="txtModalSub">Your info will be delivered directly to their QuickCard inbox and Telegram.</p>
      
      <form id="leadForm" onsubmit="submitLead(event)">
        <div class="input-grp">
          <label id="lblVisitorName">Your Name / ስም</label>
          <input type="text" id="visitorName" required placeholder="e.g. Mahlet Solomon">
        </div>
        <div class="input-grp">
          <label id="lblVisitorPhone">Phone or Telegram / ስልክ ወይም ቴሌግራም</label>
          <input type="text" id="visitorPhone" required placeholder="0911... or @mahlet_sol">
        </div>
        <div class="input-grp">
          <label id="lblVisitorCompany">Company / ድርጅት (Optional)</label>
          <input type="text" id="visitorCompany" placeholder="e.g. Awash Bank">
        </div>
        <div class="input-grp">
          <label id="lblVisitorNote">Quick Note / ማስታወሻ</label>
          <textarea id="visitorNote" rows="2" placeholder="e.g. Discuss commercial lease opportunity"></textarea>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-close" onclick="closeLeadModal()">Cancel</button>
          <button type="submit" class="btn-submit" id="btnSubmitLead">Send Contact</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal-overlay" id="qrModal" onclick="if(event.target === this) closeQrModal()">
    <div class="modal-sheet qr-modal-body">
      <h3>Scan ${profile.name}'s Card</h3>
      <p>Scan with any phone camera to save contact or exchange details.</p>
      <div class="qr-modal-matrix">
        <img id="modalQrImg" src="" alt="High contrast QR code">
      </div>
      <div style="font-size:12px; font-family:monospace; color:#94a3b8; background:rgba(255,255,255,0.06); padding:4px 10px; border-radius:6px; margin-bottom:14px;">
        qc.et/p/${profile.id}
      </div>
      <button type="button" class="btn-close" onclick="closeQrModal()" style="width:100%;">Close</button>
    </div>
  </div>

  <div id="toast">Copied!</div>

  <script>
    const profileData = {
      en: {
        name: "${profile.name.replace(/"/g, '\\"')}",
        title: "${(profile.title || '').replace(/"/g, '\\"')}",
        company: "${(profile.company || '').replace(/"/g, '\\"')}",
        bio: "${(profile.bio || '').replace(/"/g, '\\"')}",
        location: "${(profile.location || '').replace(/"/g, '\\"')}",
        saveBtn: "Save to Contacts",
        call: "Direct Call",
        email: "Email",
        telebirrLbl: "Telebirr Account",
        cbeLbl: "Commercial Bank of Ethiopia",
        copyBtn: "Copy",
        locLbl: "OFFICE / MEETING LOCATION",
        recTitle: "🤝 Meet ${profile.name.split(' ')[0]} at this meeting or expo?",
        recDesc: "No paper card with you? Send your phone or Telegram directly back in 3 seconds.",
        recBtn: "Share Your Contact Back",
        shareHeading: "Quick QR Share",
        shareSub: "Tap QR to scan directly from this screen",
        modalTitle: "Send Your Contact to ${profile.name}",
        modalSub: "Delivered directly to their QuickCard inbox and Telegram.",
        btnSubmit: "Send Contact",
        langLabel: "አማርኛ / EN"
      },
      am: {
        name: "${(profile.name_am || profile.name).replace(/"/g, '\\"')}",
        title: "${(profile.title_am || profile.title).replace(/"/g, '\\"')}",
        company: "${(profile.company_am || profile.company).replace(/"/g, '\\"')}",
        bio: "${(profile.bio_am || profile.bio).replace(/"/g, '\\"')}",
        location: "${(profile.location_am || profile.location).replace(/"/g, '\\"')}",
        saveBtn: "እውቂያውን ስልክህ ላይ መዝግብ",
        call: "በቀጥታ ደውል",
        email: "ኢሜይል ላክ",
        telebirrLbl: "የቴሌብር አካውንት",
        cbeLbl: "የኢትዮጵያ ንግድ ባንክ",
        copyBtn: "ኮፒ አድርግ",
        locLbl: "የቢሮ / የመሰብሰቢያ አድራሻ",
        recTitle: "🤝 በአካል ተገናኝታችኋል?",
        recDesc: "የካርድ ወረቀት አያስፈልግም፤ የእርስዎን ስልክ ወይም ቴሌግራም በአንድ ንክኪ ይመልሱ።",
        recBtn: "የእርስዎን እውቂያ ይመልሱ",
        shareHeading: "የፈጣን ኪው-አር ማጋሪያ",
        shareSub: "በቀጥታ ከስክሪኑ ላይ ፎቶ አንስተው ለመክፈት ይንኩ",
        modalTitle: "እውቂያዎትን ለ${profile.name_am || profile.name} ይላኩ",
        modalSub: "በቀጥታ ወደ ስልካቸው እና የቴሌግራም ቦክሳቸው ይደርሳቸዋል።",
        btnSubmit: "እውቂያዬን ላክ",
        langLabel: "English / አማ"
      }
    };

    let currentLang = 'en';

    function toggleLanguage() {
      currentLang = currentLang === 'en' ? 'am' : 'en';
      const d = profileData[currentLang];
      document.getElementById('txtName').textContent = d.name;
      document.getElementById('txtTitle').textContent = d.title;
      document.getElementById('txtCompany').innerHTML = '<span>🏢</span> ' + d.company;
      document.getElementById('txtBio').textContent = d.bio;
      document.getElementById('txtSaveBtn').textContent = d.saveBtn;
      if (document.getElementById('txtCall')) document.getElementById('txtCall').textContent = d.call;
      if (document.getElementById('txtEmail')) document.getElementById('txtEmail').textContent = d.email;
      if (document.getElementById('txtTelebirrLbl')) document.getElementById('txtTelebirrLbl').textContent = d.telebirrLbl;
      if (document.getElementById('txtCbeLbl')) document.getElementById('txtCbeLbl').textContent = d.cbeLbl;
      if (document.getElementById('txtLocLbl')) document.getElementById('txtLocLbl').textContent = d.locLbl;
      if (document.getElementById('txtLocation')) document.getElementById('txtLocation').textContent = d.location;
      document.getElementById('txtRecTitle').textContent = d.recTitle;
      document.getElementById('txtRecDesc').textContent = d.recDesc;
      document.getElementById('txtRecBtn').textContent = d.recBtn;
      document.getElementById('txtShareHeading').textContent = d.shareHeading;
      document.getElementById('txtShareSub').textContent = d.shareSub;
      document.getElementById('txtModalTitle').textContent = d.modalTitle;
      document.getElementById('txtModalSub').textContent = d.modalSub;
      document.getElementById('btnSubmitLead').textContent = d.btnSubmit;
      document.getElementById('txtLangLabel').textContent = d.langLabel;
    }

    function handleVCardDownload(e) {
      const vcardRaw = ${JSON.stringify(vcardRaw)};
      try {
        const blob = new Blob([vcardRaw], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "${profile.id}-contact.vcf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(currentLang === 'am' ? 'እውቂያው ወርዷል!' : 'Contact file downloaded!');
        e.preventDefault();
      } catch (err) {
        return true;
      }
    }

    function copyText(txt, msg) {
      navigator.clipboard.writeText(txt).then(() => {
        showToast(msg || 'Copied to clipboard');
      }).catch(() => {
        const input = document.createElement('input');
        input.value = txt;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        showToast(msg || 'Copied!');
      });
    }

    function showToast(msg) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 2200);
    }

    function openLeadModal() {
      document.getElementById('leadModal').classList.add('open');
      document.getElementById('visitorName').focus();
    }
    function closeLeadModal() {
      document.getElementById('leadModal').classList.remove('open');
    }

    function openQrModal() {
      const thumb = document.getElementById('cardQrThumb');
      if (thumb) {
        document.getElementById('modalQrImg').src = thumb.src;
      }
      document.getElementById('qrModal').classList.add('open');
    }
    function closeQrModal() {
      document.getElementById('qrModal').classList.remove('open');
    }

    async function submitLead(e) {
      e.preventDefault();
      const payload = {
        cardId: "${profile.id}",
        visitorName: document.getElementById('visitorName').value.trim(),
        visitorPhone: document.getElementById('visitorPhone').value.trim(),
        visitorCompany: document.getElementById('visitorCompany').value.trim(),
        note: document.getElementById('visitorNote').value.trim(),
        source: 'QuickCard Web Exchange'
      };

      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          closeLeadModal();
          showToast(currentLang === 'am' ? 'እውቂያዎ ተልኳል! እናመሰግናለን።' : 'Contact sent successfully! Thank you.');
          document.getElementById('leadForm').reset();
        } else {
          fallbackTelegramShare(payload);
        }
      } catch (err) {
        fallbackTelegramShare(payload);
      }
    }

    function fallbackTelegramShare(p) {
      ${profile.telegram ? `
      const msg = encodeURIComponent("Hi ${profile.name}, we connected on QuickCard! Here are my details:\\nName: " + p.visitorName + "\\nContact: " + p.visitorPhone + (p.visitorCompany ? "\\nCompany: " + p.visitorCompany : "") + (p.note ? "\\nNote: " + p.note : ""));
      window.location.href = "https://t.me/${profile.telegram.replace('@', '')}?text=" + msg;
      ` : `
      showToast('Saved locally!');
      closeLeadModal();
      `}
    }
  </script>
</body>
</html>`;

  return minifyHtml(rawHtml);
}

module.exports = { renderCardHtml };

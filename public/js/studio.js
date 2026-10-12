// QuickCard Ethiopia - Master Studio Controller
let allProfiles = {};
let currentProfileId = 'abebe';
let allLeads = [];
let currentBadgeFormat = 'lanyard';

window.addEventListener('DOMContentLoaded', async () => {
  startAddisClock();
  await loadProfiles();
  await loadLeads();
  updateBadgeDisplay();
  calculateRoi();
  if (currentProfileId) {
    await runPerformanceAudit(currentProfileId);
  }
});

// -------------------------------------------------------------
// Live Addis Ababa Clock (GMT+3)
// -------------------------------------------------------------
function startAddisClock() {
  function updateClock() {
    const now = new Date();
    // UTC + 3 hours for East Africa Time (EAT)
    const eatOffset = 3 * 60;
    const localOffset = now.getTimezoneOffset();
    const eatTime = new Date(now.getTime() + (localOffset + eatOffset) * 60000);
    const hours = String(eatTime.getHours()).padStart(2, '0');
    const minutes = String(eatTime.getMinutes()).padStart(2, '0');
    const el = document.getElementById('headerAddisClock');
    if (el) el.textContent = `${hours}:${minutes} EAT (GMT+3)`;
  }
  updateClock();
  setInterval(updateClock, 60000);
}

// -------------------------------------------------------------
// Profile Management
// -------------------------------------------------------------
async function loadProfiles() {
  try {
    const res = await fetch('/api/profiles');
    allProfiles = await res.json();
    renderProfileChips();
    if (!allProfiles[currentProfileId]) {
      currentProfileId = Object.keys(allProfiles)[0] || 'abebe';
    }
    populateForm(currentProfileId);
    updateFilterCardholders();
  } catch (err) {
    console.error('Error fetching profiles', err);
    showToast('Failed to load profiles');
  }
}

function renderProfileChips() {
  const container = document.getElementById('profileChips');
  if (!container) return;
  container.innerHTML = '';

  Object.keys(allProfiles).forEach(id => {
    const p = allProfiles[id];
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = `chip ${id === currentProfileId ? 'active' : ''}`;
    chip.innerHTML = `
      <img src="${p.avatar || '/images/abebe.jpg'}" class="chip-avatar" onerror="this.src='/images/abebe.jpg'" alt="${p.name}">
      <span>${escapeHtml(p.name)}</span>
    `;
    chip.onclick = () => selectProfile(id);
    container.appendChild(chip);
  });

  // "+ Add" chip button
  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'btn-chip-add';
  addBtn.textContent = '+ New';
  addBtn.onclick = openNewProfileModal;
  container.appendChild(addBtn);
}

function selectProfile(id) {
  currentProfileId = id;
  renderProfileChips();
  populateForm(id);
  updateSimulatorUrl(id);
  updateBadgeDisplay();
  runPerformanceAudit(id);

  // Update top right header live link
  const liveLink = document.getElementById('headerLiveCardLink');
  if (liveLink) liveLink.href = `/p/${id}`;
}

function populateForm(id) {
  const p = allProfiles[id];
  if (!p) return;

  document.getElementById('inpId').value = p.id || '';
  document.getElementById('inpTheme').value = p.theme || 'gold';
  document.getElementById('inpName').value = p.name || '';
  document.getElementById('inpNameAm').value = p.name_am || '';
  document.getElementById('inpTitle').value = p.title || '';
  document.getElementById('inpTitleAm').value = p.title_am || '';
  document.getElementById('inpCompany').value = p.company || '';
  document.getElementById('inpCompanyAm').value = p.company_am || '';
  document.getElementById('inpAvatar').value = p.avatar || '';
  
  const avatarSelect = document.getElementById('inpAvatarSelect');
  if (avatarSelect) {
    if (p.avatar === '/images/sara.jpg') {
      avatarSelect.value = '/images/sara.jpg';
    } else {
      avatarSelect.value = '/images/abebe.jpg';
    }
  }

  document.getElementById('inpPhone').value = p.phone || '';
  document.getElementById('inpEmail').value = p.email || '';
  document.getElementById('inpTelegram').value = (p.telegram || '').replace('@', '');
  document.getElementById('inpWhatsapp').value = p.whatsapp || '';
  document.getElementById('inpWebsite').value = p.website || '';

  document.getElementById('inpTelebirr').value = p.telebirr || '';
  document.getElementById('inpTelebirrName').value = p.telebirr_name || '';
  document.getElementById('inpCbe').value = p.cbebirr || '';
  document.getElementById('inpCbeName').value = p.cbebirr_name || '';

  document.getElementById('inpLocation').value = p.location || '';
  document.getElementById('inpLocationAm').value = p.location_am || '';
  document.getElementById('inpMapsUrl').value = p.maps_url || '';
  document.getElementById('inpBio').value = p.bio || '';
  document.getElementById('inpBioAm').value = p.bio_am || '';

  document.getElementById('simProfileName').textContent = p.name || p.id;
}

function selectPresetAvatar(val) {
  document.getElementById('inpAvatar').value = val;
  updateLivePreview();
}

// Live edit preview debounce
let previewTimeout = null;
function updateLivePreview() {
  clearTimeout(previewTimeout);
  previewTimeout = setTimeout(() => {
    const updated = collectFormData();
    allProfiles[currentProfileId] = updated;
    document.getElementById('simProfileName').textContent = updated.name;
    updateBadgeDisplay();
  }, 250);
}

function collectFormData() {
  return {
    id: document.getElementById('inpId').value.trim(),
    name: document.getElementById('inpName').value.trim(),
    name_am: document.getElementById('inpNameAm').value.trim(),
    title: document.getElementById('inpTitle').value.trim(),
    title_am: document.getElementById('inpTitleAm').value.trim(),
    company: document.getElementById('inpCompany').value.trim(),
    company_am: document.getElementById('inpCompanyAm').value.trim(),
    phone: document.getElementById('inpPhone').value.trim(),
    email: document.getElementById('inpEmail').value.trim(),
    telegram: document.getElementById('inpTelegram').value.trim(),
    whatsapp: document.getElementById('inpWhatsapp').value.trim(),
    website: document.getElementById('inpWebsite').value.trim(),
    telebirr: document.getElementById('inpTelebirr').value.trim(),
    telebirr_name: document.getElementById('inpTelebirrName').value.trim(),
    cbebirr: document.getElementById('inpCbe').value.trim(),
    cbebirr_name: document.getElementById('inpCbeName').value.trim(),
    location: document.getElementById('inpLocation').value.trim(),
    location_am: document.getElementById('inpLocationAm').value.trim(),
    maps_url: document.getElementById('inpMapsUrl').value.trim(),
    bio: document.getElementById('inpBio').value.trim(),
    bio_am: document.getElementById('inpBioAm').value.trim(),
    theme: document.getElementById('inpTheme').value,
    avatar: document.getElementById('inpAvatar').value.trim() || '/images/abebe.jpg'
  };
}

async function saveCurrentProfile(e) {
  if (e) e.preventDefault();
  const updated = collectFormData();

  try {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (res.ok) {
      allProfiles[updated.id] = updated;
      renderProfileChips();
      reloadSimIframe();
      showToast('Profile saved & synchronized!');
      runPerformanceAudit(updated.id);
      updateBadgeDisplay();
    } else {
      showToast('Server error saving profile');
    }
  } catch (err) {
    showToast('Failed to save profile');
  }
}

function resetCurrentForm() {
  populateForm(currentProfileId);
  reloadSimIframe();
  showToast('Reset to saved profile state');
}

async function deleteCurrentProfile() {
  if (Object.keys(allProfiles).length <= 1) {
    showToast('Cannot delete the only remaining profile');
    return;
  }

  const p = allProfiles[currentProfileId];
  if (!confirm(`Are you sure you want to delete profile "${p?.name || currentProfileId}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/profiles/${currentProfileId}`, { method: 'DELETE' });
    if (res.ok) {
      delete allProfiles[currentProfileId];
      currentProfileId = Object.keys(allProfiles)[0];
      renderProfileChips();
      populateForm(currentProfileId);
      updateSimulatorUrl(currentProfileId);
      showToast('Profile deleted successfully');
    } else {
      showToast('Error deleting profile');
    }
  } catch (err) {
    showToast('Failed to delete profile');
  }
}

// -------------------------------------------------------------
// Interactive Phone Simulator Controls
// -------------------------------------------------------------
function updateSimulatorUrl(id) {
  const iframe = document.getElementById('cardPreviewIframe');
  iframe.src = `/p/${id}?t=${Date.now()}`;
  document.getElementById('btnSimDirectVcard').href = `/p/${id}/vcard`;
  document.getElementById('btnSimOpenTab').href = `/p/${id}`;
}

function reloadSimIframe() {
  const iframe = document.getElementById('cardPreviewIframe');
  iframe.src = `/p/${currentProfileId}?t=${Date.now()}`;
  showToast('Mobile simulator reloaded');
}

let isAndroid = false;
function toggleSimDevice() {
  isAndroid = !isAndroid;
  const chassis = document.getElementById('phoneChassis');
  const btn = document.getElementById('btnDeviceToggle');
  if (isAndroid) {
    chassis.classList.add('android-frame');
    btn.textContent = '🤖 Android S25';
  } else {
    chassis.classList.remove('android-frame');
    btn.textContent = '🍎 iPhone 16 Pro';
  }
}

function triggerNfcTap() {
  const overlay = document.getElementById('nfcOverlay');
  overlay.classList.add('active');
  setTimeout(() => {
    overlay.classList.remove('active');
    reloadSimIframe();
    showToast('NFC tap beam simulated! Opened in browser.');
  }, 1200);
}

function copyCardUrl() {
  const url = `${window.location.origin}/p/${currentProfileId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast(`Copied shortlink: ${url}`);
  }).catch(() => {
    showToast(`Link: ${url}`);
  });
}

function openQrPassModal() {
  const p = allProfiles[currentProfileId] || {};
  document.getElementById('qrModalHeading').textContent = `${p.name || currentProfileId}'s QR Pass`;
  document.getElementById('qrModalImg').src = `/p/${currentProfileId}/qr.svg?t=${Date.now()}`;
  document.getElementById('qrModalUrl').textContent = `qc.et/p/${currentProfileId}`;
  document.getElementById('btnDownloadSvg').href = `/p/${currentProfileId}/qr.svg`;
  document.getElementById('btnDownloadPng').href = `/p/${currentProfileId}/qr.png`;
  document.getElementById('qrPassModal').classList.add('open');
}

function closeQrPassModal() {
  document.getElementById('qrPassModal').classList.remove('open');
}

// -------------------------------------------------------------
// Quick Settings Tile & Floating HUD Overlay Simulator
// -------------------------------------------------------------
function toggleQuickSettingsShade() {
  const shade = document.getElementById('qsShade');
  if (!shade) return;
  shade.classList.toggle('open');
  if (shade.classList.contains('open')) {
    updateQsClock();
  }
}

function closeQuickSettingsShade() {
  const shade = document.getElementById('qsShade');
  if (shade) shade.classList.remove('open');
}

function updateQsClock() {
  const now = new Date();
  const eatOffset = 3 * 60;
  const localOffset = now.getTimezoneOffset();
  const eatTime = new Date(now.getTime() + (localOffset + eatOffset) * 60000);
  const hours = String(eatTime.getHours()).padStart(2, '0');
  const minutes = String(eatTime.getMinutes()).padStart(2, '0');
  const clockEl = document.getElementById('qsClock');
  if (clockEl) clockEl.textContent = `${hours}:${minutes}`;
  const statusEl = document.getElementById('statusBarClock');
  if (statusEl) statusEl.textContent = `${hours}:${minutes}`;
}

function triggerTileToHud() {
  closeQuickSettingsShade();
  const hud = document.getElementById('phoneHudOverlay');
  if (!hud) return;

  // Sync current profile data to the HUD popup
  const p = allProfiles[currentProfileId] || {};
  const avatarEl = document.getElementById('simHudAvatar');
  if (avatarEl) avatarEl.src = p.avatar || '/images/abebe.jpg';
  
  const nameEl = document.getElementById('simHudName');
  if (nameEl) nameEl.textContent = p.name || 'QuickCard User';

  const roleEl = document.getElementById('simHudRole');
  if (roleEl) roleEl.textContent = `${p.title || ''} ${p.company ? '· ' + p.company : ''}`;

  const qrImg = document.getElementById('simHudQrImg');
  if (qrImg) qrImg.src = `/p/${currentProfileId}/qr.svg?t=${Date.now()}`;

  const shortUrl = document.getElementById('simHudShortUrl');
  if (shortUrl) shortUrl.textContent = `qc.et/p/${currentProfileId}`;

  const telebirrEl = document.getElementById('simHudTelebirr');
  if (telebirrEl) telebirrEl.textContent = p.telebirr || p.phone || '0911234567';

  const vcardLink = document.getElementById('simHudVcardLink');
  if (vcardLink) vcardLink.href = `/p/${currentProfileId}/vcard`;

  hud.classList.add('open');
  showToast('⚡ QuickCard HUD popped up with 0s latency! No app opened.');
}

function closeHudOverlay() {
  const hud = document.getElementById('phoneHudOverlay');
  if (hud) hud.classList.remove('open');
}

function switchSimHudMethod(method) {
  const methodMap = {
    qr: 'Qr',
    nfc: 'Nfc',
    exchange: 'Exchange',
    pay: 'Pay'
  };

  ['qr', 'nfc', 'exchange', 'pay'].forEach(m => {
    const key = methodMap[m];
    const tab = document.getElementById(`simTab${key}`);
    const stage = document.getElementById(`simStage${key}`);
    if (tab) tab.classList.toggle('active', m === method);
    if (stage) stage.style.display = (m === method) ? 'flex' : 'none';
  });
}

async function submitSimQuickLead() {
  const nameInput = document.getElementById('simQuickLeadName');
  const phoneInput = document.getElementById('simQuickLeadPhone');
  if (!nameInput || !phoneInput) return;

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!name || !phone) {
    showToast('Please enter visitor name and phone/telegram');
    return;
  }

  const payload = {
    cardId: currentProfileId,
    visitorName: name,
    visitorPhone: phone,
    visitorCompany: 'Direct HUD Handshake',
    source: 'Quick Settings Floating Widget',
    note: 'Instant 2-way handshake from phone popup'
  };

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      showToast('🤝 Contact saved directly to Leads CRM!');
      nameInput.value = '';
      phoneInput.value = '';
      await loadLeads();
      closeHudOverlay();
    } else {
      showToast('Error saving contact');
    }
  } catch (err) {
    showToast('Failed to record contact');
  }
}


// -------------------------------------------------------------
// Trade Fair & Badge Suite
// -------------------------------------------------------------
function switchBadgeFormat(format) {
  currentBadgeFormat = format;
  document.querySelectorAll('.btn-format').forEach(b => b.classList.remove('active'));
  document.getElementById('formatLanyard').style.display = 'none';
  document.getElementById('formatTent').style.display = 'none';
  document.getElementById('formatNfc').style.display = 'none';

  if (format === 'lanyard') {
    document.getElementById('btnFormatLanyard').classList.add('active');
    document.getElementById('formatLanyard').style.display = 'flex';
  } else if (format === 'tent') {
    document.getElementById('btnFormatTent').classList.add('active');
    document.getElementById('formatTent').style.display = 'block';
  } else if (format === 'nfc') {
    document.getElementById('btnFormatNfc').classList.add('active');
    document.getElementById('formatNfc').style.display = 'flex';
  }
  updateBadgeDisplay();
}

function updateBadgeDisplay() {
  const p = allProfiles[currentProfileId];
  if (!p) return;

  const eventName = document.getElementById('inpBadgeEvent').value.trim() || 'ADDIS CHAMBER EXPO 2026';
  const qrUrl = `/p/${currentProfileId}/qr.svg`;

  // Format 1: Lanyard Badge
  document.getElementById('badgeEventLabel').textContent = eventName.toUpperCase();
  document.getElementById('badgeNameEn').textContent = p.name;
  document.getElementById('badgeNameAm').textContent = p.name_am || '';
  document.getElementById('badgeRole').textContent = p.title || '';
  document.getElementById('badgeComp').textContent = p.company || '';
  document.getElementById('badgeQrImg').src = qrUrl;
  document.getElementById('badgeUrlText').textContent = `qc.et/p/${p.id}`;

  // Format 2: Table Tent
  document.getElementById('tentCompName').textContent = p.company || p.name;
  document.getElementById('tentQr1').src = qrUrl;
  document.getElementById('tentTelebirr').textContent = p.telebirr || p.phone || '0911234567';

  // Format 3: NFC Card
  document.getElementById('nfcName').textContent = p.name;
  document.getElementById('nfcRole').textContent = p.title || '';
  document.getElementById('nfcComp').textContent = p.company || '';
  document.getElementById('nfcQrThumb').src = qrUrl;
}

// -------------------------------------------------------------
// Captured Leads CRM
// -------------------------------------------------------------
async function loadLeads() {
  try {
    const res = await fetch('/api/leads');
    allLeads = await res.json();
    renderLeadsTable(allLeads);
    updateLeadsMetrics();
  } catch (err) {
    console.error('Failed to load leads', err);
  }
}

function updateLeadsMetrics() {
  const total = allLeads.length;
  const newCount = allLeads.filter(l => (l.status || 'New') === 'New').length;
  const qualCount = allLeads.filter(l => l.status === 'Qualified').length;

  document.getElementById('metricTotalLeads').textContent = total;
  document.getElementById('metricNewLeads').textContent = newCount;
  document.getElementById('metricQualifiedLeads').textContent = qualCount;
  document.getElementById('leadsBadge').textContent = total;
  document.getElementById('headerLeadsCount').textContent = total;

  // Compute top cardholder
  const cardCounts = {};
  allLeads.forEach(l => {
    cardCounts[l.cardId] = (cardCounts[l.cardId] || 0) + 1;
  });
  let topName = 'Abebe';
  let topVal = 0;
  Object.keys(cardCounts).forEach(c => {
    if (cardCounts[c] > topVal) {
      topVal = cardCounts[c];
      const found = allProfiles[c];
      topName = found ? found.name.split(' ')[0] : c;
    }
  });
  document.getElementById('metricTopCardholder').textContent = `${topName} (${topVal})`;
}

function updateFilterCardholders() {
  const sel = document.getElementById('filterCardholder');
  if (!sel) return;
  sel.innerHTML = '<option value="all">All Cardholders</option>';
  Object.keys(allProfiles).forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = allProfiles[id].name || id;
    sel.appendChild(opt);
  });
}

function filterLeads() {
  const query = (document.getElementById('leadSearchInput').value || '').toLowerCase().trim();
  const cardFilter = document.getElementById('filterCardholder').value;
  const statusFilter = document.getElementById('filterStatus').value;

  const filtered = allLeads.filter(l => {
    if (cardFilter !== 'all' && l.cardId !== cardFilter) return false;
    if (statusFilter !== 'all' && (l.status || 'New') !== statusFilter) return false;
    if (query) {
      const match = (l.visitorName || '').toLowerCase().includes(query) ||
                    (l.visitorPhone || '').toLowerCase().includes(query) ||
                    (l.visitorTelegram || '').toLowerCase().includes(query) ||
                    (l.visitorCompany || '').toLowerCase().includes(query) ||
                    (l.note || '').toLowerCase().includes(query);
      if (!match) return false;
    }
    return true;
  });

  renderLeadsTable(filtered);
}

function renderLeadsTable(leadsToRender) {
  const tbody = document.getElementById('leadsTableBody');
  if (!tbody) return;

  if (leadsToRender.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#64748b;padding:36px;">No matching inbound leads found.</td></tr>`;
    return;
  }

  tbody.innerHTML = leadsToRender.map(lead => {
    const timeFormatted = new Date(lead.timestamp).toLocaleDateString() + ' ' + 
      new Date(lead.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const status = lead.status || 'New';
    const statusClass = status.toLowerCase();

    return `
      <tr>
        <td><strong>${escapeHtml(lead.visitorName)}</strong></td>
        <td>
          <a href="tel:${escapeHtml(lead.visitorPhone.replace(/\s+/g, ''))}" style="color:#38bdf8; text-decoration:none;">📞 ${escapeHtml(lead.visitorPhone)}</a>
          ${lead.visitorTelegram ? `<br><a href="https://t.me/${escapeHtml(lead.visitorTelegram.replace('@', ''))}" target="_blank" style="color:#94a3b8; font-size:11.5px; text-decoration:none;">✈️ ${escapeHtml(lead.visitorTelegram)}</a>` : ''}
        </td>
        <td>${escapeHtml(lead.visitorCompany || '—')}</td>
        <td><span style="background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px; font-size:11.5px;">@${lead.cardId}</span></td>
        <td>
          <select onchange="updateLeadStatus('${lead.id}', this.value)" style="background:#090e19; border:1px solid var(--border-subtle); color:#fff; padding:3px 7px; border-radius:6px; font-size:11px;">
            <option value="New" ${status === 'New' ? 'selected' : ''}>🟢 New</option>
            <option value="Contacted" ${status === 'Contacted' ? 'selected' : ''}>🔵 Contacted</option>
            <option value="Qualified" ${status === 'Qualified' ? 'selected' : ''}>🟡 Qualified</option>
            <option value="Closed" ${status === 'Closed' ? 'selected' : ''}>⚪ Closed</option>
          </select>
        </td>
        <td><span style="font-size:11.5px; color:#cbd5e1;">${escapeHtml(lead.source || 'Badge Scan')}</span></td>
        <td style="max-width:220px; color:#cbd5e1; font-size:12px;">${escapeHtml(lead.note || '—')}</td>
        <td style="color:#64748b; font-size:11.5px; white-space:nowrap;">${timeFormatted}</td>
        <td>
          <div class="lead-actions-cell">
            <button type="button" class="btn-xs" onclick="downloadLeadSingleVcard('${lead.id}')" title="Save to phonebook">🪪 vCard</button>
            <button type="button" class="btn-xs" onclick="deleteLead('${lead.id}')" title="Delete lead" style="color:#f87171;">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function updateLeadStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    if (res.ok) {
      const idx = allLeads.findIndex(l => l.id === id);
      if (idx !== -1) allLeads[idx].status = newStatus;
      updateLeadsMetrics();
      showToast(`Lead status updated to ${newStatus}`);
    }
  } catch (err) {
    showToast('Failed to update lead status');
  }
}

async function deleteLead(id) {
  if (!confirm('Are you sure you want to remove this lead?')) return;
  try {
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' });
    if (res.ok) {
      allLeads = allLeads.filter(l => l.id !== id);
      filterLeads();
      updateLeadsMetrics();
      showToast('Lead deleted');
    }
  } catch (err) {
    showToast('Failed to delete lead');
  }
}

function downloadLeadSingleVcard(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;

  const names = lead.visitorName.trim().split(' ');
  const firstName = names[0] || '';
  const lastName = names.slice(1).join(' ') || '';
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${lead.visitorName}`,
    `N:${lastName};${firstName};;;`,
    `ORG:${lead.visitorCompany || 'Trade Fair Visitor'}`,
    `TEL;TYPE=CELL,VOICE:${lead.visitorPhone.replace(/\s+/g, '')}`,
    lead.visitorTelegram ? `X-TELEGRAM:${lead.visitorTelegram}` : '',
    `NOTE:QuickCard Event Lead (${lead.source || 'Badge Scan'} | Note: ${lead.note || ''})`,
    'END:VCARD'
  ].filter(Boolean).join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${lead.visitorName.replace(/\s+/g, '_')}-lead.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`vCard for ${lead.visitorName} downloaded!`);
}

function exportLeadsCSV() {
  if (allLeads.length === 0) {
    showToast('No leads to export');
    return;
  }
  const headers = ['ID', 'Visitor Name', 'Phone', 'Telegram', 'Company', 'Cardholder', 'Status', 'Source', 'Notes', 'Date'];
  const rows = allLeads.map(l => [
    l.id,
    `"${(l.visitorName || '').replace(/"/g, '""')}"`,
    `"${(l.visitorPhone || '').replace(/"/g, '""')}"`,
    `"${(l.visitorTelegram || '').replace(/"/g, '""')}"`,
    `"${(l.visitorCompany || '').replace(/"/g, '""')}"`,
    l.cardId,
    l.status || 'New',
    `"${(l.source || '').replace(/"/g, '""')}"`,
    `"${(l.note || '').replace(/"/g, '""')}"`,
    l.timestamp
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `quickcard_leads_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Exported CSV spreadsheet!');
}

function exportLeadsVCard() {
  window.location.href = '/api/leads/export/vcf';
  showToast('Downloading all leads as .vcf bundle...');
}

// -------------------------------------------------------------
// Lead Simulation Modal
// -------------------------------------------------------------
function openSimLeadModal() {
  document.getElementById('simLeadModal').classList.add('open');
}
function closeSimLeadModal() {
  document.getElementById('simLeadModal').classList.remove('open');
}

function fillLeadPreset(type) {
  if (type === 'bank') {
    document.getElementById('simVisitorName').value = 'Ephrem Tesfaye';
    document.getElementById('simVisitorPhone').value = '+251 91 144 5566';
    document.getElementById('simVisitorCompany').value = 'Dashen Bank Head Office';
    document.getElementById('simVisitorNote').value = 'Interested in booking commercial floor for digital branch.';
  } else if (type === 'exporter') {
    document.getElementById('simVisitorName').value = 'Hans Meier';
    document.getElementById('simVisitorPhone').value = '+49 171 889 900';
    document.getElementById('simVisitorCompany').value = 'Bremen Green Coffee Trading';
    document.getElementById('simVisitorNote').value = 'Requesting sample shipment of Grade 1 Washed Sidama.';
  } else if (type === 'investor') {
    document.getElementById('simVisitorName').value = 'Helina Moges';
    document.getElementById('simVisitorPhone').value = '+251 93 456 7890';
    document.getElementById('simVisitorCompany').value = 'Addis Venture Capital';
    document.getElementById('simVisitorNote').value = 'Discussing syndicate investment in mixed-use plaza.';
  }
}

async function submitSimLead(e) {
  e.preventDefault();
  const payload = {
    cardId: currentProfileId,
    visitorName: document.getElementById('simVisitorName').value.trim(),
    visitorPhone: document.getElementById('simVisitorPhone').value.trim(),
    visitorCompany: document.getElementById('simVisitorCompany').value.trim(),
    source: document.getElementById('simVisitorSource').value,
    note: document.getElementById('simVisitorNote').value.trim(),
    status: 'New'
  };

  try {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      closeSimLeadModal();
      showToast('New inbound lead recorded!');
      await loadLeads();
      document.getElementById('simVisitorName').value = '';
      document.getElementById('simVisitorPhone').value = '';
      document.getElementById('simVisitorCompany').value = '';
      document.getElementById('simVisitorNote').value = '';
    }
  } catch (err) {
    showToast('Failed to record lead');
  }
}

// -------------------------------------------------------------
// New Profile Modal
// -------------------------------------------------------------
function openNewProfileModal() {
  document.getElementById('newProfileModal').classList.add('open');
}
function closeNewProfileModal() {
  document.getElementById('newProfileModal').classList.remove('open');
}

function applyProfilePreset(type) {
  if (type === 'broker') {
    document.getElementById('newProfileSlug').value = 'yonas_broker';
    document.getElementById('newProfileName').value = 'Yonas Tsegaye';
    document.getElementById('newProfileCompany').value = 'Addis Skyline Realty';
    document.getElementById('newProfilePhone').value = '+251 91 188 2233';
  } else if (type === 'fintech') {
    document.getElementById('newProfileSlug').value = 'mahlet_pay';
    document.getElementById('newProfileName').value = 'Mahlet Getachew';
    document.getElementById('newProfileCompany').value = 'PayEthiopia Solutions';
    document.getElementById('newProfilePhone').value = '+251 92 334 5566';
  } else if (type === 'exporter') {
    document.getElementById('newProfileSlug').value = 'alemu_coffee';
    document.getElementById('newProfileName').value = 'Alemu Negash';
    document.getElementById('newProfileCompany').value = 'Kaffa Highland Coffee Exports';
    document.getElementById('newProfilePhone').value = '+251 91 555 7788';
  } else if (type === 'designer') {
    document.getElementById('newProfileSlug').value = 'rahel_studio';
    document.getElementById('newProfileName').value = 'Rahel Melaku';
    document.getElementById('newProfileCompany').value = 'Entoto Design & Brand Lab';
    document.getElementById('newProfilePhone').value = '+251 94 222 3344';
  }
}

async function submitNewProfile(e) {
  e.preventDefault();
  const slug = document.getElementById('newProfileSlug').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const name = document.getElementById('newProfileName').value.trim();
  const company = document.getElementById('newProfileCompany').value.trim();
  const phone = document.getElementById('newProfilePhone').value.trim();

  if (!slug || !name) return;

  const newProfile = {
    id: slug,
    name: name,
    name_am: name,
    title: 'Business Representative',
    title_am: 'የንግድ ተወካይ',
    company: company,
    company_am: company,
    phone: phone,
    email: `${slug}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.et`,
    telegram: slug,
    whatsapp: phone.replace(/[^0-9]/g, ''),
    telebirr: phone.replace(/[^0-9]/g, '').slice(-10),
    telebirr_name: name,
    cbebirr: '1000' + Math.floor(100000000 + Math.random() * 900000000),
    cbebirr_name: name,
    location: 'Bole, Addis Ababa, Ethiopia',
    location_am: 'ቦሌ፣ አዲስ አበባ፣ ኢትዮጵያ',
    bio: `Professional profile for ${name} at ${company}. Connect instantly via QuickCard.`,
    bio_am: `የ${name} ፈጣን የቢዝነስ ካርድ። በቀላሉ ስልካቸውን ይያዙ።`,
    theme: 'gold',
    avatar: '/images/abebe.jpg'
  };

  try {
    const res = await fetch('/api/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile)
    });
    if (res.ok) {
      allProfiles[slug] = newProfile;
      closeNewProfileModal();
      selectProfile(slug);
      showToast(`Created new profile: ${name}`);
    } else {
      showToast('Error creating profile');
    }
  } catch (err) {
    showToast('Failed to create profile');
  }
}

// -------------------------------------------------------------
// Speed & 3G Benchmark Lab
// -------------------------------------------------------------
async function runPerformanceAudit(id) {
  try {
    const res = await fetch(`/api/audit/${id}`);
    const data = await res.json();
    document.getElementById('headerPageSize').textContent = data.formattedSize;
    document.getElementById('headerLatency').textContent = data.latencyEstimates['Ethio Telecom 3G'];
    document.getElementById('benchBytes').textContent = data.formattedSize;
    document.getElementById('bench3G').textContent = data.latencyEstimates['Ethio Telecom 3G'];
    document.getElementById('simByteBadge').textContent = data.formattedSize;
    document.getElementById('sim3GBadge').textContent = data.latencyEstimates['Ethio Telecom 3G'];
  } catch (err) {
    console.error('Audit failed', err);
  }
}

function runSimulatedRace() {
  const net = document.getElementById('selectNetworkSim').value;
  const barQc = document.getElementById('raceBarQuickCard');
  const barLt = document.getElementById('raceBarLinktree');
  const barNx = document.getElementById('raceBarNextJs');

  const timeQc = document.getElementById('raceTimeQuickCard');
  const timeLt = document.getElementById('raceTimeLinktree');
  const timeNx = document.getElementById('raceTimeNextJs');

  // Reset bars
  barQc.style.transition = 'none';
  barLt.style.transition = 'none';
  barNx.style.transition = 'none';
  barQc.style.width = '0%';
  barLt.style.width = '0%';
  barNx.style.width = '0%';

  setTimeout(() => {
    let qcSec = 0.18;
    let ltSec = 12.2;
    let nxSec = 30.4;

    if (net === '2g') {
      qcSec = 2.75;
      ltSec = 184.0;
      nxSec = 456.0;
    } else if (net === '4g') {
      qcSec = 0.02;
      ltSec = 0.92;
      nxSec = 2.28;
    } else if (net === 'safaricom') {
      qcSec = 0.01;
      ltSec = 0.61;
      nxSec = 1.52;
    }

    timeQc.textContent = `COMPLETED (${qcSec}s)`;
    timeLt.textContent = `${ltSec}s (${Math.round(ltSec / qcSec)}x Slower)`;
    timeNx.textContent = `${nxSec}s (High Bounce Risk)`;

    barQc.style.transition = `width ${Math.min(qcSec, 2)}s ease-out`;
    barLt.style.transition = `width ${Math.min(ltSec, 8)}s ease-out`;
    barNx.style.transition = `width ${Math.min(nxSec, 12)}s ease-out`;

    barQc.style.width = '100%';
    barLt.style.width = '100%';
    barNx.style.width = '100%';

    showToast(`Simulated race completed on ${net.toUpperCase()} network!`);
  }, 50);
}

// -------------------------------------------------------------
// Interactive ROI & Paperless Savings Calculator
// -------------------------------------------------------------
function calculateRoi() {
  const staff = parseInt(document.getElementById('sliderRoiStaff').value, 10);
  const paperCostPerStaff = parseInt(document.getElementById('sliderRoiCost').value, 10);

  document.getElementById('lblRoiStaff').textContent = `${staff} Staff`;
  document.getElementById('lblRoiCost').textContent = `ETB ${paperCostPerStaff.toLocaleString()}`;

  const totalPaperExpense = staff * paperCostPerStaff;
  // QuickCard Enterprise fee = ETB 750 / staff / year
  const totalQcExpense = staff * 750;
  const netSavings = totalPaperExpense - totalQcExpense;
  const cardsSaved = staff * 500; // Average 500 paper cards printed per person per year

  document.getElementById('roiPaperCost').textContent = `ETB ${totalPaperExpense.toLocaleString()} / yr`;
  document.getElementById('roiQcCost').textContent = `ETB ${totalQcExpense.toLocaleString()} / yr`;
  document.getElementById('roiSavings').textContent = `ETB ${netSavings.toLocaleString()} / yr`;
  document.getElementById('roiCardsSaved').textContent = `${cardsSaved.toLocaleString()} Cards Eliminated`;
}

// -------------------------------------------------------------
// Tab Switching & Utilities
// -------------------------------------------------------------
function switchTab(tabId) {
  document.querySelectorAll('.tab-pane').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));

  const targetPane = document.getElementById(`tab-${tabId}`);
  if (targetPane) targetPane.classList.add('active');

  const tabs = document.querySelectorAll('.nav-tab');
  const indexMap = { studio: 0, quicksettings: 1, tradefair: 2, leads: 3, benchmark: 4, strategy: 5 };
  if (tabs[indexMap[tabId]]) {
    tabs[indexMap[tabId]].classList.add('active');
  }

  if (tabId === 'tradefair') {
    updateBadgeDisplay();
  }
}

function showToast(msg) {
  const t = document.getElementById('studioToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2400);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

import { Request, Response } from "express";

/** Self-contained mobile capture page — served from the same host as the API (works with ngrok). */
export const serveMobileCapturePage = (req: Request, res: Response) => {
  const { token } = req.params;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>Clinical Photo — Lakshmi Connect</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f8faf9; color: #111; min-height: 100dvh; }
    .wrap { max-width: 420px; margin: 0 auto; padding: 24px 20px 40px; }
    .brand { font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #16a34a; }
    h1 { font-size: 1.5rem; margin-top: 8px; text-transform: capitalize; }
    .mrn { display: inline-block; margin-top: 10px; padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 12px; background: #fff; }
    .sub { color: #6b7280; font-size: 14px; margin-top: 12px; line-height: 1.5; }
    .center { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 50dvh; gap: 16px; }
    .btn { width: 100%; max-width: 360px; height: 56px; border: none; border-radius: 999px; background: #16a34a; color: #fff; font-size: 17px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer; box-shadow: 0 4px 14px rgba(22,163,74,.25); }
    .btn:disabled { opacity: .6; cursor: wait; }
    .ok { width: 100%; padding: 14px 16px; border-radius: 12px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; font-size: 14px; }
    .err { color: #b91c1c; font-size: 14px; text-align: center; }
    .expired { text-align: center; padding: 48px 16px; color: #6b7280; }
    .spin { width: 28px; height: 28px; border: 3px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    #file { display: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div id="app"><div class="center"><div class="spin" style="border-color:#16a34a;border-top-color:transparent"></div></div></div>
  </div>
  <input id="file" type="file" accept="image/*" capture="environment" />
  <script>
    const TOKEN = ${JSON.stringify(token)};
    const API = '/api/v1/m/upload/' + TOKEN;
    const app = document.getElementById('app');
    const fileInput = document.getElementById('file');
    let uploadCount = 0;

    function esc(s) {
      return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    }

    function renderExpired() {
      app.innerHTML = '<div class="expired"><h2>Link expired</h2><p style="margin-top:8px">Ask the doctor to generate a new QR code.</p></div>';
    }

    function renderForm(data) {
      app.innerHTML =
        '<p class="brand">Lakshmi Connect</p>' +
        '<h1>' + esc(data.patientName) + '</h1>' +
        (data.uhid ? '<span class="mrn">MRN no: ' + esc(data.uhid) + '</span>' : '') +
        '<p class="sub">Capture clinical photos for this consultation. You can take multiple photos.</p>' +
        '<div class="center">' +
          '<div id="msg"></div>' +
          '<button type="button" class="btn" id="camBtn">📷 Take Photo</button>' +
        '</div>';
      document.getElementById('camBtn').onclick = () => fileInput.click();
    }

    async function loadMeta() {
      try {
        const res = await fetch(API, { headers: { 'Accept': 'application/json', 'ngrok-skip-browser-warning': 'true' } });
        if (res.status === 410) { renderExpired(); return; }
        if (!res.ok) throw new Error('Invalid link');
        const json = await res.json();
        renderForm(json.data || {});
      } catch (e) {
        app.innerHTML = '<div class="center"><p class="err">Could not open upload link.</p></div>';
      }
    }

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      const btn = document.getElementById('camBtn');
      const msg = document.getElementById('msg');
      if (btn) { btn.disabled = true; btn.innerHTML = '<div class="spin"></div>'; }
      try {
        const fd = new FormData();
        fd.append('image', file);
        const res = await fetch(API, { method: 'POST', body: fd, headers: { 'ngrok-skip-browser-warning': 'true' } });
        if (res.status === 410) { renderExpired(); return; }
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Upload failed');
        }
        uploadCount++;
        if (msg) msg.innerHTML = '<div class="ok">✓ Uploaded — take another?<br><small>' + uploadCount + ' photo' + (uploadCount === 1 ? '' : 's') + ' sent</small></div>';
      } catch (e) {
        if (msg) msg.innerHTML = '<p class="err">' + esc(e.message || 'Upload failed') + '</p>';
      } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '📷 ' + (uploadCount ? 'Take Another Photo' : 'Take Photo'); }
      }
    });

    loadMeta();
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
};

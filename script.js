// Utility: clamp
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

// DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  // Current year in footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Mobile nav toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      const expanded = navToggle.getAttribute('aria-expanded') === 'true';
      navToggle.setAttribute('aria-expanded', String(!expanded));
      nav.classList.toggle('open');
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }));
  }

  // Smooth anchor scroll (additional JS assist)
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id.length > 1) {
        const target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, '', id);
        }
      }
    })
  });

  // Modal logic for Scientist
  const openBtn = document.getElementById('openScientistModal');
  const modal = document.getElementById('scientistModal');
  if (openBtn && modal) {
    const setOpen = (isOpen) => {
      modal.setAttribute('aria-hidden', String(!isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    };
    openBtn.addEventListener('click', () => setOpen(true));
    modal.addEventListener('click', (e) => {
      const t = e.target;
      if (t instanceof Element && (t.matches('[data-close="modal"]') || t.classList.contains('modal-backdrop'))) {
        setOpen(false);
      }
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // Calculator + Chart
  const form = document.getElementById('calcForm');
  const tableBody = document.querySelector('#resultsTable tbody');
  const canvas = document.getElementById('chartCanvas');
  const ctx = canvas.getContext('2d');
  const conclusion = document.getElementById('calcConclusion');

  const computeSeries = (V0, K, N) => {
    const data = [];
    for (let i = 0; i <= N; i++) {
      const Vi = V0 * Math.pow(1 + K, -i);
      data.push({ i, Vi });
    }
    return data;
  };

  const renderTable = (data) => {
    tableBody.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.forEach(({ i, Vi }) => {
      const tr = document.createElement('tr');
      const tdI = document.createElement('td'); tdI.textContent = String(i);
      const tdVi = document.createElement('td'); tdVi.textContent = Vi.toFixed(4);
      tr.append(tdI, tdVi); fragment.appendChild(tr);
    });
    tableBody.appendChild(fragment);
  };

  const renderChart = (data) => {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Padding and plot area
    const P = { l: 60, r: 20, t: 20, b: 40 };
    const W = canvas.width - P.l - P.r;
    const H = canvas.height - P.t - P.b;

    // Bounds
    const xs = data.map(d => d.i);
    const ys = data.map(d => d.Vi);
    const xMin = Math.min(...xs), xMax = Math.max(...xs);
    const yMin = Math.min(...ys), yMax = Math.max(...ys);

    const xToPx = x => P.l + ( (x - xMin) / (xMax - xMin || 1) ) * W;
    const yToPx = y => P.t + (1 - ( (y - yMin) / (yMax - yMin || 1) )) * H;

    // Axes
    ctx.strokeStyle = '#cfe7db';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P.l, P.t); ctx.lineTo(P.l, P.t + H); // Y
    ctx.lineTo(P.l + W, P.t + H); // X
    ctx.stroke();

    // Grid (5 steps)
    ctx.strokeStyle = '#e7f3ee';
    ctx.lineWidth = 1;
    for (let g = 1; g <= 4; g++) {
      const gy = P.t + (H/5) * g;
      ctx.beginPath();
      ctx.moveTo(P.l, gy);
      ctx.lineTo(P.l + W, gy);
      ctx.stroke();
    }

    // Line
    ctx.strokeStyle = '#2e8b57';
    ctx.lineWidth = 2;
    ctx.beginPath();
    data.forEach((d, idx) => {
      const x = xToPx(d.i), y = yToPx(d.Vi);
      if (idx === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    ctx.fillStyle = '#2e8b57';
    data.forEach(d => {
      const x = xToPx(d.i), y = yToPx(d.Vi);
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI*2);
      ctx.fill();
    });

    // Labels
    ctx.fillStyle = '#5b6b60';
    ctx.font = '12px Inter, Roboto, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('Vi', P.l - 8, P.t + 10);
    ctx.textAlign = 'center';
    ctx.fillText('i', P.l + W / 2, P.t + H + 28);
  };

  const refreshCalc = () => {
    const V0 = clamp(parseFloat(document.getElementById('V0').value), 0, 1e9);
    const K = clamp(parseFloat(document.getElementById('K').value), -0.99, 1e6);
    const N = clamp(parseInt(document.getElementById('N').value, 10), 0, 20);

    if (!isFinite(V0) || !isFinite(K) || !Number.isInteger(N)) return;

    const series = computeSeries(V0, K, N);
    renderTable(series);
    renderChart(series);

    const last = series[series.length - 1];
    const sign = K >= 0 ? 'снижается' : 'возрастает';
    conclusion.textContent = `После ${N} обработок уровень Vi ${sign} от начального V0=${V0} до ~${last.Vi.toFixed(4)} при коэффициенте K=${K}.`;
  };

  if (form) {
    form.addEventListener('submit', (e) => { e.preventDefault(); refreshCalc(); });
    // Initial draw
    refreshCalc();
  }

  // Auto-generate icons and manifest in <head>
  generateIconsAndManifest();
});

function generateIconsAndManifest() {
  const sizes = [16, 32, 180, 512];
  const icons = sizes.map(sz => ({ size: sz, dataUrl: drawLeafIcon(sz, sz) }));

  const head = document.head;

  // Favicon links
  const linkIcon16 = document.createElement('link');
  linkIcon16.rel = 'icon';
  linkIcon16.type = 'image/png';
  linkIcon16.sizes = '16x16';
  linkIcon16.href = icons.find(i => i.size === 16).dataUrl;

  const linkIcon32 = document.createElement('link');
  linkIcon32.rel = 'icon';
  linkIcon32.type = 'image/png';
  linkIcon32.sizes = '32x32';
  linkIcon32.href = icons.find(i => i.size === 32).dataUrl;

  const linkApple = document.createElement('link');
  linkApple.rel = 'apple-touch-icon';
  linkApple.sizes = '180x180';
  linkApple.href = icons.find(i => i.size === 180).dataUrl;

  head.append(linkIcon16, linkIcon32, linkApple);

  // Manifest as Blob URL
  const manifest = {
    name: 'Фитоспоры — проект',
    short_name: 'Фитоспоры',
    start_url: '.',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2e8b57',
    icons: icons.map(i => ({
      src: i.dataUrl,
      sizes: `${i.size}x${i.size}`,
      type: 'image/png',
      purpose: 'any'
    }))
  };
  const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
  const manifestUrl = URL.createObjectURL(blob);
  const linkManifest = document.createElement('link');
  linkManifest.rel = 'manifest';
  linkManifest.href = manifestUrl;
  head.appendChild(linkManifest);
}

function drawLeafIcon(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, w, h);

  // soft circle background
  g.fillStyle = '#e8f4ee';
  g.beginPath();
  g.arc(w/2, h/2, Math.min(w,h)*0.45, 0, Math.PI*2);
  g.fill();

  // leaf body
  g.fillStyle = '#2e8b57';
  g.strokeStyle = '#2e8b57';
  g.lineWidth = Math.max(1, w*0.05);
  g.beginPath();
  g.moveTo(w*0.25, h*0.65);
  g.quadraticCurveTo(w*0.20, h*0.30, w*0.55, h*0.25);
  g.quadraticCurveTo(w*0.85, h*0.35, w*0.75, h*0.70);
  g.quadraticCurveTo(w*0.55, h*0.85, w*0.25, h*0.65);
  g.closePath();
  g.fill();

  // leaf vein
  g.strokeStyle = '#ffffff';
  g.lineWidth = Math.max(1, w*0.04);
  g.beginPath();
  g.moveTo(w*0.35, h*0.60);
  g.quadraticCurveTo(w*0.48, h*0.45, w*0.62, h*0.40);
  g.stroke();

  return c.toDataURL('image/png');
}

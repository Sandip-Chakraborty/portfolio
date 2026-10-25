import React, { useEffect, useRef, useState } from 'react';
import { isLand, LAT_TOP, LAT_BOTTOM } from './worldLand.js';

/*  Terminal-style live attack map.
 *
 *  Feed: set VITE_ATTACK_FEED_URL (see .env.example) to a JSON endpoint that returns an array
 *  (or { events: [...] }) of  { src:{lat,lon,cc}, dst:{lat,lon,cc}, type, ip? }.
 *  It is polled every 8 s. With no URL (or if it fails) a clearly-labelled SIMULATED feed is shown. */
const FEED_URL = import.meta.env.VITE_ATTACK_FEED_URL;
const HOME = { n: 'Kolkata', cc: 'IN', lat: 22.57, lon: 88.36 };

const NODES = [
  ['New York', 'US', 40.7, -74], ['Los Angeles', 'US', 34, -118.2], ['Toronto', 'CA', 43.7, -79.4], ['Mexico City', 'MX', 19.4, -99.1],
  ['São Paulo', 'BR', -23.5, -46.6], ['Buenos Aires', 'AR', -34.6, -58.4], ['Bogotá', 'CO', 4.7, -74.1], ['London', 'GB', 51.5, -0.1],
  ['Frankfurt', 'DE', 50.1, 8.7], ['Paris', 'FR', 48.9, 2.3], ['Madrid', 'ES', 40.4, -3.7], ['Moscow', 'RU', 55.8, 37.6], ['Kyiv', 'UA', 50.4, 30.5],
  ['Istanbul', 'TR', 41, 29], ['Tehran', 'IR', 35.7, 51.4], ['Dubai', 'AE', 25.2, 55.3], ['Riyadh', 'SA', 24.7, 46.7], ['Cairo', 'EG', 30, 31.2],
  ['Lagos', 'NG', 6.5, 3.4], ['Nairobi', 'KE', -1.3, 36.8], ['Johannesburg', 'ZA', -26.2, 28], ['Mumbai', 'IN', 19.1, 72.9], ['Delhi', 'IN', 28.6, 77.2],
  ['Dhaka', 'BD', 23.8, 90.4], ['Singapore', 'SG', 1.35, 103.8], ['Jakarta', 'ID', -6.2, 106.8], ['Bangkok', 'TH', 13.8, 100.5], ['Beijing', 'CN', 39.9, 116.4],
  ['Shanghai', 'CN', 31.2, 121.5], ['Seoul', 'KR', 37.6, 127], ['Tokyo', 'JP', 35.7, 139.7], ['Sydney', 'AU', -33.9, 151.2], ['Auckland', 'NZ', -36.8, 174.8]
].map(([n, cc, lat, lon]) => ({ n, cc, lat, lon }));

const TYPES = [
  { k: 'DDoS', c: '#ff2bd6' }, { k: 'MALWARE', c: '#ff3b3b' }, { k: 'PHISHING', c: '#f5ff00' }, { k: 'RANSOMWARE', c: '#ff8a00' },
  { k: 'BRUTE-FORCE', c: '#00f0ff' }, { k: 'SQLi', c: '#b026ff' }, { k: 'PORT-SCAN', c: '#39ff14' }, { k: 'BOTNET-C2', c: '#ff5ea8' }
];
const typeOf = k => TYPES.find(t => t.k === String(k || '').toUpperCase()) || TYPES[Math.floor(Math.random() * TYPES.length)];
const rnd = a => a[Math.floor(Math.random() * a.length)];
const ip = () => `${[45, 91, 103, 112, 146, 185, 193, 203][Math.floor(Math.random() * 8)]}.${Math.floor(Math.random() * 255)}.x.x`;
const clock = () => new Date().toLocaleTimeString([], { hour12: false });
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const simulate = () => {
  const toHome = Math.random() < 0.16;
  const src = rnd(NODES);
  let dst = toHome ? HOME : rnd(NODES);
  while (dst.n === src.n) dst = rnd(NODES);
  return { src, dst, type: rnd(TYPES).k, ip: ip(), home: toHome };
};

const normalise = e => {
  const ok = p => p && Number.isFinite(+p.lat) && Number.isFinite(+p.lon);
  if (!e || !ok(e.src) || !ok(e.dst)) return null;
  const f = p => ({ n: p.city || p.n || p.cc || '', cc: (p.cc || p.country || '??').toString().slice(0, 2).toUpperCase(), lat: +p.lat, lon: +p.lon });
  return { src: f(e.src), dst: f(e.dst), type: typeOf(e.type).k, ip: e.ip || ip(), home: false };
};

export default function ThreatMap() {
  const wrap = useRef(null), canvas = useRef(null);
  const [log, setLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, rate: '0.0', top: '—' });
  const [mode, setMode] = useState(FEED_URL ? 'LIVE' : 'SIM');
  const S = useRef({ attacks: [], pulses: [], w: 0, h: 0, dpr: 1, queue: [], total: 0, stamps: [], counts: {}, land: null, visible: true });

  useEffect(() => {
    const el = canvas.current, ctx = el.getContext('2d'), s = S.current;
    const project = (lon, lat) => [((lon + 180) / 360) * s.w, ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * s.h];

    // Pre-render the dot-matrix land layer whenever the size changes.
    const buildLand = () => {
      const c = document.createElement('canvas'); c.width = s.w * s.dpr; c.height = s.h * s.dpr;
      const g = c.getContext('2d'); g.scale(s.dpr, s.dpr);
      g.strokeStyle = 'rgba(57,255,20,.07)'; g.lineWidth = 1; g.beginPath();
      for (let lon = -150; lon <= 180; lon += 30) { const [x] = project(lon, 0); g.moveTo(x, 0); g.lineTo(x, s.h); }
      for (let lat = -30; lat <= 60; lat += 30) { const [, y] = project(0, lat); g.moveTo(0, y); g.lineTo(s.w, y); }
      g.stroke();
      const step = 2.4, r = Math.max(0.7, s.w / 520);
      g.fillStyle = 'rgba(57,255,20,.62)';
      for (let lat = LAT_TOP - 1; lat > LAT_BOTTOM; lat -= step) for (let lon = -179; lon < 180; lon += step) {
        if (!isLand(lon, lat)) continue;
        const [x, y] = project(lon, lat); g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      s.land = c;
    };
    const resize = () => {
      s.dpr = Math.min(window.devicePixelRatio || 1, 2);
      s.w = wrap.current.clientWidth; s.h = Math.round(s.w * ((LAT_TOP - LAT_BOTTOM) / 360));
      el.width = s.w * s.dpr; el.height = s.h * s.dpr; el.style.height = `${s.h}px`;
      buildLand();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(wrap.current);
    const io = new IntersectionObserver(([e]) => { s.visible = e.isIntersecting; }); io.observe(el);

    const launch = ev => {
      const t = typeOf(ev.type);
      s.attacks.push({ ...ev, color: t.c, t0: performance.now(), dur: 1500 + Math.random() * 1300 });
      if (s.attacks.length > 28) s.attacks.shift();
      s.total++; s.counts[t.k] = (s.counts[t.k] || 0) + 1;
      const now = Date.now(); s.stamps = s.stamps.filter(x => now - x < 10000); s.stamps.push(now);
      const top = Object.entries(s.counts).sort((a, b) => b[1] - a[1])[0][0];
      setStats({ total: s.total, rate: (s.stamps.length / 10).toFixed(1), top });
      const id = s.total;
      setLog(l => [...l, { id, time: clock(), type: t.k, color: t.c, from: ev.src.cc, to: ev.dst.cc, ip: ev.ip, home: ev.home }].slice(-5));
    };

    // Event source: real feed (if configured) else simulation.
    let spawn, poll, alive = true;
    const next = () => {
      if (!alive) return;
      if (document.visibilityState === 'visible' && s.visible) launch(s.queue.length ? s.queue.shift() : simulate());
      spawn = setTimeout(next, (reduced() ? 2400 : 380) + Math.random() * (reduced() ? 1500 : 900));
    };
    next();
    if (FEED_URL) {
      const fetchFeed = async () => {
        try {
          const r = await fetch(FEED_URL, { cache: 'no-store' }); if (!r.ok) throw new Error(r.status);
          const j = await r.json(); const evs = (Array.isArray(j) ? j : j.events || []).map(normalise).filter(Boolean);
          if (evs.length) { s.queue.push(...evs.slice(-60)); setMode('LIVE'); } else setMode('SIM');
        } catch { setMode('SIM'); }
      };
      fetchFeed(); poll = setInterval(fetchFeed, 8000);
    }

    // Render loop
    const quad = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;
    let raf;
    const draw = now => {
      raf = requestAnimationFrame(draw);
      if (!s.visible) return;
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); ctx.clearRect(0, 0, s.w, s.h);
      if (s.land) ctx.drawImage(s.land, 0, 0, s.w, s.h);
      // radar sweep
      const sx = ((now / 7000) % 1) * s.w, grad = ctx.createLinearGradient(sx - 60, 0, sx, 0);
      grad.addColorStop(0, 'rgba(57,255,20,0)'); grad.addColorStop(1, 'rgba(57,255,20,.14)');
      ctx.fillStyle = grad; ctx.fillRect(sx - 60, 0, 60, s.h);
      ctx.fillStyle = 'rgba(57,255,20,.5)'; ctx.fillRect(sx, 0, 1, s.h);
      // home node
      const [hx, hy] = project(HOME.lon, HOME.lat), hp = (now % 2000) / 2000;
      ctx.strokeStyle = `rgba(0,240,255,${1 - hp})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(hx, hy, 3 + hp * 14, 0, 7); ctx.stroke();
      ctx.fillStyle = '#00f0ff'; ctx.shadowColor = '#00f0ff'; ctx.shadowBlur = 10; ctx.fillRect(hx - 2.5, hy - 2.5, 5, 5); ctx.shadowBlur = 0;
      ctx.font = '9px "Share Tech Mono",monospace'; ctx.fillStyle = '#00f0ff'; ctx.fillText('HOME·KOL', hx + 7, hy - 6);

      s.attacks = s.attacks.filter(a => {
        const p = Math.max(0, (now - a.t0) / a.dur);
        const [x1, y1] = project(a.src.lon, a.src.lat), [x2, y2] = project(a.dst.lon, a.dst.lat);
        const cx = (x1 + x2) / 2, cy = Math.max(2, (y1 + y2) / 2 - Math.hypot(x2 - x1, y2 - y1) * 0.32);
        if (p >= 1) { s.pulses.push({ x: x2, y: y2, color: a.color, t0: now }); if (s.pulses.length > 40) s.pulses.shift(); return false; }
        ctx.strokeStyle = a.color; ctx.globalAlpha = 0.1; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); ctx.stroke();
        const tail = Math.max(0, p - 0.3), N = 14; ctx.lineWidth = 1.6;
        for (let i = 0; i < N; i++) {
          const ta = tail + ((p - tail) * i) / N, tb = tail + ((p - tail) * (i + 1)) / N;
          ctx.globalAlpha = 0.15 + 0.85 * (i / N);
          ctx.beginPath(); ctx.moveTo(quad(x1, cx, x2, ta), quad(y1, cy, y2, ta)); ctx.lineTo(quad(x1, cx, x2, tb), quad(y1, cy, y2, tb)); ctx.stroke();
        }
        ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.shadowColor = a.color; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(quad(x1, cx, x2, p), quad(y1, cy, y2, p), 1.8, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        if (p < 0.25) { ctx.strokeStyle = a.color; ctx.globalAlpha = 1 - p * 4; ctx.beginPath(); ctx.arc(x1, y1, 2 + p * 24, 0, 7); ctx.stroke(); ctx.globalAlpha = 1; }
        return true;
      });
      s.pulses = s.pulses.filter(pl => {
        const p = Math.max(0, (now - pl.t0) / 900); if (p >= 1) return false;
        ctx.strokeStyle = pl.color; ctx.globalAlpha = 1 - p; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(pl.x, pl.y, 2 + p * 13, 0, 7); ctx.stroke();
        ctx.fillStyle = pl.color; ctx.fillRect(pl.x - 1.5, pl.y - 1.5, 3, 3); ctx.globalAlpha = 1; return true;
      });
    };
    raf = requestAnimationFrame(draw);
    return () => { alive = false; clearTimeout(spawn); clearInterval(poll); cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); };
  }, []);

  return <div className="tmap">
    <div className="tmap-stats">
      <span className={`tmap-mode ${mode === 'LIVE' ? 'is-live' : ''}`}><i />{mode === 'LIVE' ? 'LIVE FEED' : 'SIMULATED FEED'}</span>
      <span>EVENTS <b>{stats.total.toLocaleString()}</b></span>
      <span>RATE <b>{stats.rate}/s</b></span>
      <span>TOP <b>{stats.top}</b></span>
    </div>
    <div className="tmap-screen" ref={wrap}><canvas ref={canvas} aria-label="Terminal world map showing animated cyber attack arcs" role="img" /><div className="tmap-crt" /></div>
    <div className="tmap-legend">{TYPES.map(t => <span key={t.k} style={{ color: t.c }}><i style={{ background: t.c }} />{t.k}</span>)}</div>
    <div className="tmap-log" aria-live="off">
      {log.length === 0 && <p className="dim">[ waiting for events… ]</p>}
      {log.map(l => <p key={l.id} className={l.home ? 'is-home' : ''}><span className="dim">[{l.time}]</span> <b style={{ color: l.color }}>{l.type.padEnd(11, ' ')}</b> {l.from} <em>→</em> {l.to}{l.home ? ' ◄ HOME NODE' : ''} <span className="dim">{l.ip}</span></p>)}
    </div>
  </div>;
}

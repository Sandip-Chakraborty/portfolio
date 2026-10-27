import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Activity, ArrowDownToLine, ArrowRight, BriefcaseBusiness, Code2, Cpu, Fingerprint, Github, GraduationCap, Linkedin, Mail, MapPin, Menu, Network, Radio, Send, Shield, ShieldCheck, Terminal, X, Zap } from 'lucide-react';
import logo from './assets/scyberx-logo.jpg';
import certificateImg from './assets/certificate.svg';
import cwoLogo from './assets/cyber-world-logo.png';
import ThreatMap from './ThreatMap.jsx';
import { runCommand, complete, promptFor } from './terminalEngine.js';
import './styles.css';
import './neon.css';

const BRAND = 'SCyberootX';

const profile = {
  name: 'Sandip Chakraborty ~ a.k.a SCyberootX',
  location: 'Ramnagar, Kolkata, West Bengal, India',
  email: 'scyberootx@gmail.com', // Replace with your real email before publishing.
  github: 'https://github.com/Sandip-Chakraborty/',
  linkedin: 'https://www.linkedin.com/in/sandip-chakraborty01/', // Replace with your LinkedIn profile URL.
  resume: './resume.pdf' // Add your resume as public/resume.pdf.
};

// "accent" is the neon colour used for that skill group.
const skillGroups = [
  { title: 'Web Security', icon: Shield, accent: '#39ff14', items: ['OWASP Top 10', 'API Security', 'SQLi', 'XSS', 'BOLA'] },
  { title: 'Forensics & OSINT', icon: Fingerprint, accent: '#00f0ff', items: ['FTK Imager', 'Autopsy', 'OSINT', 'Digital Forensics'] },
  { title: 'Programming', icon: Code2, accent: '#ff2bd6', items: ['Python', 'JavaScript', 'Node.js', 'Express', 'MongoDB'] },
  { title: 'Security Tools', icon: Network, accent: '#f5ff00', items: ['Burp Suite', 'Nmap', 'Nuclei', 'Subfinder', 'Amass'] },
  { title: 'Environment', icon: Cpu, accent: '#b026ff', items: ['Linux', 'Kali Linux', 'Git', 'Docker', 'VS Code'] }
];

const projects = [
  { number: '01', title: 'Profit Pilot', type: 'Forex Trading Platform', desc: 'A full-stack trading interface concept with charts, indicators, watchlists and a secure backend.', tags: ['React', 'Node.js', 'MongoDB'], icon: Activity, link: profile.github },
  { number: '02', title: 'Web Application Security Lab', type: 'OWASP Top 10 Assessment', desc: 'A controlled learning lab for understanding web vulnerabilities, testing methodology and remediation.', tags: ['Burp Suite', 'Kali Linux', 'OWASP'], icon: ShieldCheck, link: profile.github },
  { number: '03', title: 'Digital Forensics Analysis', type: 'Evidence Collection & Analysis', desc: 'A learning project exploring forensic imaging, evidence integrity, file recovery and investigation workflows.', tags: ['Autopsy', 'FTK Imager', 'Linux'], icon: Fingerprint, link: profile.github }
];

// Put each organisation's real logo in  public/logos/<logo>  (png/svg/jpg - just keep the file name below
// or change it here). Until a file exists, a neon monogram badge is shown instead.
const certifications = [
  { name: 'CEH', desc: 'Certified Ethical Hacker', date: 'Sep 2017', org: 'EC-Council', logo: 'eccouncil.png', mono: 'EC' },
  { name: 'CPTE', desc: 'Certified Penetration Testing Engineer', date: 'In progress', org: 'Mile2 Cybersecurity Institute', logo: 'miles.png', mono: 'CP' },
  { name: 'UPSIFS', desc: 'Cyber Forensics in Practice', date: '19 May 2025', org: 'UPSIFS ', logo: 'upsifs.png', mono: 'UP' },
  { name: 'Cyber World Organization', desc: 'Chief Secretary · Co-Founder · Non-profit · CCA', date: 'May 2025 – Present', org: 'Cyber World Organization ', logo: 'cyber-world-organization.png', mono: 'CW' }
];

const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/* ---------- Typing text with blinking caret (type -> hold -> erase -> repeat) ---------- */
function Typewriter({ text, speed = 120, hold = 2200 }) {
  const reduced = prefersReducedMotion();
  const [count, setCount] = useState(reduced ? text.length : 0);
  const [dir, setDir] = useState(1);
  useEffect(() => {
    if (reduced) return;
    let t;
    if (dir === 1) {
      t = count < text.length ? setTimeout(() => setCount(count + 1), speed + Math.random() * 70) : setTimeout(() => setDir(-1), hold);
    } else {
      t = count > 0 ? setTimeout(() => setCount(count - 1), 55) : setTimeout(() => setDir(1), 600);
    }
    return () => clearTimeout(t);
  }, [count, dir, text, speed, hold, reduced]);
  return <span className="typed" aria-label={text}><span aria-hidden="true">{text.slice(0, count)}</span><i className="caret" aria-hidden="true" /></span>;
}

/* ---------- Neon hacker cursor: blinking core + lagging crosshair ring + glowing trail ---------- */
function NeonCursor() {
  const dot = useRef(null), ring = useRef(null), trail = useRef([]);
  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const root = document.documentElement;
    root.classList.add('has-neon-cursor');
    const m = { x: -100, y: -100 };
    const r = { x: -100, y: -100 };
    const pts = Array.from({ length: 7 }, () => ({ x: -100, y: -100 }));
    let raf;
    const move = e => { m.x = e.clientX; m.y = e.clientY; root.classList.add('cursor-live'); };
    const over = e => ring.current?.classList.toggle('is-link', !!e.target.closest?.('a,button,input,[role="button"],.project-card'));
    const down = () => ring.current?.classList.add('is-down');
    const up = () => ring.current?.classList.remove('is-down');
    const leave = () => root.classList.remove('cursor-live');
    const tick = () => {
      r.x += (m.x - r.x) * 0.2; r.y += (m.y - r.y) * 0.2;
      if (dot.current) dot.current.style.transform = `translate3d(${m.x}px,${m.y}px,0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${r.x}px,${r.y}px,0)`;
      let px = m.x, py = m.y;
      pts.forEach((p, i) => {
        p.x += (px - p.x) * (0.34 - i * 0.03); p.y += (py - p.y) * (0.34 - i * 0.03);
        const el = trail.current[i];
        if (el) el.style.transform = `translate3d(${p.x}px,${p.y}px,0) scale(${1 - i * 0.12})`;
        px = p.x; py = p.y;
      });
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseover', over);
    window.addEventListener('mousedown', down);
    window.addEventListener('mouseup', up);
    document.documentElement.addEventListener('mouseleave', leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove('has-neon-cursor', 'cursor-live');
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseover', over);
      window.removeEventListener('mousedown', down);
      window.removeEventListener('mouseup', up);
      document.documentElement.removeEventListener('mouseleave', leave);
    };
  }, []);
  return <div className="neon-cursor" aria-hidden="true">
    {Array.from({ length: 7 }, (_, i) => <span key={i} className="cursor-trail" ref={el => (trail.current[i] = el)} />)}
    <span className="cursor-ring" ref={ring}><i /><i /><i /><i /></span>
    <span className="cursor-dot" ref={dot} />
  </div>;
}

/* ---------- Faint falling-code canvas behind the skills panel ---------- */
function MatrixRain() {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    const chars = '01アイウエオカキクケコサシスセソ{}<>/$#%&*+=';
    const size = 14;
    let cols = 0, drops = [], timer, visible = true;
    const resize = () => {
      canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight;
      cols = Math.floor(canvas.width / size);
      drops = Array.from({ length: cols }, () => Math.random() * -40);
    };
    const draw = () => {
      if (!visible) return;
      ctx.fillStyle = 'rgba(0,8,4,.14)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${size}px "Share Tech Mono", monospace`;
      drops.forEach((y, i) => {
        ctx.fillStyle = Math.random() > 0.96 ? '#eafff0' : '#39ff14';
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * size, y * size);
        drops[i] = y * size > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
      });
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }); io.observe(canvas);
    timer = setInterval(draw, 70);
    return () => { clearInterval(timer); ro.disconnect(); io.disconnect(); };
  }, []);
  return <canvas ref={ref} className="matrix-rain" aria-hidden="true" />;
}

/* ---------- Arc reactor (SVG) with the SCyberX logo in the core ---------- */
const polar = (r, a) => [200 + r * Math.cos((a * Math.PI) / 180), 200 + r * Math.sin((a * Math.PI) / 180)];
const sector = (r1, r2, a1, a2) => {
  const [x1, y1] = polar(r2, a1), [x2, y2] = polar(r2, a2), [x3, y3] = polar(r1, a2), [x4, y4] = polar(r1, a1);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r2} ${r2} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}L${x3.toFixed(2)} ${y3.toFixed(2)}A${r1} ${r1} 0 0 0 ${x4.toFixed(2)} ${y4.toFixed(2)}Z`;
};
const arcStroke = (r, a1, a2) => { const [x1, y1] = polar(r, a1), [x2, y2] = polar(r, a2); return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`; };

function ArcReactor() {
  const ticks = Array.from({ length: 90 }, (_, i) => { const a = i * 4, long = i % 5 === 0; const [x1, y1] = polar(long ? 176 : 181, a), [x2, y2] = polar(190, a); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className={long ? 'tick-long' : ''} />; });
  const coils = Array.from({ length: 10 }, (_, i) => <path key={i} d={sector(106, 138, i * 36 + 4, i * 36 + 32)} className="coil" style={{ animationDelay: `${i * 0.18}s` }} />);
  return <div className="reactor-wrap" aria-label={`${BRAND} animated arc reactor`}>
    <svg className="arc-svg" viewBox="0 0 400 400" role="img" aria-hidden="true">
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%"><stop offset="55%" stopColor="#00f0ff" stopOpacity=".0" /><stop offset="82%" stopColor="#00f0ff" stopOpacity=".35" /><stop offset="100%" stopColor="#39ff14" stopOpacity="0" /></radialGradient>
      </defs>
      <circle cx="200" cy="200" r="198" fill="url(#coreGlow)" className="arc-halo" />
      <g className="spin spin-slow ticks">{ticks}</g>
      <circle cx="200" cy="200" r="168" className="ring-dash" />
      <g className="spin spin-rev arcs"><path d={arcStroke(156, 10, 100)} /><path d={arcStroke(156, 130, 220)} /><path d={arcStroke(156, 250, 340)} /></g>
      <circle cx="200" cy="200" r="145" className="ring-thin" />
      <g className="coils">{coils}</g>
      <circle cx="200" cy="200" r="100" className="ring-thick" />
      <g className="spin spin-fast inner-arcs"><path d={arcStroke(94, 0, 70)} /><path d={arcStroke(94, 120, 190)} /><path d={arcStroke(94, 240, 310)} /></g>
      <circle cx="200" cy="200" r="88" className="core-bg" />
    </svg>
    <img className="reactor-logo" src={logo} alt={`${BRAND} logo`} />
    <div className="orbit-label label-top">NEURAL INTERFACE <span>ONLINE</span></div>
    <div className="orbit-label label-bottom"><Activity size={14} /> {BRAND} CORE · NOMINAL</div>
  </div>;
}

/* ---------- Organisation logo with a graceful fallback badge ---------- */
function OrgLogo({ item }) {
  const [failed, setFailed] = useState(false);
  const src = `${import.meta.env.BASE_URL}logos/${item.logo}`;
  return <div className={`org-logo ${failed ? 'is-fallback' : ''}`} title={item.org}>
    {failed ? <span>{item.mono}</span> : <img src={src} alt={`${item.org} logo`} loading="lazy" onError={() => setFailed(true)} />}
  </div>;
}

const aboutFacts = [
  ['Location', profile.location],
  ['Education', 'B.Sc. (Hons.) Zoology · B.Ed. · IGNOU MSCIS'],
  ['Focus', 'Cyber Forensics · Web Security · OSINT · Investigation'],
  ['Mission', 'Learn. Test. Secure. — responsible security research']
];

/* Scrollable terminal output (auto-sticks to the newest line) */
function TermOutput({ lines, limit = 120, className = '' }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  return <div className={`term-out ${className}`} ref={ref} role="log" aria-live="polite">
    {lines.slice(-limit).map((l, i) => l.t === 'cmd'
      ? <p key={i} className="tl tl-cmd"><span>{l.prompt}</span> {l.text}</p>
      : <p key={i} className={`tl tl-${l.t}`}>{l.text}</p>)}
  </div>;
}
const navItems = ['home', 'about', 'skills', 'projects', 'certifications', 'contact'];

function App() {
  const [time, setTime] = useState(new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [heroCommand, setHeroCommand] = useState('');
  const [cwd, setCwd] = useState('');
  const [lines, setLines] = useState([
    { t: 'ok', text: `${BRAND} interface initialized.` },
    { t: 'out', text: 'Portfolio modules loaded.' },
    { t: 'ok', text: 'All systems ready. Welcome, Sandip.' },
    { t: 'dim', text: 'Type "help" for commands · ↑/↓ history · Tab autocomplete' }
  ]);
  const historyRef = useRef([]);
  const histIdx = useRef(-1);
  const startedAt = useRef(Date.now());
  const [booted, setBooted] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [highlight, setHighlight] = useState(null);
  const hlTimers = useRef([]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const boot = setTimeout(() => setBooted(true), 650);
    return () => { clearInterval(timer); clearTimeout(boot); };
  }, []);
  useEffect(() => {
    const onScroll = () => {
      let current = 'home';
      navItems.forEach(id => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top < window.innerHeight * 0.45) current = id; });
      setActiveSection(current);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = id => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };

  // Neon blink + highlight on the title of the page/section a terminal command opened.
  const flashSection = id => {
    hlTimers.current.forEach(clearTimeout);
    setHighlight(null);
    hlTimers.current = [setTimeout(() => setHighlight(id), 450), setTimeout(() => setHighlight(null), 5200)];
  };
  const hl = id => (highlight === id ? ' hl' : '');

  // One command interpreter shared by the hero terminal and the bottom-right terminal.
  const ctxBase = () => ({ cwd, brand: BRAND, profile, skillGroups, projects, certifications, aboutFacts, about: { education: aboutFacts[1][1], mission: aboutFacts[3][1] }, history: historyRef.current, startedAt: startedAt.current });
  const push = items => setLines(l => [...l, ...items].slice(-400));
  const execute = raw => {
    const typed = raw.trim();
    const prompt = promptFor(BRAND, cwd);
    if (!typed) { push([{ t: 'cmd', text: '', prompt }]); return; }
    historyRef.current.push(typed); histIdx.current = -1;
    const res = runCommand(typed, ctxBase());
    if (res.clear) setLines([]);
    else {
      push([{ t: 'cmd', text: typed, prompt }, ...res.lines.filter(x => !x.d)]);
      res.lines.filter(x => x.d).forEach(x => setTimeout(() => push([x]), x.d));
    }
    if (res.cwd !== undefined) setCwd(res.cwd);
    if (res.open) { scrollTo(res.open); flashSection(res.open); }
    if (res.link) {
      if (res.link.download) { const a = document.createElement('a'); a.href = res.link.url; a.download = ''; document.body.appendChild(a); a.click(); a.remove(); }
      else if (res.link.same) window.location.href = res.link.url;
      else window.open(res.link.url, '_blank', 'noopener');
    }
  };
  const onTermKey = (e, value, setValue) => {
    const h = historyRef.current;
    if (e.key === 'ArrowUp') { e.preventDefault(); if (!h.length) return; histIdx.current = histIdx.current < 0 ? h.length - 1 : Math.max(0, histIdx.current - 1); setValue(h[histIdx.current]); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (histIdx.current < 0) return; histIdx.current++; if (histIdx.current >= h.length) { histIdx.current = -1; setValue(''); } else setValue(h[histIdx.current]); }
    else if (e.key === 'Tab') { e.preventDefault(); const r = complete(value, ctxBase()); setValue(r.value); if (r.options.length) push([{ t: 'dim', text: r.options.join('   ') }]); }
    else if (e.ctrlKey && e.key.toLowerCase() === 'l') { e.preventDefault(); setLines([]); }
  };
  const submitAssistant = e => { e.preventDefault(); execute(command); setCommand(''); };
  const submitHero = e => { e.preventDefault(); execute(heroCommand); setHeroCommand(''); };
  const shortPrompt = cwd ? `~/${cwd}$` : '~$';

  return <div className={`app ${booted ? 'booted' : ''}`}>
    <NeonCursor />
    <div className="scanlines" /><div className="grid-bg" />
    {!booted && <div className="boot-overlay"><img className="boot-logo" src={logo} alt="" /><strong>{BRAND}</strong><span>INITIALIZING PORTFOLIO SYSTEM…</span><div className="boot-bar"><i /></div></div>}
    <header className="topbar">
      <button className="brand" onClick={() => scrollTo('home')} aria-label="Go to home"><img className="brand-logo" src={logo} alt="" /><span><strong>SANDIP CHAKRABORTY</strong><small>{BRAND} <i>|</i> SECURITY RESEARCHER <i>|</i> BUG HUNTER</small></span></button>
      <nav className={menuOpen ? 'nav open' : 'nav'}>{navItems.map(item => <button key={item} className={activeSection === item ? 'active' : ''} onClick={() => scrollTo(item)}>{item}</button>)}</nav>
      <div className="top-status"><span className="live-dot" /> SYSTEM ONLINE</div>
      <div className="clock">{time.toLocaleTimeString([], { hour12: false })}<small>{time.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</small></div>
      <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
    </header>
    <main>
      <section className={`hero section-shell${hl('home')}`} id="home">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> {BRAND} PERSONAL SECURITY CONSOLE <span className="eyebrow-line" /></div>
          <p className="hello">Hello, I’m</p>
          <h1>SANDIP<br /><Typewriter text="CHAKRABORTY" /></h1>
          <p className="hero-role">Security Researcher <b>/</b> Bug Hunter <b>/</b> Cyber Forensic Analyst</p>
          <p className="hero-intro">Exploring vulnerabilities. Securing tomorrow.<br />Learning, testing and investigating with purpose.</p>
          <div className="hero-actions"><button className="btn btn-primary" onClick={() => scrollTo('projects')}><Code2 size={17} /> VIEW PROJECTS</button><a className="btn" href={profile.resume} download><ArrowDownToLine size={17} /> DOWNLOAD RESUME</a><button className="btn" onClick={() => scrollTo('contact')}><Mail size={17} /> CONTACT ME</button></div>
          <div className="hero-foot"><span><ShieldCheck size={15} /> ETHICAL RESEARCH ONLY</span><span><Radio size={15} /> READY FOR INPUT</span></div>
        </div>
        <ArcReactor />
        <aside className="hero-side">
          <div className="mini-terminal panel">
            <div className="panel-heading"><Terminal size={15} /> LIVE TERMINAL <span className="live-dot" /></div>
            <TermOutput lines={lines} limit={80} className="hero-out" />
            <form className="term-input" onSubmit={submitHero}><span>{shortPrompt}</span><input value={heroCommand} onChange={e => setHeroCommand(e.target.value)} onKeyDown={e => onTermKey(e, heroCommand, setHeroCommand)} placeholder="type help…" aria-label="Terminal command" autoComplete="off" spellCheck="false" /></form>
            <div className="terminal-quote">“The best way to predict the future is to create it.”</div>
          </div>
          <div className="panel system-panel"><div className="panel-heading"><Activity size={15} /> SYSTEM STATUS</div>{[['CPU', '12%'], ['MEMORY', '38%'], ['STORAGE', '54%']].map(([label, value]) => <div className="metric" key={label}><div><span>{label}</span><b>{value}</b></div><div className="meter"><i style={{ width: value }} /></div></div>)}<div className="metric network-state"><span>NETWORK</span><b><span className="live-dot" /> CONNECTED</b></div><p className="fake-note">Decorative demo metrics · not live telemetry</p></div>
        </aside>
      </section>

      <section className={`stats-grid section-shell${hl('about')}`} id="about"><article className="stat-card"><MapPin /><span className="stat-label">LOCATION</span><strong>West Bengal, India</strong><small>{profile.location}</small></article><article className="stat-card"><GraduationCap /><span className="stat-label">EDUCATION</span><strong>B.Sc. (Hons.) Zoology</strong><small>B.Ed. · IGNOU MSCIS</small></article><article className="stat-card"><BriefcaseBusiness /><span className="stat-label">FOCUS AREA</span><strong>Cyber Forensics</strong><small>Web Security · OSINT · Investigation</small></article><article className="stat-card"><Zap /><span className="stat-label">MISSION</span><strong>Learn. Test. Secure.</strong><small>Responsible security research</small></article></section>

      <section className="content-grid section-shell">
        <section className={`panel skills-panel${hl('skills')}`} id="skills">
          <MatrixRain />
          <div className="skills-inner">
            <div className="section-heading"><div><Code2 /><h2>SKILLS & TECHNOLOGIES</h2></div><span>01 / CAPABILITIES</span></div>
            <p className="section-subtitle">&gt; A growing toolkit for security research and digital investigation<span className="blink-us">_</span></p>
            <div className="skill-list">{skillGroups.map(group => <div className="skill-row" key={group.title} style={{ '--c': group.accent }}><div className="skill-icon"><group.icon size={20} /></div><div className="skill-content"><h3>{group.title}</h3><div className="chips">{group.items.map(item => <span className="chip" key={item}>{item}</span>)}</div></div></div>)}</div>
          </div>
        </section>
        <section className={`panel projects-panel${hl('projects')}`} id="projects"><div className="section-heading"><div><BriefcaseBusiness /><h2>FEATURED PROJECTS</h2></div><span>02 / SELECTED WORK</span></div><p className="section-subtitle">Learning projects and practical focus areas. Update links to individual repositories.</p><div className="project-grid">{projects.map(project => <article className="project-card" key={project.number}><div className="project-top"><span>{project.number}</span><project.icon size={23} /></div><h3>{project.title}</h3><p className="project-type">{project.type}</p><p className="project-desc">{project.desc}</p><div className="chips">{project.tags.map(tag => <span className="chip" key={tag}>{tag}</span>)}</div><a className="project-link" href={project.link} target="_blank" rel="noreferrer">VIEW REPOSITORY <ArrowRight size={14} /></a></article>)}</div></section>
      </section>

      <section className={`panel cert-panel section-shell${hl('certifications')}`} id="certifications">
        <div className="section-heading"><div><img className="cert-heading-img" src={certificateImg} alt="" /><h2>CERTIFICATIONS & EXPERIENCE</h2></div><span>03 / CREDENTIALS</span></div>
        <div className="cert-list">{certifications.map(item => <article className="cert-row" key={item.name}><OrgLogo item={item} /><div className="cert-copy"><h3>{item.name}</h3><p>{item.desc}</p>{item.org !== item.name && <small className="cert-org">{item.org}</small>}</div><span className="cert-date">{item.date}</span></article>)}</div>
      </section>

      <section className={`contact-grid section-shell${hl('contact')}`} id="contact">
        <div className="panel contact-copy"><div className="section-heading"><div><Send /><h2>OPEN COMMUNICATION CHANNEL</h2></div></div><h2>Let’s build something <span>secure.</span></h2><p>Have a security project, collaboration idea, or opportunity? Reach out and let’s connect.</p><div className="contact-actions"><a className="btn btn-primary" href={`mailto:${profile.email}`}><Mail size={16} /> EMAIL ME</a><a className="btn" href={profile.github} target="_blank" rel="noreferrer"><Github size={16} /> GITHUB</a><a className="btn" href={profile.linkedin} target="_blank" rel="noreferrer"><Linkedin size={16} /> LINKEDIN</a></div><div className="cwo-card">
            <div className="cwo-logo"><i className="cwo-ring r1" /><i className="cwo-ring r2" /><img src={cwoLogo} alt="Cyber World Organization logo" /></div>
            <div className="cwo-info">
              <span className="cwo-tag"><span className="live-dot" /> CURRENT POSITION</span>
              <h3>Chief Secretary</h3>
              <p className="cwo-org">at <b>CWO</b> · Cyber World Organization</p>
              <p className="cwo-meta">Non-profit · May 2025 – Present</p>
            </div>
          </div>
          <p className="config-note">Before publishing, update the email and LinkedIn URL in <code>src/main.jsx</code>.</p></div>
        <div className="panel assistant-panel term-panel">
          <div className="term-bar"><span className="td r" /><span className="td y" /><span className="td g" /><b>{BRAND.toLowerCase()}@threat-map:~$ ./live-attacks --map</b><span className="live-dot" /></div>
          <div className="term-body">
            <ThreatMap />
            <TermOutput lines={lines} limit={150} className="pane-out" />
            <div className="quick-commands">{['help', 'ls', 'pwd', 'whoami', 'neofetch', 'about', 'skills', 'projects', 'certifications', 'contact', 'clear'].map(cmd => <button key={cmd} onClick={() => execute(cmd)}>&gt; {cmd}</button>)}</div>
            <form className="command-form term-form" onSubmit={submitAssistant}><span>{promptFor(BRAND, cwd)}</span><input value={command} onChange={e => setCommand(e.target.value)} onKeyDown={e => onTermKey(e, command, setCommand)} placeholder="type a command… (help)" aria-label="Terminal command" autoComplete="off" spellCheck="false" /><button type="submit" aria-label="Run command"><ArrowRight size={18} /></button></form>
            <p className="assistant-hint">Try <code>help</code>, <code>ls</code>, <code>neofetch</code> · <code>↑↓</code> history · <code>Tab</code> autocomplete · attack data is a <code>simulation</code> unless a feed URL is configured (see README).</p>
          </div>
        </div>
      </section>
    </main>
    <footer className="footer section-shell"><span>© {new Date().getFullYear()} SANDIP CHAKRABORTY · {BRAND}</span><span>BUILT WITH: ❤️ <b>CWO · CCA</b></span><span className="footer-status"><i /> THINK <b>›</b> ANALYZE <b>›</b> SECURE</span></footer>
  </div>;
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);

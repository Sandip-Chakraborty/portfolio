/* SCyberX shell — a small, safe, fake shell that runs entirely in the browser.
 * runCommand() is a pure function: it returns what to print and which side-effects the page should perform.
 *   result = { lines:[{t,text,d?}], cwd?, open?, link?, clear? }
 *   line types: out | ok | err | dim | head | art      (d = optional delay in ms for a "typed" effect)
 */
export const SECTIONS = ['home', 'about', 'skills', 'projects', 'certifications', 'contact'];
const SECTION_ALIASES = {
  home: 'home', top: 'home', hero: 'home',
  about: 'about', me: 'about', info: 'about',
  skills: 'skills', skill: 'skills', tech: 'skills', technologies: 'skills',
  projects: 'projects', project: 'projects', work: 'projects',
  certifications: 'certifications', certification: 'certifications', certs: 'certifications', cert: 'certifications', experience: 'certifications',
  contact: 'contact', hire: 'contact', map: 'contact', attacks: 'contact'
};
const LINKS = ['github', 'linkedin', 'email', 'resume'];

export const COMMANDS = [
  'help', 'man', 'ls', 'dir', 'list', 'll', 'cd', 'pwd', 'tree', 'cat', 'type', 'head', 'tail', 'less', 'more', 'open', 'goto',
  'about', 'skills', 'projects', 'certifications', 'certs', 'contact', 'home',
  'github', 'linkedin', 'email', 'resume',
  'whoami', 'id', 'hostname', 'uname', 'date', 'uptime', 'neofetch', 'banner', 'env', 'ps', 'history', 'echo', 'which', 'clear', 'cls', 'exit',
  'ping', 'nmap', 'ifconfig', 'netstat', 'sudo', 'rm', 'hack'
];

const DOCS = {
  help: ['help', 'Show all commands.'],
  man: ['man <command>', 'Short manual for a command.'],
  ls: ['ls [-l] [-a] [dir]', 'List files. Aliases: dir, list, ll.'],
  cd: ['cd <dir>', 'Change directory (and jump to that section of the page). cd .. goes up, cd ~ goes home.'],
  pwd: ['pwd', 'Print the current working directory.'],
  tree: ['tree [dir]', 'Show the folder tree.'],
  cat: ['cat <file>', 'Print a file. Aliases: type, head, tail, less, more.'],
  open: ['open <section|link>', 'Jump to home, about, skills, projects, certifications, contact — or open github, linkedin, email, resume.'],
  about: ['about', 'Open the about section and print a summary.'],
  skills: ['skills', 'Open the skills section and print the toolkit.'],
  projects: ['projects', 'Open the projects section and list them.'],
  certifications: ['certifications', 'Open credentials and print them. Alias: certs.'],
  contact: ['contact', 'Open the contact section (and the live attack map).'],
  whoami: ['whoami', 'Who is behind this portfolio.'],
  id: ['id', 'Print user and group ids.'],
  hostname: ['hostname', 'Print the host name.'],
  uname: ['uname [-a]', 'Print system information.'],
  date: ['date', 'Print the current date and time.'],
  uptime: ['uptime', 'How long this session has been running.'],
  neofetch: ['neofetch', 'System / profile summary with logo.'],
  banner: ['banner', 'Print the SCyberX banner.'],
  env: ['env', 'Print environment variables.'],
  ps: ['ps', 'List (simulated) processes.'],
  history: ['history', 'Show commands typed in this session. Use ↑ / ↓ to recall them.'],
  echo: ['echo <text>', 'Print text. Supports $USER, $HOME, $PWD, $SHELL.'],
  which: ['which <command>', 'Show where a command lives.'],
  clear: ['clear', 'Clear the terminal. Alias: cls.'],
  ping: ['ping <host>', 'Simulated ping (no packets are sent).'],
  nmap: ['nmap <host>', 'Simulated port scan (no real scan is performed).'],
  ifconfig: ['ifconfig', 'Simulated network interfaces.'],
  netstat: ['netstat', 'Simulated connections.'],
  github: ['github', 'Open the GitHub profile.'],
  linkedin: ['linkedin', 'Open the LinkedIn profile.'],
  email: ['email', 'Open your mail app to email Sandip.'],
  resume: ['resume', 'Download the resume.']
};

const slug = s => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const L = (t, text, d) => (d ? { t, text, d } : { t, text });
const out = (...texts) => texts.flat().map(x => L('out', x));

/* ---------- virtual file system ---------- */
function buildFS(c) {
  const dirs = {
    about: {
      'bio.txt': [c.profile.name + ' — Security Researcher / Bug Hunter / Cyber Forensic Analyst', 'Exploring vulnerabilities. Securing tomorrow.'],
      'education.txt': [c.about.education],
      'location.txt': [c.profile.location],
      'mission.txt': [c.about.mission]
    },
    skills: {}, projects: {}, certifications: {},
    contact: {
      'email.txt': [c.profile.email],
      'github.txt': [c.profile.github],
      'linkedin.txt': [c.profile.linkedin]
    }
  };
  c.skillGroups.forEach(g => { dirs.skills[`${slug(g.title)}.txt`] = [g.title, '  ' + g.items.join(' · ')]; });
  c.projects.forEach(p => { dirs.projects[`${p.number}-${slug(p.title)}.md`] = [`# ${p.title}`, p.type, '', p.desc, '', 'Stack: ' + p.tags.join(', '), 'Repo:  ' + p.link]; });
  c.certifications.forEach(x => { dirs.certifications[`${slug(x.name)}.txt`] = [x.name, x.desc, x.date + (x.org !== x.name ? ' · ' + x.org : '')]; });
  const root = {
    'README.md': ['# SCyberX portfolio shell', 'Type `help` for commands. Folders match the sections of this page.', 'Try: ls, cd skills, cat web-security.txt, neofetch'],
    'whoami.txt': [c.profile.name, 'Kolkata, India'],
    'resume.pdf': { bin: true },
    '.secret': ['You found the hidden file. 🕵️  Curiosity is the best exploit — stay ethical.']
  };
  return { dirs, root };
}

// Resolve a path argument against cwd. Returns { kind:'dir', dir:'' | name } | { kind:'file', dir, name } | null
function resolvePath(fs, cwd, arg = '') {
  let a = arg.trim().replace(/^\/home\/sandip\/scyberx/, '~');
  const fromRoot = a.startsWith('~') || a.startsWith('/');
  const stack = fromRoot ? [] : cwd ? [cwd] : [];
  for (const p of a.replace(/^~/, '').split('/').filter(Boolean)) {
    if (p === '.') continue;
    if (p === '..') stack.pop(); else stack.push(p);
  }
  if (stack.length === 0) return { kind: 'dir', dir: '' };
  if (stack.length === 1) {
    if (fs.dirs[stack[0]]) return { kind: 'dir', dir: stack[0] };
    if (stack[0] in fs.root) return { kind: 'file', dir: '', name: stack[0] };
    return null;
  }
  if (stack.length === 2 && fs.dirs[stack[0]] && stack[1] in fs.dirs[stack[0]]) return { kind: 'file', dir: stack[0], name: stack[1] };
  return null;
}
const entriesOf = (fs, dir, hidden) => {
  const files = dir ? Object.keys(fs.dirs[dir]) : Object.keys(fs.root).filter(f => hidden || !f.startsWith('.'));
  const dirNames = dir ? [] : Object.keys(fs.dirs);
  return [...dirNames.map(n => ({ n, dir: true })), ...files.map(n => ({ n, dir: false }))];
};
const fileLines = (fs, dir, name) => (dir ? fs.dirs[dir][name] : fs.root[name]);
export const promptFor = (brand, cwd) => `${brand.toLowerCase()}@portfolio:${cwd ? '~/' + cwd : '~'}$`;
const pwdOf = cwd => '/home/sandip/scyberx' + (cwd ? '/' + cwd : '');

/* ---------- helpers ---------- */
const tokenize = raw => (raw.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(t => t.replace(/^["']|["']$/g, ''));
const fmtUptime = ms => { const s = Math.floor(ms / 1000), m = Math.floor(s / 60), h = Math.floor(m / 60); return h ? `${h}h ${m % 60}m` : m ? `${m}m ${s % 60}s` : `${s}s`; };

const BANNER = String.raw` ____   ____      _                __  __
/ ___| / ___|   _| |__   ___ _ __  \ \/ /
\___ \| |  | | | | '_ \ / _ \ '__|  \  /
 ___) | |__| |_| | |_) |  __/ |     /  \
|____/ \____\__, |_.__/ \___|_|    /_/\_\
            |___/   CYBER SECURITY`.split('\n');
const SHIELD = [
  '    .-""""-.    ', '   / .----. \\   ', '  | |  ()  | |  ', '  | | \\__/ | |  ', '   \\ \\_||_/ /   ', '    \\  ||  /    ', '     `.||.\'     ', '       ``       '
];

export function runCommand(raw, ctx) {
  const { cwd, brand, profile, skillGroups, projects, certifications, history, startedAt } = ctx;
  const fs = buildFS(ctx);
  const tokens = tokenize(raw.trim());
  if (!tokens.length) return { lines: [] };
  const cmd = tokens[0].toLowerCase();
  const args = tokens.slice(1);
  const flags = args.filter(a => a.startsWith('-') && a.length > 1).join('');
  const params = args.filter(a => !(a.startsWith('-') && a.length > 1));
  const host = `${brand.toLowerCase()}-portfolio`;

  const openSection = (id, lines = []) => ({ lines: [L('ok', `Opening ${id} module…`), ...lines], open: id });

  switch (cmd) {
    case 'help': case '?': case 'commands': return { lines: [
      L('head', `${brand} shell v1.0 — available commands`),
      L('out', 'NAVIGATE   ls [-la] [dir] · cd <dir> · pwd · tree · cat <file> · open <section>'),
      L('out', 'PORTFOLIO  about · skills · projects · certifications · contact · home'),
      L('out', 'LINKS      github · linkedin · email · resume'),
      L('out', 'SYSTEM     whoami · id · hostname · uname -a · date · uptime · neofetch · banner'),
      L('out', '           env · ps · history · echo <text> · which <cmd> · man <cmd> · clear'),
      L('out', 'NETWORK    ping <host> · nmap <host> · ifconfig · netstat   (simulated, safe)'),
      L('out', 'FUN        sudo · rm -rf / · hack · exit'),
      L('dim', 'Tips: ↑ / ↓ recall previous commands · Tab autocompletes · "cd skills" jumps to that section')
    ] };

    case 'man': {
      const n = (params[0] || '').toLowerCase();
      if (!n) return { lines: [L('err', 'What manual page do you want? e.g. man ls')] };
      const d = DOCS[n] || DOCS[{ dir: 'ls', list: 'ls', ll: 'ls', type: 'cat', head: 'cat', tail: 'cat', less: 'cat', more: 'cat', certs: 'certifications', cls: 'clear', goto: 'open' }[n]];
      return d ? { lines: [L('head', n.toUpperCase()), L('out', '  usage:  ' + d[0]), L('out', '  ' + d[1])] } : { lines: [L('err', `No manual entry for ${n}`)] };
    }

    case 'ls': case 'dir': case 'list': case 'll': {
      const long = cmd === 'll' || flags.includes('l'), all = flags.includes('a');
      const target = params[0] ? resolvePath(fs, cwd, params[0]) : { kind: 'dir', dir: cwd };
      if (!target) return { lines: [L('err', `ls: cannot access '${params[0]}': No such file or directory`)] };
      if (target.kind === 'file') return { lines: [L('out', target.name)] };
      const ents = entriesOf(fs, target.dir, all);
      if (all) ents.unshift({ n: '.', dir: true }, { n: '..', dir: true });
      if (!long) return { lines: [L('out', ents.map(e => e.n + (e.dir ? '/' : '')).join('   ') || '(empty)')] };
      const day = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return { lines: [L('dim', `total ${ents.length}`), ...ents.map(e => {
        const size = e.dir ? 4096 : e.n === 'resume.pdf' ? 184320 : (fileLines(fs, target.dir, e.n) || []).join('\n').length;
        return L('out', `${e.dir ? 'drwxr-xr-x' : '-rw-r--r--'}  sandip  scyberx  ${String(size).padStart(6)}  ${day}  ${e.n}${e.dir ? '/' : ''}`);
      })] };
    }

    case 'pwd': return { lines: [L('out', pwdOf(cwd))] };

    case 'cd': {
      if (!params.length) return { lines: [], cwd: '' };
      const t = resolvePath(fs, cwd, params[0]);
      if (!t) return { lines: [L('err', `cd: ${params[0]}: No such file or directory`)] };
      if (t.kind === 'file') return { lines: [L('err', `cd: ${params[0]}: Not a directory`)] };
      return { lines: t.dir ? [L('ok', `Entering ${t.dir}/ …`)] : [], cwd: t.dir, open: t.dir || undefined };
    }

    case 'tree': {
      const t = params[0] ? resolvePath(fs, cwd, params[0]) : { kind: 'dir', dir: cwd };
      if (!t || t.kind !== 'dir') return { lines: [L('err', `tree: ${params[0]}: not a directory`)] };
      const lines = [L('head', t.dir ? t.dir + '/' : '~')];
      const show = (ents, pad) => ents.forEach((e, i) => {
        lines.push(L('out', `${pad}${i === ents.length - 1 ? '└── ' : '├── '}${e.n}${e.dir ? '/' : ''}`));
        if (e.dir) show(entriesOf(fs, e.n).map(x => ({ ...x })), pad + (i === ents.length - 1 ? '    ' : '│   '));
      });
      show(entriesOf(fs, t.dir), '');
      return { lines };
    }

    case 'cat': case 'type': case 'head': case 'tail': case 'less': case 'more': {
      if (!params.length) return { lines: [L('err', `${cmd}: missing file operand`)] };
      const lines = [];
      params.forEach(p => {
        const t = resolvePath(fs, cwd, p);
        if (!t) lines.push(L('err', `${cmd}: ${p}: No such file or directory`));
        else if (t.kind === 'dir') lines.push(L('err', `${cmd}: ${p}: Is a directory`));
        else {
          const f = fileLines(fs, t.dir, t.name);
          if (f && f.bin) lines.push(L('err', `${cmd}: ${p}: binary file — type "resume" to download it`));
          else lines.push(...f.map(x => L('out', x)));
        }
      });
      return { lines };
    }

    case 'open': case 'goto': case 'go': case 'show': case 'view': {
      const k = (params[0] || '').toLowerCase().replace(/\/+$/, '');
      if (!k) return { lines: [L('err', `${cmd}: which one? try: ${[...SECTIONS, ...LINKS].join(', ')}`)] };
      if (SECTION_ALIASES[k]) return openSection(SECTION_ALIASES[k]);
      if (LINKS.includes(k)) return runCommand(k, ctx);
      return { lines: [L('err', `${cmd}: '${k}': no such module. Try: ${[...SECTIONS, ...LINKS].join(', ')}`)] };
    }

    /* ---- portfolio sections (open + print summary) ---- */
    case 'home': case 'top': return openSection('home');
    case 'about': case 'me': case 'info': return openSection('about', [
      L('head', profile.name), ...ctx.aboutFacts.map(([k, v]) => L('out', `${k.padEnd(10)} ${v}`))
    ]);
    case 'skills': case 'skill': case 'tech': return openSection('skills', skillGroups.map(g => L('out', `${g.title.padEnd(18)} ${g.items.join(' · ')}`)));
    case 'projects': case 'project': case 'work': return openSection('projects', projects.map(p => L('out', `${p.number}  ${p.title} — ${p.type}`)));
    case 'certifications': case 'certification': case 'certs': case 'cert': case 'experience':
      return openSection('certifications', certifications.map(x => L('out', `${x.name.padEnd(26)} ${x.date.padEnd(20)} ${x.desc}`)));
    case 'contact': case 'hire': case 'map': case 'attacks': return openSection('contact', [L('dim', 'Live attack map + this terminal are in the panel on the right.')]);

    case 'github': return { lines: [L('ok', 'Opening GitHub…'), L('dim', profile.github)], link: { url: profile.github } };
    case 'linkedin': return { lines: [L('ok', 'Opening LinkedIn…'), L('dim', profile.linkedin)], link: { url: profile.linkedin } };
    case 'email': case 'mail': return { lines: [L('ok', 'Opening mail client…'), L('dim', profile.email)], link: { url: `mailto:${profile.email}`, same: true } };
    case 'resume': case 'cv': case 'download': return { lines: [L('ok', 'Downloading resume.pdf …')], link: { url: profile.resume, download: true } };

    /* ---- system ---- */
    case 'whoami': return { lines: [L('out', 'sandip'), L('dim', `${profile.name} — Security Researcher · Bug Hunter · Cyber Forensic Analyst`), L('dim', profile.location)] };
    case 'id': return { lines: [L('out', 'uid=1337(sandip) gid=1337(scyberx) groups=1337(scyberx),100(users),1000(bughunters),1001(forensics)')] };
    case 'hostname': return { lines: [L('out', host)] };
    case 'uname': return { lines: [L('out', flags.includes('a') ? `${brand}-OS 1.0 ${host} 6.1.0-web #1 SMP x86_64 GNU/Linux (browser)` : `${brand}-OS`)] };
    case 'date': return { lines: [L('out', new Date().toString())] };
    case 'uptime': return { lines: [L('out', `up ${fmtUptime(Date.now() - startedAt)}, 1 user, load average: 0.12, 0.08, 0.03`)] };
    case 'banner': case 'logo': return { lines: [...BANNER.map(x => L('art', x)), L('dim', 'Exploring vulnerabilities. Securing tomorrow.')] };
    case 'neofetch': case 'sysinfo': {
      const info = [
        `sandip@${host}`, '-'.repeat(`sandip@${host}`.length), `OS: ${brand}-OS 1.0 (web)`, `Role: Security Researcher / Bug Hunter`, 'Focus: Cyber Forensics · Web Security · OSINT',
        `Skills: ${skillGroups.reduce((n, g) => n + g.items.length, 0)} tools & techs`, `Projects: ${projects.length}`, `Certs: ${certifications.length}`, `Shell: ${brand.toLowerCase()}-sh`, `Uptime: ${fmtUptime(Date.now() - startedAt)}`, 'Location: Kolkata, India'
      ];
      return { lines: Array.from({ length: Math.max(SHIELD.length, info.length) }, (_, i) => L('art', `${(SHIELD[i] || '').padEnd(20)}${info[i] || ''}`)) };
    }
    case 'env': return { lines: out('USER=sandip', 'HOME=/home/sandip/scyberx', `PWD=${pwdOf(cwd)}`, `SHELL=/bin/${brand.toLowerCase()}-sh`, 'TERM=xterm-256color', 'LANG=en_IN.UTF-8', 'EDITOR=vim', 'MISSION=learn-test-secure') };
    case 'ps': return { lines: [L('dim', '  PID TTY          TIME CMD'), ...out(' 1001 pts/0    00:00:00 scyberx-sh', ' 1337 pts/0    00:00:02 threat-map --live', ' 1338 pts/0    00:00:00 arc-reactor --core', ' 1402 pts/0    00:00:00 ps')] };
    case 'history': return { lines: history.length ? history.map((h, i) => L('out', `${String(i + 1).padStart(4)}  ${h}`)) : [L('dim', '(no history yet)')] };
    case 'echo': {
      const vars = { USER: 'sandip', HOME: '/home/sandip/scyberx', PWD: pwdOf(cwd), SHELL: `/bin/${brand.toLowerCase()}-sh`, HOSTNAME: host };
      return { lines: [L('out', args.join(' ').replace(/\$(\w+)/g, (m, v) => vars[v] ?? ''))] };
    }
    case 'which': {
      const n = (params[0] || '').toLowerCase();
      return { lines: [n ? (COMMANDS.includes(n) ? L('out', `/usr/local/bin/${n}`) : L('err', `which: no ${n} in (/usr/local/bin:/usr/bin)`)) : L('err', 'which: missing command name')] };
    }
    case 'clear': case 'cls': return { lines: [], clear: true };
    case 'exit': case 'logout': case 'quit': return { lines: out('logout: this session lives in your browser tab and cannot be closed.', 'Refresh the page to restart. Stay curious. 🔐') };

    /* ---- simulated network tools (nothing is actually sent) ---- */
    case 'ping': {
      const h = params[0];
      if (!h) return { lines: [L('err', 'ping: usage error: destination address required')] };
      const t = () => (18 + Math.random() * 30).toFixed(1);
      return { lines: [L('dim', `PING ${h} 56(84) bytes of data.  [simulated]`), ...[1, 2, 3, 4].map(i => L('out', `64 bytes from ${h}: icmp_seq=${i} ttl=57 time=${t()} ms`, i * 450)),
        L('ok', `--- ${h} ping statistics --- 4 packets transmitted, 4 received, 0% packet loss`, 2100)] };
    }
    case 'nmap': {
      const h = params[0];
      if (!h) return { lines: [L('err', 'nmap: usage: nmap <host>')] };
      return { lines: [L('dim', 'SIMULATED output — no packets were sent. Only scan systems you own or have written permission to test.'),
        L('out', `Starting scan of ${h} …`, 300), L('out', 'PORT      STATE   SERVICE', 800), L('ok', '22/tcp    open    ssh', 1000), L('ok', '80/tcp    open    http', 1200), L('ok', '443/tcp   open    https', 1400), L('out', '3306/tcp  closed  mysql', 1600), L('out', 'Done: 1 host up, scanned in 1.6 s (simulated)', 1900)] };
    }
    case 'ifconfig': case 'ipconfig': return { lines: out('eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500', '      inet 10.13.37.5  netmask 255.255.255.0  broadcast 10.13.37.255', '      ether 02:42:ac:13:37:05  (simulated)', 'lo:   inet 127.0.0.1  netmask 255.0.0.0') };
    case 'netstat': return { lines: [L('dim', 'Proto  Local Address        Foreign Address      State   (simulated)'), ...out('tcp    10.13.37.5:443       threat-feed:8080     ESTABLISHED', 'tcp    10.13.37.5:22        0.0.0.0:*            LISTEN')] };

    /* ---- jokes & guards ---- */
    case 'sudo': return { lines: out('sandip is not in the sudoers file. This incident will be reported.', '(just kidding — this is a read-only portfolio 😄)') };
    case 'rm': case 'rmdir': case 'mv': case 'cp': case 'touch': case 'mkdir': case 'chmod': case 'chown': case 'nano': case 'vim': case 'vi':
      return { lines: [L('err', /-\w*r\w*f|-\w*f\w*r/.test(flags) && params.includes('/') ? 'rm: nice try. 🛡️  This filesystem is read-only and protected by SCyberX.' : `${cmd}: Read-only file system — this portfolio can't be modified from the terminal.`)] };
    case 'hack': case 'hackme': return { lines: [L('err', 'ACCESS DENIED'), L('out', 'This is an ethical-research-only console. Want to see real work? Type: projects')] };
    default: return { lines: [L('err', `${tokens[0]}: command not found. Type "help" to see what's available.`)] };
  }
}

/* ---------- Tab completion ---------- */
export function complete(value, ctx) {
  const parts = value.split(/\s+/);
  const last = parts[parts.length - 1];
  let pool;
  if (parts.length === 1) pool = COMMANDS;
  else {
    const fs = buildFS(ctx);
    const slash = last.lastIndexOf('/');
    const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
    const t = dirPart ? resolvePath(fs, ctx.cwd, dirPart) : { kind: 'dir', dir: ctx.cwd };
    pool = t && t.kind === 'dir' ? entriesOf(fs, t.dir, last.slice(slash + 1).startsWith('.')).map(e => dirPart + e.n + (e.dir ? '/' : '')) : [];
    if (['open', 'goto', 'man', 'which'].includes(parts[0].toLowerCase())) pool = [...pool, ...SECTIONS, ...LINKS, ...COMMANDS];
  }
  const matches = [...new Set(pool.filter(p => p.toLowerCase().startsWith(last.toLowerCase())))];
  if (!matches.length) return { value, options: [] };
  let prefix = matches[0];
  matches.forEach(m => { while (!m.toLowerCase().startsWith(prefix.toLowerCase())) prefix = prefix.slice(0, -1); });
  const completed = [...parts.slice(0, -1), matches.length === 1 && !matches[0].endsWith('/') ? prefix + ' ' : prefix].join(' ');
  return { value: completed, options: matches.length > 1 ? matches : [] };
}

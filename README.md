# SCyberootX Cybersecurity Portfolio

Responsive React + Vite portfolio with a neon cyan/green sci-fi interface, animated HUD, clock, terminal-style assistant, skill matrix, projects, certifications and contact section.

## Run locally
1. Install Node.js (LTS) from https://nodejs.org/
2. Open this folder in a terminal.
3. Run `npm install`
4. Run `npm run dev`
5. Open the local URL printed by Vite.

## Build for production
Run `npm run build`. Vite creates the deployable site in `dist/`.

## Deploy to Vercel
1. Upload this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Framework preset: **Vite**; Build command: `npm run build`; Output directory: `dist`.
4. Click Deploy.

## Personalize before publishing
- Edit `profile.email` and `profile.linkedin` in `src/main.jsx`.
- Replace the sample project repository links with the exact GitHub repository URLs for each project.
- Put your PDF resume at `public/resume.pdf` (create the `public` folder if needed).
- Verify all certification dates and titles before publishing.

System dashboard bars are decorative sample values, not actual machine telemetry. This is a frontend-only portfolio; Node.js/MongoDB are not required unless you later add a backend, database, or real contact-form processing.

## Organisation logos (Certifications & Experience)
Drop each organisation's real logo into `public/logos/` using these file names (png, or edit the name in `src/main.jsx`):
`ceh.png`, `cpte.png`, `upsifs.png`, `cyber-world-organization.png`.
Until a file exists, a neon monogram badge is shown automatically.

## Terminal commands
Both terminals (hero "LIVE TERMINAL" and the bottom-right terminal) share one shell, history and current folder. Type `help` for the list. Use ↑/↓ for history, Tab to autocomplete, Ctrl+L to clear.
- Files: `ls [-la] [dir]` (also `dir`, `list`, `ll`), `cd`, `pwd`, `tree`, `cat <file>`
- Portfolio: `about`, `skills`, `projects`, `certifications`, `contact`, `home`, `open <section>` — scrolls to the section and blinks its title
- Links: `github`, `linkedin`, `email`, `resume`
- System: `whoami`, `id`, `hostname`, `uname -a`, `date`, `uptime`, `neofetch`, `banner`, `env`, `ps`, `history`, `echo`, `which`, `man`, `clear`
- Network (simulated, nothing is sent): `ping`, `nmap`, `ifconfig`, `netstat`
- Fun: `sudo`, `rm -rf /`, `hack`, `exit`, `cat .secret`
The shell lives in `src/terminalEngine.js` — add new commands in its `switch`.

## Live attack map (bottom-right terminal)
Shows a terminal-style dot-matrix world map with animated attack arcs and a scrolling log. By default it uses a **simulated** feed (labelled `SIMULATED FEED`; not real attacks).
To use real data, copy `.env.example` to `.env` and set `VITE_ATTACK_FEED_URL` to a CORS-enabled JSON endpoint returning events in the format described in `.env.example`; the badge switches to `LIVE FEED`.
Most public attack maps (Kaspersky, Fortinet, Check Point...) have no open API, so you would need your own small proxy/service that converts a threat-intel source into that format.

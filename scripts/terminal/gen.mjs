// Generates an animated "terminal" SVG for the GitHub profile README.
// usage (from repo root): node scripts/terminal/gen.mjs scripts/terminal/avatar-pixels.txt assets/terminal.svg
// avatar-pixels.txt comes from the GitHub avatar (https://github.com/0xsharkboy.png?size=200):
//   magick avatar.png -crop 180x200+5+0 -resize 36x20\! -depth 8 txt:-
import { readFileSync, writeFileSync } from "node:fs";

const [pixelsPath, outPath] = process.argv.slice(2);

// ---------- Tokyo Night palette ----------
const C = {
  bg: "#1a1b26", bar: "#16161e", border: "#292e42",
  fg: "#c0caf5", dim: "#565f89", comment: "#737aa2",
  blue: "#7aa2f7", cyan: "#7dcfff", magenta: "#bb9af7", green: "#9ece6a",
  orange: "#ff9e64", yellow: "#e0af68", red: "#f7768e", teal: "#73daca",
};

// ---------- geometry ----------
const W = 900, H = 470;
const BAR = 36, PADX = 22, PADY = 14;
const FS = 14, CW = 8.4, LH = 18;
const VIEW_H = H - BAR - PADY * 2; // visible content height
const ROWS = Math.floor(VIEW_H / LH);

// ---------- avatar -> colored ASCII ----------
const RAMP = " .:-=+*#%@";
function avatarRows() {
  const px = {};
  let w = 0, h = 0;
  for (const l of readFileSync(pixelsPath, "utf8").split("\n")) {
    const m = l.match(/^(\d+),(\d+): \((\d+),(\d+),(\d+)/);
    if (!m) continue;
    const [x, y, r, g, b] = m.slice(1).map(Number);
    px[`${x},${y}`] = [r, g, b];
    w = Math.max(w, x + 1); h = Math.max(h, y + 1);
  }
  const rows = [];
  for (let y = 0; y < h; y++) {
    const cells = [];
    for (let x = 0; x < w; x++) {
      const [r, g, b] = px[`${x},${y}`];
      const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      if (lum < 0.07) { cells.push([" ", null]); continue; }
      const v = Math.min(1, Math.pow(lum, 0.7) * 1.5);
      const ch = RAMP[Math.round(v * (RAMP.length - 1))];
      // lift dark colors so they stay visible on the dark background
      const lift = (c) => Math.round(Math.min(255, 60 + c * 1.25));
      cells.push([ch, ch === " " ? null : `rgb(${lift(r)},${lift(g)},${lift(b)})`]);
    }
    rows.push(cells);
  }
  return rows;
}

// ---------- script ----------
// A line is an array of [text, color] segments. Commands are typed.
const seg = (t, c = C.fg) => [t, c];
const prompt = (cmd) => ({
  type: "cmd", cmd,
  segs: [seg("achille", C.blue), seg("@", C.dim), seg("nixos", C.magenta), seg(" ~ ", C.cyan), seg("❯ ", C.green)],
});
const out = (...segs) => ({ type: "out", segs });
const blank = () => out();

const art = avatarRows();
const ART_W = art[0].length;
const info = [
  [seg("achille", C.blue), seg("@", C.dim), seg("0xsharkboy", C.magenta)],
  [seg("─".repeat(18), C.dim)],
  [seg("OS        ", C.blue), seg("NixOS "), seg("(btw)", C.comment), seg(" · COSMIC")],
  [seg("Kernel    ", C.blue), seg("6.18-velo-green-spearmint")],
  [seg("Uptime    ", C.blue), seg("10 years since my first bootloop")],
  [seg("Role      ", C.blue), seg("Android Hacker")],
  [seg("Crew      ", C.blue), seg("Evolution X "), seg("(official maintainer)", C.comment)],
  [seg("Side      ", C.blue), seg("Cybersec · Reverse engineering")],
  [seg("School    ", C.blue), seg("Epitech · JU "), seg("(MSc Cybersecurity)", C.comment)],
  [seg("Langs     ", C.blue), seg("C · C++ · Rust · Kotlin · Nix · Python")],
  [seg("Shell     ", C.blue), seg("zsh · neovim")],
  [seg("Location  ", C.blue), seg("0x7C00 "), seg("(boot sector)", C.comment)],
  [seg("Contact   ", C.blue), seg("achille@0xsharkboy.dev", C.cyan)],
  [],
  "PALETTE",
];

const toml = (key, list) => out(seg(key.padEnd(9), C.blue), seg("= "), seg("[", C.fg),
  ...list.flatMap((x, i) => [seg(`"${x}"`, C.green), ...(i < list.length - 1 ? [seg(", ", C.fg)] : [])]), seg("]", C.fg));
const table = (name) => out(seg(`[${name}]`, C.magenta));

const script = [
  prompt("whoami"),
  out(seg("achille", C.magenta), seg(", a.k.a. 0xsharkboy", C.comment)),
  out(seg("I build Android ROMs, recoveries & root tooling, automate the infra behind them,")),
  out(seg("and take binaries apart for fun.")),
  blank(),
  prompt("neofetch"),
  { type: "neofetch" },
  blank(),
  prompt("ls ~/projects"),
  out(seg("evolution-x/          ", C.blue), seg("# official ROM maintainer, Samsung Exynos devices", C.comment)),
  out(seg("metrify/              ", C.blue), seg("# sponsor-visibility analytics for creators & esports", C.comment)),
  out(seg("exynos982x-orangefox/ ", C.blue), seg("# OrangeFox recovery for Exynos 9820/9825 devices", C.comment)),
  out(seg("magisk-boot-patcher/  ", C.blue), seg("# Magisk-patched boot.img, no phone required", C.comment)),
  blank(),
  prompt("cat ~/.skills.toml"),
  table("android"),
  toml("rom", ["AOSP", "LineageOS", "Soong", "device trees", "kernels", "sepolicy", "vendor blobs"]),
  toml("recovery", ["OrangeFox", "TWRP", "Magisk", "Magisk modules", "boot images"]),
  toml("apps", ["Kotlin", "Jetpack Compose", "Android SDK"]),
  table("devops"),
  toml("infra", ["NixOS", "Docker", "Kubernetes", "Terraform", "Ansible"]),
  toml("ci", ["Jenkins", "Groovy", "GitHub Actions"]),
  toml("selfhost", ["Caddy", "Pi-hole", "Unbound", "Jellyfin", "Cloudflare"]),
  table("security"),
  toml("reverse", ["Ghidra", "Cutter", "jadx", "apktool"]),
  table("code"),
  toml("lowlevel", ["C", "C++", "Rust", "Bash", "Python"]),
  toml("web", ["Vue", "TypeScript", "JavaScript", "PHP", "C#"]),
  blank(),
  { type: "final" },
];

// ---------- timeline ----------
const TYPE_CPS = 14;        // typed chars / second
const OUT_GAP = 0.06;       // seconds between output lines
const AFTER_CMD = 0.35;     // pause between Enter and output
const PAUSES = { whoami: 3.2, neofetch: 7, "ls ~/projects": 4.2, "cat ~/.skills.toml": 0 };
const HOLD = 9;             // final hold before loop

let t = 0.6, row = 0;
const items = []; // {row, t, kind, ...}
let lastCmd = null;
for (const s of script) {
  if (s.type === "cmd") {
    if (lastCmd) t += PAUSES[lastCmd];
    const typeDur = s.cmd.length / TYPE_CPS;
    items.push({ kind: "cmd", row: row++, t, typeDur, segs: s.segs, cmd: s.cmd });
    t += typeDur + AFTER_CMD;
    lastCmd = s.cmd;
  } else if (s.type === "out") {
    items.push({ kind: "out", row: row++, t, segs: s.segs });
    t += OUT_GAP;
  } else if (s.type === "neofetch") {
    const n = Math.max(art.length, info.length);
    for (let i = 0; i < n; i++) {
      items.push({ kind: "neo", row: row++, t, art: art[i], info: info[i] });
      t += 0.03;
    }
  } else if (s.type === "final") {
    t += 0.4;
    items.push({ kind: "final", row: row++, t });
  }
}
const T = +(t + HOLD).toFixed(2);
const pct = (x) => +((x / T) * 100).toFixed(3);

// scroll offset (in rows) after each item appears
const scrollSteps = [];
let cur = 0;
for (const it of items) {
  const need = Math.max(0, it.row - ROWS + 1);
  if (need !== cur) { scrollSteps.push({ t: it.t, rows: need }); cur = need; }
}

// ---------- SVG building ----------
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const len = (segs) => segs.reduce((n, [s]) => n + [...s].length, 0);
let css = "", k = 0;

function appear(at, end = T - 0.4) {
  const name = `a${k++}`;
  css += `@keyframes ${name}{0%,${pct(at) - 0.001}%{opacity:0}${pct(at)}%,${pct(end)}%{opacity:1}${pct(end) + 0.01}%,100%{opacity:0}}`;
  return `style="animation:${name} ${T}s infinite"`;
}

function textLine(segs, x, y, extra = "") {
  if (!segs || !segs.length) return "";
  const n = len(segs);
  const tspans = segs.map(([s, c]) => `<tspan fill="${c}">${esc(s)}</tspan>`).join("");
  return `<text x="${x}" y="${y}" textLength="${(n * CW).toFixed(1)}" lengthAdjust="spacing" ${extra}>${tspans}</text>`;
}

function artLine(cells, x, y) {
  // merge runs of identical color to keep the file small
  const runs = [];
  for (const [ch, col] of cells) {
    const last = runs[runs.length - 1];
    if (last && last[1] === col) last[0] += ch; else runs.push([ch, col]);
  }
  const tspans = runs.map(([s, c]) => c ? `<tspan fill="${c}">${esc(s)}</tspan>` : `<tspan>${s.replace(/ /g, "&#160;")}</tspan>`).join("");
  return `<text x="${x}" y="${y}" textLength="${(cells.length * CW).toFixed(1)}" lengthAdjust="spacing" xml:space="preserve">${tspans}</text>`;
}

let body = "";
const PROMPT_LEN = 18; // "achille@nixos ~ ❯ "
for (const it of items) {
  const y = it.row * LH + FS;
  if (it.kind === "cmd") {
    const px = PADX + PROMPT_LEN * CW;
    const cmdW = it.cmd.length * CW;
    const name = `ty${k++}`;
    const s0 = pct(it.t), s1 = pct(it.t + it.typeDur);
    // a bg-colored cover (with a cursor on its left edge) slides right to "type" the command
    css += `@keyframes ${name}{0%,${s0}%{transform:translateX(0)}${s1}%,100%{transform:translateX(${cmdW}px)}}`;
    const cur = `cu${k++}`;
    css += `@keyframes ${cur}{0%,${s0 - 0.001}%{opacity:0}${s0}%,${pct(it.t + it.typeDur + AFTER_CMD - 0.05)}%{opacity:1}${pct(it.t + it.typeDur + AFTER_CMD)}%,100%{opacity:0}}`;
    body += `<g ${appear(it.t - 0.25)}>` +
      textLine(it.segs, PADX, y) +
      textLine([[it.cmd, C.fg]], px, y) +
      `<g style="animation:${name} ${T}s infinite steps(${it.cmd.length}, end) "><rect x="${px}" y="${y - FS + 1}" width="${cmdW + 4}" height="${LH}" fill="${C.bg}"/>` +
      `<rect x="${px}" y="${y - FS + 1}" width="${CW}" height="${LH - 2}" fill="${C.fg}" style="animation:${cur} ${T}s infinite"/></g></g>`;
  } else if (it.kind === "out") {
    if (it.segs.length) body += `<g ${appear(it.t)}>${textLine(it.segs, PADX, y)}</g>`;
  } else if (it.kind === "neo") {
    let g = "";
    if (it.art) g += artLine(it.art, PADX, y);
    const ix = PADX + (ART_W + 4) * CW;
    if (it.info === "PALETTE") {
      [C.red, C.orange, C.yellow, C.green, C.teal, C.cyan, C.blue, C.magenta].forEach((c, i) =>
        g += `<rect x="${ix + i * 26}" y="${y - FS + 2}" width="24" height="${LH - 4}" rx="2" fill="${c}"/>`);
    } else if (it.info) g += textLine(it.info, ix, y);
    body += `<g ${appear(it.t)}>${g}</g>`;
  } else if (it.kind === "final") {
    const blink = `bl${k++}`;
    css += `@keyframes ${blink}{0%,49%{opacity:1}50%,100%{opacity:0}}`;
    body += `<g ${appear(it.t)}>${textLine(prompt("").segs, PADX, y)}` +
      `<rect x="${PADX + PROMPT_LEN * CW}" y="${y - FS + 1}" width="${CW}" height="${LH - 2}" fill="${C.fg}" style="animation:${blink} 1.1s infinite steps(1)"/></g>`;
  }
}

// scroll keyframes: quick slide at each step
let sk = "@keyframes scroll{0%{transform:translateY(0)}";
let prev = 0;
for (const s of scrollSteps) {
  sk += `${pct(s.t) - 0.01}%{transform:translateY(${-prev * LH}px)}${pct(s.t + 0.08)}%{transform:translateY(${-s.rows * LH}px)}`;
  prev = s.rows;
}
sk += `${pct(T - 0.4)}%{transform:translateY(${-prev * LH}px)}${pct(T - 0.39)}%,100%{transform:translateY(0)}}`;
css += sk;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="achille@nixos terminal: whoami, neofetch, projects and skills">
<style>
text{font-family:"JetBrains Mono","Fira Code","SF Mono",Menlo,Consolas,"DejaVu Sans Mono",monospace;font-size:${FS}px;fill:${C.fg};white-space:pre}
${css}
#scroll{animation:scroll ${T}s infinite}
</style>
<defs><clipPath id="view"><rect x="0" y="${BAR + PADY - 4}" width="${W}" height="${VIEW_H + 8}"/></clipPath></defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="12" fill="${C.bg}" stroke="${C.border}"/>
<path d="M0.5 12.5a12 12 0 0 1 12-12h${W - 25}a12 12 0 0 1 12 12v${BAR - 12}h-${W - 1}z" fill="${C.bar}"/>
<circle cx="22" cy="18" r="6" fill="${C.red}"/><circle cx="42" cy="18" r="6" fill="${C.yellow}"/><circle cx="62" cy="18" r="6" fill="${C.green}"/>
<text x="${W / 2}" y="23" text-anchor="middle" style="fill:${C.dim};font-size:13px">achille@nixos: ~</text>
<g clip-path="url(#view)"><g transform="translate(0 ${BAR + PADY})"><g id="scroll">
${body}
</g></g></g>
</svg>`;

writeFileSync(outPath, svg);
console.log(`wrote ${outPath}: ${(svg.length / 1024).toFixed(1)} KB, loop ${T}s, ${items.length} lines, ${ROWS} visible rows`);

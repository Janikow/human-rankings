/* ============================================================
   STATDUNGEON — HUMAN STAT TESTING PLATFORM
   script.js — Full Application Logic
   ============================================================ */

'use strict';

/* ============================================================
   CONSTANTS & CONFIG
   ============================================================ */

const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500];
const MAX_HISTORY = 10;

const REACTION_DELAY = {
  easy:   { min: 1500, max: 3000 },
  normal: { min: 1000, max: 4000 },
  hard:   { min: 600,  max: 5000 }
};

/* ============================================================
   WORD BANKS FOR TYPING TEST
   ============================================================ */

const WORD_BANKS = {
  words: [
    "the","be","to","of","and","a","in","that","have","it","for","not","on","with","he","as","you",
    "do","at","this","but","his","by","from","they","we","say","her","she","or","an","will","my",
    "one","all","would","there","their","what","so","up","out","if","about","who","get","which",
    "go","me","when","make","can","like","time","no","just","him","know","take","people","into",
    "year","your","good","some","could","them","see","other","than","then","now","look","only","come",
    "its","over","think","also","back","after","use","two","how","our","work","first","well","way",
    "even","new","want","because","any","these","give","day","most","us","great","between","need",
    "large","often","hand","high","place","hold","turn","here","why","ask","went","men","read","need",
    "land","different","home","move","try","kind","hand","picture","again","change","off","play","spell",
    "air","away","animal","house","point","page","letter","mother","answer","found","study","still",
    "learn","plant","cover","food","sun","four","between","state","keep","eye","never","last","let",
    "thought","city","tree","cross","farm","hard","start","might","story","saw","far","sea","draw",
    "left","late","run","don","while","press","close","night","real","life","few","north","open",
    "seem","together","next","white","children","begin","got","walk","example","ease","paper","group",
    "always","music","those","both","mark","book","carry","took","science","eat","room","friend","began",
    "idea","fish","mountain","stop","once","base","hear","horse","cut","sure","watch","color","face",
    "wood","main","enough","plain","girl","usual","young","ready","above","ever","red","list","though",
    "feel","talk","bird","soon","body","dog","family","direct","pose","leave","song","measure","door",
    "product","black","short","numeral","class","wind","question","happen","complete","ship","area"
  ],
  sentences: [
    "The quick brown fox jumps over the lazy dog near the riverbank where children play every afternoon.",
    "Gaming requires split-second decisions and precise muscle memory built through thousands of hours of deliberate practice.",
    "Reaction time is the interval between a stimulus and the initiation of a response that follows.",
    "Speed and accuracy must work together because a fast typist who makes many errors is slower overall.",
    "The human brain can process a visual signal in as little as one hundred milliseconds after seeing it.",
    "Competitive gaming demands consistent performance under pressure and mental training is just as important as mechanical skill.",
    "Every millisecond counts when you are at the top of the leaderboard so train smart and rest well.",
    "Aim trainers help build muscle memory for mouse control and just fifteen minutes of daily practice shows results.",
    "Working memory determines how much information you can hold and manipulate at once and it is trainable.",
    "Discipline beats motivation every time so show up every day track your progress and the improvements will come.",
    "The best way to improve your typing speed is to focus on accuracy first and let speed follow.",
    "Consistent practice leads to mastery in any skill whether it is typing gaming or playing an instrument.",
    "Scientists have discovered that the human brain continues to form new neural connections throughout adult life with practice.",
    "Professional esports players spend hours each day warming up their reflexes before competing in tournaments around the world.",
    "The difference between an average player and a professional often comes down to hundreds of hours of focused training.",
    "Memory is not fixed and can be improved through deliberate mental exercises and a healthy lifestyle with good sleep."
  ],
  numbers: [
    "1 2 3 4 5 6 7 8 9 0",
    "10 20 30 40 50 60 70 80 90 100",
    "42 17 83 56 29 74 11 95 38 62",
    "100 200 300 400 500 600 700 800 900 1000",
    "3 14 159 265 358 979 323 846 264 338",
    "2 71 828 182 845 904 523 536 028 747",
    "7 11 13 17 19 23 29 31 37 41 43 47",
    "1 1 2 3 5 8 13 21 34 55 89 144 233"
  ],
  code: [
    "const x = 42; let y = x * 2; return y;",
    "function add(a, b) { return a + b; }",
    "if (score > 100) { level++; xp += 50; }",
    "arr.map(x => x * 2).filter(x => x > 10)",
    "import { useState } from 'react';",
    "for (let i = 0; i < arr.length; i++) {}",
    "const obj = { key: 'value', num: 42 };",
    "document.querySelector('#id').classList.add('active');",
    "async function fetch() { const res = await api(); }",
    "export default class Component extends Base {}"
  ]
};

/* ============================================================
   DUNGEON CANVAS BACKGROUND
   ============================================================ */

const DungeonCanvas = (() => {
  let canvas, ctx, W, H, animId;
  let torches = [];
  let particles = [];
  let time = 0;
  let active = false;

  // Dungeon color palette
  const STONE_COLORS = [
    '#1a1208', '#1e1508', '#221808', '#1c1306', '#201608'
  ];
  const GROUT_COLOR = '#0e0a04';
  const TORCH_COLOR = '#c89020';

  const TILE_W = 48;
  const TILE_H = 48;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    placeTorches();
  }

  function placeTorches() {
    torches = [];
    const cols = Math.ceil(W / (TILE_W * 6)) + 1;
    const rows = Math.ceil(H / (TILE_H * 5)) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        torches.push({
          x: c * TILE_W * 6 + TILE_W * 3,
          y: r * TILE_H * 5 + TILE_H * 1.5,
          phase: Math.random() * Math.PI * 2,
          speed: 0.04 + Math.random() * 0.03,
          brightness: 0.6 + Math.random() * 0.4
        });
      }
    }
  }

  function drawStoneFloor() {
    const cols = Math.ceil(W / TILE_W) + 2;
    const rows = Math.ceil(H / TILE_H) + 2;
    ctx.fillStyle = GROUT_COLOR;
    ctx.fillRect(0, 0, W, H);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const offset = (r % 2 === 0) ? 0 : TILE_W / 2;
        const x = c * TILE_W - offset;
        const y = r * TILE_H;
        // Stone base
        const colorIdx = (r * 7 + c * 13) % STONE_COLORS.length;
        ctx.fillStyle = STONE_COLORS[colorIdx];
        ctx.fillRect(x + 1, y + 1, TILE_W - 2, TILE_H - 2);
        // Subtle pixel noise on tile
        ctx.fillStyle = 'rgba(255,200,100,0.015)';
        for (let px = 0; px < 3; px++) {
          const nx = x + 2 + ((r * 11 + c * 7 + px * 5) % (TILE_W - 4));
          const ny = y + 2 + ((r * 5 + c * 13 + px * 9) % (TILE_H - 4));
          ctx.fillRect(nx, ny, 2, 2);
        }
        // Worn corner marks (pixel art style)
        ctx.fillStyle = 'rgba(255,220,100,0.03)';
        ctx.fillRect(x + 2, y + 2, 4, 4);
        ctx.fillRect(x + TILE_W - 6, y + 2, 4, 4);
        ctx.fillRect(x + 2, y + TILE_H - 6, 4, 4);
        ctx.fillRect(x + TILE_W - 6, y + TILE_H - 6, 4, 4);
      }
    }
  }

  function spawnParticle(torch) {
    particles.push({
      x: torch.x + (Math.random() - 0.5) * 8,
      y: torch.y - 8,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(0.4 + Math.random() * 0.8),
      life: 1,
      decay: 0.025 + Math.random() * 0.02,
      size: 2 + Math.random() * 3
    });
  }

  function drawTorch(torch) {
    const flicker = Math.sin(time * torch.speed + torch.phase) * 0.3 +
                    Math.sin(time * torch.speed * 2.3 + torch.phase * 1.7) * 0.15;
    const brightness = torch.brightness + flicker;
    const radius = 80 + flicker * 20;

    // Torch glow
    const grd = ctx.createRadialGradient(torch.x, torch.y, 2, torch.x, torch.y, radius);
    grd.addColorStop(0, `rgba(200,160,32,${0.14 * brightness})`);
    grd.addColorStop(0.3, `rgba(160,100,20,${0.06 * brightness})`);
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(torch.x, torch.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Torch sconce (pixel art style - simple rectangles)
    ctx.fillStyle = '#4a3010';
    ctx.fillRect(torch.x - 4, torch.y, 8, 14);
    ctx.fillStyle = '#6a4818';
    ctx.fillRect(torch.x - 3, torch.y + 1, 6, 11);

    // Flame
    const flameH = 10 + flicker * 4;
    ctx.fillStyle = `rgba(255,220,60,${0.9 + flicker * 0.1})`;
    ctx.fillRect(torch.x - 3, torch.y - flameH, 6, flameH);
    ctx.fillStyle = `rgba(255,140,20,${0.8 + flicker * 0.15})`;
    ctx.fillRect(torch.x - 2, torch.y - flameH + 2, 4, flameH - 3);
    ctx.fillStyle = `rgba(255,255,200,${0.6 + flicker * 0.2})`;
    ctx.fillRect(torch.x - 1, torch.y - flameH + 4, 2, flameH - 6);

    // Spawn embers
    if (Math.random() < 0.15) spawnParticle(torch);
  }

  function drawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.01;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.fillStyle = `rgba(255,${100 + p.life * 120},20,${p.life * 0.8})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
  }

  function drawWallTop() {
    // Dark stone wall at the very top
    ctx.fillStyle = '#100c04';
    ctx.fillRect(0, 0, W, TILE_H * 0.5);
    // Wall border bricks
    const brickW = 64, brickH = 16;
    ctx.fillStyle = '#1a1408';
    for (let c = -1; c < Math.ceil(W / brickW) + 1; c++) {
      const offset = (0 % 2 === 0) ? 0 : brickW / 2;
      ctx.fillRect(c * brickW - offset + 1, 4, brickW - 2, brickH - 2);
    }
    // Wall shadow
    const wallGrd = ctx.createLinearGradient(0, 0, 0, TILE_H * 2);
    wallGrd.addColorStop(0, 'rgba(0,0,0,0.8)');
    wallGrd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = wallGrd;
    ctx.fillRect(0, 0, W, TILE_H * 2);
  }

  function drawVignette() {
    const grd = ctx.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, H * 0.9);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.7)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function loop() {
    if (!active) return;
    time++;
    ctx.clearRect(0, 0, W, H);
    drawStoneFloor();
    drawWallTop();
    torches.forEach(t => drawTorch(t));
    drawParticles();
    drawVignette();
    animId = requestAnimationFrame(loop);
  }

  function start() {
    active = true;
    if (!animId) loop();
  }

  function stop() {
    active = false;
    cancelAnimationFrame(animId);
    animId = null;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  function init() {
    canvas = document.getElementById('dungeonCanvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    resize();
    window.addEventListener('resize', () => { resize(); });
  }

  return { init, start, stop };
})();

/* ============================================================
   THEME SYSTEM
   ============================================================ */

const THEMES = {
  cyber: {
    '--bg-base': '#080c12',
    '--bg-card': '#0d1117',
    '--bg-card2': '#111820',
    '--bg-hover': '#1a2233',
    '--border': 'rgba(255,255,255,0.07)',
    '--border-glow': 'rgba(0,255,170,0.3)',
    '--accent': '#00ffaa',
    '--accent2': '#00c8ff',
    '--accent3': '#ff6b35',
    '--accent4': '#a855f7',
    '--accent-dim': 'rgba(0,255,170,0.15)',
    '--text-primary': '#e8edf5',
    '--text-secondary': '#7a8a9e',
    '--text-muted': '#4a5568',
    '--orb1': 'rgba(0,255,170,0.06)',
    '--orb2': 'rgba(0,200,255,0.04)',
    '--orb3': 'rgba(168,85,247,0.04)'
  },
  neon: {
    '--bg-base': '#0f0818',
    '--bg-card': '#160d22',
    '--bg-card2': '#1c1230',
    '--bg-hover': '#251640',
    '--border': 'rgba(255,100,255,0.1)',
    '--border-glow': 'rgba(255,80,220,0.4)',
    '--accent': '#ff50dc',
    '--accent2': '#ff9cf7',
    '--accent3': '#ffcc00',
    '--accent4': '#00eeff',
    '--accent-dim': 'rgba(255,80,220,0.15)',
    '--text-primary': '#f5e8ff',
    '--text-secondary': '#9a7aae',
    '--text-muted': '#5a3a6e',
    '--orb1': 'rgba(255,80,220,0.07)',
    '--orb2': 'rgba(0,238,255,0.04)',
    '--orb3': 'rgba(255,200,0,0.04)'
  },
  ocean: {
    '--bg-base': '#020d1a',
    '--bg-card': '#051525',
    '--bg-card2': '#081e35',
    '--bg-hover': '#0d2a4a',
    '--border': 'rgba(0,180,255,0.1)',
    '--border-glow': 'rgba(0,200,255,0.4)',
    '--accent': '#00d4ff',
    '--accent2': '#0080ff',
    '--accent3': '#ff6b35',
    '--accent4': '#00ffcc',
    '--accent-dim': 'rgba(0,212,255,0.15)',
    '--text-primary': '#d0eeff',
    '--text-secondary': '#5a8aaa',
    '--text-muted': '#2a4a6a',
    '--orb1': 'rgba(0,212,255,0.06)',
    '--orb2': 'rgba(0,100,255,0.05)',
    '--orb3': 'rgba(0,255,180,0.04)'
  },
  fire: {
    '--bg-base': '#120800',
    '--bg-card': '#1a0d00',
    '--bg-card2': '#221200',
    '--bg-hover': '#2e1800',
    '--border': 'rgba(255,120,0,0.1)',
    '--border-glow': 'rgba(255,100,0,0.4)',
    '--accent': '#ff6a00',
    '--accent2': '#ffcc00',
    '--accent3': '#ff2a2a',
    '--accent4': '#ff9500',
    '--accent-dim': 'rgba(255,106,0,0.15)',
    '--text-primary': '#fff0e0',
    '--text-secondary': '#aa7040',
    '--text-muted': '#5a3010',
    '--orb1': 'rgba(255,106,0,0.07)',
    '--orb2': 'rgba(255,200,0,0.05)',
    '--orb3': 'rgba(255,42,42,0.04)'
  },
  void: {
    '--bg-base': '#07050f',
    '--bg-card': '#0e0b1a',
    '--bg-card2': '#14102a',
    '--bg-hover': '#1e1840',
    '--border': 'rgba(150,100,255,0.1)',
    '--border-glow': 'rgba(130,80,255,0.4)',
    '--accent': '#9060ff',
    '--accent2': '#cc80ff',
    '--accent3': '#ff4fa0',
    '--accent4': '#60d0ff',
    '--accent-dim': 'rgba(144,96,255,0.15)',
    '--text-primary': '#e8e0ff',
    '--text-secondary': '#7060aa',
    '--text-muted': '#40306a',
    '--orb1': 'rgba(144,96,255,0.07)',
    '--orb2': 'rgba(204,128,255,0.05)',
    '--orb3': 'rgba(255,79,160,0.04)'
  },
  light: {
    '--bg-base': '#f0f4f8',
    '--bg-card': '#ffffff',
    '--bg-card2': '#f8fafc',
    '--bg-hover': '#e8f0f8',
    '--border': 'rgba(0,0,0,0.08)',
    '--border-glow': 'rgba(0,120,255,0.3)',
    '--accent': '#0070f3',
    '--accent2': '#00aaff',
    '--accent3': '#ff4500',
    '--accent4': '#8800ff',
    '--accent-dim': 'rgba(0,112,243,0.1)',
    '--text-primary': '#0a0e1a',
    '--text-secondary': '#4a5568',
    '--text-muted': '#8a9aae',
    '--orb1': 'rgba(0,112,243,0.06)',
    '--orb2': 'rgba(0,170,255,0.04)',
    '--orb3': 'rgba(136,0,255,0.04)'
  },
  dungeon: {
    '--bg-base': '#0e0a05',
    '--bg-card': '#1a1208',
    '--bg-card2': '#221808',
    '--bg-hover': '#2e2010',
    '--border': 'rgba(180,140,60,0.2)',
    '--border-glow': 'rgba(200,160,60,0.5)',
    '--accent': '#c8a020',
    '--accent2': '#e8c060',
    '--accent3': '#cc4422',
    '--accent4': '#8060a0',
    '--accent-dim': 'rgba(200,160,32,0.15)',
    '--text-primary': '#f0e8d0',
    '--text-secondary': '#9a8060',
    '--text-muted': '#5a4030',
    '--orb1': 'rgba(200,160,32,0.08)',
    '--orb2': 'rgba(180,100,20,0.05)',
    '--orb3': 'rgba(120,80,160,0.04)'
  }
};

function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (!theme) return;
  const root = document.documentElement;
  Object.entries(theme).forEach(([key, val]) => root.style.setProperty(key, val));

  const orb1 = document.querySelector('.orb-1');
  const orb2 = document.querySelector('.orb-2');
  const orb3 = document.querySelector('.orb-3');
  if (orb1) orb1.style.background = theme['--orb1'];
  if (orb2) orb2.style.background = theme['--orb2'];
  if (orb3) orb3.style.background = theme['--orb3'];

  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`.theme-btn[data-theme="${themeName}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // Dungeon canvas toggle
  document.body.className = document.body.className.replace(/theme-\S+/g, '').trim();
  document.body.classList.add('theme-' + themeName);

  if (themeName === 'dungeon') {
    DungeonCanvas.start();
  } else {
    DungeonCanvas.stop();
  }

  Storage.set('theme', themeName);
}

function initThemes() {
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
  const saved = Storage.get('theme', 'cyber');
  applyTheme(saved);
}

/* ============================================================
   STORAGE — localStorage helpers
   ============================================================ */

const Storage = {
  get(key, fallback = null) {
    try {
      const val = localStorage.getItem('rz_' + key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set(key, val) {
    try { localStorage.setItem('rz_' + key, JSON.stringify(val)); } catch {}
  },
  addHistory(test, score) {
    const hist = this.get(test + '_hist', []);
    hist.unshift({ score, ts: Date.now() });
    if (hist.length > MAX_HISTORY) hist.pop();
    this.set(test + '_hist', hist);
    const best = this.get(test + '_best', null);
    const isBetter = test === 'reaction'
      ? (best === null || score < best)
      : (best === null || score > best);
    if (isBetter) this.set(test + '_best', score);
    return isBetter;
  }
};

/* ============================================================
   XP & LEVEL SYSTEM
   ============================================================ */

const XPSystem = {
  getXP() { return Storage.get('xp', 0); },
  getLevel() {
    const xp = this.getXP();
    let level = 1;
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      if (xp >= XP_THRESHOLDS[i]) level = i + 1;
      else break;
    }
    return level;
  },
  getXPForLevel(level) { return XP_THRESHOLDS[Math.min(level - 1, XP_THRESHOLDS.length - 1)]; },
  getXPForNextLevel(level) { return XP_THRESHOLDS[Math.min(level, XP_THRESHOLDS.length - 1)]; },
  addXP(amount) {
    const prevLevel = this.getLevel();
    const newXP = this.getXP() + amount;
    Storage.set('xp', newXP);
    const newLevel = this.getLevel();
    if (newLevel > prevLevel) showLevelUp(newLevel);
    updateHUD();
    return amount;
  }
};

/* ============================================================
   STREAK SYSTEM
   ============================================================ */

const StreakSystem = {
  check() {
    const today = new Date().toDateString();
    const last = Storage.get('last_visit', null);
    let streak = Storage.get('streak', 0);
    if (last === today) return streak;
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (last === yesterday) streak++;
    else streak = 1;
    Storage.set('streak', streak);
    Storage.set('last_visit', today);
    return streak;
  },
  get() { return Storage.get('streak', 0); }
};

/* ============================================================
   NAVIGATION
   ============================================================ */

function navigateTo(sectionId) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(sectionId) ||
    document.querySelector(`.section[id="${sectionId}"]`);
  if (target) {
    target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('navToggle').classList.remove('open');
  updateHomeBests();
}

const NAV_MAP = {
  home: 'home',
  reaction: 'reaction-time',
  cps: 'cps-test',
  aim: 'aim-trainer',
  memory: 'memory-test',
  typing: 'typing-speed',
  number: 'number-memory',
  chimp: 'chimp-test',
  color: 'color-reflex',
  dashboard: 'dashboard'
};

function initNavigation() {
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-nav]');
    if (!el) return;
    e.preventDefault();
    const nav = el.dataset.nav;
    const sectionId = NAV_MAP[nav] || nav;
    navigateTo(sectionId);
    if (nav === 'dashboard') refreshDashboard();
  });

  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
    if (hash === 'dashboard') refreshDashboard();
  }

  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('mobileMenu').classList.toggle('open');
    document.getElementById('navToggle').classList.toggle('open');
  });
}

/* ============================================================
   HUD UPDATE
   ============================================================ */

function updateHUD() {
  const xp = XPSystem.getXP();
  const level = XPSystem.getLevel();
  const streak = StreakSystem.get();
  const xpThis = XPSystem.getXPForLevel(level);
  const xpNext = XPSystem.getXPForNextLevel(level);
  const xpPercent = xpNext > xpThis
    ? Math.min(100, ((xp - xpThis) / (xpNext - xpThis)) * 100)
    : 100;

  ['hudLevel', 'dashLevel'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = level; });
  ['hudStreak'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = streak + '🔥'; });
  ['dashStreak'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = streak; });
  ['hudXpFill', 'dashXpFill'].forEach(id => { const el = document.getElementById(id); if (el) el.style.width = xpPercent + '%'; });
  const hudXpText = document.getElementById('hudXpText');
  if (hudXpText) hudXpText.textContent = `${xp - xpThis} / ${xpNext - xpThis} XP`;
  const dashXpNums = document.getElementById('dashXpNums');
  if (dashXpNums) dashXpNums.textContent = `${xp} / ${xpNext} XP`;
}

function updateHomeBests() {
  const reactionBest = Storage.get('reaction_best', null);
  const cpsBest = Storage.get('cps_best', null);
  const aimBest = Storage.get('aim_best', null);
  const memBest = Storage.get('memory_best', null);
  const typeBest = Storage.get('typing_best', null);
  const numBest = Storage.get('number_best', null);
  const chimpBest = Storage.get('chimp_best', null);
  const colorBest = Storage.get('color_best', null);

  setEl('homeReactionBest', reactionBest !== null ? reactionBest + 'ms' : '— ms');
  setEl('homeCpsBest', cpsBest !== null ? cpsBest.toFixed(1) + ' CPS' : '— CPS');
  setEl('homeAimBest', aimBest !== null ? aimBest + ' pts' : '— pts');
  setEl('homeMemoryBest', memBest !== null ? 'Level ' + memBest : 'Level —');
  setEl('homeTypingBest', typeBest !== null ? typeBest + ' WPM' : '— WPM');
  setEl('homeNumberBest', numBest !== null ? numBest + ' digits' : '— digits');
  setEl('homeChimpBest', chimpBest !== null ? 'Level ' + chimpBest : 'Level —');
  setEl('homeColorBest', colorBest !== null ? colorBest + ' pts' : '— pts');
}

function setEl(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

/* ============================================================
   TOAST
   ============================================================ */

let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show' + (type ? ' toast-' + type : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function showLevelUp(level) {
  const overlay = document.getElementById('levelupOverlay');
  document.getElementById('levelupNum').textContent = level;
  overlay.classList.remove('hidden');
  document.getElementById('levelupClose').onclick = () => overlay.classList.add('hidden');
}

/* ============================================================
   RATING HELPER
   ============================================================ */

function getRating(type, value) {
  const ratings = {
    reaction: [
      { max: 150, label: 'GODLIKE', cls: 'rating-godlike' },
      { max: 180, label: 'ELITE', cls: 'rating-elite' },
      { max: 220, label: 'GREAT', cls: 'rating-great' },
      { max: 270, label: 'AVERAGE', cls: 'rating-average' },
      { max: Infinity, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    cps: [
      { min: 20, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 14, label: 'ELITE', cls: 'rating-elite' },
      { min: 9, label: 'GREAT', cls: 'rating-great' },
      { min: 5, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    aim: [
      { min: 800, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 550, label: 'ELITE', cls: 'rating-elite' },
      { min: 350, label: 'GREAT', cls: 'rating-great' },
      { min: 150, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    memory: [
      { min: 10, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 8, label: 'ELITE', cls: 'rating-elite' },
      { min: 6, label: 'GREAT', cls: 'rating-great' },
      { min: 4, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    typing: [
      { min: 130, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 90, label: 'ELITE', cls: 'rating-elite' },
      { min: 60, label: 'GREAT', cls: 'rating-great' },
      { min: 35, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    number: [
      { min: 12, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 9, label: 'ELITE', cls: 'rating-elite' },
      { min: 7, label: 'GREAT', cls: 'rating-great' },
      { min: 5, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    chimp: [
      { min: 12, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 9, label: 'ELITE', cls: 'rating-elite' },
      { min: 7, label: 'GREAT', cls: 'rating-great' },
      { min: 5, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ],
    color: [
      { min: 25, label: 'GODLIKE', cls: 'rating-godlike' },
      { min: 18, label: 'ELITE', cls: 'rating-elite' },
      { min: 12, label: 'GREAT', cls: 'rating-great' },
      { min: 6, label: 'AVERAGE', cls: 'rating-average' },
      { min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
    ]
  };

  const list = ratings[type] || [];
  for (const r of list) {
    if (type === 'reaction') {
      if (value < r.max) return r;
    } else {
      if (value >= r.min) return r;
    }
  }
  return { label: '—', cls: '' };
}

function applyRating(el, type, value) {
  if (!el) return;
  const r = getRating(type, value);
  el.textContent = r.label;
  el.className = 'result-rating ' + r.cls;
}

/* ============================================================
   SHARE HELPER
   ============================================================ */

function setupShare(btnId, boxId, inputId, copyBtnId, message) {
  const shareBtn = document.getElementById(btnId);
  const box = document.getElementById(boxId);
  const input = document.getElementById(inputId);
  const copyBtn = document.getElementById(copyBtnId);
  if (!shareBtn || !box || !input || !copyBtn) return;

  shareBtn.onclick = () => {
    input.value = message;
    box.classList.remove('hidden');
  };
  copyBtn.onclick = () => {
    input.select();
    document.execCommand('copy');
    showToast('Copied to clipboard! 📋', 'success');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => copyBtn.textContent = 'Copy', 2000);
  };
}

/* ============================================================
   TEST 1: REACTION TIME
   ============================================================ */

const ReactionTest = (() => {
  let state = 'idle';
  let rounds = [];
  let currentRound = 0;
  const TOTAL_ROUNDS = 5;
  let goTimeout, startTime;
  let isTrainingMode = false;

  const arena = document.getElementById('reactionArena');
  const reactMsg = document.getElementById('reactMsg');
  const reactSub = document.getElementById('reactSub');
  const reactRounds = document.getElementById('reactRounds');
  const results = document.getElementById('reactionResults');

  function setState(s) {
    state = s;
    arena.className = 'reaction-arena state-' + s;
  }

  function updateRoundDisplay() {
    if (reactRounds) reactRounds.textContent = `Round ${currentRound + 1} / ${TOTAL_ROUNDS}`;
  }

  function startRound() {
    setState('ready');
    if (reactMsg) reactMsg.textContent = 'WAIT...';
    if (reactSub) reactSub.textContent = "Don't click yet!";
    const diff = document.getElementById('reactionDifficulty')?.value || 'normal';
    const range = REACTION_DELAY[diff];
    const delay = range.min + Math.random() * (range.max - range.min);
    goTimeout = setTimeout(() => {
      if (state !== 'ready') return;
      setState('go');
      if (reactMsg) reactMsg.textContent = 'CLICK NOW!';
      if (reactSub) reactSub.textContent = '';
      startTime = performance.now();
    }, delay);
  }

  function handleClick() {
    if (state === 'idle') {
      currentRound = 0; rounds = [];
      isTrainingMode = document.getElementById('reactionMode')?.value === 'training';
      results.classList.add('hidden');
      arena.classList.remove('hidden');
      updateRoundDisplay();
      startRound();
      return;
    }
    if (state === 'ready') {
      clearTimeout(goTimeout);
      setState('toosoon');
      if (reactMsg) reactMsg.textContent = 'TOO SOON!';
      if (reactSub) reactSub.textContent = 'Wait for green before clicking';
      setTimeout(() => { if (isTrainingMode || currentRound < TOTAL_ROUNDS) startRound(); }, 1200);
      return;
    }
    if (state === 'go') {
      const rt = Math.round(performance.now() - startTime);
      rounds.push(rt);
      setState('clicked');
      if (reactMsg) reactMsg.textContent = rt + 'ms';
      if (reactSub) reactSub.textContent = getRating('reaction', rt).label;
      currentRound++;
      updateRoundDisplay();
      if (isTrainingMode || currentRound < TOTAL_ROUNDS) {
        setTimeout(() => { if (state === 'clicked') startRound(); }, 1000);
      } else {
        setTimeout(() => showResults(), 800);
      }
      return;
    }
  }

  function showResults() {
    setState('idle');
    results.classList.remove('hidden');
    const best = Math.min(...rounds);
    const avg = Math.round(rounds.reduce((a, b) => a + b, 0) / rounds.length);
    setEl('reactionTime', best);
    setEl('reactionAvg', `Average: ${avg}ms over ${rounds.length} rounds`);
    applyRating(document.getElementById('reactionRating'), 'reaction', best);
    const rd = document.getElementById('roundsDisplay');
    if (rd) rd.innerHTML = rounds.map((r) => `<span class="round-pill${r === best ? ' best' : ''}">${r}ms</span>`).join('');
    Storage.addHistory('reaction', best);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = best < 150 ? 50 : best < 200 ? 30 : best < 250 ? 20 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('reactionShare', 'reactionShareBox', 'reactionShareText', 'reactionCopyBtn',
      `⚡ I got ${best}ms reaction time on StatDungeon! Can you beat me? statdungeon.io`);
    document.getElementById('reactionRetry').onclick = () => {
      results.classList.add('hidden'); setState('idle');
      if (reactMsg) reactMsg.textContent = 'Click to Start';
      if (reactSub) reactSub.textContent = 'Wait for the screen to flash green';
    };
  }

  function init() {
    if (!arena) return;
    arena.addEventListener('click', handleClick);
    arena.addEventListener('touchend', (e) => { e.preventDefault(); handleClick(); });
  }

  return { init };
})();

/* ============================================================
   TEST 2: CPS TEST
   ============================================================ */

const CPSTest = (() => {
  let running = false, clicks = 0, startTime = null, duration = 5, rafId = null, endTimer = null;
  const CIRCUMFERENCE = 2 * Math.PI * 54;
  const btn = document.getElementById('cpsBtn');
  const btnText = document.getElementById('cpsBtnText');
  const cpsNum = document.getElementById('cpsNumber');
  const clickCount = document.getElementById('cpsClickCount');
  const timeLeft = document.getElementById('cpsTimeLeft');
  const ringFill = document.getElementById('cpsRingFill');
  const results = document.getElementById('cpsResults');

  function setRing(fraction) {
    if (!ringFill) return;
    ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);
  }

  function startTest() {
    duration = parseInt(document.getElementById('cpsDuration')?.value || '5');
    running = true; clicks = 0; startTime = performance.now();
    if (btnText) btnText.textContent = 'CLICKING...';
    btn.classList.add('active-state');
    results.classList.add('hidden');
    setRing(1);
    endTimer = setTimeout(() => finishTest(), duration * 1000);
    rafId = requestAnimationFrame(updateLoop);
  }

  function updateLoop() {
    if (!running) return;
    const elapsed = (performance.now() - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsed);
    const cps = elapsed > 0 ? (clicks / elapsed).toFixed(2) : '0.00';
    if (cpsNum) cpsNum.textContent = cps;
    if (clickCount) clickCount.textContent = clicks;
    if (timeLeft) timeLeft.textContent = remaining.toFixed(1);
    setRing(remaining / duration);
    rafId = requestAnimationFrame(updateLoop);
  }

  function finishTest() {
    running = false;
    cancelAnimationFrame(rafId);
    clearTimeout(endTimer);
    const finalCps = (clicks / duration);
    if (cpsNum) cpsNum.textContent = finalCps.toFixed(2);
    if (timeLeft) timeLeft.textContent = '0.0';
    if (btnText) btnText.textContent = 'CLICK TO RETRY';
    btn.classList.remove('active-state');
    results.classList.remove('hidden');
    setEl('cpsFinalScore', finalCps.toFixed(2));
    setEl('cpsTotalClicks', clicks + ' total clicks in ' + duration + 's');
    applyRating(document.getElementById('cpsRating'), 'cps', finalCps);
    Storage.addHistory('cps', parseFloat(finalCps.toFixed(2)));
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = finalCps >= 14 ? 50 : finalCps >= 9 ? 30 : finalCps >= 5 ? 20 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('cpsShare', 'cpsShareBox', 'cpsShareText', 'cpsCopyBtn',
      `🖱 I got ${finalCps.toFixed(2)} CPS (${clicks} clicks in ${duration}s) on StatDungeon! statdungeon.io`);
    document.getElementById('cpsRetry').onclick = () => {
      results.classList.add('hidden');
      if (btnText) btnText.textContent = 'CLICK TO START';
      if (cpsNum) cpsNum.textContent = '0.00';
      if (clickCount) clickCount.textContent = '0';
      if (timeLeft) timeLeft.textContent = duration + '.0';
      setRing(1); clicks = 0;
    };
  }

  function handleClick(e) {
    const ripple = document.getElementById('cpsRipple');
    if (ripple) {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top;
      ripple.style.left = (x - 5) + 'px'; ripple.style.top = (y - 5) + 'px';
      ripple.style.animation = 'none'; void ripple.offsetWidth;
      ripple.style.animation = 'ripple 0.4s ease forwards';
    }
    if (!running) startTest(); else clicks++;
  }

  function init() {
    if (!btn) return;
    btn.addEventListener('click', handleClick);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleClick(e); }, { passive: false });
  }

  return { init };
})();

/* ============================================================
   TEST 3: AIM TRAINER
   ============================================================ */

const AimTrainer = (() => {
  let running = false, score = 0, hits = 0, misses = 0, timeLeft = 30, timings = [], lastTargetTime = null, targetEl = null, timerInterval = null;
  const arena = document.getElementById('aimArena');
  const results = document.getElementById('aimResults');
  const DIFFICULTY_CONFIG = {
    easy:   { size: 70, lifespan: 3000, interval: [800, 1400] },
    normal: { size: 50, lifespan: 2000, interval: [600, 1000] },
    hard:   { size: 35, lifespan: 1500, interval: [400, 700] },
    insane: { size: 22, lifespan: 1000, interval: [250, 500] }
  };

  function getDiff() { return DIFFICULTY_CONFIG[document.getElementById('aimDifficulty')?.value || 'normal']; }

  function spawnTarget() {
    if (!running) return;
    if (targetEl) targetEl.remove();
    const conf = getDiff();
    const scale = Math.max(0.5, 1 - (score / 2000) * 0.3);
    const size = Math.round(conf.size * scale);
    const arenaRect = arena.getBoundingClientRect();
    const margin = size / 2 + 10;
    const x = margin + Math.random() * (arenaRect.width - margin * 2);
    const y = margin + Math.random() * (arenaRect.height - margin * 2);
    targetEl = document.createElement('div');
    targetEl.className = 'aim-target';
    targetEl.style.cssText = `width:${size}px;height:${size}px;left:${x - size/2}px;top:${y - size/2}px`;
    lastTargetTime = performance.now();
    targetEl.addEventListener('click', hitTarget);
    targetEl.addEventListener('touchstart', (e) => { e.preventDefault(); hitTarget(e); }, { passive: false });
    arena.appendChild(targetEl);
    setTimeout(() => {
      if (targetEl && document.contains(targetEl)) {
        targetEl.remove(); targetEl = null; misses++;
        updateAimHud();
        const flash = document.createElement('div');
        flash.className = 'miss-flash';
        arena.appendChild(flash);
        setTimeout(() => flash.remove(), 200);
        scheduleNextTarget();
      }
    }, conf.lifespan);
  }

  function scheduleNextTarget() {
    if (!running) return;
    const conf = getDiff();
    const [min, max] = conf.interval;
    setTimeout(() => { if (running) spawnTarget(); }, min + Math.random() * (max - min));
  }

  function hitTarget() {
    if (!running || !targetEl) return;
    const rt = Math.round(performance.now() - lastTargetTime);
    timings.push(rt);
    hits++;
    score += 10 + Math.max(0, Math.round((2000 - rt) / 100));
    const rect = targetEl.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.style.left = (rect.left - arenaRect.left + rect.width / 2) + 'px';
    effect.style.top = (rect.top - arenaRect.top + rect.height / 2) + 'px';
    arena.appendChild(effect);
    setTimeout(() => effect.remove(), 300);
    targetEl.remove(); targetEl = null;
    updateAimHud();
    scheduleNextTarget();
  }

  function updateAimHud() {
    setEl('aimScore', score); setEl('aimHits', hits);
    const total = hits + misses;
    setEl('aimAccuracy', (total > 0 ? Math.round((hits / total) * 100) : 0) + '%');
  }

  function startTest() {
    running = true; score = 0; hits = 0; misses = 0; timings = []; timeLeft = 30; targetEl = null;
    document.getElementById('aimStartOverlay')?.remove();
    updateAimHud(); results.classList.add('hidden');
    spawnTarget();
    timerInterval = setInterval(() => {
      timeLeft--; setEl('aimTime', timeLeft);
      if (timeLeft <= 0) finishTest();
    }, 1000);
  }

  function finishTest() {
    running = false; clearInterval(timerInterval);
    if (targetEl) { targetEl.remove(); targetEl = null; }
    const total = hits + misses;
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0;
    const avgTime = timings.length > 0 ? Math.round(timings.reduce((a,b) => a+b,0) / timings.length) : 0;
    results.classList.remove('hidden');
    setEl('aimFinalScore', score); applyRating(document.getElementById('aimRating'), 'aim', score);
    setEl('aimResHits', hits); setEl('aimResMisses', misses);
    setEl('aimResAccuracy', accuracy + '%'); setEl('aimResAvgTime', avgTime + 'ms');
    Storage.addHistory('aim', score);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = score >= 800 ? 50 : score >= 400 ? 30 : score >= 150 ? 20 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('aimShare', 'aimShareBox', 'aimShareText', 'aimCopyBtn',
      `🎯 I scored ${score} pts (${accuracy}% accuracy) in Aim Trainer on StatDungeon! statdungeon.io`);
    document.getElementById('aimRetry').onclick = () => {
      results.classList.add('hidden');
      const overlay = document.createElement('div');
      overlay.id = 'aimStartOverlay'; overlay.className = 'aim-start-overlay';
      overlay.innerHTML = `<div class="aim-start-icon">🎯</div><div class="aim-start-title">Aim Trainer</div>
        <div class="aim-start-sub">Click targets as fast as possible<br/>30 seconds, difficulty ramps up</div>
        <button class="btn-primary btn-large" id="aimStartBtn">Start Training</button>`;
      arena.appendChild(overlay);
      document.getElementById('aimStartBtn').onclick = startTest;
      setEl('aimScore', 0); setEl('aimTime', 30); setEl('aimAccuracy', '—'); setEl('aimHits', 0);
    };
  }

  function init() {
    if (!arena) return;
    const startBtn = document.getElementById('aimStartBtn');
    if (startBtn) startBtn.onclick = startTest;
    arena.addEventListener('click', (e) => { if (!running) return; if (e.target === arena) { misses++; updateAimHud(); } });
  }

  return { init };
})();

/* ============================================================
   TEST 4: MEMORY TEST
   ============================================================ */

const MemoryTest = (() => {
  let level = 1, sequence = [], playerSeq = [], phase = 'idle', tiles = [];
  const GRID_SIZE = 9;
  const grid = document.getElementById('memoryGrid');
  const results = document.getElementById('memoryResults');
  const startBtn = document.getElementById('memStartBtn');
  const controls = document.getElementById('memoryControls');

  function buildGrid() {
    if (!grid) return;
    grid.innerHTML = ''; tiles = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const tile = document.createElement('div');
      tile.className = 'mem-tile disabled';
      tile.dataset.index = i;
      tile.addEventListener('click', () => handleTileClick(i));
      tile.addEventListener('touchstart', (e) => { e.preventDefault(); handleTileClick(i); }, { passive: false });
      grid.appendChild(tile); tiles.push(tile);
    }
  }

  function generateSequence() {
    sequence = [];
    for (let i = 0; i < level + 2; i++) sequence.push(Math.floor(Math.random() * GRID_SIZE));
  }

  async function showSequence() {
    phase = 'showing'; setEl('memMsg', 'Watch the sequence...'); setTilesDisabled(true); await sleep(500);
    for (const idx of sequence) await flashTile(idx, 600, 400);
    await sleep(300); phase = 'input'; playerSeq = []; setEl('memMsg', 'Your turn! Repeat it.'); setTilesDisabled(false);
  }

  async function flashTile(idx, onMs, offMs) {
    tiles[idx].classList.add('active'); await sleep(onMs); tiles[idx].classList.remove('active'); await sleep(offMs);
  }

  function setTilesDisabled(disabled) {
    tiles.forEach(t => { if (disabled) t.classList.add('disabled'); else t.classList.remove('disabled'); });
  }

  async function handleTileClick(idx) {
    if (phase !== 'input') return;
    tiles[idx].classList.add('active');
    setTimeout(() => tiles[idx].classList.remove('active'), 300);
    playerSeq.push(idx);
    const pos = playerSeq.length - 1;
    if (playerSeq[pos] !== sequence[pos]) {
      tiles[idx].classList.add('wrong'); phase = 'idle'; setTilesDisabled(true); await sleep(600); gameOver(); return;
    }
    if (playerSeq.length === sequence.length) {
      tiles.forEach(t => t.classList.add('correct')); setEl('memMsg', `Level ${level} Complete! ✓`);
      phase = 'idle'; setTilesDisabled(true); await sleep(900);
      tiles.forEach(t => t.classList.remove('correct'));
      level++; setEl('memLevel', level); generateSequence(); await showSequence();
    }
  }

  function gameOver() {
    const reached = level;
    const best = Math.max(reached, Storage.get('memory_best', 0));
    Storage.set('memory_best', best);
    results.classList.remove('hidden');
    if (controls) controls.classList.add('hidden');
    setEl('memFinalLevel', reached); applyRating(document.getElementById('memRating'), 'memory', reached);
    Storage.addHistory('memory', reached);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = reached >= 10 ? 50 : reached >= 8 ? 40 : reached >= 6 ? 25 : reached >= 4 ? 15 : 10;
    XPSystem.addXP(xpEarned); showToast(`+${xpEarned} XP earned!`, 'success'); setEl('memBest', best);
    setupShare('memShare', 'memShareBox', 'memShareText', 'memCopyBtn',
      `🧠 I reached Level ${reached} in Memory Test on StatDungeon! Can you beat me? statdungeon.io`);
    document.getElementById('memRetry').onclick = () => {
      results.classList.add('hidden'); if (controls) controls.classList.remove('hidden');
      level = 1; setEl('memLevel', 1); setEl('memMsg', 'Watch the sequence...');
      tiles.forEach(t => { t.className = 'mem-tile disabled'; });
    };
  }

  async function startGame() {
    if (controls) controls.classList.add('hidden');
    results.classList.add('hidden'); level = 1; setEl('memLevel', 1);
    setEl('memBest', Storage.get('memory_best', 0));
    buildGrid(); generateSequence(); await showSequence();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function init() { buildGrid(); if (startBtn) startBtn.onclick = startGame; }

  return { init };
})();

/* ============================================================
   TEST 5: TYPING SPEED
   ============================================================ */

const TypingTest = (() => {
  let started = false, finished = false, startTime = null, timerInterval = null;
  let duration = 60, totalTyped = 0, errors = 0, currentWords = [], wordIndex = 0, charIndex = 0;

  const promptEl = document.getElementById('typePrompt');
  const inputEl = document.getElementById('typeInput');
  const results = document.getElementById('typingResults');

  function getWordList() {
    const mode = document.getElementById('typingMode')?.value || 'words';
    if (mode === 'sentences') return null;
    if (mode === 'numbers') return WORD_BANKS.numbers[Math.floor(Math.random() * WORD_BANKS.numbers.length)].split(' ');
    if (mode === 'code') return WORD_BANKS.code[Math.floor(Math.random() * WORD_BANKS.code.length)].split(' ');
    const bank = WORD_BANKS.words;
    const picked = [];
    for (let i = 0; i < 80; i++) picked.push(bank[Math.floor(Math.random() * bank.length)]);
    return picked;
  }

  function getSentenceText() {
    const sentences = WORD_BANKS.sentences;
    let text = '';
    while (text.length < 300) {
      text += (text ? ' ' : '') + sentences[Math.floor(Math.random() * sentences.length)];
    }
    return text;
  }

  function setupTest() {
    duration = parseInt(document.getElementById('typingDuration')?.value || '60');
    const mode = document.getElementById('typingMode')?.value || 'words';
    totalTyped = 0; errors = 0; wordIndex = 0; charIndex = 0;
    started = false; finished = false;
    if (mode === 'sentences') {
      currentWords = getSentenceText().split('');
    } else {
      currentWords = getWordList();
    }
    if (inputEl) { inputEl.value = ''; inputEl.disabled = false; }
    if (timerInterval) clearInterval(timerInterval);
    setEl('typeTimer', duration); setEl('typeWpm', 0); setEl('typeAccuracy', '100%'); setEl('typeErrors', 0);
    results.classList.add('hidden');
    renderWordPrompt();
  }

  function renderWordPrompt() {
    if (!promptEl) return;
    const mode = document.getElementById('typingMode')?.value || 'words';
    if (mode === 'sentences') {
      const text = currentWords.join('');
      promptEl.innerHTML = text.split('').map((ch, i) => {
        let cls = i < charIndex ? 'char-correct' : i === charIndex ? 'char-current' : 'char-pending';
        return `<span class="${cls}">${ch === ' ' ? '&nbsp;' : ch}</span>`;
      }).join('');
      return;
    }
    promptEl.innerHTML = currentWords.map((word, wi) => {
      if (wi < wordIndex) return `<span class="word-done">${word}</span> `;
      if (wi === wordIndex) {
        return '<span class="word-current">' + word.split('').map((ch, ci) => {
          let cls = ci < charIndex ? 'char-correct' : ci === charIndex ? 'char-current' : 'char-pending';
          return `<span class="${cls}">${ch}</span>`;
        }).join('') + '</span> ';
      }
      return `<span class="word-pending">${word}</span> `;
    }).join('');
    const currentWordEl = promptEl.querySelector('.word-current');
    if (currentWordEl) {
      const topOffset = currentWordEl.offsetTop;
      if (topOffset > 60) promptEl.scrollTop = topOffset - 20;
    }
  }

  function calcWPM() {
    if (!startTime) return 0;
    const elapsed = (performance.now() - startTime) / 60000;
    const words = totalTyped / 5;
    return elapsed > 0 ? Math.round(words / elapsed) : 0;
  }

  function handleInput(e) {
    if (finished) return;
    const mode = document.getElementById('typingMode')?.value || 'words';
    if (!started) {
      started = true; startTime = performance.now();
      let timeLeft = duration;
      timerInterval = setInterval(() => {
        timeLeft--; setEl('typeTimer', timeLeft); setEl('typeWpm', calcWPM());
        if (timeLeft <= 0) finishTest();
      }, 1000);
    }
    const val = inputEl.value;
    if (mode === 'sentences') {
      const lastChar = val[val.length - 1];
      const expected = currentWords[charIndex];
      if (lastChar === expected) { charIndex++; totalTyped++; }
      else if (lastChar !== undefined) { errors++; totalTyped++; }
      if (val.length > 40) inputEl.value = '';
      if (charIndex >= currentWords.length) { currentWords = getSentenceText().split(''); charIndex = 0; inputEl.value = ''; }
    } else {
      if (val.endsWith(' ')) {
        const typed = val.trim();
        const expected = currentWords[wordIndex] || '';
        totalTyped += expected.length + 1;
        for (let i = 0; i < Math.max(typed.length, expected.length); i++) {
          if (typed[i] !== expected[i]) errors++;
        }
        wordIndex++; charIndex = 0; inputEl.value = '';
        if (wordIndex >= currentWords.length - 10) {
          const bank = WORD_BANKS.words;
          for (let i = 0; i < 20; i++) currentWords.push(bank[Math.floor(Math.random() * bank.length)]);
        }
      } else {
        charIndex = val.length;
      }
    }
    const acc = totalTyped > 0 ? Math.round((1 - errors / totalTyped) * 100) : 100;
    setEl('typeAccuracy', acc + '%'); setEl('typeErrors', errors); setEl('typeWpm', calcWPM());
    renderWordPrompt();
  }

  function finishTest() {
    finished = true; clearInterval(timerInterval);
    if (inputEl) inputEl.disabled = true;
    const wpm = calcWPM();
    const acc = totalTyped > 0 ? Math.round((1 - errors / totalTyped) * 100) : 100;
    const words = Math.round(totalTyped / 5); const chars = totalTyped;
    results.classList.remove('hidden');
    setEl('typeFinalWpm', wpm); applyRating(document.getElementById('typeRating'), 'typing', wpm);
    setEl('typeResAccuracy', acc + '%'); setEl('typeResWords', words); setEl('typeResChars', chars); setEl('typeResErrors', errors);
    Storage.addHistory('typing', wpm);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = wpm >= 130 ? 50 : wpm >= 90 ? 35 : wpm >= 60 ? 25 : wpm >= 35 ? 15 : 10;
    XPSystem.addXP(xpEarned); showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('typeShare', 'typeShareBox', 'typeShareText', 'typeCopyBtn',
      `⌨️ I typed ${wpm} WPM with ${acc}% accuracy on StatDungeon! statdungeon.io`);
    document.getElementById('typeRetry').onclick = () => { setupTest(); if (inputEl) inputEl.focus(); };
  }

  function init() {
    if (!inputEl) return;
    setupTest();
    inputEl.addEventListener('input', handleInput);
    document.getElementById('typingDuration')?.addEventListener('change', setupTest);
    document.getElementById('typingMode')?.addEventListener('change', setupTest);
  }

  return { init, setupTest };
})();

/* ============================================================
   TEST 6: NUMBER MEMORY
   ============================================================ */

const NumberMemory = (() => {
  let level = 1, currentNumber = '', phase = 'idle';
  const arena = document.getElementById('numberArena');
  const displayArea = document.getElementById('numDisplayArea');
  const inputArea = document.getElementById('numInputArea');
  const results = document.getElementById('numberResults');

  function generateNumber(digits) {
    let num = '';
    for (let i = 0; i < digits; i++) num += i === 0 ? (Math.floor(Math.random() * 9) + 1) : Math.floor(Math.random() * 10);
    return num;
  }

  async function startRound() {
    if (inputArea) inputArea.classList.add('hidden');
    if (results) results.classList.add('hidden');
    currentNumber = generateNumber(level + 2);
    phase = 'showing';
    const showDuration = Math.min(1000 + (level + 2) * 500, 6000);
    displayArea.innerHTML = `
      <div class="num-flash-wrapper">
        <div class="num-countdown" id="numCountdown">GET READY</div>
        <div class="num-flash-number hidden" id="numFlashNumber">${currentNumber}</div>
        <div class="num-timer-bar"><div class="num-timer-fill" id="numTimerFill"></div></div>
      </div>`;
    await sleep(800);
    const countEl = document.getElementById('numCountdown');
    const numEl = document.getElementById('numFlashNumber');
    const fillEl = document.getElementById('numTimerFill');
    if (countEl) countEl.classList.add('hidden');
    if (numEl) numEl.classList.remove('hidden');
    if (fillEl) {
      fillEl.style.transition = `width ${showDuration}ms linear`;
      fillEl.style.width = '100%';
      requestAnimationFrame(() => { requestAnimationFrame(() => { fillEl.style.width = '0%'; }); });
    }
    await sleep(showDuration);
    if (numEl) numEl.textContent = '?'.repeat(currentNumber.length);
    phase = 'input';
    displayArea.innerHTML = `<div class="num-flash-wrapper"><div class="num-flash-number blurred">${'?'.repeat(currentNumber.length)}</div></div>`;
    if (inputArea) {
      inputArea.classList.remove('hidden');
      const numInput = document.getElementById('numInput');
      if (numInput) { numInput.value = ''; numInput.focus(); }
    }
  }

  function submitAnswer() {
    if (phase !== 'input') return;
    const inputEl = document.getElementById('numInput');
    const typed = (inputEl?.value || '').trim();
    if (typed === currentNumber) {
      level++;
      setEl('numLevel', level);
      showToast('✓ Correct! Next level...', 'success');
      displayArea.innerHTML = `<div class="num-flash-wrapper"><div class="num-correct-flash">✓ ${currentNumber}</div></div>`;
      setTimeout(() => startRound(), 1000);
    } else {
      displayArea.innerHTML = `<div class="num-flash-wrapper">
        <div class="num-wrong-flash">✗ ${currentNumber}</div>
        <div class="num-wrong-sub">You typed: ${typed || '(nothing)'}</div>
      </div>`;
      if (inputArea) inputArea.classList.add('hidden');
      setTimeout(() => gameOver(), 1200);
    }
  }

  function gameOver() {
    const digits = level + 1;
    const best = Math.max(digits, Storage.get('number_best', 0));
    Storage.set('number_best', best);
    results.classList.remove('hidden');
    displayArea.innerHTML = `<div class="num-flash-wrapper"><div class="num-start-icon">🔢</div></div>`;
    setEl('numFinalLevel', digits);
    applyRating(document.getElementById('numRating'), 'number', digits);
    setEl('numBestDisplay', best);
    Storage.addHistory('number', digits);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = digits >= 12 ? 50 : digits >= 9 ? 35 : digits >= 7 ? 25 : digits >= 5 ? 15 : 10;
    XPSystem.addXP(xpEarned); showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('numShare', 'numShareBox', 'numShareText', 'numCopyBtn',
      `🔢 I memorized a ${digits}-digit number on StatDungeon! Can you beat me? statdungeon.io`);
    document.getElementById('numRetry').onclick = () => {
      results.classList.add('hidden');
      level = 1; setEl('numLevel', 1);
      displayArea.innerHTML = `<div class="num-start-overlay" id="numStartOverlay">
        <div class="num-start-icon">🔢</div>
        <div class="num-start-title">Number Memory</div>
        <div class="num-start-sub">A number will flash on screen.<br/>Memorize it, then type it back.</div>
        <button class="btn-primary btn-large" id="numStartBtn">Start Test</button></div>`;
      document.getElementById('numStartBtn').onclick = () => startRound();
    };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function init() {
    document.getElementById('numStartBtn')?.addEventListener('click', () => startRound());
    document.getElementById('numSubmitBtn')?.addEventListener('click', submitAnswer);
    document.getElementById('numInput')?.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAnswer(); });
  }

  return { init };
})();

/* ============================================================
   TEST 7: CHIMP TEST
   ============================================================ */

const ChimpTest = (() => {
  let numCount = 4, lives = 3, nextToClick = 1, numbers = [], phase = 'idle';
  const arena = document.getElementById('chimpArena');
  const results = document.getElementById('chimpResults');
  const GRID_W = 5, GRID_H = 4;

  function renderLives() {
    setEl('chimpLives', '❤️'.repeat(lives) + '🖤'.repeat(Math.max(0, 3 - lives)));
  }

  function buildRound() {
    phase = 'showing';
    numbers = [];
    const cells = new Set();
    while (cells.size < numCount) cells.add(Math.floor(Math.random() * GRID_W * GRID_H));
    const positions = [...cells];
    let gridHTML = '<div class="chimp-grid">';
    const numArr = Array.from({length: numCount}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    for (let i = 0; i < GRID_W * GRID_H; i++) {
      const posIdx = positions.indexOf(i);
      if (posIdx >= 0) {
        const n = numArr[posIdx];
        numbers.push({ num: n, cell: i });
        gridHTML += `<div class="chimp-cell has-num" data-num="${n}">${n}</div>`;
      } else {
        gridHTML += `<div class="chimp-cell"></div>`;
      }
    }
    gridHTML += '</div>';
    arena.innerHTML = gridHTML;
    setTimeout(() => {
      if (phase !== 'showing') return;
      arena.querySelectorAll('.chimp-cell.has-num').forEach(el => el.textContent = '');
      phase = 'clicking';
      nextToClick = 1;
    }, Math.max(800, 1500 - (numCount - 4) * 100));
  }

  function handleCellClick(e) {
    const cell = e.target.closest('.chimp-cell');
    if (!cell || phase !== 'clicking') return;
    const num = parseInt(cell.dataset.num);
    if (isNaN(num)) { wrongClick(); return; }
    if (num === nextToClick) {
      cell.classList.add('chimp-correct');
      cell.textContent = num;
      nextToClick++;
      if (nextToClick > numCount) { numCount++; setEl('chimpLevel', numCount); setTimeout(() => buildRound(), 600); }
    } else {
      cell.classList.add('chimp-wrong');
      cell.textContent = num;
      wrongClick();
    }
  }

  function wrongClick() {
    lives--; renderLives();
    if (lives <= 0) { setTimeout(() => gameOver(), 500); }
    else { showToast('Wrong! ' + lives + ' lives left', 'error'); setTimeout(() => buildRound(), 800); }
  }

  function gameOver() {
    phase = 'idle';
    const reached = numCount - 1;
    const best = Math.max(reached, Storage.get('chimp_best', 0));
    Storage.set('chimp_best', best);
    results.classList.remove('hidden');
    setEl('chimpFinalLevel', reached); setEl('chimpBestDisplay', best);
    applyRating(document.getElementById('chimpRating'), 'chimp', reached);
    Storage.addHistory('chimp', reached);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = reached >= 12 ? 50 : reached >= 9 ? 40 : reached >= 7 ? 25 : reached >= 5 ? 15 : 10;
    XPSystem.addXP(xpEarned); showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('chimpShare', 'chimpShareBox', 'chimpShareText', 'chimpCopyBtn',
      `🐒 I reached ${reached} numbers in the Chimp Test on StatDungeon! statdungeon.io`);
    document.getElementById('chimpRetry').onclick = () => {
      results.classList.add('hidden'); numCount = 4; lives = 3;
      setEl('chimpLevel', numCount); renderLives();
      arena.innerHTML = `<div class="chimp-start-overlay" id="chimpStartOverlay">
        <div class="chimp-start-icon">🐒</div><div class="chimp-start-title">Chimp Test</div>
        <div class="chimp-start-sub">Numbers flash on screen.<br/>Click them in ascending order.</div>
        <button class="btn-primary btn-large" id="chimpStartBtn">Begin</button></div>`;
      document.getElementById('chimpStartBtn').onclick = () => { arena.innerHTML = ''; buildRound(); };
    };
  }

  function init() {
    document.getElementById('chimpStartBtn')?.addEventListener('click', () => { arena.innerHTML = ''; buildRound(); });
    arena.addEventListener('click', handleCellClick);
  }

  return { init };
})();

/* ============================================================
   TEST 8: COLOR REFLEX
   ============================================================ */

const ColorReflex = (() => {
  const COLORS = [
    { name: 'RED', hex: '#ff4757' },
    { name: 'BLUE', hex: '#00c8ff' },
    { name: 'GREEN', hex: '#00ffaa' },
    { name: 'YELLOW', hex: '#ffd700' },
    { name: 'PINK', hex: '#ff6eb4' },
    { name: 'ORANGE', hex: '#ff6a00' }
  ];

  let score = 0, streak = 0, bestStreak = 0, correct = 0, wrong = 0, timeLeft = 30, timerInterval = null, running = false;
  let currentWord = '', inkColor = '';
  const game = document.getElementById('colorGame');
  const results = document.getElementById('colorResults');

  function generateRound() {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    let inkIdx;
    do { inkIdx = Math.floor(Math.random() * COLORS.length); } while (inkIdx === wordIdx && Math.random() < 0.7);
    currentWord = COLORS[wordIdx].name;
    inkColor = COLORS[inkIdx].hex;
    const wordEl = document.getElementById('colorWordDisplay');
    if (wordEl) { wordEl.textContent = currentWord; wordEl.style.color = inkColor; }
    const correctColor = COLORS.find(c => c.name === currentWord);
    const others = COLORS.filter(c => c.name !== currentWord);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const options = [...shuffled, correctColor].sort(() => Math.random() - 0.5);
    const btns = document.getElementById('colorButtons');
    if (btns) {
      btns.innerHTML = options.map(c =>
        `<button class="color-btn" data-color="${c.name}" style="background:${c.hex}">${c.name}</button>`
      ).join('');
    }
  }

  function handleAnswer(e) {
    const btn = e.target.closest('.color-btn');
    if (!btn || !running) return;
    const chosen = btn.dataset.color;
    if (chosen === currentWord) {
      correct++; streak++;
      if (streak > bestStreak) bestStreak = streak;
      score += 1 + Math.floor(streak / 3);
      btn.classList.add('color-btn-correct');
      setEl('colorScore', score); setEl('colorStreak', streak); setEl('colorBestStreak', bestStreak);
      setTimeout(() => generateRound(), 150);
    } else {
      wrong++; streak = 0; score = Math.max(0, score - 1);
      btn.classList.add('color-btn-wrong');
      document.querySelectorAll('.color-btn').forEach(b => { if (b.dataset.color === currentWord) b.classList.add('color-btn-correct'); });
      setEl('colorScore', score); setEl('colorStreak', streak);
      setTimeout(() => generateRound(), 400);
    }
  }

  function startGame() {
    score = 0; streak = 0; bestStreak = 0; correct = 0; wrong = 0; timeLeft = 30; running = true;
    document.getElementById('colorStartOverlay')?.classList.add('hidden');
    game.classList.remove('hidden');
    setEl('colorScore', 0); setEl('colorTimer', 30); setEl('colorStreak', 0); setEl('colorBestStreak', 0);
    generateRound();
    timerInterval = setInterval(() => {
      timeLeft--; setEl('colorTimer', timeLeft);
      if (timeLeft <= 0) finishGame();
    }, 1000);
  }

  function finishGame() {
    running = false; clearInterval(timerInterval);
    game.classList.add('hidden');
    results.classList.remove('hidden');
    setEl('colorFinalScore', score); applyRating(document.getElementById('colorRating'), 'color', score);
    setEl('colorResCorrect', correct); setEl('colorResWrong', wrong); setEl('colorResBestStreak', bestStreak);
    Storage.addHistory('color', score);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = score >= 25 ? 50 : score >= 18 ? 35 : score >= 12 ? 25 : score >= 6 ? 15 : 10;
    XPSystem.addXP(xpEarned); showToast(`+${xpEarned} XP earned!`, 'success');
    setupShare('colorShare', 'colorShareBox', 'colorShareText', 'colorCopyBtn',
      `🎨 I scored ${score} in Color Reflex on StatDungeon! (${correct} correct, best streak ${bestStreak}) statdungeon.io`);
    document.getElementById('colorRetry').onclick = () => {
      results.classList.add('hidden');
      document.getElementById('colorStartOverlay')?.classList.remove('hidden');
      setEl('colorScore', 0); setEl('colorTimer', 30); setEl('colorStreak', 0); setEl('colorBestStreak', 0);
    };
  }

  function init() {
    document.getElementById('colorStartBtn')?.addEventListener('click', startGame);
    document.getElementById('colorButtons')?.addEventListener('click', handleAnswer);
    document.getElementById('colorArena')?.addEventListener('click', (e) => { if (running) handleAnswer(e); });
  }

  return { init };
})();

/* ============================================================
   DASHBOARD
   ============================================================ */

function refreshDashboard() {
  updateHUD();
  const tests = ['reaction', 'cps', 'aim', 'memory', 'typing', 'number', 'chimp', 'color'];
  const units = { reaction: 'ms', cps: ' CPS', aim: ' pts', memory: '', typing: ' WPM', number: ' digits', chimp: '', color: ' pts' };
  const prefixes = { memory: 'Level ', chimp: 'Level ' };

  tests.forEach(test => {
    const hist = Storage.get(test + '_hist', []);
    const best = Storage.get(test + '_best', null);
    const unit = units[test] || '';
    const prefix = prefixes[test] || '';
    const bestEl = document.getElementById('dash' + capitalize(test) + 'Best');
    if (bestEl) bestEl.textContent = best !== null ? prefix + best + unit : '—';
    const avgEl = document.getElementById('dash' + capitalize(test) + 'Avg');
    if (avgEl && hist.length > 0) {
      const avg = hist.reduce((a, b) => a + b.score, 0) / hist.length;
      avgEl.textContent = 'Avg: ' + prefix + (test === 'reaction' ? Math.round(avg) : avg.toFixed(1)) + unit;
    }
    const histEl = document.getElementById('dash' + capitalize(test) + 'History');
    if (histEl && hist.length > 0) {
      const scores = hist.map(h => h.score);
      const maxVal = Math.max(...scores), minVal = Math.min(...scores);
      const range = maxVal - minVal || 1;
      histEl.innerHTML = scores.map(s => {
        const frac = test === 'reaction' ? 1 - (s - minVal) / range : (s - minVal) / range;
        const h = Math.max(4, Math.round(frac * 30));
        return `<div class="hist-bar" style="height:${h}px" title="${s}${unit}"></div>`;
      }).join('');
    }
  });

  setEl('dashTotalXp', XPSystem.getXP() + ' XP');
  setEl('dashTestCount', Storage.get('tests_count', 0) + ' tests completed');
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

/* ============================================================
   RESET ALL DATA
   ============================================================ */

document.getElementById('resetAllData')?.addEventListener('click', () => {
  if (!confirm('Reset all your data? This cannot be undone.')) return;
  ['xp', 'streak', 'last_visit', 'tests_count',
   'reaction_best', 'cps_best', 'aim_best', 'memory_best', 'typing_best', 'number_best', 'chimp_best', 'color_best',
   'reaction_hist', 'cps_hist', 'aim_hist', 'memory_hist', 'typing_hist', 'number_hist', 'chimp_hist', 'color_hist'
  ].forEach(k => localStorage.removeItem('rz_' + k));
  updateHUD(); updateHomeBests(); refreshDashboard();
  showToast('All data reset.', '');
});

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  DungeonCanvas.init();
  StreakSystem.check();
  updateHUD();
  updateHomeBests();
  initNavigation();
  initThemes();
  ReactionTest.init();
  CPSTest.init();
  AimTrainer.init();
  MemoryTest.init();
  TypingTest.init();
  NumberMemory.init();
  ChimpTest.init();
  ColorReflex.init();

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') navigateTo('home');
  });

  console.log('%c⚔️ StatDungeon v1 loaded', 'color: #c8a020; font-size: 16px; font-weight: bold;');
});
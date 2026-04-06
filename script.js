/* ============================================================
   REFLEXZONE — HUMAN BENCHMARK PLATFORM
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

const TYPING_PARAGRAPHS = [
  "The quick brown fox jumps over the lazy dog near the riverbank where children play every afternoon during the long summer months.",
  "Gaming requires split-second decisions and precise muscle memory built through thousands of hours of deliberate practice and reflection.",
  "Reaction time is the interval between a stimulus and the initiation of a response. Elite athletes train this skill daily.",
  "Speed and accuracy must work together. A fast typist who makes many errors is slower than a careful one who rarely backtracks.",
  "The human brain can process a visual signal in as little as 100 milliseconds, but translating that into action takes longer.",
  "Competitive gaming demands consistent performance under pressure. Mental training is just as important as mechanical skill.",
  "Every millisecond counts when you are at the top of the leaderboard. Train smart, rest well, and compete with focus.",
  "Aim trainers help build muscle memory for mouse control. Just fifteen minutes of daily practice shows results within two weeks.",
  "Working memory determines how much information you can hold and manipulate at once. It is trainable with the right exercises.",
  "Discipline beats motivation every time. Show up every day, track your progress, and the improvements will come inevitably."
];

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
  // Add a score to a test's history (max MAX_HISTORY entries)
  addHistory(test, score) {
    const hist = this.get(test + '_hist', []);
    hist.unshift({ score, ts: Date.now() });
    if (hist.length > MAX_HISTORY) hist.pop();
    this.set(test + '_hist', hist);
    // Update personal best
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
    if (newLevel > prevLevel) {
      showLevelUp(newLevel);
    }
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
  // Update nav link active states
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  // Close mobile menu
  document.getElementById('mobileMenu').classList.remove('open');
  document.getElementById('navToggle').classList.remove('open');
  // Update home cards with latest bests
  updateHomeBests();
}

// Section ID map
const NAV_MAP = {
  home: 'home',
  reaction: 'reaction-time',
  cps: 'cps-test',
  aim: 'aim-trainer',
  memory: 'memory-test',
  typing: 'typing-speed',
  dashboard: 'dashboard'
};

function initNavigation() {
  // All elements with data-nav attribute
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-nav]');
    if (!el) return;
    e.preventDefault();
    const nav = el.dataset.nav;
    const sectionId = NAV_MAP[nav] || nav;
    navigateTo(sectionId);
    // If navigating to dashboard, refresh it
    if (nav === 'dashboard') refreshDashboard();
  });

  // Hash-based navigation on load
  const hash = window.location.hash.replace('#', '');
  if (hash && document.getElementById(hash)) {
    navigateTo(hash);
    if (hash === 'dashboard') refreshDashboard();
  }

  // Mobile toggle
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

  ['hudLevel', 'dashLevel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = level;
  });
  ['hudStreak'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = streak + '🔥';
  });
  ['dashStreak'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = streak;
  });
  ['hudXpFill', 'dashXpFill'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.width = xpPercent + '%';
  });
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

  setEl('homeReactionBest', reactionBest !== null ? reactionBest + 'ms' : '— ms');
  setEl('homeCpsBest', cpsBest !== null ? cpsBest.toFixed(1) + ' CPS' : '— CPS');
  setEl('homeAimBest', aimBest !== null ? aimBest + ' pts' : '— pts');
  setEl('homeMemoryBest', memBest !== null ? 'Level ' + memBest : 'Level —');
  setEl('homeTypingBest', typeBest !== null ? typeBest + ' WPM' : '— WPM');
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

/* ============================================================
   LEVEL UP OVERLAY
   ============================================================ */

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
      { max: Infinity, min: 20, label: 'GODLIKE', cls: 'rating-godlike' },
      { max: 20, min: 14, label: 'ELITE', cls: 'rating-elite' },
      { max: 14, min: 9, label: 'GREAT', cls: 'rating-great' },
      { max: 9, min: 5, label: 'AVERAGE', cls: 'rating-average' },
      { max: 5, min: 0, label: 'KEEP TRAINING', cls: 'rating-slow' }
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
   ============================================================
   TEST 1: REACTION TIME
   ============================================================
   ============================================================ */

const ReactionTest = (() => {
  let state = 'idle'; // idle | waiting | ready | go | clicked | toosoon
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
    if (reactSub) reactSub.textContent = 'Don\'t click yet!';
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
      // Start
      currentRound = 0;
      rounds = [];
      isTrainingMode = document.getElementById('reactionMode')?.value === 'training';
      results.classList.add('hidden');
      arena.classList.remove('hidden');
      updateRoundDisplay();
      startRound();
      return;
    }

    if (state === 'ready') {
      // Too soon!
      clearTimeout(goTimeout);
      setState('toosoon');
      if (reactMsg) reactMsg.textContent = 'TOO SOON!';
      if (reactSub) reactSub.textContent = 'Wait for green before clicking';
      setTimeout(() => {
        if (isTrainingMode || currentRound < TOTAL_ROUNDS) startRound();
      }, 1200);
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
        setTimeout(() => {
          if (state === 'clicked') startRound();
        }, 1000);
      } else {
        setTimeout(() => showResults(), 800);
      }
      return;
    }

    if (state === 'clicked') {
      // Waiting between rounds, ignore
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

    // Rounds display
    const rd = document.getElementById('roundsDisplay');
    if (rd) {
      rd.innerHTML = rounds.map((r, i) => `<span class="round-pill${r === best ? ' best' : ''}">${r}ms</span>`).join('');
    }

    // Save & XP
    Storage.addHistory('reaction', best);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = best < 150 ? 50 : best < 200 ? 30 : best < 250 ? 20 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');

    // Share
    setupShare('reactionShare', 'reactionShareBox', 'reactionShareText', 'reactionCopyBtn',
      `⚡ I got ${best}ms reaction time on ReflexZone! Can you beat me? reflexzone.io`);

    document.getElementById('reactionRetry').onclick = () => {
      results.classList.add('hidden');
      setState('idle');
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
   ============================================================
   TEST 2: CPS TEST
   ============================================================
   ============================================================ */

const CPSTest = (() => {
  let running = false;
  let clicks = 0;
  let startTime = null;
  let duration = 5; // seconds
  let rafId = null;
  let endTimer = null;

  const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

  const btn = document.getElementById('cpsBtn');
  const btnText = document.getElementById('cpsBtnText');
  const cpsNum = document.getElementById('cpsNumber');
  const clickCount = document.getElementById('cpsClickCount');
  const timeLeft = document.getElementById('cpsTimeLeft');
  const ringFill = document.getElementById('cpsRingFill');
  const results = document.getElementById('cpsResults');

  function setRing(fraction) {
    if (!ringFill) return;
    const offset = CIRCUMFERENCE * (1 - fraction);
    ringFill.style.strokeDashoffset = offset;
  }

  function startTest() {
    duration = parseInt(document.getElementById('cpsDuration')?.value || '5');
    running = true;
    clicks = 0;
    startTime = performance.now();
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

    const elapsed = duration;
    const finalCps = (clicks / elapsed);

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
      `🖱 I got ${finalCps.toFixed(2)} CPS (${clicks} clicks in ${duration}s) on ReflexZone! reflexzone.io`);

    document.getElementById('cpsRetry').onclick = () => {
      results.classList.add('hidden');
      if (btnText) btnText.textContent = 'CLICK TO START';
      if (cpsNum) cpsNum.textContent = '0.00';
      if (clickCount) clickCount.textContent = '0';
      if (timeLeft) timeLeft.textContent = duration + '.0';
      setRing(1);
      clicks = 0;
    };
  }

  function handleClick(e) {
    // Ripple
    const ripple = document.getElementById('cpsRipple');
    if (ripple) {
      const rect = btn.getBoundingClientRect();
      const x = (e.clientX || e.touches?.[0]?.clientX || rect.left + rect.width / 2) - rect.left;
      const y = (e.clientY || e.touches?.[0]?.clientY || rect.top + rect.height / 2) - rect.top;
      ripple.style.left = (x - 5) + 'px';
      ripple.style.top = (y - 5) + 'px';
      ripple.style.animation = 'none';
      void ripple.offsetWidth;
      ripple.style.animation = 'ripple 0.4s ease forwards';
    }

    if (!running) {
      startTest();
    } else {
      clicks++;
    }
  }

  function init() {
    if (!btn) return;
    btn.addEventListener('click', handleClick);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); handleClick(e); }, { passive: false });
  }

  return { init };
})();

/* ============================================================
   ============================================================
   TEST 3: AIM TRAINER
   ============================================================
   ============================================================ */

const AimTrainer = (() => {
  let running = false;
  let score = 0;
  let hits = 0;
  let misses = 0;
  let timeLeft = 30;
  let timings = [];
  let lastTargetTime = null;
  let targetEl = null;
  let timerInterval = null;

  const arena = document.getElementById('aimArena');
  const results = document.getElementById('aimResults');

  const DIFFICULTY_CONFIG = {
    easy:   { size: 70, lifespan: 3000, interval: [800, 1400] },
    normal: { size: 50, lifespan: 2000, interval: [600, 1000] },
    hard:   { size: 35, lifespan: 1500, interval: [400, 700] },
    insane: { size: 22, lifespan: 1000, interval: [250, 500] }
  };

  function getDiff() {
    return DIFFICULTY_CONFIG[document.getElementById('aimDifficulty')?.value || 'normal'];
  }

  function spawnTarget() {
    if (!running) return;
    if (targetEl) targetEl.remove();

    const conf = getDiff();
    // Scale size with score for difficulty ramp-up
    const scale = Math.max(0.5, 1 - (score / 2000) * 0.3);
    const size = Math.round(conf.size * scale);

    const arenaRect = arena.getBoundingClientRect();
    const margin = size / 2 + 10;
    const maxX = arenaRect.width - margin * 2;
    const maxY = arenaRect.height - margin * 2;

    const x = margin + Math.random() * maxX;
    const y = margin + Math.random() * maxY;

    targetEl = document.createElement('div');
    targetEl.className = 'aim-target';
    targetEl.style.cssText = `width:${size}px;height:${size}px;left:${x - size/2}px;top:${y - size/2}px`;

    lastTargetTime = performance.now();

    targetEl.addEventListener('click', hitTarget);
    targetEl.addEventListener('touchstart', (e) => { e.preventDefault(); hitTarget(e); }, { passive: false });
    arena.appendChild(targetEl);

    // Auto-remove if not clicked (missed)
    setTimeout(() => {
      if (targetEl && document.contains(targetEl)) {
        targetEl.remove();
        targetEl = null;
        misses++;
        updateAimHud();
        // Miss flash
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
    const delay = min + Math.random() * (max - min);
    setTimeout(() => {
      if (running) spawnTarget();
    }, delay);
  }

  function hitTarget(e) {
    if (!running || !targetEl) return;
    const rt = Math.round(performance.now() - lastTargetTime);
    timings.push(rt);
    hits++;

    // Score: faster = more points
    const pointsBase = 10;
    const speedBonus = Math.max(0, Math.round((2000 - rt) / 100));
    score += pointsBase + speedBonus;

    // Hit effect
    const rect = targetEl.getBoundingClientRect();
    const arenaRect = arena.getBoundingClientRect();
    const effect = document.createElement('div');
    effect.className = 'hit-effect';
    effect.style.left = (rect.left - arenaRect.left + rect.width / 2) + 'px';
    effect.style.top = (rect.top - arenaRect.top + rect.height / 2) + 'px';
    arena.appendChild(effect);
    setTimeout(() => effect.remove(), 300);

    targetEl.remove();
    targetEl = null;
    updateAimHud();
    scheduleNextTarget();
  }

  function updateAimHud() {
    setEl('aimScore', score);
    setEl('aimHits', hits);
    const totalAttempts = hits + misses;
    const acc = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
    setEl('aimAccuracy', acc + '%');
  }

  function startTest() {
    running = true;
    score = 0; hits = 0; misses = 0;
    timings = [];
    timeLeft = 30;
    targetEl = null;

    document.getElementById('aimStartOverlay')?.remove();
    updateAimHud();
    results.classList.add('hidden');

    spawnTarget();

    timerInterval = setInterval(() => {
      timeLeft--;
      setEl('aimTime', timeLeft);
      if (timeLeft <= 0) finishTest();
    }, 1000);
  }

  function finishTest() {
    running = false;
    clearInterval(timerInterval);
    if (targetEl) { targetEl.remove(); targetEl = null; }

    const totalAttempts = hits + misses;
    const accuracy = totalAttempts > 0 ? Math.round((hits / totalAttempts) * 100) : 0;
    const avgTime = timings.length > 0
      ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
      : 0;

    results.classList.remove('hidden');
    setEl('aimFinalScore', score);
    applyRating(document.getElementById('aimRating'), 'aim', score);
    setEl('aimResHits', hits);
    setEl('aimResMisses', misses);
    setEl('aimResAccuracy', accuracy + '%');
    setEl('aimResAvgTime', avgTime + 'ms');

    Storage.addHistory('aim', score);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = score >= 800 ? 50 : score >= 400 ? 30 : score >= 150 ? 20 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');

    setupShare('aimShare', 'aimShareBox', 'aimShareText', 'aimCopyBtn',
      `🎯 I scored ${score} pts (${accuracy}% accuracy) in Aim Trainer on ReflexZone! reflexzone.io`);

    document.getElementById('aimRetry').onclick = () => {
      results.classList.add('hidden');
      // Rebuild overlay
      const overlay = document.createElement('div');
      overlay.id = 'aimStartOverlay';
      overlay.className = 'aim-start-overlay';
      overlay.innerHTML = `<div class="aim-start-icon">🎯</div>
        <div class="aim-start-title">Aim Trainer</div>
        <div class="aim-start-sub">Click targets as fast as possible<br/>30 seconds, difficulty ramps up</div>
        <button class="btn-primary btn-large" id="aimStartBtn">Start Training</button>`;
      arena.appendChild(overlay);
      document.getElementById('aimStartBtn').onclick = startTest;
      setEl('aimScore', 0);
      setEl('aimTime', 30);
      setEl('aimAccuracy', '—');
      setEl('aimHits', 0);
    };

    // Miss clicks on arena after game
    arena.onclick = null;
  }

  function handleArenaMiss(e) {
    if (!running) return;
    if (e.target === arena) {
      misses++;
      updateAimHud();
    }
  }

  function init() {
    if (!arena) return;
    const startBtn = document.getElementById('aimStartBtn');
    if (startBtn) startBtn.onclick = startTest;
    arena.addEventListener('click', handleArenaMiss);
    arena.addEventListener('touchstart', (e) => {
      if (e.target === arena && running) {
        e.preventDefault();
        misses++;
        updateAimHud();
      }
    }, { passive: false });
  }

  return { init };
})();

/* ============================================================
   ============================================================
   TEST 4: MEMORY TEST
   ============================================================
   ============================================================ */

const MemoryTest = (() => {
  let level = 1;
  let sequence = [];
  let playerSeq = [];
  let phase = 'idle'; // idle | showing | input
  let tiles = [];
  const GRID_SIZE = 9;

  const grid = document.getElementById('memoryGrid');
  const results = document.getElementById('memoryResults');
  const startBtn = document.getElementById('memStartBtn');
  const controls = document.getElementById('memoryControls');

  function buildGrid() {
    if (!grid) return;
    grid.innerHTML = '';
    tiles = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      const tile = document.createElement('div');
      tile.className = 'mem-tile disabled';
      tile.dataset.index = i;
      tile.addEventListener('click', () => handleTileClick(i));
      tile.addEventListener('touchstart', (e) => { e.preventDefault(); handleTileClick(i); }, { passive: false });
      grid.appendChild(tile);
      tiles.push(tile);
    }
  }

  function generateSequence() {
    sequence = [];
    for (let i = 0; i < level + 2; i++) {
      sequence.push(Math.floor(Math.random() * GRID_SIZE));
    }
  }

  async function showSequence() {
    phase = 'showing';
    setEl('memMsg', 'Watch the sequence...');
    setTilesDisabled(true);
    await sleep(500);

    for (const idx of sequence) {
      await flashTile(idx, 600, 400);
    }

    await sleep(300);
    phase = 'input';
    playerSeq = [];
    setEl('memMsg', 'Your turn! Repeat it.');
    setTilesDisabled(false);
  }

  async function flashTile(idx, onMs, offMs) {
    tiles[idx].classList.add('active');
    await sleep(onMs);
    tiles[idx].classList.remove('active');
    await sleep(offMs);
  }

  function setTilesDisabled(disabled) {
    tiles.forEach(t => {
      if (disabled) t.classList.add('disabled');
      else t.classList.remove('disabled');
    });
  }

  async function handleTileClick(idx) {
    if (phase !== 'input') return;
    tiles[idx].classList.add('active');
    setTimeout(() => tiles[idx].classList.remove('active'), 300);

    playerSeq.push(idx);
    const pos = playerSeq.length - 1;

    if (playerSeq[pos] !== sequence[pos]) {
      // Wrong!
      tiles[idx].classList.add('wrong');
      phase = 'idle';
      setTilesDisabled(true);
      await sleep(600);
      gameOver();
      return;
    }

    if (playerSeq.length === sequence.length) {
      // Level complete!
      tiles.forEach(t => t.classList.add('correct'));
      setEl('memMsg', `Level ${level} Complete! ✓`);
      phase = 'idle';
      setTilesDisabled(true);
      await sleep(900);
      tiles.forEach(t => t.classList.remove('correct'));
      level++;
      setEl('memLevel', level);
      generateSequence();
      await showSequence();
    }
  }

  function gameOver() {
    const reached = level;
    const best = Math.max(reached, Storage.get('memory_best', 0));
    Storage.set('memory_best', best);

    results.classList.remove('hidden');
    if (controls) controls.classList.add('hidden');
    setEl('memFinalLevel', reached);
    applyRating(document.getElementById('memRating'), 'memory', reached);

    Storage.addHistory('memory', reached);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = reached >= 10 ? 50 : reached >= 8 ? 40 : reached >= 6 ? 25 : reached >= 4 ? 15 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');
    setEl('memBest', best);

    setupShare('memShare', 'memShareBox', 'memShareText', 'memCopyBtn',
      `🧠 I reached Level ${reached} in Memory Test on ReflexZone! Can you beat me? reflexzone.io`);

    document.getElementById('memRetry').onclick = () => {
      results.classList.add('hidden');
      if (controls) controls.classList.remove('hidden');
      level = 1;
      setEl('memLevel', 1);
      setEl('memMsg', 'Watch the sequence...');
      tiles.forEach(t => { t.className = 'mem-tile disabled'; });
    };
  }

  async function startGame() {
    if (controls) controls.classList.add('hidden');
    results.classList.add('hidden');
    level = 1;
    setEl('memLevel', 1);
    setEl('memBest', Storage.get('memory_best', 0));
    buildGrid();
    generateSequence();
    await showSequence();
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function init() {
    buildGrid();
    if (startBtn) startBtn.onclick = startGame;
  }

  return { init };
})();

/* ============================================================
   ============================================================
   TEST 5: TYPING SPEED
   ============================================================
   ============================================================ */

const TypingTest = (() => {
  let started = false;
  let finished = false;
  let startTime = null;
  let timerInterval = null;
  let duration = 60;
  let totalTyped = 0;
  let errors = 0;
  let currentText = '';
  let charIndex = 0;

  const promptEl = document.getElementById('typePrompt');
  const inputEl = document.getElementById('typeInput');
  const results = document.getElementById('typingResults');

  function getNewParagraph() {
    return TYPING_PARAGRAPHS[Math.floor(Math.random() * TYPING_PARAGRAPHS.length)];
  }

  function renderPrompt() {
    if (!promptEl) return;
    promptEl.innerHTML = currentText.split('').map((ch, i) => {
      let cls = 'char-pending';
      if (i < charIndex) cls = 'char-correct';
      if (i === charIndex) cls = 'char-current';
      return `<span class="${cls}">${ch === ' ' ? '&nbsp;' : ch}</span>`;
    }).join('');
  }

  function setupTest() {
    duration = parseInt(document.getElementById('typingDuration')?.value || '60');
    currentText = getNewParagraph();
    charIndex = 0;
    errors = 0;
    totalTyped = 0;
    started = false;
    finished = false;
    if (inputEl) { inputEl.value = ''; inputEl.disabled = false; }
    if (timerInterval) clearInterval(timerInterval);
    setEl('typeTimer', duration);
    setEl('typeWpm', 0);
    setEl('typeAccuracy', '100%');
    setEl('typeErrors', 0);
    results.classList.add('hidden');
    renderPrompt();
  }

  function calcWPM() {
    if (!startTime) return 0;
    const elapsed = (performance.now() - startTime) / 60000; // in minutes
    const words = charIndex / 5; // standard: 5 chars = 1 word
    return elapsed > 0 ? Math.round(words / elapsed) : 0;
  }

  function handleInput(e) {
    if (finished) return;

    const inputVal = inputEl.value;

    if (!started) {
      started = true;
      startTime = performance.now();
      let timeLeft = duration;
      timerInterval = setInterval(() => {
        timeLeft--;
        setEl('typeTimer', timeLeft);
        const wpm = calcWPM();
        setEl('typeWpm', wpm);
        if (timeLeft <= 0) finishTest();
      }, 1000);
    }

    // Validate last typed character
    const lastChar = inputVal[inputVal.length - 1];
    const expected = currentText[charIndex];

    if (lastChar === expected) {
      charIndex++;
      totalTyped++;
    } else if (lastChar !== undefined) {
      errors++;
      totalTyped++;
    }

    // Clear input periodically to avoid overflow
    if (inputVal.length > 40) inputEl.value = '';

    const acc = totalTyped > 0 ? Math.round((1 - errors / totalTyped) * 100) : 100;
    setEl('typeAccuracy', acc + '%');
    setEl('typeErrors', errors);
    setEl('typeWpm', calcWPM());

    renderPrompt();

    // If finished the text, load new one
    if (charIndex >= currentText.length) {
      currentText = getNewParagraph();
      charIndex = 0;
      inputEl.value = '';
      renderPrompt();
    }
  }

  function finishTest() {
    finished = true;
    clearInterval(timerInterval);
    if (inputEl) inputEl.disabled = true;

    const wpm = calcWPM();
    const acc = totalTyped > 0 ? Math.round((1 - errors / totalTyped) * 100) : 100;
    const words = Math.round(charIndex / 5);
    const chars = charIndex;

    results.classList.remove('hidden');
    setEl('typeFinalWpm', wpm);
    applyRating(document.getElementById('typeRating'), 'typing', wpm);
    setEl('typeResAccuracy', acc + '%');
    setEl('typeResWords', words);
    setEl('typeResChars', chars);
    setEl('typeResErrors', errors);

    Storage.addHistory('typing', wpm);
    Storage.set('tests_count', (Storage.get('tests_count', 0) + 1));
    const xpEarned = wpm >= 130 ? 50 : wpm >= 90 ? 35 : wpm >= 60 ? 25 : wpm >= 35 ? 15 : 10;
    XPSystem.addXP(xpEarned);
    showToast(`+${xpEarned} XP earned!`, 'success');

    setupShare('typeShare', 'typeShareBox', 'typeShareText', 'typeCopyBtn',
      `⌨️ I typed ${wpm} WPM with ${acc}% accuracy on ReflexZone! reflexzone.io`);

    document.getElementById('typeRetry').onclick = () => {
      setupTest();
      if (inputEl) inputEl.focus();
    };
  }

  function init() {
    if (!inputEl) return;
    setupTest();
    inputEl.addEventListener('input', handleInput);
    inputEl.addEventListener('focus', () => {
      if (!started && !finished) renderPrompt();
    });

    // Reset test when duration changes
    const durSelect = document.getElementById('typingDuration');
    if (durSelect) durSelect.addEventListener('change', setupTest);
  }

  return { init, setupTest };
})();

/* ============================================================
   DASHBOARD
   ============================================================ */

function refreshDashboard() {
  updateHUD();

  const tests = ['reaction', 'cps', 'aim', 'memory', 'typing'];

  tests.forEach(test => {
    const hist = Storage.get(test + '_hist', []);
    const best = Storage.get(test + '_best', null);

    // Determine unit
    const units = { reaction: 'ms', cps: ' CPS', aim: ' pts', memory: '', typing: ' WPM' };
    const prefixes = { memory: 'Level ' };
    const unit = units[test] || '';
    const prefix = prefixes[test] || '';

    // Best
    const bestEl = document.getElementById('dash' + capitalize(test) + 'Best');
    if (bestEl) bestEl.textContent = best !== null ? prefix + best + unit : '—';

    // Average
    const avgEl = document.getElementById('dash' + capitalize(test) + 'Avg');
    if (avgEl && hist.length > 0) {
      const avg = hist.reduce((a, b) => a + b.score, 0) / hist.length;
      avgEl.textContent = 'Avg: ' + prefix + (test === 'reaction' ? Math.round(avg) : avg.toFixed(1)) + unit;
    }

    // History bars
    const histEl = document.getElementById('dash' + capitalize(test) + 'History');
    if (histEl && hist.length > 0) {
      const scores = hist.map(h => h.score);
      const maxVal = Math.max(...scores);
      const minVal = Math.min(...scores);
      const range = maxVal - minVal || 1;
      histEl.innerHTML = scores.map(s => {
        const frac = test === 'reaction'
          ? 1 - (s - minVal) / range // Lower is better for reaction
          : (s - minVal) / range;
        const h = Math.max(4, Math.round(frac * 30));
        return `<div class="hist-bar" style="height:${h}px" title="${s}${unit}"></div>`;
      }).join('');
    }
  });

  // Total XP and test count
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
   'reaction_best', 'cps_best', 'aim_best', 'memory_best', 'typing_best',
   'reaction_hist', 'cps_hist', 'aim_hist', 'memory_hist', 'typing_hist'
  ].forEach(k => localStorage.removeItem('rz_' + k));
  updateHUD();
  updateHomeBests();
  refreshDashboard();
  showToast('All data reset.', '');
});

/* ============================================================
   INIT
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Run streak check on load
  StreakSystem.check();

  // Update HUD
  updateHUD();
  updateHomeBests();

  // Init navigation
  initNavigation();

  // Init all tests
  ReactionTest.init();
  CPSTest.init();
  AimTrainer.init();
  MemoryTest.init();
  TypingTest.init();

  // Keyboard shortcut: Escape → go home
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') navigateTo('home');
  });

  console.log('%c⚡ ReflexZone loaded', 'color: #00ffaa; font-size: 16px; font-weight: bold;');
});

/* ═══════════════════════════════════════════════════════════════
   DOMINOES — Complete JavaScript
   Multiplayer, Spectator, Timer, Variants, Animations & More
   ═══════════════════════════════════════════════════════════════ */

/* ── ANIMATION ISOLATION FLAG ── */
const ANIMATIONS_ENABLED = true;

/* ── CONSTANTS ── */
const BCX = 2500;
const BCY = 1500;
const SNAKE_W = 600;
const SNAKE_H = 240;
const DEFAULT_TIMER = 30;

/* ── AUDIO ENGINE ── */
var AC = null;
var soundOn = true;

function getAC() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      // Audio not supported
    }
  }
  return AC;
}

function tone(f, type, dur, vol, atk) {
  if (!soundOn) return;
  vol = vol || .15;
  atk = atk || .005;
  try {
    var c = getAC();
    if (!c) return;
    var o = c.createOscillator();
    var g = c.createGain();
    o.connect(g);
    g.connect(c.destination);
    o.type = type || 'sine';
    o.frequency.value = f;
    var t = c.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.start(t);
    o.stop(t + dur + .05);
  } catch (e) {
    // Silently fail
  }
}

function nz(dur, vol, bpf) {
  if (!soundOn) return;
  vol = vol || .07;
  bpf = bpf || 1100;
  try {
    var c = getAC();
    if (!c) return;
    var sr = c.sampleRate;
    var buf = c.createBuffer(1, sr * dur, sr);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) {
      d[i] = Math.random() * 2 - 1;
    }
    var src = c.createBufferSource();
    var fl = c.createBiquadFilter();
    var g = c.createGain();
    fl.type = 'bandpass';
    fl.frequency.value = bpf;
    fl.Q.value = .7;
    src.buffer = buf;
    src.connect(fl);
    fl.connect(g);
    g.connect(c.destination);
    var t = c.currentTime;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    src.start(t);
    src.stop(t + dur + .05);
  } catch (e) {
    // Silently fail
  }
}

var SFX = {
  place: function() {
    nz(.042, .24, 880);
    tone(165, 'sine', .07, .05);
  },
  placeDouble: function() {
    nz(.05, .3, 660);
    tone(130, 'sine', .1, .06);
    tone(260, 'sine', .06, .04);
  },
  draw: function() {
    nz(.06, .12, 1250);
    tone(295, 'sine', .09, .03);
  },
  yours: function() {
    tone(660, 'sine', .11, .12);
    setTimeout(function() {
      tone(880, 'sine', .17, .1);
    }, 105);
  },
  domino: function() {
    [523, 659, 784, 1047].forEach(function(f, i) {
      setTimeout(function() {
        tone(f, 'triangle', .3, .16);
      }, i * 100);
    });
  },
  hover: function() {
    tone(540, 'sine', .05, .032);
  },
  click: function() {
    tone(420, 'sine', .044, .055);
  },
  win: function() {
    [523, 659, 784, 1047].forEach(function(f, i) {
      setTimeout(function() {
        tone(f, 'triangle', .26, .14);
      }, i * 92);
    });
  },
  lose: function() {
    [390, 328, 260].forEach(function(f, i) {
      setTimeout(function() {
        tone(f, 'sawtooth', .28, .1);
      }, i * 105);
    });
  },
  bad: function() {
    tone(210, 'sawtooth', .12, .1);
  },
  pass: function() {
    tone(320, 'sine', .09, .07);
    setTimeout(function() {
      tone(255, 'sine', .14, .05);
    }, 82);
  },
  timerWarn: function() {
    tone(800, 'sine', .05, .06);
  },
  shuffle: function() {
    for (var i = 0; i < 9; i++) {
      (function(j) {
        setTimeout(function() {
          nz(.038, .09, 800 + j * 100);
        }, j * 52);
      })(i);
    }
  }
};

function toggleSound() {
  soundOn = !soundOn;
  SFX.click();
  var hb = document.getElementById('hbtn-snd');
  var ms = document.getElementById('ms-snd');
  if (hb) {
    hb.textContent = soundOn ? '🔊' : '🔇';
  }
  if (ms) {
    ms.textContent = soundOn ? '🔊 Sound On' : '🔇 Sound Off';
  }
  toast(soundOn ? '🔊 Sound enabled' : '🔇 Sound muted');
}

/* ── PARTICLES ── */
(function() {
  var cv = document.getElementById('pcv');
  var ctx = cv.getContext('2d');
  var W, H, pts;

  function resize() {
    W = cv.width = window.innerWidth;
    H = cv.height = window.innerHeight;
  }

  function mkp() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.6 + .4,
      vx: (Math.random() - .5) * .18,
      vy: (Math.random() - .5) * .18,
      a: Math.random(),
      va: (Math.random() - .5) * .005,
      gold: Math.random() > .6
    };
  }

  function init() {
    resize();
    pts = [];
    for (var i = 0; i < 50; i++) {
      pts.push(mkp());
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      if (p.a < 0) p.va = Math.abs(p.va);
      if (p.a > 1) p.va = -Math.abs(p.va);
      if (p.x < -5) p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5) p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.gold ? 'rgba(201,168,76,' + Math.max(0, p.a * .52) + ')' : 'rgba(238,228,198,' + Math.max(0, p.a * .35) + ')';
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener('resize', resize);
  init();
  frame();
})();

/* ── DOT PATTERNS ── */
var DP = {
  0: [],
  1: [[0, 1, 0]],
  2: [[0, 1, 0], [0, 0, 0], [0, 1, 0]],
  3: [[0, 1, 0], [0, 1, 0], [0, 1, 0]],
  4: [[1, 0, 1], [0, 0, 0], [1, 0, 1]],
  5: [[1, 0, 1], [0, 1, 0], [1, 0, 1]],
  6: [[1, 0, 1], [1, 0, 1], [1, 0, 1]]
};

function buildDots(n) {
  var dg = document.createElement('div');
  dg.className = 'dg';
  var rows = DP[n] || [];
  if (!rows.length) {
    return dg;
  }
  for (var i = 0; i < rows.length; i++) {
    var r = document.createElement('div');
    r.className = 'dr';
    for (var j = 0; j < rows[i].length; j++) {
      var c = document.createElement('div');
      c.className = rows[i][j] ? 'd' : 'ds';
      r.appendChild(c);
    }
    dg.appendChild(r);
  }
  return dg;
}

var hTmr = null;

function mkTile(a, b, opts) {
  opts = opts || {};
  var el = document.createElement('div');
  var isH = opts.horiz;
  var brd = opts.board;
  el.className = 'tile ' + (isH ? (brd ? 'BH' : 'H') : (brd ? 'BV' : 'V'));
  if (opts.playable) {
    el.classList.add('play');
  }
  if (opts.selected) {
    el.classList.add('sel');
  }
  if (opts.onclick) {
    el.addEventListener('click', opts.onclick);
  }
  if (opts.playable) {
    el.addEventListener('mouseenter', function() {
      clearTimeout(hTmr);
      hTmr = setTimeout(function() {
        SFX.hover();
      }, 85);
    });
  }
  var ha = document.createElement('div');
  ha.className = 'th';
  ha.appendChild(buildDots(a));
  var dv = document.createElement('div');
  dv.className = 'tdv';
  var hb = document.createElement('div');
  hb.className = 'th';
  hb.appendChild(buildDots(b));
  el.appendChild(ha);
  el.appendChild(dv);
  el.appendChild(hb);
  return el;
}

/* ── GAME DATA ── */
var BOTS = [
  { name: 'Ace', emoji: '🤖', color: '#4da6e8' },
  { name: 'Rex', emoji: '🦊', color: '#e8844d' },
  { name: 'Max', emoji: '🦁', color: '#c9a84c' },
  { name: 'Zoe', emoji: '🐺', color: '#a04de8' }
];

var BZ_IDS = ['bz0', 'bz1', 'bz2', 'bz3'];

var BZ_STYLES = {
  bz0: 'top:8px;left:50%;transform:translateX(-50%)',
  bz1: 'left:6px;top:50%;transform:translateY(-50%)',
  bz2: 'right:6px;top:50%;transform:translateY(-50%)',
  bz3: 'top:8px;left:24%;transform:translateX(-50%)'
};

var BZ_SLOTS = {
  1: ['bz0'],
  2: ['bz0', 'bz2'],
  3: ['bz0', 'bz1', 'bz2'],
  4: ['bz3', 'bz0', 'bz1', 'bz2']
};

function genSet() {
  var t = [];
  for (var a = 0; a <= 6; a++) {
    for (var b = a; b <= 6; b++) {
      t.push({ a: a, b: b });
    }
  }
  return t;
}

function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = 0 | Math.random() * (i + 1);
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function pip(t) {
  return t ? t.a + t.b : 0;
}

function hpip(p) {
  return p.hand.reduce(function(s, t) {
    return s + pip(t);
  }, 0);
}

/* ── GLOBAL STATE ── */
var G = {};
var TMR = null;
var SEL = -1;
var isMultiplayer = false;
var mpRoomId = null;
var mpPlayerId = null;
var mpListeners = [];
var mpVariant = 'draw';
var isSpectator = false;
var timerInterval = null;
var timerSeconds = 0;
var selectedOfflineMode = 1;
var STATS = {
  wins: 0,
  losses: 0,
  gamesPlayed: 0,
  tilesPlayed: 0,
  roundsPlayed: 0
};
var USERNAME = '';
var PLAYER_ID = '';

/* ── USERNAME SYSTEM ── */
function initUsername() {
  var saved = localStorage.getItem('domino_username');
  var savedId = localStorage.getItem('domino_player_id');
  if (saved && savedId) {
    USERNAME = saved;
    PLAYER_ID = savedId;
    document.getElementById('username-modal').classList.add('off');
    showMenu();
    return;
  }
  PLAYER_ID = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  document.getElementById('username-modal').classList.remove('off');
  document.getElementById('uname-input').focus();
}

function saveUsername() {
  var input = document.getElementById('uname-input');
  var name = input.value.trim();
  if (!name || name.length < 2) {
    toast('Please enter a name (at least 2 characters)');
    return;
  }
  USERNAME = name;
  localStorage.setItem('domino_username', USERNAME);
  localStorage.setItem('domino_player_id', PLAYER_ID);
  if (window.firebaseDB) {
    var profileRef = window.firebaseRef(window.firebaseDB, 'players/' + PLAYER_ID + '/profile');
    window.firebaseSet(profileRef, {
      name: USERNAME,
      lastSeen: window.firebaseServerTimestamp()
    });
  }
  document.getElementById('username-modal').classList.add('off');
  SFX.click();
  showMenu();
}

function showMenu() {
  document.getElementById('LS').classList.add('off');
  document.getElementById('MS').classList.remove('off');
  document.getElementById('welcome-label').textContent = 'Welcome, ' + USERNAME + '!';
  renderDeco();
  checkHashRoute();
}

function checkHashRoute() {
  var hash = window.location.hash;
  if (!hash) {
    return;
  }
  if (hash.startsWith('#room=')) {
    var code = hash.replace('#room=', '').toUpperCase();
    if (code.length === 4) {
      document.getElementById('room-input').value = code;
      setTimeout(function() {
        mpJoinRoom();
      }, 500);
    }
  } else if (hash.startsWith('#spectate=')) {
    var specCode = hash.replace('#spectate=', '').toUpperCase();
    if (specCode.length === 4) {
      openSpectateList();
      setTimeout(function() {
        mpSpectateRoom(specCode);
      }, 800);
    }
  }
}

window.addEventListener('hashchange', checkHashRoute);

/* ── OFFLINE MODAL ── */
function openOfflineModal() {
  document.getElementById('offline-modal').classList.remove('off');
  selectedOfflineMode = 1;
  var opts = document.querySelectorAll('.offline-option');
  opts.forEach(function(o, i) {
    o.classList.toggle('sel', i === 0);
  });
}

function selectOfflineMode(mode, el) {
  selectedOfflineMode = mode;
  var opts = document.querySelectorAll('.offline-option');
  opts.forEach(function(o) {
    o.classList.remove('sel');
  });
  el.classList.add('sel');
}

function closeOfflineModal() {
  document.getElementById('offline-modal').classList.add('off');
}

function startOfflineGame() {
  document.getElementById('offline-modal').classList.add('off');
  startGame(selectedOfflineMode);
}

/* ── BOARD LAYOUT ENGINE ── */
var TW = 68;
var TH = 36;
var DW = 36;
var DH = 68;
var GAP = 2;

function initGame(numBots, isMP, variant) {
  isMultiplayer = isMP || false;
  mpVariant = variant || 'draw';
  isSpectator = false;
  var tiles = shuffle(genSet());
  var total = isMP ? G.multiplayerPlayers.length : 1 + numBots;
  var hs = total <= 2 ? 7 : 5;
  var players = [];

  if (isMP) {
    for (var i = 0; i < G.multiplayerPlayers.length; i++) {
      var mp = G.multiplayerPlayers[i];
      players.push({
        id: i,
        name: mp.name,
        emoji: '🧑',
        color: '#4ddd88',
        bot: false,
        hand: tiles.splice(0, hs),
        score: 0,
        mpId: mp.id
      });
    }
    G.localPlayerId = players.findIndex(function(p) {
      return p.mpId === mpPlayerId;
    });
    if (G.localPlayerId === -1) {
      G.localPlayerId = 0;
    }
    players[G.localPlayerId].emoji = '🧑';
  } else {
    for (var j = 0; j < total; j++) {
      players.push({
        id: j,
        name: j === 0 ? USERNAME : BOTS[j - 1].name,
        emoji: j === 0 ? '🧑' : BOTS[j - 1].emoji,
        color: j === 0 ? '#4ddd88' : BOTS[j - 1].color,
        bot: j !== 0,
        hand: tiles.splice(0, hs),
        score: 0
      });
    }
    G.localPlayerId = 0;
  }

  var first = -1;
  var hd = -1;
  for (var pi = 0; pi < players.length; pi++) {
    for (var ti = 0; ti < players[pi].hand.length; ti++) {
      var t = players[pi].hand[ti];
      if (t.a === t.b && t.a > hd) {
        hd = t.a;
        first = pi;
      }
    }
  }
  if (first === -1) {
    var maxP = -1;
    for (var pi2 = 0; pi2 < players.length; pi2++) {
      for (var ti2 = 0; ti2 < players[pi2].hand.length; ti2++) {
        var pipVal = pip(players[pi2].hand[ti2]);
        if (pipVal > maxP) {
          maxP = pipVal;
          first = pi2;
        }
      }
    }
  }
  if (first === -1) {
    first = 0;
  }

  G = {
    players: players,
    boneyard: tiles,
    chain: [],
    head: { x: BCX, y: BCY, dir: 'L', val: null },
    tail: { x: BCX, y: BCY, dir: 'R', val: null },
    numBots: numBots,
    cur: first,
    over: false,
    isFirst: true,
    passStreak: 0,
    isMultiplayer: isMP,
    localPlayerId: G.localPlayerId || 0,
    variant: mpVariant,
    isSpectator: false,
    scoresThisRound: {}
  };
  SEL = -1;
  resetZoom();
  document.getElementById('emoji-picker').classList.add('off');
  document.getElementById('rematch-bar').classList.add('off');
}

function placeChain(player, tIdx, side) {
  if (!player || !player.hand[tIdx]) {
    return;
  }
  var t = player.hand[tIdx];
  var rA = t.a;
  var rB = t.b;
  var dbl = (t.a === t.b);
  STATS.tilesPlayed++;

  if (G.isFirst) {
    var w = dbl ? DW : TW;
    var h = dbl ? DH : TH;
    var x = BCX - w / 2;
    var y = BCY - h / 2;
    G.chain.push({
      a: rA,
      b: rB,
      x: x,
      y: y,
      w: w,
      h: h,
      dbl: dbl,
      side: 'first'
    });
    G.head = { x: x, y: y + h / 2, dir: 'L', val: rA };
    G.tail = { x: x + w, y: y + h / 2, dir: 'R', val: rB };
    G.isFirst = false;
  } else if (side === 'L') {
    if (t.a === G.head.val) {
      rA = t.b;
      rB = t.a;
    } else {
      rA = t.a;
      rB = t.b;
    }
    var rec = attachToHead(rA, rB, dbl);
    G.chain.unshift(rec);
    G.head.val = rA;
  } else {
    if (t.a === G.tail.val) {
      rA = t.a;
      rB = t.b;
    } else {
      rA = t.b;
      rB = t.a;
    }
    var rec2 = attachToTail(rA, rB, dbl);
    G.chain.push(rec2);
    G.tail.val = rB;
  }

  player.hand.splice(tIdx, 1);
  G.passStreak = 0;
  SEL = -1;
  if (dbl) {
    SFX.placeDouble();
  } else {
    SFX.place();
  }
  renderBoard();
  renderHUD();
  stopTimer();

  if (G.variant === 'allfives' && !G.isFirst && G.head.val !== null && G.tail.val !== null) {
    var es = G.head.val + G.tail.val;
    if (es > 0 && es % 5 === 0) {
      var pts = es;
      player.score += pts;
      scorePop(pts);
      renderHUD();
    }
  }
}

function attachToTail(rA, rB, dbl) {
  var end = G.tail;
  var dir = end.dir;
  var tw, th, nx, ny;

  if (dbl) {
    tw = DW;
    th = DH;
    if (dir === 'R' || dir === 'L') {
      nx = end.x;
      ny = end.y - DH / 2;
    } else {
      tw = DH;
      th = DW;
      nx = end.x - DH / 2;
      ny = end.y;
    }
    advanceTail(dir, tw, th, nx, ny);
  } else {
    if (dir === 'R') {
      tw = TW;
      th = TH;
      nx = end.x;
      ny = end.y - TH / 2;
    } else if (dir === 'L') {
      tw = TW;
      th = TH;
      nx = end.x - TW;
      ny = end.y - TH / 2;
    } else if (dir === 'D') {
      tw = TH;
      th = TW;
      nx = end.x - TH / 2;
      ny = end.y;
    } else {
      tw = TH;
      th = TW;
      nx = end.x - TH / 2;
      ny = end.y - TW;
    }
    advanceTail(dir, tw, th, nx, ny);
  }

  return {
    a: rA,
    b: rB,
    x: nx,
    y: ny,
    w: tw,
    h: th,
    dbl: dbl,
    dir: dir,
    side: 'tail'
  };
}

function advanceTail(dir, tw, th, nx, ny) {
  if (dir === 'R') {
    if (nx + tw > BCX + SNAKE_W) {
      G.tail = { x: nx + tw / 2, y: ny + th, dir: 'D', val: G.tail.val };
      return;
    }
    G.tail = { x: nx + tw, y: ny + th / 2, dir: dir, val: G.tail.val };
  } else if (dir === 'L') {
    if (nx < BCX - SNAKE_W) {
      G.tail = { x: nx + tw / 2, y: ny, dir: 'U', val: G.tail.val };
      return;
    }
    G.tail = { x: nx, y: ny + th / 2, dir: dir, val: G.tail.val };
  } else if (dir === 'D') {
    if (ny + th > BCY + SNAKE_H) {
      G.tail = { x: nx, y: ny + th / 2, dir: 'L', val: G.tail.val };
    } else {
      G.tail = { x: nx + tw / 2, y: ny + th, dir: dir, val: G.tail.val };
    }
  } else {
    if (ny < BCY - SNAKE_H) {
      G.tail = { x: nx + tw, y: ny + th / 2, dir: 'R', val: G.tail.val };
    } else {
      G.tail = { x: nx + tw / 2, y: ny, dir: dir, val: G.tail.val };
    }
  }
}

function attachToHead(rA, rB, dbl) {
  var end = G.head;
  var dir = end.dir;
  var tw, th, nx, ny;

  if (dbl) {
    tw = DW;
    th = DH;
    if (dir === 'L' || dir === 'R') {
      nx = end.x - DW;
      ny = end.y - DH / 2;
    } else {
      tw = DH;
      th = DW;
      nx = end.x - DH / 2;
      ny = end.y - DW;
    }
    advanceHead(dir, tw, th, nx, ny);
  } else {
    if (dir === 'L') {
      tw = TW;
      th = TH;
      nx = end.x - TW;
      ny = end.y - TH / 2;
    } else if (dir === 'R') {
      tw = TW;
      th = TH;
      nx = end.x;
      ny = end.y - TH / 2;
    } else if (dir === 'U') {
      tw = TH;
      th = TW;
      nx = end.x - TH / 2;
      ny = end.y - TW;
    } else {
      tw = TH;
      th = TW;
      nx = end.x - TH / 2;
      ny = end.y;
    }
    advanceHead(dir, tw, th, nx, ny);
  }

  return {
    a: rA,
    b: rB,
    x: nx,
    y: ny,
    w: tw,
    h: th,
    dbl: dbl,
    dir: dir,
    side: 'head'
  };
}

function advanceHead(dir, tw, th, nx, ny) {
  if (dir === 'L') {
    if (nx < BCX - SNAKE_W) {
      G.head = { x: nx + tw / 2, y: ny, dir: 'U', val: G.head.val };
      return;
    }
    G.head = { x: nx, y: ny + th / 2, dir: dir, val: G.head.val };
  } else if (dir === 'R') {
    if (nx + tw > BCX + SNAKE_W) {
      G.head = { x: nx + tw / 2, y: ny + th, dir: 'D', val: G.head.val };
      return;
    }
    G.head = { x: nx + tw, y: ny + th / 2, dir: dir, val: G.head.val };
  } else if (dir === 'U') {
    if (ny < BCY - SNAKE_H) {
      G.head = { x: nx + tw, y: ny + th / 2, dir: 'R', val: G.head.val };
    } else {
      G.head = { x: nx + tw / 2, y: ny, dir: dir, val: G.head.val };
    }
  } else {
    if (ny + th > BCY + SNAKE_H) {
      G.head = { x: nx, y: ny + th / 2, dir: 'L', val: G.head.val };
    } else {
      G.head = { x: nx + tw / 2, y: ny + th, dir: dir, val: G.head.val };
    }
  }
}

/* ── VALID MOVES ── */
function validMoves(hand, oL, oR, isFirst) {
  if (isFirst) {
    var all = [];
    for (var i = 0; i < hand.length; i++) {
      all.push(i);
    }
    return all;
  }
  var out = [];
  for (var i = 0; i < hand.length; i++) {
    var t = hand[i];
    if (t.a === oL || t.b === oL || t.a === oR || t.b === oR) {
      out.push(i);
    }
  }
  return out;
}

/* ── BOT AI ── */
function botMove(p) {
  var oL = G.head.val;
  var oR = G.tail.val;
  var valid = validMoves(p.hand, oL, oR, G.isFirst);
  if (!valid.length) {
    return false;
  }
  var best = null;
  var bestSc = -Infinity;
  for (var vi = 0; vi < valid.length; vi++) {
    var idx = valid[vi];
    var t = p.hand[idx];
    var dbl = (t.a === t.b);
    var sides = [];
    if (G.isFirst) {
      sides.push('R');
    } else {
      if (t.a === oL || t.b === oL) {
        sides.push('L');
      }
      if (t.a === oR || t.b === oR) {
        sides.push('R');
      }
    }
    for (var si = 0; si < sides.length; si++) {
      var sc = pip(t) * 9 + (dbl ? 7 : 0);
      var newOpen;
      if (G.isFirst) {
        newOpen = t.b;
      } else if (sides[si] === 'L') {
        newOpen = t.a === oL ? t.b : t.a;
      } else {
        newOpen = t.a === oR ? t.b : t.a;
      }
      if (newOpen === 6 || newOpen === 0) {
        sc -= 4;
      }
      if (G.variant === 'block') {
        sc += (dbl ? 15 : 0);
      }
      if (sc > bestSc) {
        bestSc = sc;
        best = { idx: idx, side: sides[si] };
      }
    }
  }
  if (best) {
    placeChain(p, best.idx, best.side);
    return true;
  }
  return false;
}

/* ── BONEYARD ── */
function getReserve() {
  return G.players && G.players.length <= 2 ? 2 : 1;
}

function byardOk() {
  if (G.variant === 'block') {
    return false;
  }
  return G.boneyard && G.boneyard.length > getReserve();
}

function drawTile(p) {
  if (!byardOk()) {
    return null;
  }
  var t = G.boneyard.shift();
  p.hand.push(t);
  SFX.draw();
  renderBoneyard();
  return t;
}

/* ── BLOCKED ── */
function isBlocked() {
  if (byardOk()) {
    return false;
  }
  var oL = G.head.val;
  var oR = G.tail.val;
  for (var i = 0; i < G.players.length; i++) {
    if (validMoves(G.players[i].hand, oL, oR, G.isFirst).length > 0) {
      return false;
    }
  }
  return true;
}

/* ── SCORING ── */
function rnd5(n) {
  return Math.round(n / 5) * 5;
}

function endHand(winIdx, blocked) {
  G.over = true;
  STATS.roundsPlayed++;
  var w = G.players[winIdx];
  var bonus;

  if (G.variant === 'allfives') {
    var opp = 0;
    for (var i = 0; i < G.players.length; i++) {
      if (i !== winIdx) {
        opp += hpip(G.players[i]);
      }
    }
    bonus = rnd5(opp);
  } else if (blocked) {
    var mine = hpip(w);
    var all = 0;
    for (var j = 0; j < G.players.length; j++) {
      all += hpip(G.players[j]);
    }
    bonus = rnd5(all - mine);
  } else {
    var opp2 = 0;
    for (var k = 0; k < G.players.length; k++) {
      if (k !== winIdx) {
        opp2 += hpip(G.players[k]);
      }
    }
    bonus = rnd5(opp2);
  }

  w.score += bonus;
  if (winIdx === G.localPlayerId) {
    STATS.wins++;
    SFX.win();
    SFX.domino();
  } else {
    STATS.losses++;
    SFX.lose();
  }
  STATS.gamesPlayed++;
  renderHUD();
  setTimeout(function() {
    showGO(winIdx, bonus, blocked);
  }, 350);
}

/* ── TIMER ── */
function startTimer() {
  if (isSpectator || G.cur !== G.localPlayerId) {
    return;
  }
  timerSeconds = DEFAULT_TIMER;
  var barWrap = document.getElementById('timer-bar-wrap');
  var bar = document.getElementById('timer-bar');
  barWrap.classList.remove('off');
  bar.style.width = '100%';
  bar.classList.remove('warn', 'danger');
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  timerInterval = setInterval(function() {
    timerSeconds--;
    var pct = (timerSeconds / DEFAULT_TIMER) * 100;
    bar.style.width = pct + '%';
    if (timerSeconds <= 10) {
      bar.classList.add('warn');
    }
    if (timerSeconds <= 5) {
      bar.classList.add('danger');
      if (timerSeconds > 0) {
        SFX.timerWarn();
      }
    }
    if (timerSeconds <= 0) {
      stopTimer();
      if (G.cur === G.localPlayerId) {
        playerDraw();
      }
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  var barWrap = document.getElementById('timer-bar-wrap');
  barWrap.classList.add('off');
}

/* ── TURN ENGINE ── */
function nextPlayer() {
  G.cur = (G.cur + 1) % G.players.length;
  if (G.isMultiplayer && !isSpectator) {
    mpSyncGameState();
  }
  runTurn();
}

function runTurn() {
  if (G.over) {
    return;
  }
  var p = G.players[G.cur];
  renderHUD();
  renderTurnBadge(p);

  if (p.hand.length === 0) {
    if (!isSpectator) {
      endHand(p.id, false);
    }
    return;
  }

  if (G.isMultiplayer || isSpectator) {
    if (G.cur === G.localPlayerId && !isSpectator) {
      setBotThinking(-1, false);
      SFX.yours();
      startTimer();
      doHumanTurn(p);
    } else {
      setSt('⏳', p.name + ' is thinking…');
      setBotThinking(p.id, true);
      stopTimer();
    }
  } else {
    if (p.bot) {
      setSt('⏳', p.name + ' is thinking…');
      setBotThinking(p.id, true);
      TMR = setTimeout(function() {
        doBotTurn(p);
      }, 880 + Math.random() * 380);
    } else {
      setBotThinking(-1, false);
      SFX.yours();
      startTimer();
      doHumanTurn(p);
    }
  }
}

function doBotTurn(p) {
  setBotThinking(p.id, false);
  var moved = botMove(p);
  if (!moved) {
    var draws = 0;
    while (!moved && draws < 28) {
      if (!byardOk()) {
        break;
      }
      drawTile(p);
      renderBotHands();
      moved = botMove(p);
      draws++;
    }
    if (!moved) {
      G.passStreak = (G.passStreak || 0) + 1;
      setSt('⏭️', p.name + ' has no moves — passing.');
      SFX.pass();
      if (G.passStreak >= G.players.length || isBlocked()) {
        setTimeout(blockEnd, 700);
        return;
      }
    } else {
      G.passStreak = 0;
    }
  }
  renderBotHands();
  if (p.hand.length === 0) {
    endHand(p.id, false);
    return;
  }
  if (isBlocked()) {
    blockEnd();
    return;
  }
  setTimeout(nextPlayer, 520);
}

function doHumanTurn(p) {
  var oL = G.head.val;
  var oR = G.tail.val;
  var valid = validMoves(p.hand, oL, oR, G.isFirst);

  if (valid.length > 0) {
    setSt('🟡', 'Your turn — tap a glowing tile to play.');
    renderHand(valid);
  } else if (byardOk()) {
    setSt('🃏', 'No valid moves — tap the Boneyard to draw.');
    renderHand([]);
  } else if (G.variant === 'block') {
    G.passStreak = (G.passStreak || 0) + 1;
    setSt('⏭️', 'Block game — no draws. Passing.');
    SFX.pass();
    renderHand([]);
    if (G.passStreak >= G.players.length || isBlocked()) {
      setTimeout(blockEnd, 800);
      return;
    }
    setTimeout(nextPlayer, 1100);
  } else {
    G.passStreak = (G.passStreak || 0) + 1;
    setSt('⏭️', 'No moves, boneyard empty — turn passed.');
    SFX.pass();
    renderHand([]);
    if (G.passStreak >= G.players.length || isBlocked()) {
      setTimeout(blockEnd, 800);
      return;
    }
    if (G.isMultiplayer) {
      mpSyncGameState();
    }
    setTimeout(nextPlayer, 1100);
  }
}

function blockEnd() {
  var minP = Infinity;
  var minI = 0;
  for (var i = 0; i < G.players.length; i++) {
    var v = hpip(G.players[i]);
    if (v < minP) {
      minP = v;
      minI = i;
    }
  }
  endHand(minI, true);
}

/* ── HUMAN ACTIONS ── */
function tileClick(idx) {
  if (G.cur !== G.localPlayerId || G.over || isSpectator) {
    return;
  }
  var p = G.players[G.localPlayerId];
  var oL = G.head.val;
  var oR = G.tail.val;
  var valid = validMoves(p.hand, oL, oR, G.isFirst);

  if (valid.indexOf(idx) === -1) {
    SFX.bad();
    return;
  }
  SFX.click();
  var t = p.hand[idx];

  if (G.isFirst) {
    placeChain(p, idx, 'R');
    afterHuman(p);
    return;
  }

  var canL = (t.a === oL || t.b === oL);
  var canR = (t.a === oR || t.b === oR);

  if (canL && canR && oL !== oR) {
    SEL = idx;
    renderHand(valid);
    document.getElementById('sbL').textContent = '◀ Left (' + oL + ')';
    document.getElementById('sbR').textContent = 'Right (' + oR + ') ▶';
    document.getElementById('sbar').classList.remove('off');
    setSt('🔀', 'Choose which end of the chain to play on:');
  } else {
    SEL = -1;
    placeChain(p, idx, canL ? 'L' : 'R');
    afterHuman(p);
  }
}

function doSide(side) {
  if (SEL === -1) {
    return;
  }
  SFX.click();
  var p = G.players[G.localPlayerId];
  hideSB();
  placeChain(p, SEL, side);
  SEL = -1;
  afterHuman(p);
}

function cancelSide() {
  SFX.click();
  SEL = -1;
  hideSB();
}

function hideSB() {
  document.getElementById('sbar').classList.add('off');
}

function afterHuman(p) {
  hideSB();
  SEL = -1;
  stopTimer();
  if (p.hand.length === 0) {
    endHand(G.localPlayerId, false);
    return;
  }
  if (isBlocked()) {
    blockEnd();
    return;
  }
  if (G.isMultiplayer) {
    mpSyncGameState();
  }
  setTimeout(nextPlayer, 360);
}

function playerDraw() {
  if (G.cur !== G.localPlayerId || G.over || isSpectator) {
    return;
  }
  var p = G.players[G.localPlayerId];
  var oL = G.head.val;
  var oR = G.tail.val;
  var valid = validMoves(p.hand, oL, oR, G.isFirst);

  if (valid.length > 0) {
    SFX.bad();
    setSt('⚠️', 'You have playable tiles — tap a glowing one!');
    var tls = document.querySelectorAll('.tile.play');
    for (var i = 0; i < tls.length; i++) {
      (function(el) {
        el.style.transform = 'translateY(-13px) scale(1.1)';
        setTimeout(function() {
          el.style.transform = '';
        }, 300);
      })(tls[i]);
    }
    return;
  }

  if (G.variant === 'block') {
    G.passStreak = (G.passStreak || 0) + 1;
    setSt('⏭️', 'Block game — no drawing. Passing.');
    SFX.pass();
    setTimeout(function() {
      if (isBlocked() || G.passStreak >= G.players.length) {
        blockEnd();
        return;
      }
      if (G.isMultiplayer) {
        mpSyncGameState();
      }
      nextPlayer();
    }, 900);
    return;
  }

  if (!byardOk()) {
    G.passStreak = (G.passStreak || 0) + 1;
    setSt('⏭️', 'Boneyard empty — passing your turn.');
    SFX.pass();
    setTimeout(function() {
      if (isBlocked() || G.passStreak >= G.players.length) {
        blockEnd();
        return;
      }
      if (G.isMultiplayer) {
        mpSyncGameState();
      }
      nextPlayer();
    }, 900);
    return;
  }

  var drawn = drawTile(p);
  if (drawn) {
    toast('Drew: ' + drawn.a + '-' + drawn.b);
    var v2 = validMoves(p.hand, G.head.val, G.tail.val, G.isFirst);
    renderHand(v2);
    setSt(v2.length ? '✅' : '🃏', v2.length ? 'Tile drawn! Tap it to play.' : 'No match — draw again or wait.');
  }
}

/* ── RENDER FUNCTIONS ── */
function renderBoard() {
  var board = document.getElementById('board');
  board.innerHTML = '';
  if (!G.chain || !G.chain.length) {
    return;
  }
  var minX = Infinity;
  var maxX = -Infinity;
  var minY = Infinity;
  var maxY = -Infinity;
  for (var i = 0; i < G.chain.length; i++) {
    var rec = G.chain[i];
    var isVert = (rec.h > rec.w);
    var el = mkTile(rec.a, rec.b, { horiz: !isVert, board: true });
    el.classList.add('btile');
    el.style.left = rec.x + 'px';
    el.style.top = rec.y + 'px';
    el.style.width = rec.w + 'px';
    el.style.height = rec.h + 'px';
    if (ANIMATIONS_ENABLED) {
      el.style.animationDelay = (i * 18) + 'ms';
    }
    board.appendChild(el);
    minX = Math.min(minX, rec.x);
    maxX = Math.max(maxX, rec.x + rec.w);
    minY = Math.min(minY, rec.y);
    maxY = Math.max(maxY, rec.y + rec.h);
  }
  if (ANIMATIONS_ENABLED) {
    centerOnChain(minX, maxX, minY, maxY);
  }
}

/* ── ZOOM/PAN ── */
var zoom = 1;
var panX = 0;
var panY = 0;
var ZOOM_MIN = 0.25;
var ZOOM_MAX = 3;

function applyTransform() {
  var bc = document.getElementById('bcanvas');
  if (!bc) {
    return;
  }
  panX = Math.max(-3000, Math.min(3000, panX));
  panY = Math.max(-2000, Math.min(2000, panY));
  bc.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  var pct = document.getElementById('zoom-pct');
  if (pct) {
    pct.textContent = Math.round(zoom * 100) + '%';
  }
}

function doZoom(factor, cx, cy) {
  var bvp = document.getElementById('bvp');
  if (!bvp) {
    return;
  }
  if (cx === undefined) {
    cx = bvp.clientWidth / 2;
    cy = bvp.clientHeight / 2;
  }
  var newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom * factor));
  var ratio = newZoom / zoom;
  panX = cx - (cx - panX) * ratio;
  panY = cy - (cy - panY) * ratio;
  zoom = newZoom;
  applyTransform();
}

function resetZoom() {
  zoom = 1;
  var bvp = document.getElementById('bvp');
  if (!bvp) {
    panX = 0;
    panY = 0;
    applyTransform();
    return;
  }
  panX = bvp.clientWidth / 2 - BCX;
  panY = bvp.clientHeight / 2 - BCY;
  applyTransform();
}

function centerOnChain(minX, maxX, minY, maxY) {
  var bvp = document.getElementById('bvp');
  if (!bvp) {
    return;
  }
  var chainCX = (minX + maxX) / 2;
  var chainCY = (minY + maxY) / 2;
  var targetPanX = bvp.clientWidth / 2 - chainCX * zoom;
  var targetPanY = bvp.clientHeight / 2 - chainCY * zoom;
  panX = panX + (targetPanX - panX) * .35;
  panY = panY + (targetPanY - panY) * .35;
  applyTransform();
}

/* ── INPUT HANDLERS ── */
(function() {
  var bvpEl = null;
  function getBVP() {
    if (!bvpEl) {
      bvpEl = document.getElementById('bvp');
    }
    return bvpEl;
  }

  document.addEventListener('wheel', function(e) {
    var b = getBVP();
    if (!b || !b.contains(e.target)) {
      return;
    }
    e.preventDefault();
    var rect = b.getBoundingClientRect();
    var cx = e.clientX - rect.left;
    var cy = e.clientY - rect.top;
    var factor = e.deltaY < 0 ? 1.1 : 0.909;
    doZoom(factor, cx, cy);
  }, { passive: false });

  var dn = false;
  var lx, ly;
  document.addEventListener('mousedown', function(e) {
    var b = getBVP();
    if (!b || !b.contains(e.target)) {
      return;
    }
    if (e.target.closest && e.target.closest('.tile')) {
      return;
    }
    dn = true;
    lx = e.clientX;
    ly = e.clientY;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!dn) {
      return;
    }
    var dx = e.clientX - lx;
    var dy = e.clientY - ly;
    panX += dx;
    panY += dy;
    lx = e.clientX;
    ly = e.clientY;
    applyTransform();
  });
  document.addEventListener('mouseup', function() {
    dn = false;
  });
  document.addEventListener('mouseleave', function() {
    dn = false;
  });

  var t1 = null;
  var t2 = null;
  var lastDist = null;
  var lastMx, lastMy;
  document.addEventListener('touchstart', function(e) {
    var b = getBVP();
    if (!b || !b.contains(e.target)) {
      return;
    }
    if (e.touches.length === 1 && e.target.closest && e.target.closest('.tile.play')) {
      return;
    }
    e.preventDefault();
    if (e.touches.length === 1) {
      t1 = e.touches[0];
      t2 = null;
      lastDist = null;
      lastMx = t1.clientX;
      lastMy = t1.clientY;
    } else if (e.touches.length === 2) {
      t1 = e.touches[0];
      t2 = e.touches[1];
      lastDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
    }
  }, { passive: false });
  document.addEventListener('touchmove', function(e) {
    var b = getBVP();
    if (!b || !b.contains(e.target)) {
      return;
    }
    e.preventDefault();
    if (e.touches.length === 2 && t2 !== null) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastDist !== null) {
        var factor = d / lastDist;
        var rect = b.getBoundingClientRect();
        var mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left;
        var my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top;
        doZoom(factor, mx, my);
      }
      lastDist = d;
    } else if (e.touches.length === 1 && t2 === null) {
      var dx = e.touches[0].clientX - lastMx;
      var dy = e.touches[0].clientY - lastMy;
      panX += dx;
      panY += dy;
      lastMx = e.touches[0].clientX;
      lastMy = e.touches[0].clientY;
      applyTransform();
    }
  }, { passive: false });
  document.addEventListener('touchend', function(e) {
    if (e.touches.length === 0) {
      t1 = null;
      t2 = null;
      lastDist = null;
    } else if (e.touches.length === 1) {
      t2 = null;
      lastDist = null;
      t1 = e.touches[0];
      lastMx = t1.clientX;
      lastMy = t1.clientY;
    }
  }, { passive: false });
})();

/* ── RENDER HELPERS ── */
function renderHand(validSet) {
  validSet = validSet || [];
  var ph = document.getElementById('ph');
  ph.innerHTML = '';
  var p = G.players[G.localPlayerId];
  if (!p || isSpectator) {
    return;
  }
  var vs = {};
  for (var i = 0; i < validSet.length; i++) {
    vs[validSet[i]] = true;
  }
  for (var i = 0; i < p.hand.length; i++) {
    (function(t, idx) {
      var play = !!vs[idx];
      var sel = (SEL === idx);
      var el = mkTile(t.a, t.b, {
        playable: play,
        selected: sel,
        onclick: play ? function() {
          tileClick(idx);
        } : null
      });
      el.title = t.a + '-' + t.b + (play ? ' — click to play' : '');
      el.style.animation = 'tpl .28s cubic-bezier(.34,1.56,.64,1) ' + (idx * 36) + 'ms both';
      ph.appendChild(el);
    })(p.hand[i], i);
  }
}

function renderBotZones() {
  for (var zi = 0; zi < BZ_IDS.length; zi++) {
    var z = document.getElementById(BZ_IDS[zi]);
    if (z) {
      z.style.display = 'none';
    }
  }
  var slots = BZ_SLOTS[Math.max(1, (G.players ? G.players.length - 1 : 1))] || ['bz0'];
  var slotIdx = 0;
  for (var b = 0; b < (G.players || []).length; b++) {
    if (b === G.localPlayerId) {
      continue;
    }
    var p = G.players[b];
    var zid = slots[slotIdx];
    var zone = document.getElementById(zid);
    if (!zone || !p || slotIdx >= slots.length) {
      continue;
    }
    zone.style.cssText = 'display:flex;' + BZ_STYLES[zid];
    zone.innerHTML = '<div class="bzav" id="av-' + p.id + '">' + p.emoji + '</div>' +
      '<div class="bzinfo"><div class="bzname" id="bn-' + p.id + '">' + p.name + '</div>' +
      '<div class="bzcnt" id="bc-' + p.id + '">' + p.hand.length + ' tiles</div></div>' +
      '<div class="bzh" id="bh-' + p.id + '"></div>';
    fillBotHand(p);
    slotIdx++;
  }
}

function renderBotHands() {
  for (var i = 0; i < G.players.length; i++) {
    var p = G.players[i];
    if (i === G.localPlayerId) {
      continue;
    }
    var bn = document.getElementById('bn-' + p.id);
    var bc = document.getElementById('bc-' + p.id);
    if (bn) {
      bn.firstChild.nodeValue = p.name;
    }
    if (bc) {
      bc.textContent = p.hand.length + ' tiles';
    }
    fillBotHand(p);
  }
}

function fillBotHand(p) {
  var hel = document.getElementById('bh-' + p.id);
  if (!hel) {
    return;
  }
  hel.innerHTML = '';
  for (var i = 0; i < p.hand.length; i++) {
    var b = document.createElement('div');
    b.className = 'btbk';
    hel.appendChild(b);
  }
}

function setBotThinking(pid, show) {
  for (var i = 0; i < G.players.length; i++) {
    var p = G.players[i];
    var av = document.getElementById('av-' + p.id);
    var bn = document.getElementById('bn-' + p.id);
    if (av) {
      if (show && p.id === pid) {
        av.classList.add('on');
      } else {
        av.classList.remove('on');
      }
    }
    if (bn) {
      var td = bn.querySelector('.tdots');
      if (show && p.id === pid) {
        if (!td) {
          var d = document.createElement('span');
          d.className = 'tdots';
          d.innerHTML = '<span></span><span></span><span></span>';
          bn.appendChild(d);
        }
      } else if (td) {
        td.remove();
      }
    }
  }
}

function renderBoneyard() {
  var cnt = document.getElementById('by-count');
  var pile = document.getElementById('byp');
  if (!cnt || !pile) {
    return;
  }
  cnt.textContent = G.boneyard ? G.boneyard.length : '';
  var ok = byardOk();
  pile.style.opacity = ok ? '1' : '0.2';
  pile.style.pointerEvents = ok ? 'auto' : 'none';
  pile.title = ok ? 'Click to draw (' + G.boneyard.length + ' left)' : 'Boneyard exhausted';
}

function renderHUD() {
  var el = document.getElementById('hscores');
  el.innerHTML = '';
  for (var i = 0; i < G.players.length; i++) {
    var p = G.players[i];
    var c = document.createElement('div');
    c.className = 'chip' + (p.id === G.cur ? ' act' : '') + (G.isMultiplayer ? ' mp-chip' : '');
    var emoji = (i === G.localPlayerId) ? '🧑' : (p.emoji || '🧑');
    c.innerHTML = '<span style="margin-right:2px">' + emoji + '</span>' +
      '<span class="cn">' + p.name + '</span>' +
      '<span class="cs">' + p.score + 'pts</span>' +
      '<span class="ct">[' + p.hand.length + ']</span>';
    el.appendChild(c);
  }
}

function renderTurnBadge(p) {
  var tb = document.getElementById('tbadge');
  var txt = document.getElementById('tbadge-txt');
  if (!p) {
    if (tb) {
      tb.classList.add('off');
    }
    return;
  }
  tb.classList.remove('off');
  var you = (p.id === G.localPlayerId);
  tb.className = (you ? 'yours' : 'theirs');
  tb.id = 'tbadge';
  if (txt) {
    txt.textContent = you ? 'YOUR TURN' : (p.name + "'s Turn");
  }
}

function setSt(icon, msg) {
  var ic = document.getElementById('stat-ic');
  var tx = document.getElementById('stat-txt');
  if (ic) {
    ic.textContent = icon || '⏳';
  }
  if (tx) {
    tx.textContent = msg || '';
  }
  var st = document.getElementById('stat');
  if (st) {
    st.classList.remove('stfl');
    void st.offsetWidth;
    st.classList.add('stfl');
  }
}

function toast(msg) {
  var wrap = document.getElementById('toasts');
  var el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function() {
    el.classList.add('out');
    setTimeout(function() {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    }, 280);
  }, 2600);
}

function scorePop(n) {
  var el = document.createElement('div');
  el.className = 'spop';
  el.textContent = '+' + n + '!';
  el.style.left = (28 + Math.random() * 42) + '%';
  el.style.top = '44%';
  document.body.appendChild(el);
  setTimeout(function() {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, 1350);
}

function launchConfetti() {
  var cv = document.getElementById('cnfc');
  var ctx = cv.getContext('2d');
  cv.width = cv.offsetWidth || 400;
  cv.height = cv.offsetHeight || 360;
  var W = cv.width;
  var H = cv.height;
  var pcs = [];
  var fr = 0;
  for (var i = 0; i < 88; i++) {
    pcs.push({
      x: Math.random() * W,
      y: -8 - Math.random() * 75,
      w: 5 + Math.random() * 8,
      h: 3 + Math.random() * 4,
      rot: Math.random() * 360,
      vx: (Math.random() - .5) * 3.2,
      vy: 1.8 + Math.random() * 3.2,
      vr: (Math.random() - .5) * 7,
      col: 'hsl(' + Math.floor(Math.random() * 360) + ',78%,64%)',
      a: 1
    });
  }
  function draw() {
    ctx.clearRect(0, 0, W, H);
    var alive = false;
    for (var i = 0; i < pcs.length; i++) {
      var p = pcs[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      if (p.y > H) {
        p.a -= .05;
      }
      if (p.a > 0) {
        alive = true;
      }
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.a);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.col;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (alive && fr++ < 200) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, W, H);
    }
  }
  draw();
}

function showGO(winIdx, bonus, blocked) {
  var w = G.players[winIdx];
  var youWin = (w.id === G.localPlayerId);
  document.getElementById('go-trophy').textContent = youWin ? '🏆' : (w.emoji || '🧑');
  document.getElementById('go-title').textContent = youWin ? 'You Win!' : (w.name + ' Wins!');
  document.getElementById('go-msg').textContent =
    (blocked ? 'Game blocked — fewest pips wins! ' : (youWin ? 'You played all tiles! ' : (w.name + ' played all tiles. '))) +
    'Bonus: +' + bonus + ' points.';

  var sc = document.getElementById('go-sc');
  sc.innerHTML = '<div class="grow" style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(201,168,76,.5);padding-bottom:4px"><span>Player</span><span>Score &amp; Pips</span></div>';
  var sorted = G.players.slice().sort(function(a, b) {
    return b.score - a.score;
  });
  for (var i = 0; i < sorted.length; i++) {
    var p = sorted[i];
    var r = document.createElement('div');
    r.className = 'grow' + (p.id === winIdx ? ' w' : '');
    r.innerHTML = '<div class="grow-l"><span>' + ((p.id === G.localPlayerId) ? '🧑' : (p.emoji || '🧑')) + '</span><span>' + p.name + '</span>' + (p.id === winIdx ? '<span style="font-size:.7rem">🥇</span>' : '') + '</div>' +
      '<span>' + p.score + ' pts <span class="grow-pips">(' + hpip(p) + ' pips)</span></span>';
    sc.appendChild(r);
  }

  document.getElementById('gov').classList.remove('off');
  document.getElementById('go-primary-btn').textContent = 'Play Again';
  document.getElementById('go-primary-btn').onclick = goMenu;

  if (G.isMultiplayer && !isSpectator) {
    document.getElementById('go-rematch-btn').style.display = 'block';
    document.getElementById('go-primary-btn').style.display = 'none';
  } else {
    document.getElementById('go-rematch-btn').style.display = 'none';
    document.getElementById('go-primary-btn').style.display = 'block';
  }

  if (youWin) {
    setTimeout(launchConfetti, 220);
  }
  stopTimer();
}

/* ── REMATCH ── */
function mpRequestRematch() {
  if (!mpRoomId) {
    return;
  }
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  window.firebaseUpdate(roomRef, {
    rematchRequestedBy: mpPlayerId,
    rematchResponses: {}
  });
  document.getElementById('go-rematch-btn').style.display = 'none';
  document.getElementById('go-msg').textContent += ' Rematch requested! Waiting for players...';
}

function mpAcceptRematch() {
  if (!mpRoomId) {
    return;
  }
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  window.firebaseUpdate(roomRef, {
    ['rematchResponses/' + mpPlayerId]: true
  });
  document.getElementById('rematch-bar').classList.add('off');
}

function mpDeclineRematch() {
  mpLeaveLobby();
  goMenu();
}

/* ── EMOJI REACTIONS ── */
function sendEmoji(emoji) {
  if (!isSpectator && !G.isMultiplayer) {
    return;
  }
  var el = document.createElement('div');
  el.className = 'emoji-float';
  el.textContent = emoji;
  el.style.left = (20 + Math.random() * 60) + '%';
  el.style.top = (30 + Math.random() * 40) + '%';
  document.body.appendChild(el);
  setTimeout(function() {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }, 2600);
  if (mpRoomId && window.firebaseDB) {
    var reactRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId + '/reactions');
    window.firebasePush(reactRef, {
      emoji: emoji,
      playerId: mpPlayerId,
      timestamp: Date.now()
    });
  }
}

/* ── SPECTATOR MODE ── */
function openSpectateList() {
  document.getElementById('spectate-list-modal').classList.remove('off');
  loadSpectateRooms();
}

function closeSpectateList() {
  document.getElementById('spectate-list-modal').classList.add('off');
}

function loadSpectateRooms() {
  if (!window.firebaseDB) {
    document.getElementById('spec-rooms-list').innerHTML = '<p style="text-align:center;color:var(--txt-dim)">Firebase not connected</p>';
    return;
  }
  var roomsRef = window.firebaseRef(window.firebaseDB, 'rooms');
  window.firebaseGet(roomsRef).then(function(snapshot) {
    var html = '';
    if (!snapshot.exists()) {
      html = '<p style="text-align:center;color:var(--txt-dim)">No active games right now</p>';
    } else {
      var rooms = snapshot.val();
      var keys = Object.keys(rooms);
      var found = false;
      for (var i = 0; i < keys.length; i++) {
        var r = rooms[keys[i]];
        if (r.status === 'playing' && r.isPublic !== false) {
          found = true;
          var players = r.players ? Object.keys(r.players).length : 0;
          html += '<div class="spec-room"><span class="sr-code">' + keys[i] + '</span><span class="sr-info">' + players + ' players · ' + ((r.gameState && r.gameState.variant) || 'draw') + '</span><button class="sr-btn" onclick="mpSpectateRoom(\'' + keys[i] + '\')">👁️ Watch</button></div>';
        }
      }
      if (!found) {
        html = '<p style="text-align:center;color:var(--txt-dim)">No active games right now</p>';
      }
    }
    document.getElementById('spec-rooms-list').innerHTML = html;
  });
}

function mpSpectateRoom(code) {
  closeSpectateList();
  document.getElementById('MS').classList.add('off');
  document.getElementById('ML').classList.add('off');
  document.getElementById('GS').classList.remove('off');
  isSpectator = true;
  mpRoomId = code;
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + code);
  window.firebaseGet(roomRef).then(function(snapshot) {
    if (!snapshot.exists() || snapshot.val().status !== 'playing') {
      toast('Game not available');
      goMenu();
      return;
    }
    var data = snapshot.val();
    var gs = data.gameState;
    G = {
      players: gs.players.map(function(p) {
        return Object.assign({}, p, { bot: false });
      }),
      boneyard: gs.boneyard,
      chain: gs.chain || [],
      head: gs.head || { x: BCX, y: BCY, dir: 'L', val: null },
      tail: gs.tail || { x: BCX, y: BCY, dir: 'R', val: null },
      cur: gs.cur,
      isFirst: gs.isFirst,
      over: gs.over,
      passStreak: gs.passStreak || 0,
      isMultiplayer: true,
      variant: gs.variant || 'draw',
      isSpectator: true,
      localPlayerId: -1,
      numBots: 0
    };
    SEL = -1;
    resetZoom();
    renderBotZones();
    renderBoard();
    renderBoneyard();
    renderHUD();
    document.getElementById('ph').innerHTML = '';
    document.getElementById('emoji-picker').classList.remove('off');
    document.getElementById('ph-label').textContent = '👁️ SPECTATING — Send reactions!';
    setSt('👁️', 'Spectating room ' + code);
    mpListenForPlayers(code);
  });
}

/* ── MULTIPLAYER ── */
function generateRoomCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  var code = '';
  for (var i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function openMultiplayerLobby(variant) {
  SFX.click();
  document.getElementById('MS').classList.add('off');
  document.getElementById('ML').classList.remove('off');
  
  var roomCodeDisplay = document.getElementById('room-code-display');
  if (roomCodeDisplay) {
    roomCodeDisplay.innerHTML = '----<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:none">📋</button>';
  }
  
  var roomPlayers = document.getElementById('room-players');
  if (roomPlayers) {
    roomPlayers.innerHTML = '<div class="room-player">Create or join a room</div>';
  }
  
  var lobbyStatus = document.getElementById('lobby-status');
  if (lobbyStatus) {
    lobbyStatus.textContent = 'Create a room or join an existing one';
  }
  
  var btnReady = document.getElementById('btn-ready');
  if (btnReady) {
    btnReady.disabled = true;
  }
  
  var btnStart = document.getElementById('btn-start');
  if (btnStart) {
    btnStart.disabled = true;
  }
  
  var roomInput = document.getElementById('room-input');
  if (roomInput) {
    roomInput.value = '';
  }
  
  var copyBtn = document.getElementById('copy-btn');
  if (copyBtn) {
    copyBtn.style.display = 'none';
  }
  
  if (!mpPlayerId) {
    mpPlayerId = PLAYER_ID || ('player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
  }
  
  mpVariant = variant || 'draw';
  
  var subtitles = {
    draw: 'Classic Draw Game',
    block: 'Block Game — No Drawing',
    allfives: 'All Fives — Score During Play'
  };
  
  var mlSubtitle = document.getElementById('ml-subtitle');
  if (mlSubtitle) {
    mlSubtitle.textContent = subtitles[mpVariant] || 'Online Multiplayer';
  }
}

function mpCreateRoom() {
  if (!window.firebaseDB) {
    toast('Firebase not loaded.');
    return;
  }
  var roomCode = generateRoomCode();
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
  var playerName = USERNAME || 'Player';
  var roomData = {
    code: roomCode,
    players: {
      [mpPlayerId]: {
        name: playerName,
        ready: false,
        hand: [],
        score: 0,
        joinedAt: window.firebaseServerTimestamp()
      }
    },
    hostId: mpPlayerId,
    status: 'waiting',
    gameState: null,
    isPublic: true,
    variant: mpVariant,
    createdAt: window.firebaseServerTimestamp()
  };

  window.firebaseSet(roomRef, roomData).then(function() {
    mpRoomId = roomCode;
    var roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay) {
      roomCodeDisplay.innerHTML = roomCode + '<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:inline-block">📋</button>';
    }
    var lobbyStatus = document.getElementById('lobby-status');
    if (lobbyStatus) {
      lobbyStatus.textContent = 'Room created! Share the code: ' + roomCode;
    }
    var btnReady = document.getElementById('btn-ready');
    if (btnReady) {
      btnReady.disabled = false;
    }
    var btnStart = document.getElementById('btn-start');
    if (btnStart) {
      btnStart.disabled = false;
    }
    window.location.hash = 'room=' + roomCode;
    mpListenForPlayers(roomCode);
    toast('🎲 Room ' + roomCode + ' created!');
    window.firebaseOnDisconnect(window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode + '/players/' + mpPlayerId)).remove();
  }).catch(function(err) {
    toast('❌ Error: ' + err.message);
  });
}

function mpJoinRoom() {
  var code = document.getElementById('room-input').value.toUpperCase().trim();
  if (code.length !== 4) {
    toast('Enter a valid 4-letter code');
    return;
  }
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + code);
  window.firebaseGet(roomRef).then(function(snapshot) {
    if (!snapshot.exists()) {
      toast('❌ Room not found');
      return;
    }
    var data = snapshot.val();
    if (data.status !== 'waiting') {
      toast('❌ Game already started');
      return;
    }
    if (Object.keys(data.players || {}).length >= 4) {
      toast('❌ Room is full (max 4)');
      return;
    }
    var playerName = USERNAME || 'Player';
    var updateData = {};
    updateData['players/' + mpPlayerId] = {
      name: playerName,
      ready: false,
      hand: [],
      score: 0,
      joinedAt: window.firebaseServerTimestamp()
    };
    window.firebaseUpdate(roomRef, updateData).then(function() {
      mpRoomId = code;
      var roomCodeDisplay = document.getElementById('room-code-display');
      if (roomCodeDisplay) {
        roomCodeDisplay.innerHTML = code + '<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:inline-block">📋</button>';
      }
      var lobbyStatus = document.getElementById('lobby-status');
      if (lobbyStatus) {
        lobbyStatus.textContent = 'Joined room ' + code;
      }
      var btnReady = document.getElementById('btn-ready');
      if (btnReady) {
        btnReady.disabled = false;
      }
      var btnStart = document.getElementById('btn-start');
      if (btnStart) {
        btnStart.disabled = true;
      }
      window.location.hash = 'room=' + code;
      mpListenForPlayers(code);
      toast('🚪 Joined room ' + code + '!');
    });
  }).catch(function(err) {
    toast('❌ Error: ' + err.message);
  });
}

function copyRoomCode() {
  var code = document.getElementById('room-code-display').textContent.trim();
  if (code === '----') {
    return;
  }
  navigator.clipboard.writeText(code).then(function() {
    toast('📋 Code copied!');
  });
}

function mpListenForPlayers(roomCode) {
  mpCleanupListeners();
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
  var listener = window.firebaseOnValue(roomRef, function(snapshot) {
    if (!snapshot.exists()) {
      return;
    }
    var data = snapshot.val();
    if (!isSpectator) {
      mpUpdateLobbyUI(data);
    }
    if (data.status === 'playing' && data.gameState) {
      if (isSpectator || G.isMultiplayer) {
        mpOnGameStateUpdate(data.gameState, data);
      }
    }
    if (data.rematchRequestedBy && data.rematchResponses) {
      handleRematchUI(data);
    }
  });
  mpListeners.push({ ref: roomRef, listener: listener });
}

function mpUpdateLobbyUI(data) {
  var players = data.players || {};
  var playerList = Object.values(players);
  var container = document.getElementById('room-players');
  if (container) {
    container.innerHTML = playerList.map(function(p) {
      return '<div class="room-player joined">🧑 ' + p.name + (p.ready ? ' ✅' : '') + '</div>';
    }).join('');
  }
  var roomCodeDisplay = document.getElementById('room-code-display');
  if (roomCodeDisplay) {
    roomCodeDisplay.innerHTML = (data.code || '----') + '<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:inline-block">📋</button>';
  }
  var lobbyStatus = document.getElementById('lobby-status');
  if (lobbyStatus && data.hostId && data.players) {
    var playerCount = Object.keys(data.players).length;
    if (playerCount >= 2) {
      lobbyStatus.textContent = playerCount + ' players in room. Host can start the game!';
    } else {
      lobbyStatus.textContent = 'Waiting for more players...';
    }
  }
}

function mpToggleReady() {
  if (!mpRoomId) {
    return;
  }
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  window.firebaseGet(window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId + '/players/' + mpPlayerId + '/ready'))
    .then(function(snap) {
      var currentReady = snap.val() || false;
      window.firebaseUpdate(roomRef, {
        ['players/' + mpPlayerId + '/ready']: !currentReady
      });
      toast(!currentReady ? '✅ Ready!' : '⏳ Not ready');
    });
}

function mpStartGame() {
  if (!mpRoomId) {
    return;
  }
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  window.firebaseGet(roomRef).then(function(snapshot) {
    var data = snapshot.val();
    var players = data.players || {};
    var playerIds = Object.keys(players);
    if (playerIds.length < 2) {
      toast('Need at least 2 players');
      return;
    }
    var totalPlayers = playerIds.length;
    var handSize = totalPlayers <= 2 ? 7 : 5;
    var allTiles = shuffle(genSet());
    var gamePlayers = [];
    for (var i = 0; i < playerIds.length; i++) {
      var pid = playerIds[i];
      gamePlayers.push({
        id: i,
        mpId: pid,
        name: players[pid].name,
        hand: allTiles.splice(0, handSize),
        score: 0,
        ready: true
      });
    }
    var first = 0;
    var hd = -1;
    for (var pi = 0; pi < gamePlayers.length; pi++) {
      for (var ti = 0; ti < gamePlayers[pi].hand.length; ti++) {
        var t = gamePlayers[pi].hand[ti];
        if (t.a === t.b && t.a > hd) {
          hd = t.a;
          first = pi;
        }
      }
    }
    if (first === -1) {
      first = 0;
    }
    var gameState = {
      players: gamePlayers,
      boneyard: allTiles,
      chain: [],
      head: { x: BCX, y: BCY, dir: 'L', val: null },
      tail: { x: BCX, y: BCY, dir: 'R', val: null },
      cur: first,
      isFirst: true,
      over: false,
      passStreak: 0,
      variant: mpVariant,
      startedAt: Date.now()
    };
    window.firebaseUpdate(roomRef, {
      status: 'playing',
      gameState: gameState,
      rematchRequestedBy: null,
      rematchResponses: null
    });
    toast('▶ Game starting!');
  });
}

function mpOnGameStateUpdate(gameState, roomData) {
  if (!G || !G.isMultiplayer || isSpectator) {
    if (isSpectator) {
      G.chain = gameState.chain || [];
      G.head = gameState.head;
      G.tail = gameState.tail;
      G.cur = gameState.cur;
      G.isFirst = gameState.isFirst;
      G.over = gameState.over;
      G.passStreak = gameState.passStreak;
      G.boneyard = gameState.boneyard || [];
      if (gameState.players) {
        for (var i = 0; i < gameState.players.length; i++) {
          if (G.players[i]) {
            G.players[i].hand = gameState.players[i].hand;
            G.players[i].score = gameState.players[i].score;
          }
        }
      }
      renderBoard();
      renderBoneyard();
      renderHUD();
      renderBotHands();
    }
    return;
  }

  G.chain = gameState.chain || [];
  G.head = gameState.head;
  G.tail = gameState.tail;
  G.cur = gameState.cur;
  G.isFirst = gameState.isFirst;
  G.over = gameState.over;
  G.passStreak = gameState.passStreak;
  if (gameState.players) {
    for (var j = 0; j < gameState.players.length; j++) {
      if (G.players[j] && gameState.players[j].hand !== undefined) {
        G.players[j].hand = gameState.players[j].hand;
        G.players[j].score = gameState.players[j].score;
      }
    }
  }
  G.boneyard = gameState.boneyard || [];

  renderBoard();
  renderBoneyard();
  renderHUD();
  renderBotHands();

  if (G.cur === G.localPlayerId && !G.over) {
    renderTurnBadge(G.players[G.localPlayerId]);
    var valid = validMoves(G.players[G.localPlayerId].hand, G.head.val, G.tail.val, G.isFirst);
    renderHand(valid.length > 0 ? valid : []);
    setSt('🟡', 'Your turn — tap a glowing tile to play.');
    setBotThinking(-1, false);
    startTimer();
  } else {
    document.getElementById('ph').innerHTML = '';
    renderTurnBadge(G.players[G.cur]);
    setBotThinking(G.cur, true);
    stopTimer();
  }

  if (gameState.over) {
    stopTimer();
    for (var k = 0; k < G.players.length; k++) {
      if (G.players[k].hand.length === 0) {
        showGO(k, 0, false);
        break;
      }
    }
  }

  if (roomData && roomData.rematchRequestedBy) {
    handleRematchUI(roomData);
  }
}

function handleRematchUI(data) {
  if (!data.rematchRequestedBy || isSpectator) {
    return;
  }
  var bar = document.getElementById('rematch-bar');
  if (data.rematchRequestedBy === mpPlayerId) {
    bar.classList.remove('off');
    document.getElementById('rematch-status').textContent = 'Waiting for players...';
  } else {
    bar.classList.remove('off');
    document.getElementById('rematch-status').textContent = 'Rematch requested!';
  }
  if (data.rematchResponses && data.players) {
    var playerIds = Object.keys(data.players);
    var allAccepted = true;
    for (var i = 0; i < playerIds.length; i++) {
      if (playerIds[i] !== data.rematchRequestedBy && !data.rematchResponses[playerIds[i]]) {
        allAccepted = false;
        break;
      }
    }
    if (allAccepted) {
      mpStartGame();
      document.getElementById('rematch-bar').classList.add('off');
      document.getElementById('gov').classList.add('off');
    }
  }
}

function mpSyncGameState() {
  if (!mpRoomId || !G.isMultiplayer || isSpectator) {
    return;
  }
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  var gameState = {
    players: G.players.map(function(p) {
      return {
        id: p.id,
        mpId: p.mpId,
        name: p.name,
        hand: p.hand,
        score: p.score
      };
    }),
    boneyard: G.boneyard,
    chain: G.chain,
    head: G.head,
    tail: G.tail,
    cur: G.cur,
    isFirst: G.isFirst,
    over: G.over,
    passStreak: G.passStreak,
    variant: G.variant
  };
  window.firebaseUpdate(roomRef, { gameState: gameState });
}

function mpCleanupListeners() {
  mpListeners.forEach(function(l) {
    if (l.listener && l.ref) {
      window.firebaseOff(l.ref, 'value', l.listener);
    }
  });
  mpListeners = [];
}

function mpCleanup() {
  mpCleanupListeners();
  if (mpRoomId && mpPlayerId) {
    var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
    window.firebaseUpdate(roomRef, {
      ['players/' + mpPlayerId]: null
    }).then(function() {
      window.firebaseGet(roomRef).then(function(snap) {
        if (snap.exists()) {
          var data = snap.val();
          var players = data.players || {};
          if (Object.keys(players).length === 0) {
            window.firebaseSet(roomRef, null);
          }
        }
      });
    });
  }
  mpRoomId = null;
  isMultiplayer = false;
  isSpectator = false;
  stopTimer();
}

function mpLeaveLobby() {
  SFX.click();
  mpCleanup();
  document.getElementById('ML').classList.add('off');
  document.getElementById('MS').classList.remove('off');
  document.getElementById('emoji-picker').classList.add('off');
  window.location.hash = '';
}

/* ── SCREEN MANAGEMENT ── */
function goMenu() {
  SFX.click();
  if (TMR) {
    clearTimeout(TMR);
    TMR = null;
  }
  hideSB();
  SEL = -1;
  stopTimer();
  if (G.isMultiplayer) {
    mpCleanup();
  }
  G = {};
  var tb = document.getElementById('tbadge');
  if (tb) {
    tb.classList.add('off');
  }
  document.getElementById('MS').classList.remove('off');
  document.getElementById('GS').classList.add('off');
  document.getElementById('gov').classList.add('off');
  document.getElementById('ML').classList.add('off');
  document.getElementById('emoji-picker').classList.add('off');
  document.getElementById('rematch-bar').classList.add('off');
  document.getElementById('offline-modal').classList.add('off');
  document.getElementById('spectate-list-modal').classList.add('off');
  window.location.hash = '';
  isSpectator = false;
  var phLabel = document.getElementById('ph-label');
  if (phLabel) {
    phLabel.textContent = 'YOUR HAND — tap a glowing tile to play';
  }
}

function startGame(numBots) {
  SFX.click();
  SFX.shuffle();
  if (TMR) {
    clearTimeout(TMR);
    TMR = null;
  }
  hideSB();
  SEL = -1;
  isSpectator = false;
  isMultiplayer = false;
  mpRoomId = null;
  document.getElementById('MS').classList.add('off');
  document.getElementById('GS').classList.remove('off');
  document.getElementById('gov').classList.add('off');
  document.getElementById('ML').classList.add('off');
  document.getElementById('emoji-picker').classList.add('off');
  document.getElementById('rematch-bar').classList.add('off');
  var phLabel = document.getElementById('ph-label');
  if (phLabel) {
    phLabel.textContent = 'YOUR HAND — tap a glowing tile to play';
  }
  initGame(numBots, false, 'draw');
  renderBotZones();
  renderBoard();
  renderBoneyard();
  renderHUD();
  document.getElementById('ph').innerHTML = '';
  var tb = document.getElementById('tbadge');
  if (tb) {
    tb.classList.remove('off');
  }
  var fp = G.players[G.cur];
  setSt('🃏', 'Shuffling and dealing tiles…');
  setTimeout(function() {
    renderTurnBadge(fp);
    setSt(fp.id === 0 ? '🎯' : '⏳', fp.id === 0 ? 'You hold the highest double — you go first!' : (fp.name + ' goes first!'));
    setTimeout(runTurn, 1000);
  }, 600);
}

/* ── MODALS ── */
function openStats() {
  SFX.click();
  if (document.getElementById('statsmod')) {
    return;
  }
  var m = document.createElement('div');
  m.id = 'statsmod';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:scIn .3s ease';
  var wr = Math.max(0, STATS.wins + STATS.losses);
  m.innerHTML = '<div class="rulebox">' +
    '<h2>📊 Session Statistics</h2>' +
    '<div class="rb">' +
    '<p><b>Games Played:</b> ' + STATS.gamesPlayed + '</p>' +
    '<p><b>Rounds Played:</b> ' + STATS.roundsPlayed + '</p>' +
    '<p><b>Wins:</b> ' + STATS.wins + '</p>' +
    '<p><b>Losses:</b> ' + STATS.losses + '</p>' +
    '<p><b>Win Rate:</b> ' + (wr > 0 ? Math.round(STATS.wins / wr * 100) : 0) + '%</p>' +
    '<p><b>Tiles Played:</b> ' + STATS.tilesPlayed + '</p>' +
    '</div>' +
    '<button class="rulebtn" onclick="document.getElementById(\'statsmod\').remove()">Close</button>' +
    '</div>';
  document.body.appendChild(m);
}

function openRules() {
  SFX.click();
  if (document.getElementById('rulesmod')) {
    return;
  }
  var m = document.createElement('div');
  m.id = 'rulesmod';
  m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.86);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:scIn .3s ease';
  m.innerHTML = '<div class="rulebox">' +
    '<h2>📖 How to Play</h2>' +
    '<div class="rb">' +
    '<p><b>🎯 Objective:</b> Empty your hand first.</p>' +
    '<p><b>🃏 Setup:</b> 28 tiles. 2 players=7 tiles, 3+=5 tiles.</p>' +
    '<p><b>▶ First:</b> Highest double goes first.</p>' +
    '<p><b>🔗 Playing:</b> Match tile ends. Doubles go perpendicular.</p>' +
    '<p><b>🃏 Drawing:</b> No move? Draw from boneyard.</p>' +
    '<p><b>🚫 Block Game:</b> No drawing — pass if stuck.</p>' +
    '<p><b>✋ All Fives:</b> Score when board ends sum to 5.</p>' +
    '<p><b>👁️ Spectate:</b> Watch live games & send emoji reactions!</p>' +
    '<p><b>🔍 Zoom:</b> Pinch, scroll, drag to pan.</p>' +
    '</div>' +
    '<button class="rulebtn" onclick="document.getElementById(\'rulesmod\').remove()">Got it! ✓</button>' +
    '</div>';
  document.body.appendChild(m);
}

function renderDeco() {
  var el = document.getElementById('deco');
  if (!el) {
    return;
  }
  el.innerHTML = '';
  var pairs = [[6, 6], [4, 3], [1, 5], [3, 3], [5, 5], [2, 0], [6, 1]];
  for (var i = 0; i < pairs.length; i++) {
    (function(a, b, idx) {
      var t = mkTile(a, b, {});
      t.style.cssText = 'width:26px;height:50px;border-width:1.5px;cursor:default;flex-shrink:0;opacity:0;' +
        'transition:opacity .4s ease ' + idx * 78 + 'ms,transform .4s ease ' + idx * 78 + 'ms;transform:translateY(12px)';
      t.querySelectorAll('.d,.ds').forEach(function(d) {
        d.style.width = '4px';
        d.style.height = '4px';
      });
      el.appendChild(t);
      requestAnimationFrame(function() {
        requestAnimationFrame(function() {
          t.style.opacity = '1';
          t.style.transform = 'translateY(0)';
        });
      });
    })(pairs[i][0], pairs[i][1], i);
  }
}

/* ── LOADING ── */
(function() {
  initUsername();
  var bar = document.getElementById('lbar');
  var txt = document.getElementById('ltxt');
  var msgs = ['Shuffling tiles…', 'Polishing the felt…', 'Waking the bots…', 'Counting pips…', 'Ready!'];
  var pct = 0;
  var iv = setInterval(function() {
    pct += 5 + Math.random() * 17;
    if (pct > 100) {
      pct = 100;
    }
    bar.style.width = pct + '%';
    txt.textContent = msgs[Math.min(4, Math.floor(pct / 25))];
    if (pct >= 100) {
      clearInterval(iv);
      setTimeout(function() {
        if (!USERNAME) {
          // Wait for username
        } else {
          document.getElementById('LS').classList.add('off');
          document.getElementById('MS').classList.remove('off');
          renderDeco();
        }
      }, 340);
    }
  }, 58);
})();

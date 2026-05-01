/* ═══════════════════════════════════════════════════════════════
   DOMINOES — Complete JavaScript
   Multiplayer, Spectator, Timer, Variants, Animations, PWA,
   Voice Chat, Friends, Tile Skins, Drag & Drop, Fullscreen
   ═══════════════════════════════════════════════════════════════ */

/* ── ANIMATION ISOLATION FLAG ── */
const ANIMATIONS_ENABLED = true;

/* ── CONSTANTS ── */
const BCX = 2500;
const BCY = 1500;
const SNAKE_W = 600;
const SNAKE_H = 240;
const DEFAULT_TIMER = 30;
const ROOM_TIMEOUT = 30;

/* ── AUDIO ENGINE ── */
var AC = null;
var soundOn = true;

function getAC() {
  if (!AC) {
    try {
      AC = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {}
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
  } catch (e) {}
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
  } catch (e) {}
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
  if (hb) hb.textContent = soundOn ? '🔊' : '🔇';
  if (ms) ms.textContent = soundOn ? '🔊 Sound On' : '🔇 Sound Off';
  toast(soundOn ? '🔊 Sound enabled' : '🔇 Sound muted');
}

/* ── PARTICLES ── */
(function() {
  var cv = document.getElementById('pcv');
  if (!cv) return;
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
    if (!ctx) return;
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
  if (!rows.length) return dg;
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
var currentSkin = 'classic';

function mkTile(a, b, opts) {
  opts = opts || {};
  var el = document.createElement('div');
  var isH = opts.horiz;
  var brd = opts.board;
  el.className = 'tile ' + (isH ? (brd ? 'BH' : 'H') : (brd ? 'BV' : 'V'));
  el.classList.add('skin-' + currentSkin);
  if (opts.playable) el.classList.add('play');
  if (opts.selected) el.classList.add('sel');
  if (opts.draggable) {
    el.classList.add('draggable');
    el.draggable = true;
    el.setAttribute('data-tile-index', opts.tileIndex || '');
    el.addEventListener('dragstart', handleDragStart);
    el.addEventListener('dragend', handleDragEnd);
  }
  if (opts.onclick) el.addEventListener('click', opts.onclick);
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

function selectSkin(skin) {
  currentSkin = skin;
  localStorage.setItem('domino_skin', skin);
  var allTiles = document.querySelectorAll('.tile');
  allTiles.forEach(function(tile) {
    tile.classList.remove('skin-classic', 'skin-midnight', 'skin-forest', 'skin-ruby');
    tile.classList.add('skin-' + skin);
  });
  var dots = document.querySelectorAll('.skin-dot');
  dots.forEach(function(d) { d.classList.remove('active'); });
  var activeDot = document.querySelector('.skin-dot.' + skin);
  if (activeDot) activeDot.classList.add('active');
  toast('🎨 ' + skin.charAt(0).toUpperCase() + skin.slice(1) + ' skin selected!');
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
var selectedOnlineMode = 'draw';
var autoStartEnabled = false;
var roomTimeoutTimer = null;
var draggedTileIndex = null;
var friends = [];
var voiceMuted = true;
var localStream = null;
var peerConnections = {};

var STATS = {
  wins: 0,
  losses: 0,
  gamesPlayed: 0,
  tilesPlayed: 0,
  roundsPlayed: 0
};

var USERNAME = '';
var PLAYER_ID = '';

/* ── FULLSCREEN ── */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(function(e) {
      toast('Fullscreen not supported');
    });
  } else {
    document.exitFullscreen();
  }
}

/* ── FRIENDS SYSTEM ── */
function toggleFriendsPanel() {
  var panel = document.getElementById('friends-panel');
  if (panel) {
    panel.classList.toggle('open');
  }
}

function addFriend() {
  var input = document.getElementById('friend-name-input');
  if (!input) return;
  var name = input.value.trim();
  if (!name) return;
  if (friends.indexOf(name) !== -1) {
    toast('Already in your friends list!');
    return;
  }
  friends.push(name);
  input.value = '';
  saveFriends();
  renderFriendsList();
  toast('👥 ' + name + ' added!');
}

function saveFriends() {
  localStorage.setItem('domino_friends', JSON.stringify(friends));
}

function loadFriends() {
  var saved = localStorage.getItem('domino_friends');
  if (saved) {
    try {
      friends = JSON.parse(saved);
    } catch (e) {
      friends = [];
    }
  }
}

function renderFriendsList() {
  var list = document.getElementById('friends-list');
  if (!list) return;
  if (friends.length === 0) {
    list.innerHTML = '<p style="font-size:.65rem;color:var(--txt-dim);text-align:center">No friends added yet</p>';
    return;
  }
  list.innerHTML = friends.map(function(f) {
    return '<div class="friend-entry">' +
      '<span class="friend-name">🧑 ' + f + '</span>' +
      '<span class="friend-status offline">Offline</span>' +
      '<button class="invite-btn" onclick="inviteFriend(\'' + f + '\')">Invite</button>' +
      '</div>';
  }).join('');
}

function inviteFriend(name) {
  if (!mpRoomId) {
    toast('Create a room first to invite friends');
    return;
  }
  toast('📨 Invite sent to ' + name + '! Share code: ' + mpRoomId);
}

/* ── VOICE CHAT (WebRTC) ── */
function initVoiceChat() {
  if (!isMultiplayer || isSpectator) return;
  var voiceControls = document.getElementById('voice-controls');
  if (voiceControls) voiceControls.classList.remove('off');
}

function toggleVoiceMute() {
  voiceMuted = !voiceMuted;
  var btn = document.getElementById('voice-mute-btn');
  if (btn) {
    btn.textContent = voiceMuted ? '🔇' : '🎤';
    btn.classList.toggle('muted', voiceMuted);
  }
  if (localStream) {
    localStream.getAudioTracks().forEach(function(track) {
      track.enabled = !voiceMuted;
    });
  }
  toast(voiceMuted ? '🔇 Muted' : '🎤 Unmuted');
}

function startVoiceChat() {
  if (!isMultiplayer || isSpectator) return;
  navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
    localStream = stream;
    voiceMuted = false;
    var btn = document.getElementById('voice-mute-btn');
    if (btn) {
      btn.textContent = '🎤';
      btn.classList.remove('muted');
    }
    // In a full implementation, you'd establish peer connections here
    // using Firebase as a signaling server
    toast('🎤 Voice chat ready!');
  }).catch(function(err) {
    console.log('Voice chat not available:', err);
    toast('🎤 Voice chat unavailable');
  });
}

function stopVoiceChat() {
  if (localStream) {
    localStream.getTracks().forEach(function(track) {
      track.stop();
    });
    localStream = null;
  }
  Object.keys(peerConnections).forEach(function(key) {
    if (peerConnections[key]) peerConnections[key].close();
  });
  peerConnections = {};
}
/* ── USERNAME SYSTEM ── */
function initUsername() {
  var saved = localStorage.getItem('domino_username');
  var savedId = localStorage.getItem('domino_player_id');
  var savedSkin = localStorage.getItem('domino_skin');
  if (savedSkin) currentSkin = savedSkin;
  loadFriends();
  
  if (saved && savedId) {
    USERNAME = saved;
    PLAYER_ID = savedId;
    var modal = document.getElementById('username-modal');
    if (modal) modal.classList.add('off');
    showMenu();
    return;
  }
  PLAYER_ID = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
  var modal = document.getElementById('username-modal');
  if (modal) modal.classList.remove('off');
  var input = document.getElementById('uname-input');
  if (input) input.focus();
}

function saveUsername() {
  var input = document.getElementById('uname-input');
  if (!input) return;
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
  var modal = document.getElementById('username-modal');
  if (modal) modal.classList.add('off');
  SFX.click();
  showMenu();
}

function showMenu() {
  var ls = document.getElementById('LS');
  var ms = document.getElementById('MS');
  if (ls) ls.classList.add('off');
  if (ms) ms.classList.remove('off');
  var welcomeLabel = document.getElementById('welcome-label');
  if (welcomeLabel) welcomeLabel.textContent = 'Welcome, ' + USERNAME + '!';
  renderDeco();
  checkHashRoute();
  checkPageContext();
}

function checkPageContext() {
  // Prevent redirect loops
  if (window._pageContextChecked) return;
  window._pageContextChecked = true;
  
  var path = window.location.pathname;
  var params = new URLSearchParams(window.location.search);
  
  // If on game.html with room param, try to rejoin
  if (path.includes('game.html')) {
    var roomCode = params.get('room');
    var gameType = params.get('type');
    if (roomCode && gameType === 'multiplayer') {
      mpRoomId = roomCode;
      mpVariant = params.get('variant') || 'draw';
      isSpectator = params.get('spectate') === 'true';
      setTimeout(function() { rejoinGame(roomCode); }, 600);
      return;
    }
    if (gameType === 'offline') {
      var numBots = parseInt(params.get('bots')) || 1;
      setTimeout(function() { startGame(numBots); }, 400);
      return;
    }
  }
  
   // If on lobby.html, check for room param or auto-create
  if (path.includes('lobby.html')) {
    var lobbyRoom = params.get('room');
    var lobbyVariant = params.get('variant') || 'draw';
    mpVariant = lobbyVariant;
    if (lobbyRoom) {
      mpRoomId = lobbyRoom;
      setTimeout(function() { rejoinLobby(lobbyRoom); }, 500);
    } else {
      if (!mpPlayerId) mpPlayerId = PLAYER_ID || ('player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
      setTimeout(function() { mpCreateRoom(); }, 400);
    }
    return;
  }
  
  // If on join.html, check for room code
  if (path.includes('join.html')) {
    var joinCode = params.get('code');
    if (joinCode) {
      var input = document.getElementById('room-input');
      if (input) input.value = joinCode;
      setTimeout(function() { mpJoinRoom(); }, 600);
    }
    return;
  }
}

function checkHashRoute() {
  var hash = window.location.hash;
  if (!hash) return;
  if (hash.startsWith('#room=')) {
    var code = hash.replace('#room=', '').toUpperCase();
    if (code.length === 4) {
      window.location.href = 'join.html?code=' + code;
    }
  } else if (hash.startsWith('#spectate=')) {
    var specCode = hash.replace('#spectate=', '').toUpperCase();
    if (specCode.length === 4) {
      openSpectateList();
      setTimeout(function() { mpSpectateRoom(specCode); }, 800);
    }
  }
}

window.addEventListener('hashchange', checkHashRoute);

/* ── NAVIGATION HELPERS ── */
function goToMenu() {
  window.location.href = 'index.html';
}

function goToLobby(roomCode, variant) {
  window.location.href = 'lobby.html?room=' + roomCode + '&variant=' + (variant || 'draw');
}

function goToGame(roomCode, variant, spectate) {
  var url = 'game.html?room=' + roomCode + '&type=multiplayer&variant=' + (variant || 'draw');
  if (spectate) url += '&spectate=true';
  window.location.href = url;
}

function goToOfflineGame(numBots) {
  window.location.href = 'game.html?type=offline&bots=' + numBots;
}

/* ── REJOIN FUNCTIONS ── */
function rejoinGame(roomCode) {
  if (!window.firebaseDB) return;
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
  window.firebaseGet(roomRef).then(function(snapshot) {
    if (!snapshot.exists()) {
      toast('Game no longer exists');
      setTimeout(function() { goToMenu(); }, 1000);
      return;
    }
    var data = snapshot.val();
    if (data.status === 'playing' && data.gameState) {
      mpRoomId = roomCode;
      isMultiplayer = true;
      if (!mpPlayerId) mpPlayerId = PLAYER_ID;
      // Re-add player to room
      var updateData = {};
      updateData['players/' + mpPlayerId] = {
        name: USERNAME,
        ready: true,
        hand: [],
        score: 0,
        reconnectedAt: window.firebaseServerTimestamp()
      };
      window.firebaseUpdate(roomRef, updateData).then(function() {
        var gs = data.gameState;
        // Find player's hand
        if (gs.players) {
          for (var i = 0; i < gs.players.length; i++) {
            if (gs.players[i].mpId === mpPlayerId) {
              G.localPlayerId = i;
              break;
            }
          }
        }
        if (G.localPlayerId === undefined) G.localPlayerId = 0;
        mpOnGameStarted(data);
        mpListenForPlayers(roomCode);
        if (isSpectator) {
          document.getElementById('emoji-picker').classList.remove('off');
        }
      });
    } else {
      toast('Game not available');
      setTimeout(function() { goToMenu(); }, 1000);
    }
  });
}

function rejoinLobby(roomCode) {
  if (!window.firebaseDB) return;
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
  window.firebaseGet(roomRef).then(function(snapshot) {
    if (!snapshot.exists() || snapshot.val().status !== 'waiting') {
      toast('Lobby no longer available');
      setTimeout(function() { goToMenu(); }, 1000);
      return;
    }
    mpRoomId = roomCode;
    if (!mpPlayerId) mpPlayerId = PLAYER_ID;
    var updateData = {};
    updateData['players/' + mpPlayerId] = {
      name: USERNAME,
      ready: false,
      hand: [],
      score: 0,
      reconnectedAt: window.firebaseServerTimestamp()
    };
    window.firebaseUpdate(roomRef, updateData).then(function() {
      var roomCodeDisplay = document.getElementById('room-code-display');
      if (roomCodeDisplay) roomCodeDisplay.innerHTML = roomCode + '<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:inline-block">📋</button>';
      var btnReady = document.getElementById('btn-ready');
      if (btnReady) btnReady.disabled = false;
      mpListenForPlayers(roomCode);
      toast('🔗 Reconnected to lobby');
    });
  });
}

/* ── OFFLINE MODAL ── */
function openOfflineModal() {
  var modal = document.getElementById('offline-modal');
  if (modal) modal.classList.remove('off');
  selectedOfflineMode = 1;
  var opts = document.querySelectorAll('.modal-option');
  opts.forEach(function(o, i) {
    o.classList.toggle('sel', i === 0);
  });
}

function selectOfflineMode(mode, el) {
  selectedOfflineMode = mode;
  var opts = document.querySelectorAll('#offline-modal .modal-option');
  opts.forEach(function(o) { o.classList.remove('sel'); });
  if (el) el.classList.add('sel');
}

function closeOfflineModal() {
  var modal = document.getElementById('offline-modal');
  if (modal) modal.classList.add('off');
}

function startOfflineGame() {
  var modal = document.getElementById('offline-modal');
  if (modal) modal.classList.add('off');
  goToOfflineGame(selectedOfflineMode);
}

/* ── ONLINE MODAL ── */
function openOnlineModal() {
  var modal = document.getElementById('online-modal');
  if (modal) modal.classList.remove('off');
  selectedOnlineMode = 'draw';
  var opts = document.querySelectorAll('#online-modal .modal-option');
  opts.forEach(function(o, i) {
    o.classList.toggle('sel', i === 0);
  });
}

function selectOnlineMode(mode, el) {
  selectedOnlineMode = mode;
  var opts = document.querySelectorAll('#online-modal .modal-option');
  opts.forEach(function(o) { o.classList.remove('sel'); });
  if (el) el.classList.add('sel');
}

function closeOnlineModal() {
  var modal = document.getElementById('online-modal');
  if (modal) modal.classList.add('off');
}

function createOnlineGame() {
  var modal = document.getElementById('online-modal');
  if (modal) modal.classList.add('off');
  mpVariant = selectedOnlineMode;
  if (!mpPlayerId) mpPlayerId = PLAYER_ID || ('player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
  window.location.href = 'lobby.html?variant=' + selectedOnlineMode;
}

/* ── JOIN MODAL ── */
function openJoinModal() {
  var modal = document.getElementById('join-modal');
  if (modal) modal.classList.remove('off');
  var input = document.getElementById('join-room-input');
  if (input) {
    input.value = '';
    input.focus();
  }
}

function closeJoinModal() {
  var modal = document.getElementById('join-modal');
  if (modal) modal.classList.add('off');
}

function joinRoomFromModal() {
  var input = document.getElementById('join-room-input');
  if (!input) return;
  var code = input.value.toUpperCase().trim();
  if (code.length !== 4) {
    toast('Enter a valid 4-letter code');
    return;
  }
  var modal = document.getElementById('join-modal');
  if (modal) modal.classList.add('off');
  if (!mpPlayerId) mpPlayerId = PLAYER_ID || ('player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5));
  window.location.href = 'join.html?code=' + code;
}

/* ── BOARD LAYOUT ENGINE ── */
var TW = 68;
var TH = 36;
var DW = 36;
var DH = 68;

function initGame(numBots, isMP, variant) {
  isMultiplayer = isMP || false;
  mpVariant = variant || 'draw';
  isSpectator = false;
  var tiles = shuffle(genSet());
  var total = isMP ? (G.multiplayerPlayers ? G.multiplayerPlayers.length : 2) : 1 + numBots;
  var hs = total <= 2 ? 7 : 5;
  var players = [];

  if (isMP && G.multiplayerPlayers) {
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
    if (G.localPlayerId === -1) G.localPlayerId = 0;
  } else if (isMP) {
    // Fallback for multiplayer without pre-loaded players
    for (var j = 0; j < total; j++) {
      players.push({
        id: j,
        name: j === 0 ? USERNAME : ('Player ' + (j + 1)),
        emoji: '🧑',
        color: '#4ddd88',
        bot: false,
        hand: tiles.splice(0, hs),
        score: 0
      });
    }
    G.localPlayerId = 0;
  } else {
    for (var k = 0; k < total; k++) {
      players.push({
        id: k,
        name: k === 0 ? USERNAME : BOTS[k - 1].name,
        emoji: k === 0 ? '🧑' : BOTS[k - 1].emoji,
        color: k === 0 ? '#4ddd88' : BOTS[k - 1].color,
        bot: k !== 0,
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
  if (first === -1) first = 0;

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
    isSpectator: false
  };
  SEL = -1;
  resetZoom();
  var emojiPicker = document.getElementById('emoji-picker');
  if (emojiPicker) emojiPicker.classList.add('off');
  var rematchBar = document.getElementById('rematch-bar');
  if (rematchBar) rematchBar.classList.add('off');
  var skinSelector = document.getElementById('skin-selector');
  if (skinSelector) skinSelector.classList.remove('off');
  applySkinToAll();
}

function applySkinToAll() {
  var allTiles = document.querySelectorAll('.tile');
  allTiles.forEach(function(tile) {
    tile.classList.remove('skin-classic', 'skin-midnight', 'skin-forest', 'skin-ruby');
    tile.classList.add('skin-' + currentSkin);
  });
}

function placeChain(player, tIdx, side) {
  if (!player || !player.hand[tIdx]) return;
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
  if (!valid.length) return false;

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
      if (t.a === oL || t.b === oL) sides.push('L');
      if (t.a === oR || t.b === oR) sides.push('R');
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

      if (newOpen === 6 || newOpen === 0) sc -= 4;
      if (G.variant === 'block') sc += (dbl ? 15 : 0);
      if (G.variant === 'allfives') {
        var testEnd = (sides[si] === 'L') ? G.tail.val : G.head.val;
        if ((newOpen + testEnd) % 5 === 0) sc += 10;
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
  if (!G.players) return 2;
  return G.players.length <= 2 ? 2 : 1;
}

function byardOk() {
  if (G.variant === 'block') return false;
  if (!G.boneyard) return false;
  return G.boneyard.length > getReserve();
}

function drawTile(p) {
  if (!byardOk()) return null;
  var t = G.boneyard.shift();
  p.hand.push(t);
  SFX.draw();
  renderBoneyard();
  return t;
}

/* ── BLOCKED CHECK ── */
function isBlocked() {
  if (byardOk()) return false;
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
      if (i !== winIdx) opp += hpip(G.players[i]);
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
      if (k !== winIdx) opp2 += hpip(G.players[k]);
    }
    bonus = rnd5(opp2);
  }

  w.score += bonus;

  if (winIdx === G.localPlayerId) {
    STATS.wins++;
    SFX.win();
    SFX.domino();
    checkAchievement('win');
  } else {
    STATS.losses++;
    SFX.lose();
  }

  STATS.gamesPlayed++;
  renderHUD();

  setTimeout(function() {
    showGO(winIdx, bonus, blocked);
  }, 350);

  stopVoiceChat();
}

/* ── ACHIEVEMENTS ── */
function checkAchievement(type) {
  var achievements = JSON.parse(localStorage.getItem('domino_achievements') || '{}');
  
  if (type === 'win') {
    if (STATS.wins >= 1 && !achievements.firstWin) {
      achievements.firstWin = true;
      toast('🏆 Achievement Unlocked: First Win!');
    }
    if (STATS.wins >= 10 && !achievements.tenWins) {
      achievements.tenWins = true;
      toast('🏆 Achievement Unlocked: 10 Wins! Ruby skin unlocked!');
    }
    if (STATS.tilesPlayed >= 100 && !achievements.hundredTiles) {
      achievements.hundredTiles = true;
      toast('🏆 Achievement Unlocked: Played 100 Tiles! Midnight skin unlocked!');
    }
    if (STATS.roundsPlayed >= 50 && !achievements.fiftyRounds) {
      achievements.fiftyRounds = true;
      toast('🏆 Achievement Unlocked: 50 Rounds! Forest skin unlocked!');
    }
  }
  
  localStorage.setItem('domino_achievements', JSON.stringify(achievements));
}

/* ── TIMER ── */
function startTimer() {
  if (isSpectator || G.cur !== G.localPlayerId) return;
  timerSeconds = DEFAULT_TIMER;
  var barWrap = document.getElementById('timer-bar-wrap');
  var bar = document.getElementById('timer-bar');
  if (!barWrap || !bar) return;
  barWrap.classList.remove('off');
  bar.style.width = '100%';
  bar.classList.remove('warn', 'danger');
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(function() {
    timerSeconds--;
    var pct = (timerSeconds / DEFAULT_TIMER) * 100;
    bar.style.width = pct + '%';
    if (timerSeconds <= 10) bar.classList.add('warn');
    if (timerSeconds <= 5) {
      bar.classList.add('danger');
      if (timerSeconds > 0) SFX.timerWarn();
    }
    if (timerSeconds <= 0) {
      stopTimer();
      if (G.cur === G.localPlayerId) playerDraw();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  var barWrap = document.getElementById('timer-bar-wrap');
  if (barWrap) barWrap.classList.add('off');
}

/* ── TURN ENGINE ── */
function nextPlayer() {
  G.cur = (G.cur + 1) % G.players.length;
  if (G.isMultiplayer && !isSpectator) mpSyncGameState();
  runTurn();
}

function runTurn() {
  if (G.over) return;
  var p = G.players[G.cur];
  renderHUD();
  renderTurnBadge(p);

  if (p.hand.length === 0) {
    if (!isSpectator) endHand(p.id, false);
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
      if (!byardOk()) break;
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
    setSt('🟡', 'Your turn — tap or drag a glowing tile to play.');
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
    if (G.isMultiplayer) mpSyncGameState();
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
  if (G.cur !== G.localPlayerId || G.over || isSpectator) return;
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
    var sbL = document.getElementById('sbL');
    var sbR = document.getElementById('sbR');
    var sbar = document.getElementById('sbar');
    if (sbL) sbL.textContent = '◀ Left (' + oL + ')';
    if (sbR) sbR.textContent = 'Right (' + oR + ') ▶';
    if (sbar) sbar.classList.remove('off');
    setSt('🔀', 'Choose which end of the chain to play on:');
  } else {
    SEL = -1;
    placeChain(p, idx, canL ? 'L' : 'R');
    afterHuman(p);
  }
}

function doSide(side) {
  if (SEL === -1) return;
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
  var sbar = document.getElementById('sbar');
  if (sbar) sbar.classList.add('off');
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
  if (G.isMultiplayer) mpSyncGameState();
  setTimeout(nextPlayer, 360);
}

function playerDraw() {
  if (G.cur !== G.localPlayerId || G.over || isSpectator) return;
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
      if (G.isMultiplayer) mpSyncGameState();
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
      if (G.isMultiplayer) mpSyncGameState();
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

/* ── DRAG & DROP ── */
function handleDragStart(e) {
  if (G.cur !== G.localPlayerId || G.over || isSpectator) {
    e.preventDefault();
    return;
  }
  var idx = parseInt(this.getAttribute('data-tile-index'));
  if (isNaN(idx)) return;
  var p = G.players[G.localPlayerId];
  var oL = G.head.val;
  var oR = G.tail.val;
  var valid = validMoves(p.hand, oL, oR, G.isFirst);
  if (valid.indexOf(idx) === -1) {
    e.preventDefault();
    return;
  }
  draggedTileIndex = idx;
  this.style.opacity = '0.5';
  e.dataTransfer.setData('text/plain', idx);
  e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
  this.style.opacity = '1';
  draggedTileIndex = null;
  var targets = document.querySelectorAll('.drag-target');
  targets.forEach(function(t) { t.classList.remove('drag-target'); });
}

// Setup drop zones on the board
function setupDropZones() {
  var board = document.getElementById('board');
  if (!board) return;

  board.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // Highlight where the tile would be placed
    var bvp = document.getElementById('bvp');
    if (!bvp) return;
    var rect = bvp.getBoundingClientRect();
    var dropX = e.clientX - rect.left;
    
    // Determine if dropping on left or right side
    if (dropX < rect.width / 2) {
      board.classList.add('drag-target-left');
      board.classList.remove('drag-target-right');
    } else {
      board.classList.add('drag-target-right');
      board.classList.remove('drag-target-left');
    }
  });

  board.addEventListener('dragleave', function(e) {
    board.classList.remove('drag-target-left', 'drag-target-right');
  });

  board.addEventListener('drop', function(e) {
    e.preventDefault();
    board.classList.remove('drag-target-left', 'drag-target-right');
    
    if (draggedTileIndex === null) return;
    var p = G.players[G.localPlayerId];
    if (!p) return;
    
    var oL = G.head.val;
    var oR = G.tail.val;
    var t = p.hand[draggedTileIndex];
    if (!t) return;
    
    var canL = (t.a === oL || t.b === oL);
    var canR = (t.a === oR || t.b === oR);
    
    var bvp = document.getElementById('bvp');
    var rect = bvp.getBoundingClientRect();
    var dropX = e.clientX - rect.left;
    
    if (dropX < rect.width / 2 && canL) {
      placeChain(p, draggedTileIndex, 'L');
      afterHuman(p);
    } else if (dropX >= rect.width / 2 && canR) {
      placeChain(p, draggedTileIndex, 'R');
      afterHuman(p);
    } else {
      SFX.bad();
      setSt('⚠️', 'Cannot place that tile there. Try the other side.');
    }
    
    draggedTileIndex = null;
  });
}
/* ── RENDER FUNCTIONS ── */
function renderBoard() {
  var board = document.getElementById('board');
  if (!board) return;
  board.innerHTML = '';
  if (!G.chain || !G.chain.length) return;
  var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (var i = 0; i < G.chain.length; i++) {
    var rec = G.chain[i];
    var isVert = (rec.h > rec.w);
    var el = mkTile(rec.a, rec.b, { horiz: !isVert, board: true });
    el.classList.add('btile');
    el.style.left = rec.x + 'px';
    el.style.top = rec.y + 'px';
    el.style.width = rec.w + 'px';
    el.style.height = rec.h + 'px';
    if (ANIMATIONS_ENABLED) el.style.animationDelay = (i * 18) + 'ms';
    board.appendChild(el);
    minX = Math.min(minX, rec.x);
    maxX = Math.max(maxX, rec.x + rec.w);
    minY = Math.min(minY, rec.y);
    maxY = Math.max(maxY, rec.y + rec.h);
  }
  if (ANIMATIONS_ENABLED) centerOnChain(minX, maxX, minY, maxY);
}

/* ── ZOOM/PAN ── */
var zoom = 1, panX = 0, panY = 0, ZOOM_MIN = 0.25, ZOOM_MAX = 3;

function applyTransform() {
  var bc = document.getElementById('bcanvas');
  if (!bc) return;
  panX = Math.max(-3000, Math.min(3000, panX));
  panY = Math.max(-2000, Math.min(2000, panY));
  bc.style.transform = 'translate(' + panX + 'px,' + panY + 'px) scale(' + zoom + ')';
  var pct = document.getElementById('zoom-pct');
  if (pct) pct.textContent = Math.round(zoom * 100) + '%';
}

function doZoom(factor, cx, cy) {
  var bvp = document.getElementById('bvp');
  if (!bvp) return;
  if (cx === undefined) { cx = bvp.clientWidth / 2; cy = bvp.clientHeight / 2; }
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
  if (!bvp) { panX = 0; panY = 0; applyTransform(); return; }
  panX = bvp.clientWidth / 2 - BCX;
  panY = bvp.clientHeight / 2 - BCY;
  applyTransform();
}

function centerOnChain(minX, maxX, minY, maxY) {
  var bvp = document.getElementById('bvp');
  if (!bvp) return;
  var chainCX = (minX + maxX) / 2, chainCY = (minY + maxY) / 2;
  var targetPanX = bvp.clientWidth / 2 - chainCX * zoom;
  var targetPanY = bvp.clientHeight / 2 - chainCY * zoom;
  panX = panX + (targetPanX - panX) * .35;
  panY = panY + (targetPanY - panY) * .35;
  applyTransform();
}

/* ── INPUT HANDLERS ── */
(function() {
  var bvpEl = null;
  function getBVP() { if (!bvpEl) bvpEl = document.getElementById('bvp'); return bvpEl; }
  document.addEventListener('wheel', function(e) {
    var b = getBVP(); if (!b || !b.contains(e.target)) return;
    e.preventDefault();
    var rect = b.getBoundingClientRect(), cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    var factor = e.deltaY < 0 ? 1.1 : 0.909;
    doZoom(factor, cx, cy);
  }, { passive: false });

  var dn = false, lx, ly;
  document.addEventListener('mousedown', function(e) {
    var b = getBVP(); if (!b || !b.contains(e.target)) return;
    if (e.target.closest && e.target.closest('.tile')) return;
    dn = true; lx = e.clientX; ly = e.clientY; e.preventDefault();
  });
  document.addEventListener('mousemove', function(e) {
    if (!dn) return;
    var dx = e.clientX - lx, dy = e.clientY - ly;
    panX += dx; panY += dy; lx = e.clientX; ly = e.clientY;
    applyTransform();
  });
  document.addEventListener('mouseup', function() { dn = false; });
  document.addEventListener('mouseleave', function() { dn = false; });

  var t1 = null, t2 = null, lastDist = null, lastMx, lastMy;
  document.addEventListener('touchstart', function(e) {
    var b = getBVP(); if (!b || !b.contains(e.target)) return;
    if (e.touches.length === 1 && e.target.closest && e.target.closest('.tile.play')) return;
    e.preventDefault();
    if (e.touches.length === 1) { t1 = e.touches[0]; t2 = null; lastDist = null; lastMx = t1.clientX; lastMy = t1.clientY; }
    else if (e.touches.length === 2) { t1 = e.touches[0]; t2 = e.touches[1]; lastDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY); }
  }, { passive: false });
  document.addEventListener('touchmove', function(e) {
    var b = getBVP(); if (!b || !b.contains(e.target)) return;
    e.preventDefault();
    if (e.touches.length === 2 && t2 !== null) {
      var d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastDist !== null) { var factor = d / lastDist, rect = b.getBoundingClientRect(), mx = (e.touches[0].clientX + e.touches[1].clientX) / 2 - rect.left, my = (e.touches[0].clientY + e.touches[1].clientY) / 2 - rect.top; doZoom(factor, mx, my); }
      lastDist = d;
    } else if (e.touches.length === 1 && t2 === null) {
      var dx = e.touches[0].clientX - lastMx, dy = e.touches[0].clientY - lastMy;
      panX += dx; panY += dy; lastMx = e.touches[0].clientX; lastMy = e.touches[0].clientY;
      applyTransform();
    }
  }, { passive: false });
  document.addEventListener('touchend', function(e) {
    if (e.touches.length === 0) { t1 = null; t2 = null; lastDist = null; }
    else if (e.touches.length === 1) { t2 = null; lastDist = null; t1 = e.touches[0]; lastMx = t1.clientX; lastMy = t1.clientY; }
  }, { passive: false });
})();

/* ── RENDER HELPERS ── */
function renderHand(validSet) {
  validSet = validSet || [];
  var ph = document.getElementById('ph'); if (!ph) return;
  ph.innerHTML = '';
  var p = G.players[G.localPlayerId]; if (!p || isSpectator) return;
  var vs = {}; for (var i = 0; i < validSet.length; i++) vs[validSet[i]] = true;
  for (var i = 0; i < p.hand.length; i++) {
    (function(t, idx) {
      var play = !!vs[idx], sel = (SEL === idx);
      var el = mkTile(t.a, t.b, {
        playable: play,
        selected: sel,
        draggable: play,
        tileIndex: idx,
        onclick: play ? function() { tileClick(idx); } : null
      });
      el.title = t.a + '-' + t.b + (play ? ' — click or drag to play' : '');
      el.style.animation = 'tpl .28s cubic-bezier(.34,1.56,.64,1) ' + (idx * 36) + 'ms both';
      ph.appendChild(el);
    })(p.hand[i], i);
  }
}

function renderBotZones() {
  for (var zi = 0; zi < BZ_IDS.length; zi++) { var z = document.getElementById(BZ_IDS[zi]); if (z) z.style.display = 'none'; }
  var slots = BZ_SLOTS[Math.max(1, (G.players ? G.players.length - 1 : 1))] || ['bz0'];
  var slotIdx = 0;
  for (var b = 0; b < (G.players || []).length; b++) {
    if (b === G.localPlayerId) continue;
    var p = G.players[b], zid = slots[slotIdx], zone = document.getElementById(zid);
    if (!zone || !p || slotIdx >= slots.length) continue;
    zone.style.cssText = 'display:flex;' + BZ_STYLES[zid];
    zone.innerHTML = '<div class="bzav" id="av-' + p.id + '">' + (p.emoji || '🧑') + '</div>' +
      '<div class="bzinfo"><div class="bzname" id="bn-' + p.id + '">' + p.name + '</div>' +
      '<div class="bzcnt" id="bc-' + p.id + '">' + p.hand.length + ' tiles</div></div>' +
      '<div class="bzh" id="bh-' + p.id + '"></div>';
    fillBotHand(p); slotIdx++;
  }
}

function renderBotHands() {
  for (var i = 0; i < G.players.length; i++) { var p = G.players[i]; if (i === G.localPlayerId) continue;
    var bn = document.getElementById('bn-' + p.id), bc = document.getElementById('bc-' + p.id);
    if (bn && bn.firstChild) bn.firstChild.nodeValue = p.name;
    if (bc) bc.textContent = p.hand.length + ' tiles';
    fillBotHand(p); }
}

function fillBotHand(p) {
  var hel = document.getElementById('bh-' + p.id); if (!hel) return;
  hel.innerHTML = ''; for (var i = 0; i < p.hand.length; i++) { var b = document.createElement('div'); b.className = 'btbk'; hel.appendChild(b); }
}

function setBotThinking(pid, show) {
  for (var i = 0; i < G.players.length; i++) { var p = G.players[i], av = document.getElementById('av-' + p.id), bn = document.getElementById('bn-' + p.id);
    if (av) { if (show && p.id === pid) av.classList.add('on'); else av.classList.remove('on'); }
    if (bn) { var td = bn.querySelector('.tdots'); if (show && p.id === pid) { if (!td) { var d = document.createElement('span'); d.className = 'tdots'; d.innerHTML = '<span></span><span></span><span></span>'; bn.appendChild(d); } } else if (td) td.remove(); } }
}

function renderBoneyard() {
  var cnt = document.getElementById('by-count'), pile = document.getElementById('byp');
  if (!cnt || !pile) return;
  cnt.textContent = G.boneyard ? G.boneyard.length : '';
  var ok = byardOk(); pile.style.opacity = ok ? '1' : '0.2'; pile.style.pointerEvents = ok ? 'auto' : 'none';
  pile.title = ok ? 'Click to draw (' + G.boneyard.length + ' left)' : 'Boneyard exhausted';
}

function renderHUD() {
  var el = document.getElementById('hscores'); if (!el) return;
  el.innerHTML = '';
  for (var i = 0; i < G.players.length; i++) { var p = G.players[i];
    var c = document.createElement('div'); c.className = 'chip' + (p.id === G.cur ? ' act' : '') + (G.isMultiplayer ? ' mp-chip' : '');
    var emoji = (i === G.localPlayerId) ? '🧑' : (p.emoji || '🧑');
    c.innerHTML = '<span style="margin-right:2px">' + emoji + '</span><span class="cn">' + p.name + '</span><span class="cs">' + p.score + 'pts</span><span class="ct">[' + p.hand.length + ']</span>';
    el.appendChild(c); }
}

function renderTurnBadge(p) {
  var tb = document.getElementById('tbadge'), txt = document.getElementById('tbadge-txt');
  if (!p) { if (tb) tb.classList.add('off'); return; }
  if (tb) tb.classList.remove('off');
  var you = (p.id === G.localPlayerId);
  if (tb) tb.className = (you ? 'yours' : 'theirs');
  if (txt) txt.textContent = you ? 'YOUR TURN' : (p.name + "'s Turn");
}

function setSt(icon, msg) {
  var ic = document.getElementById('stat-ic'), tx = document.getElementById('stat-txt');
  if (ic) ic.textContent = icon || '⏳';
  if (tx) tx.textContent = msg || '';
  var st = document.getElementById('stat'); if (st) { st.classList.remove('stfl'); void st.offsetWidth; st.classList.add('stfl'); }
}

function toast(msg) {
  var wrap = document.getElementById('toasts'); if (!wrap) return;
  var el = document.createElement('div'); el.className = 'toast'; el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(function() { el.classList.add('out'); setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 280); }, 2600);
}

function scorePop(n) {
  var el = document.createElement('div'); el.className = 'spop'; el.textContent = '+' + n + '!';
  el.style.left = (28 + Math.random() * 42) + '%'; el.style.top = '44%';
  document.body.appendChild(el);
  setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 1350);
}

function launchConfetti() {
  var cv = document.getElementById('cnfc'); if (!cv) return;
  var ctx = cv.getContext('2d');
  cv.width = cv.offsetWidth || 400; cv.height = cv.offsetHeight || 360;
  var W = cv.width, H = cv.height, pcs = [], fr = 0;
  for (var i = 0; i < 88; i++) pcs.push({ x: Math.random() * W, y: -8 - Math.random() * 75, w: 5 + Math.random() * 8, h: 3 + Math.random() * 4, rot: Math.random() * 360, vx: (Math.random() - .5) * 3.2, vy: 1.8 + Math.random() * 3.2, vr: (Math.random() - .5) * 7, col: 'hsl(' + Math.floor(Math.random() * 360) + ',78%,64%)', a: 1 });
  function draw() { ctx.clearRect(0, 0, W, H); var alive = false;
    for (var i = 0; i < pcs.length; i++) { var p = pcs[i]; p.x += p.vx; p.y += p.vy; p.rot += p.vr; if (p.y > H) p.a -= .05; if (p.a > 0) alive = true;
      ctx.save(); ctx.globalAlpha = Math.max(0, p.a); ctx.translate(p.x, p.y); ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.col; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); }
    if (alive && fr++ < 200) requestAnimationFrame(draw); else ctx.clearRect(0, 0, W, H); }
  draw();
}

function showGO(winIdx, bonus, blocked) {
  var w = G.players[winIdx], youWin = (w.id === G.localPlayerId);
  var trophy = document.getElementById('go-trophy'); if (trophy) trophy.textContent = youWin ? '🏆' : (w.emoji || '🧑');
  var title = document.getElementById('go-title'); if (title) title.textContent = youWin ? 'You Win!' : (w.name + ' Wins!');
  var msg = document.getElementById('go-msg');
  if (msg) msg.textContent = (blocked ? 'Game blocked — fewest pips wins! ' : (youWin ? 'You played all tiles! ' : (w.name + ' played all tiles. '))) + 'Bonus: +' + bonus + ' points.';
  var sc = document.getElementById('go-sc'); if (!sc) return;
  sc.innerHTML = '<div class="grow" style="font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(201,168,76,.5);padding-bottom:4px"><span>Player</span><span>Score &amp; Pips</span></div>';
  var sorted = G.players.slice().sort(function(a, b) { return b.score - a.score; });
  for (var i = 0; i < sorted.length; i++) { var p = sorted[i], r = document.createElement('div'); r.className = 'grow' + (p.id === winIdx ? ' w' : '');
    r.innerHTML = '<div class="grow-l"><span>' + ((p.id === G.localPlayerId) ? '🧑' : (p.emoji || '🧑')) + '</span><span>' + p.name + '</span>' + (p.id === winIdx ? '<span style="font-size:.7rem">🥇</span>' : '') + '</div><span>' + p.score + ' pts <span class="grow-pips">(' + hpip(p) + ' pips)</span></span>'; sc.appendChild(r); }
  var gov = document.getElementById('gov'); if (gov) gov.classList.remove('off');
  var primaryBtn = document.getElementById('go-primary-btn'); if (primaryBtn) { primaryBtn.textContent = 'Play Again'; primaryBtn.onclick = goMenu; }
  var rematchBtn = document.getElementById('go-rematch-btn');
  if (G.isMultiplayer && !isSpectator) { if (rematchBtn) rematchBtn.style.display = 'block'; if (primaryBtn) primaryBtn.style.display = 'none'; }
  else { if (rematchBtn) rematchBtn.style.display = 'none'; if (primaryBtn) primaryBtn.style.display = 'block'; }
  if (youWin) setTimeout(launchConfetti, 220);
  stopTimer();
}

/* ── REMATCH ── */
function mpRequestRematch() { if (!mpRoomId) return; var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId); window.firebaseUpdate(roomRef, { rematchRequestedBy: mpPlayerId, rematchResponses: {} });
  var btn = document.getElementById('go-rematch-btn'); if (btn) btn.style.display = 'none';
  var msg = document.getElementById('go-msg'); if (msg) msg.textContent += ' Rematch requested! Waiting for players...'; }
function mpAcceptRematch() { if (!mpRoomId) return; var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId); window.firebaseUpdate(roomRef, { ['rematchResponses/' + mpPlayerId]: true });
  var bar = document.getElementById('rematch-bar'); if (bar) bar.classList.add('off'); }
function mpDeclineRematch() { mpLeaveLobby(); goMenu(); }

/* ── EMOJI REACTIONS ── */
function sendEmoji(emoji) { if (!isSpectator && !G.isMultiplayer) return;
  var el = document.createElement('div'); el.className = 'emoji-float'; el.textContent = emoji;
  el.style.left = (20 + Math.random() * 60) + '%'; el.style.top = (30 + Math.random() * 40) + '%';
  document.body.appendChild(el); setTimeout(function() { if (el.parentNode) el.parentNode.removeChild(el); }, 2600);
  if (mpRoomId && window.firebaseDB) { var reactRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId + '/reactions'); window.firebasePush(reactRef, { emoji: emoji, playerId: mpPlayerId, timestamp: Date.now() }); }
}

/* ── SPECTATOR MODE ── */
function openSpectateList() { var modal = document.getElementById('spectate-list-modal'); if (modal) modal.classList.remove('off'); loadSpectateRooms(); }
function closeSpectateList() { var modal = document.getElementById('spectate-list-modal'); if (modal) modal.classList.add('off'); }
function loadSpectateRooms() { if (!window.firebaseDB) { var list = document.getElementById('spec-rooms-list'); if (list) list.innerHTML = '<p style="text-align:center;color:var(--txt-dim)">Firebase not connected</p>'; return; }
  var roomsRef = window.firebaseRef(window.firebaseDB, 'rooms'); window.firebaseGet(roomsRef).then(function(snapshot) { var html = '';
    if (!snapshot.exists()) { html = '<p style="text-align:center;color:var(--txt-dim)">No active games right now</p>'; }
    else { var rooms = snapshot.val(); var keys = Object.keys(rooms); var found = false;
      for (var i = 0; i < keys.length; i++) { var r = rooms[keys[i]]; if (r.status === 'playing' && r.isPublic !== false) { found = true; var players = r.players ? Object.keys(r.players).length : 0;
        html += '<div class="spec-room"><span class="sr-code">' + keys[i] + '</span><span class="sr-info">' + players + ' players · ' + ((r.gameState && r.gameState.variant) || 'draw') + '</span><button class="sr-btn" onclick="mpSpectateRoom(\'' + keys[i] + '\')">👁️ Watch</button></div>'; } }
      if (!found) html = '<p style="text-align:center;color:var(--txt-dim)">No active games right now</p>'; }
    var list = document.getElementById('spec-rooms-list'); if (list) list.innerHTML = html; }); }

function mpSpectateRoom(code) { closeSpectateList(); window.location.href = 'game.html?room=' + code + '&type=multiplayer&variant=draw&spectate=true'; }

/* ── ROOM TIMEOUT ── */
function startRoomTimeout(roomCode) {
  if (roomTimeoutTimer) clearTimeout(roomTimeoutTimer);
  roomTimeoutTimer = setTimeout(function() {
    if (!mpRoomId) return;
    var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
    window.firebaseGet(roomRef).then(function(snap) {
      if (snap.exists()) {
        var data = snap.val();
        var players = data.players || {};
        var activePlayers = Object.keys(players).length;
        if (activePlayers === 0 || (activePlayers === 1 && players[mpPlayerId])) {
          window.firebaseSet(roomRef, null);
          console.log('🗑️ Room ' + roomCode + ' auto-closed (timeout)');
        }
      }
    });
  }, ROOM_TIMEOUT * 1000);
}

function resetRoomTimeout(roomCode) {
  if (roomTimeoutTimer) clearTimeout(roomTimeoutTimer);
  startRoomTimeout(roomCode);
}

/* ── MULTIPLAYER LOBBY ── */
function generateRoomCode() { var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; var code = ''; for (var i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)]; return code; }

function openMultiplayerLobby(variant) { SFX.click(); window.location.href = 'lobby.html?variant=' + (variant || 'draw'); }

function mpCreateRoom() {
  if (!window.firebaseDB) { toast('Firebase not loaded.'); return; }
  var roomCode = generateRoomCode();
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
  var playerName = USERNAME || 'Player';
  if (!mpPlayerId) mpPlayerId = PLAYER_ID;
  var roomData = { code: roomCode, players: { [mpPlayerId]: { name: playerName, ready: false, hand: [], score: 0, joinedAt: window.firebaseServerTimestamp() } }, hostId: mpPlayerId, status: 'waiting', gameState: null, isPublic: true, variant: mpVariant, createdAt: window.firebaseServerTimestamp() };
  window.firebaseSet(roomRef, roomData).then(function() {
    mpRoomId = roomCode;
    var roomCodeDisplay = document.getElementById('room-code-display');
    if (roomCodeDisplay) roomCodeDisplay.innerHTML = roomCode + '<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:inline-block">📋</button>';
    var lobbyStatus = document.getElementById('lobby-status');
    if (lobbyStatus) lobbyStatus.textContent = 'Room created! Share the code: ' + roomCode;
    var btnReady = document.getElementById('btn-ready'); if (btnReady) btnReady.disabled = false;
    var btnStart = document.getElementById('btn-start'); if (btnStart) btnStart.disabled = false;
    mpListenForPlayers(roomCode);
    toast('🎲 Room ' + roomCode + ' created!');
    window.firebaseOnDisconnect(window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode + '/players/' + mpPlayerId)).remove();
    startRoomTimeout(roomCode);
  }).catch(function(err) { toast('❌ Error: ' + err.message); });
}

function mpJoinRoom() {
  var input = document.getElementById('room-input') || document.getElementById('join-room-input');
  if (!input) return;
  var code = input.value.toUpperCase().trim();
  if (code.length !== 4) { toast('Enter a valid 4-letter code'); return; }
  if (!window.firebaseDB) { toast('Firebase not loaded.'); return; }
  if (!mpPlayerId) mpPlayerId = PLAYER_ID;
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + code);
  window.firebaseGet(roomRef).then(function(snapshot) {
    if (!snapshot.exists()) { toast('❌ Room not found'); return; }
    var data = snapshot.val();
    if (data.status !== 'waiting') { toast('❌ Game already started'); return; }
    if (Object.keys(data.players || {}).length >= 4) { toast('❌ Room is full (max 4)'); return; }
    var playerName = USERNAME || 'Player';
    var updateData = {}; updateData['players/' + mpPlayerId] = { name: playerName, ready: false, hand: [], score: 0, joinedAt: window.firebaseServerTimestamp() };
    window.firebaseUpdate(roomRef, updateData).then(function() {
      mpRoomId = code; mpVariant = data.variant || 'draw';
      window.location.href = 'lobby.html?room=' + code + '&variant=' + mpVariant;
    });
  }).catch(function(err) { toast('❌ Error: ' + err.message); });
}

function copyRoomCode() {
  var display = document.getElementById('room-code-display'); if (!display) return;
  var code = display.textContent.replace('📋', '').trim();
  if (code === '----') return;
  navigator.clipboard.writeText(code).then(function() { toast('📋 Code copied!'); });
}

function mpListenForPlayers(roomCode) { mpCleanupListeners();
  var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + roomCode);
  var listener = window.firebaseOnValue(roomRef, function(snapshot) { if (!snapshot.exists()) return; var data = snapshot.val();
    if (!isSpectator) mpUpdateLobbyUI(data);
    if (data.status === 'playing' && data.gameState) { if (isSpectator || G.isMultiplayer) mpOnGameStateUpdate(data.gameState, data); else mpOnGameStarted(data); }
    if (data.rematchRequestedBy && data.rematchResponses) handleRematchUI(data);
    resetRoomTimeout(roomCode); });
  mpListeners.push({ ref: roomRef, listener: listener }); }

function mpUpdateLobbyUI(data) { var players = data.players || {}; var playerList = Object.values(players);
  var container = document.getElementById('room-players'); if (container) container.innerHTML = playerList.map(function(p) { return '<div class="room-player joined">🧑 ' + p.name + (p.ready ? ' <span class="player-ready">✅</span>' : '') + (data.hostId === mpPlayerId && p.name !== (USERNAME || 'Player') ? '<button class="kick-btn" onclick="mpKickPlayer(\'' + Object.keys(players).find(function(k) { return players[k].name === p.name; }) + '\')">✕</button>' : '') + '</div>'; }).join('');
  var roomCodeDisplay = document.getElementById('room-code-display'); if (roomCodeDisplay) roomCodeDisplay.innerHTML = (data.code || '----') + '<button class="copy-btn" onclick="copyRoomCode()" id="copy-btn" style="display:inline-block">📋</button>';
  var btnStart = document.getElementById('btn-start'); if (btnStart) { var isHost = (data.hostId === mpPlayerId); var enoughPlayers = Object.keys(players).length >= 2; btnStart.disabled = !(isHost && enoughPlayers); }
  if (autoStartEnabled) { var allReady = playerList.every(function(p) { return p.ready; }); if (allReady && Object.keys(players).length >= 2 && data.hostId === mpPlayerId) { mpStartGame(); } }
}

function mpKickPlayer(playerId) { if (!mpRoomId || !playerId) return; var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId); window.firebaseUpdate(roomRef, { ['players/' + playerId]: null }); toast('Player removed'); }

function toggleAutoStart() { autoStartEnabled = !autoStartEnabled; var toggle = document.getElementById('auto-start-toggle'); if (toggle) toggle.classList.toggle('on', autoStartEnabled); toast(autoStartEnabled ? '✅ Auto-start enabled' : '⏳ Auto-start disabled'); }

function mpToggleReady() { if (!mpRoomId) return; var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId); window.firebaseGet(window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId + '/players/' + mpPlayerId + '/ready')).then(function(snap) { var currentReady = snap.val() || false; window.firebaseUpdate(roomRef, { ['players/' + mpPlayerId + '/ready']: !currentReady }); toast(!currentReady ? '✅ Ready!' : '⏳ Not ready'); }); }

function mpStartGame() { if (!mpRoomId) return; var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  window.firebaseGet(roomRef).then(function(snapshot) { var data = snapshot.val(), players = data.players || {}, playerIds = Object.keys(players); if (playerIds.length < 2) { toast('Need at least 2 players'); return; }
    var totalPlayers = playerIds.length, handSize = totalPlayers <= 2 ? 7 : 5, allTiles = shuffle(genSet()); var gamePlayers = [];
    for (var i = 0; i < playerIds.length; i++) { var pid = playerIds[i]; gamePlayers.push({ id: i, mpId: pid, name: players[pid].name, hand: allTiles.splice(0, handSize), score: 0, ready: true }); }
    var first = 0, hd = -1; for (var pi = 0; pi < gamePlayers.length; pi++) for (var ti = 0; ti < gamePlayers[pi].hand.length; ti++) { var t = gamePlayers[pi].hand[ti]; if (t.a === t.b && t.a > hd) { hd = t.a; first = pi; } } if (first === -1) first = 0;
    var gameState = { players: gamePlayers, boneyard: allTiles, chain: [], head: { x: BCX, y: BCY, dir: 'L', val: null }, tail: { x: BCX, y: BCY, dir: 'R', val: null }, cur: first, isFirst: true, over: false, passStreak: 0, variant: mpVariant, startedAt: Date.now() };
    window.firebaseUpdate(roomRef, { status: 'playing', gameState: gameState, rematchRequestedBy: null, rematchResponses: null });
    window.location.href = 'game.html?room=' + mpRoomId + '&type=multiplayer&variant=' + mpVariant;
  }); }

function mpOnGameStarted(data) {
  var ml = document.getElementById('ML'); if (ml) ml.classList.add('off');
  var gsElement = document.getElementById('GS'); if (gsElement) gsElement.classList.remove('off');
  var gov = document.getElementById('gov'); if (gov) gov.classList.add('off');
  var gs = data.gameState;
  G = { players: gs.players.map(function(p) { return Object.assign({}, p, { bot: false }); }), boneyard: gs.boneyard, chain: gs.chain || [], head: gs.head || { x: BCX, y: BCY, dir: 'L', val: null }, tail: gs.tail || { x: BCX, y: BCY, dir: 'R', val: null }, cur: gs.cur, isFirst: gs.isFirst, over: gs.over, passStreak: gs.passStreak || 0, isMultiplayer: true, numBots: 0, multiplayerPlayers: gs.players, localPlayerId: gs.players.findIndex(function(p) { return p.mpId === mpPlayerId; }), variant: gs.variant || 'draw', isSpectator: false };
  if (G.localPlayerId === -1) G.localPlayerId = 0;
  SEL = -1; resetZoom(); renderBotZones(); renderBoard(); renderBoneyard(); renderHUD();
  var ph = document.getElementById('ph'); if (ph) ph.innerHTML = '';
  var emojiPicker = document.getElementById('emoji-picker'); if (emojiPicker) emojiPicker.classList.add('off');
  var skinSelector = document.getElementById('skin-selector'); if (skinSelector) skinSelector.classList.remove('off');
  var tb = document.getElementById('tbadge'); if (tb) tb.classList.remove('off');
  renderTurnBadge(G.players[G.cur]); setSt('🌐', 'Multiplayer game started!');
  initVoiceChat(); setupDropZones();
  setTimeout(runTurn, 500);
}

function mpOnGameStateUpdate(gameState, roomData) {
  if (!G || !G.isMultiplayer || isSpectator) { if (isSpectator) { G.chain = gameState.chain || []; G.head = gameState.head; G.tail = gameState.tail; G.cur = gameState.cur; G.isFirst = gameState.isFirst; G.over = gameState.over; G.passStreak = gameState.passStreak; G.boneyard = gameState.boneyard || []; if (gameState.players) for (var i = 0; i < gameState.players.length; i++) if (G.players[i]) { G.players[i].hand = gameState.players[i].hand; G.players[i].score = gameState.players[i].score; } renderBoard(); renderBoneyard(); renderHUD(); renderBotHands(); } return; }
  G.chain = gameState.chain || []; G.head = gameState.head; G.tail = gameState.tail; G.cur = gameState.cur; G.isFirst = gameState.isFirst; G.over = gameState.over; G.passStreak = gameState.passStreak;
  if (gameState.players) for (var j = 0; j < gameState.players.length; j++) if (G.players[j] && gameState.players[j].hand !== undefined) { G.players[j].hand = gameState.players[j].hand; G.players[j].score = gameState.players[j].score; }
  G.boneyard = gameState.boneyard || [];
  renderBoard(); renderBoneyard(); renderHUD(); renderBotHands();
  if (G.cur === G.localPlayerId && !G.over) { renderTurnBadge(G.players[G.localPlayerId]); var valid = validMoves(G.players[G.localPlayerId].hand, G.head.val, G.tail.val, G.isFirst); renderHand(valid.length > 0 ? valid : []); setSt('🟡', 'Your turn — tap or drag a glowing tile to play.'); setBotThinking(-1, false); startTimer(); }
  else { var ph = document.getElementById('ph'); if (ph) ph.innerHTML = ''; renderTurnBadge(G.players[G.cur]); setBotThinking(G.cur, true); stopTimer(); }
  if (gameState.over) { stopTimer(); for (var k = 0; k < G.players.length; k++) if (G.players[k].hand.length === 0) { showGO(k, 0, false); break; } }
  if (roomData && roomData.rematchRequestedBy) handleRematchUI(roomData);
}

function handleRematchUI(data) { if (!data.rematchRequestedBy || isSpectator) return; var bar = document.getElementById('rematch-bar'); if (!bar) return; bar.classList.remove('off');
  if (data.rematchRequestedBy === mpPlayerId) { var status = document.getElementById('rematch-status'); if (status) status.textContent = 'Waiting for players...'; }
  else { var status2 = document.getElementById('rematch-status'); if (status2) status2.textContent = 'Rematch requested!'; }
  if (data.rematchResponses && data.players) { var playerIds = Object.keys(data.players), allAccepted = true; for (var i = 0; i < playerIds.length; i++) if (playerIds[i] !== data.rematchRequestedBy && !data.rematchResponses[playerIds[i]]) { allAccepted = false; break; }
    if (allAccepted) { mpStartGame(); bar.classList.add('off'); var gov = document.getElementById('gov'); if (gov) gov.classList.add('off'); } } }

function mpSyncGameState() { if (!mpRoomId || !G.isMultiplayer || isSpectator) return; var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId);
  var gameState = { players: G.players.map(function(p) { return { id: p.id, mpId: p.mpId, name: p.name, hand: p.hand, score: p.score }; }), boneyard: G.boneyard, chain: G.chain, head: G.head, tail: G.tail, cur: G.cur, isFirst: G.isFirst, over: G.over, passStreak: G.passStreak, variant: G.variant };
  window.firebaseUpdate(roomRef, { gameState: gameState }); }

function mpCleanupListeners() { mpListeners.forEach(function(l) { if (l.listener && l.ref) window.firebaseOff(l.ref, 'value', l.listener); }); mpListeners = []; }
function mpCleanup() { mpCleanupListeners(); if (mpRoomId && mpPlayerId) { var roomRef = window.firebaseRef(window.firebaseDB, 'rooms/' + mpRoomId); window.firebaseUpdate(roomRef, { ['players/' + mpPlayerId]: null }).then(function() { window.firebaseGet(roomRef).then(function(snap) { if (snap.exists()) { var data = snap.val(); if (Object.keys(data.players || {}).length === 0) window.firebaseSet(roomRef, null); } }); }); } mpRoomId = null; isMultiplayer = false; isSpectator = false; stopTimer(); stopVoiceChat(); if (roomTimeoutTimer) { clearTimeout(roomTimeoutTimer); roomTimeoutTimer = null; } }
function mpLeaveLobby() { SFX.click(); mpCleanup(); window.location.href = 'index.html'; }

/* ── SCREEN MANAGEMENT ── */
function goMenu() { SFX.click(); if (TMR) { clearTimeout(TMR); TMR = null; } hideSB(); SEL = -1; stopTimer(); if (G.isMultiplayer) mpCleanup(); G = {}; stopVoiceChat(); window.location.href = 'index.html'; }

function startGame(numBots) { SFX.click(); SFX.shuffle(); if (TMR) { clearTimeout(TMR); TMR = null; } hideSB(); SEL = -1; isSpectator = false; isMultiplayer = false; mpRoomId = null;
  initGame(numBots, false, 'draw'); renderBotZones(); renderBoard(); renderBoneyard(); renderHUD();
  var ph = document.getElementById('ph'); if (ph) ph.innerHTML = '';
  var phLabel = document.getElementById('ph-label'); if (phLabel) phLabel.textContent = 'YOUR HAND — tap or drag a glowing tile to play';
  var emojiPicker = document.getElementById('emoji-picker'); if (emojiPicker) emojiPicker.classList.add('off');
  var rematchBar = document.getElementById('rematch-bar'); if (rematchBar) rematchBar.classList.add('off');
  var skinSelector = document.getElementById('skin-selector'); if (skinSelector) skinSelector.classList.remove('off');
  var tb = document.getElementById('tbadge'); if (tb) tb.classList.remove('off');
  var fp = G.players[G.cur]; setSt('🃏', 'Shuffling and dealing tiles…');
  setupDropZones();
  setTimeout(function() { renderTurnBadge(fp); setSt(fp.id === 0 ? '🎯' : '⏳', fp.id === 0 ? 'You hold the highest double — you go first!' : (fp.name + ' goes first!')); setTimeout(runTurn, 1000); }, 600); }

/* ── MODALS ── */
function openStats() { SFX.click(); if (document.getElementById('statsmod')) return; var m = document.createElement('div'); m.id = 'statsmod'; m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:scIn .3s ease'; var wr = Math.max(0, STATS.wins + STATS.losses); m.innerHTML = '<div class="rulebox"><h2>📊 Session Statistics</h2><div class="rb"><p><b>Games Played:</b> ' + STATS.gamesPlayed + '</p><p><b>Rounds Played:</b> ' + STATS.roundsPlayed + '</p><p><b>Wins:</b> ' + STATS.wins + '</p><p><b>Losses:</b> ' + STATS.losses + '</p><p><b>Win Rate:</b> ' + (wr > 0 ? Math.round(STATS.wins / wr * 100) : 0) + '%</p><p><b>Tiles Played:</b> ' + STATS.tilesPlayed + '</p></div><button class="rulebtn" onclick="document.getElementById(\'statsmod\').remove()">Close</button></div>'; document.body.appendChild(m); }
function openRules() { SFX.click(); if (document.getElementById('rulesmod')) return; var m = document.createElement('div'); m.id = 'rulesmod'; m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.86);z-index:500;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);animation:scIn .3s ease'; m.innerHTML = '<div class="rulebox"><h2>📖 How to Play</h2><div class="rb"><p><b>🎯 Objective:</b> Empty your hand first.</p><p><b>🃏 Setup:</b> 28 tiles. 2 players=7 tiles, 3+=5 tiles.</p><p><b>▶ First:</b> Highest double goes first.</p><p><b>🔗 Playing:</b> Match tile ends. Doubles go perpendicular.</p><p><b>🃏 Drawing:</b> No move? Draw from boneyard.</p><p><b>🚫 Block Game:</b> No drawing — pass if stuck.</p><p><b>✋ All Fives:</b> Score when board ends sum to 5.</p><p><b>👁️ Spectate:</b> Watch live games & send emoji reactions!</p><p><b>🎨 Skins:</b> Click the color dots to change tile design.</p><p><b>🖱️ Drag & Drop:</b> Drag tiles to the board sides.</p><p><b>🔍 Zoom:</b> Pinch, scroll, drag to pan.</p></div><button class="rulebtn" onclick="document.getElementById(\'rulesmod\').remove()">Got it! ✓</button></div>'; document.body.appendChild(m); }

function renderDeco() { var el = document.getElementById('deco'); if (!el) return; el.innerHTML = ''; var pairs = [[6, 6], [4, 3], [1, 5], [3, 3], [5, 5], [2, 0], [6, 1]]; for (var i = 0; i < pairs.length; i++) { (function(a, b, idx) { var t = mkTile(a, b, {}); t.style.cssText = 'width:26px;height:50px;border-width:1.5px;cursor:default;flex-shrink:0;opacity:0;transition:opacity .4s ease ' + idx * 78 + 'ms,transform .4s ease ' + idx * 78 + 'ms;transform:translateY(12px)'; t.querySelectorAll('.d,.ds').forEach(function(d) { d.style.width = '4px'; d.style.height = '4px'; }); el.appendChild(t); requestAnimationFrame(function() { requestAnimationFrame(function() { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; }); }); })(pairs[i][0], pairs[i][1], i); } }

/* ── LOADING ── */
(function() {
  initUsername();
  var bar = document.getElementById('lbar'), txt = document.getElementById('ltxt');
  if (!bar || !txt) return;
  var msgs = ['Shuffling tiles…', 'Polishing the felt…', 'Waking the bots…', 'Counting pips…', 'Ready!'];
  var pct = 0;
  var iv = setInterval(function() { pct += 5 + Math.random() * 17; if (pct > 100) pct = 100; bar.style.width = pct + '%'; txt.textContent = msgs[Math.min(4, Math.floor(pct / 25))]; if (pct >= 100) { clearInterval(iv); setTimeout(function() { if (!USERNAME) {} else { var ls = document.getElementById('LS'); if (ls) ls.classList.add('off'); var ms = document.getElementById('MS'); if (ms) ms.classList.remove('off'); renderDeco(); } }, 340); } }, 58);
})();

/**
 * Deep Spot — underwater photography dive game
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const hud = document.getElementById('hud');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const collectionScreen = document.getElementById('collectionScreen');
const albumStatBtn = document.getElementById('albumStatBtn');
const collectionCloseBtn = document.getElementById('collectionCloseBtn');
const collectionList = document.getElementById('collectionList');
const collectionProgress = document.getElementById('collectionProgress');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const motionHint = document.getElementById('motionHint');
const depthValue = document.getElementById('depthValue');
const pendingInline = document.getElementById('pendingInline');
const diveCardStrip = document.getElementById('diveCardStrip');
const diveCardStripCards = document.getElementById('diveCardStripCards');
const airWarningHalo = document.getElementById('airWarningHalo');
const airPercent = document.getElementById('airPercent');
const airBar = document.getElementById('airBar');
const spotToast = document.getElementById('spotToast');
const stageTankHint = document.getElementById('stageTankHint');
const pauseHint = document.getElementById('pauseHint');
const httpsHint = document.getElementById('httpsHint');

// CREATURE_TYPES + CREATURE_SWIM — loaded from species-data.js (100 species)

function getCreatureSwim(type) {
  return CREATURE_SWIM[type.id] || CREATURE_SWIM._default;
}

/** Apple/system emoji art usually faces left; a few species face right by default. */
function creatureEmojiFacesLeft(type) {
  const swim = getCreatureSwim(type);
  return swim.emojiFacesLeft !== false;
}

function shouldFlipCreatureEmoji(type, facing) {
  const swim = getCreatureSwim(type);
  if (swim.noFlip) return false;
  const facesLeft = creatureEmojiFacesLeft(type);
  return facesLeft ? facing > 0 : facing < 0;
}

function initCreatureSwimState(creature, spawnFacing) {
  const swim = getCreatureSwim(creature.type);
  creature.swim = swim;
  creature.homeDepth = creature.depth;
  creature.phase = Math.random() * Math.PI * 2;
  creature.phase2 = Math.random() * Math.PI * 2;
  if (spawnFacing != null) {
    creature.facing = spawnFacing;
  } else {
    creature.facing = swim.style === 'settled' ? 1 : Math.random() < 0.5 ? -1 : 1;
  }
}

function clampCreatureDepth(creature) {
  const range = creature.swim?.depthRange ?? 4;
  creature.depth = clamp(
    creature.depth,
    Math.max(0, creature.homeDepth - range),
    creature.homeDepth + range
  );
}

function updateSchoolFacing(creature, dt) {
  let sum = 0;
  let count = 0;
  for (const other of creatures) {
    if (other === creature || other.spotted || other.type.id !== creature.type.id) continue;
    if (Math.abs(other.depth - creature.depth) > 5) continue;
    if (Math.abs(other.x - creature.x) > 130) continue;
    sum += other.facing || 1;
    count++;
  }
  if (count > 0 && Math.random() < dt * 1.2) {
    creature.facing = Math.sign(sum) || creature.facing;
  }
}

function updateCreatureSwim(creature, dt) {
  const swim = creature.swim || getCreatureSwim(creature.type);
  const p = creature.phase;
  const p2 = creature.phase2;
  const prevX = creature.x;

  switch (swim.style) {
    case 'school':
      updateSchoolFacing(creature, dt);
    /* falls through */
    case 'fast_cruise':
    case 'cruise':
    case 'patrol':
    case 'glide': {
      const speed = swim.speed * (0.76 + 0.24 * Math.sin(p * 0.55));
      creature.x += creature.facing * speed * dt;
      creature.x += Math.sin(p * 1.35) * (swim.wobble || 8) * dt;
      creature.depth += Math.sin(p * 0.5 + p2) * (swim.vert || 0) * dt;
      break;
    }
    case 'dart': {
      const sway = Math.sin(p * 2.6);
      creature.x += sway * swim.speed * dt;
      creature.depth += Math.cos(p * 2.1) * (swim.vert || 6) * dt;
      creature.facing = Math.sign(sway) || creature.facing;
      break;
    }
    case 'bottom': {
      creature.x += creature.facing * swim.speed * dt * (0.45 + 0.55 * Math.abs(Math.sin(p * 0.85)));
      if (Math.sin(p * 0.35) < -0.92) creature.facing *= -1;
      break;
    }
    case 'settled':
      break;
    case 'drift': {
      creature.x += (Math.sin(p * 0.75) * swim.speed + (swim.drift || 6) * Math.sin(p2)) * dt;
      creature.depth += Math.sin(p * 0.42) * (swim.vert || 5) * dt;
      break;
    }
    case 'hover': {
      creature.x += Math.sin(p) * swim.speed * dt * 0.45 + Math.cos(p * 2) * (swim.wobble || 6) * dt;
      creature.depth += Math.sin(p * 2.1) * (swim.vert || 3) * dt * 0.55;
      break;
    }
    case 'stalk': {
      creature.x += creature.facing * swim.speed * dt * 0.55;
      creature.x += Math.sin(p * 1.55) * (swim.wobble || 12) * dt;
      creature.depth += Math.sin(p * 0.85) * (swim.vert || 2) * dt;
      if (Math.abs(Math.sin(p * 0.22)) < 0.04) creature.facing *= -1;
      break;
    }
    case 'jet': {
      const jet = Math.max(0, Math.sin(p * 0.65));
      creature.x += creature.facing * swim.speed * jet * jet * dt * 2.4;
      creature.depth += Math.sin(p * 1.05) * (swim.vert || 8) * dt * (0.25 + jet);
      if (jet < 0.04 && Math.random() < dt * 0.7) creature.facing *= -1;
      break;
    }
    default:
      creature.x += Math.sin(p) * (swim.speed || 20) * dt;
  }

  const dx = creature.x - prevX;
  if (swim.style !== 'settled' && Math.abs(dx) > 0.35) {
    creature.facing = Math.sign(dx);
  }

  creature.phase += dt * (swim.phaseSpd || 2);
  creature.phase2 += dt * (swim.phaseSpd2 || 1.25);
  clampCreatureDepth(creature);
}

const OBSTACLE_TYPES = [
  { id: 'rock', emoji: '🪨', deadly: true, radius: 28, weight: 5 },
  { id: 'coral', emoji: '🪸', deadly: false, radius: 24, airDrain: 4, weight: 48 },
  { id: 'net', emoji: '🕸️', deadly: false, radius: 30, airDrain: 6, slow: 0.7, weight: 8 },
  { id: 'mine', emoji: '💣', deadly: false, radius: 22, weight: 5 },
];

const RARITY_COLORS = {
  common: '#94a3b8',
  uncommon: '#34d399',
  rare: '#a78bfa',
  legendary: '#fbbf24',
};

function getCookie(name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escaped}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days = COOKIE_DAYS) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

const ALBUM_SPECIES_COOKIE = 'deep_spot_album_species';
const ALBUM_SPECIES_COOKIE_LEGACY = 'deep_spot_collection';
const TOTAL_PHOTOS_COOKIE = 'deep_spot_total_photos';

function loadAlbum() {
  try {
    let raw = getCookie(ALBUM_SPECIES_COOKIE);
    if (!raw) raw = getCookie(ALBUM_SPECIES_COOKIE_LEGACY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

function saveAlbum(data) {
  setCookie(ALBUM_SPECIES_COOKIE, JSON.stringify(data));
}

function migratePhotoCountIfNeeded() {
  if (getCookie(TOTAL_PHOTOS_COOKIE) != null) return;
  const album = loadAlbum();
  const sum = Object.values(album).reduce((s, e) => s + (e.count || 0), 0);
  setCookie(TOTAL_PHOTOS_COOKIE, String(sum));
}

function getTotalPhotoCount() {
  const raw = getCookie(TOTAL_PHOTOS_COOKIE);
  if (raw == null || raw === '') return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) ? n : 0;
}

function incrementTotalPhotos(amount = 1) {
  setCookie(TOTAL_PHOTOS_COOKIE, String(getTotalPhotoCount() + amount));
}

/** Photos remaining until the next stage bottle spawns (every STAGE_BOTTLE.photosPerSpawn). */
function getPhotosUntilNextStageBottle() {
  const mod = getTotalPhotoCount() % STAGE_BOTTLE.photosPerSpawn;
  return mod === 0 ? STAGE_BOTTLE.photosPerSpawn : STAGE_BOTTLE.photosPerSpawn - mod;
}

function formatStageBottleCountdown() {
  const n = getPhotosUntilNextStageBottle();
  return `Stage bottle in ${n} photo${n === 1 ? '' : 's'}`;
}

function getStageBottleHudText() {
  if (stageBottles.length > 0) {
    return 'Stage bottle ahead — +30% air';
  }
  return formatStageBottleCountdown();
}

function formatPhotoCaptureToast(type, isNewSpecies) {
  return isNewSpecies ? `${type.name} — New species!` : type.name;
}

function updateStageTankHint() {
  if (!stageTankHint) return;
  if (!isActiveDive()) {
    stageTankHint.classList.add('hidden');
    stageTankHint.textContent = '';
    stageTankHint.classList.remove('stage-tank-hint--ready');
    return;
  }
  const ready = stageBottles.length > 0;
  stageTankHint.textContent = getStageBottleHudText();
  stageTankHint.classList.toggle('stage-tank-hint--ready', ready);
  stageTankHint.classList.remove('hidden');
}

function addSpeciesToAlbum(creatureType) {
  const album = loadAlbum();
  const id = creatureType.id;
  const isNew = !album[id];
  if (!album[id]) {
    album[id] = { firstAt: Date.now() };
  }
  saveAlbum(album);
  return isNew;
}

function resetAlbum() {
  if (
    !confirm(
      'Clear your entire album? All discovered species and tank upgrade progress will be deleted. This cannot be undone.'
    )
  ) {
    return;
  }
  saveAlbum({});
  setCookie(TOTAL_PHOTOS_COOKIE, '0');
  setAppliedTankTierIndex(0);
  pendingSpots = [];
  clearDiveMiniCards();
  updatePendingBadge();
  renderAlbum();
}

const TANK_APPLIED_COOKIE = 'deep_spot_tank_applied';
const TANK_TIER_COOKIE = 'deep_spot_tank_tier';

const RARITY_ORDER = ['common', 'uncommon', 'rare', 'legendary'];

const RARITY_SORT_RANK = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legendary: 3,
};

function compareCreaturesByRarity(a, b) {
  const ra = RARITY_SORT_RANK[a.rarity] ?? 9;
  const rb = RARITY_SORT_RANK[b.rarity] ?? 9;
  if (ra !== rb) return ra - rb;
  return a.minDepth - b.minDepth;
}

const RARITY_LABELS = {
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  legendary: 'Legendary',
};

/** Tank upgrades when every species of a rarity tier is in the album (in order). */
const TANK_UPGRADES = [
  { tier: 0, rarityComplete: null, maxAir: 800, drainScale: 1, label: 'Standard Tank' },
  { tier: 1, rarityComplete: 'common', maxAir: 1200, drainScale: 0.94, label: 'Reef Tank' },
  { tier: 2, rarityComplete: 'uncommon', maxAir: 1800, drainScale: 0.88, label: 'Explorer Tank' },
  { tier: 3, rarityComplete: 'rare', maxAir: 2600, drainScale: 0.8, label: 'Deep Tank' },
  { tier: 4, rarityComplete: 'legendary', maxAir: 4000, drainScale: 0.72, label: 'Abyss Tank' },
];

function getSpeciesForRarity(rarity) {
  return CREATURE_TYPES.filter((t) => t.rarity === rarity);
}

function getRarityAlbumProgress(rarity) {
  const album = loadAlbum();
  const species = getSpeciesForRarity(rarity);
  const have = species.filter((t) => album[t.id]).length;
  return { have, total: species.length };
}

function isRarityComplete(rarity) {
  const p = getRarityAlbumProgress(rarity);
  return p.total > 0 && p.have >= p.total;
}

function getEarnedTankTierIndex() {
  let idx = 0;
  for (let i = 0; i < RARITY_ORDER.length; i++) {
    if (isRarityComplete(RARITY_ORDER[i])) idx = i + 1;
    else break;
  }
  return Math.min(idx, TANK_UPGRADES.length - 1);
}

function getAppliedTankTierIndex() {
  let raw = getCookie(TANK_TIER_COOKIE);
  if (raw == null || raw === '') raw = getCookie(TANK_APPLIED_COOKIE);
  if (raw == null || raw === '') return 0;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, TANK_UPGRADES.length - 1);
}

function setAppliedTankTierIndex(idx) {
  const tier = Math.max(0, Math.min(idx, TANK_UPGRADES.length - 1));
  setCookie(TANK_TIER_COOKIE, String(tier));
  setCookie(TANK_APPLIED_COOKIE, String(tier));
}

function migrateTankTierIfNeeded() {
  const v2 = getCookie(TANK_TIER_COOKIE);
  if (v2 != null && v2 !== '') {
    const n = parseInt(v2, 10);
    if (Number.isFinite(n) && n >= 0 && n < TANK_UPGRADES.length) return;
  }
  const legacy = getCookie(TANK_APPLIED_COOKIE);
  if (legacy != null && legacy !== '') {
    const n = parseInt(legacy, 10);
    if (Number.isFinite(n) && n >= 0 && n < TANK_UPGRADES.length) {
      setAppliedTankTierIndex(n);
      return;
    }
  }
  setAppliedTankTierIndex(0);
}

function getTankTier() {
  return TANK_UPGRADES[getAppliedTankTierIndex()];
}

/** Apply earned tank tier; optionally show upgrade card and sound. */
function tryApplyEarnedTankUpgrade(showCard = false) {
  const appliedBefore = getAppliedTankTierIndex();
  const earned = getEarnedTankTierIndex();
  if (earned <= appliedBefore) return false;

  setAppliedTankTierIndex(earned);
  const prevTier = TANK_UPGRADES[appliedBefore];
  const newTier = getTankTier();

  if (showCard && typeof enqueueTankUpgrade === 'function') {
    enqueueTankUpgrade(prevTier, newTier);
    if (typeof Sounds !== 'undefined') Sounds.tankUpgrade();
  }
  return true;
}

function getNextTankUpgrade() {
  const applied = getAppliedTankTierIndex();
  const nextIdx = applied + 1;
  if (nextIdx >= TANK_UPGRADES.length) return null;
  const next = TANK_UPGRADES[nextIdx];
  const rarity = next.rarityComplete;
  const prog = getRarityAlbumProgress(rarity);
  return {
    tier: next,
    rarity,
    remaining: prog.total - prog.have,
    total: prog.total,
  };
}

function formatTankUnlockReason(tierIdx) {
  const rarity = TANK_UPGRADES[tierIdx]?.rarityComplete;
  if (!rarity) return '';
  const label = RARITY_LABELS[rarity] || rarity;
  return `all ${label} species collected`;
}

function getMaxAir() {
  return getTankTier().maxAir;
}

function getAirDrainScale() {
  return getTankTier().drainScale;
}

function isSpeciesInAlbum(creatureId) {
  return Boolean(loadAlbum()[creatureId]);
}

function isSpeciesPendingThisDive(creatureId) {
  return pendingSpots.some((s) => s.type.id === creatureId);
}

function isNewSpeciesForGlow(creatureType) {
  const id = creatureType.id;
  return !isSpeciesInAlbum(id) && !isSpeciesPendingThisDive(id);
}

function isSpeciesDiscoveredInAlbum(creatureType) {
  return isSpeciesInAlbum(creatureType.id);
}

/** Diver body center on screen (ellipse origin in drawDiver). */
function getDiverCenter() {
  updateDiverScreenY();
  return { x: diver.x, y: diver.y };
}

function getDiverDrawCenter() {
  if (netTangle.active) {
    return { x: netTangle.visualX, y: netTangle.visualY };
  }
  return getDiverCenter();
}

function syncNetTangleToDiver() {
  const c = getDiverCenter();
  netTangle.visualX = c.x;
  netTangle.visualY = c.y;
}

function drawCreatureEmoji(x, y, emoji, style, alpha, photoFade, flip = false, targetH = 40) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${Math.round(targetH * 0.85)}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (flip) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  if (style === 'silhouette') {
    ctx.filter = 'brightness(0) saturate(0)';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.9)';
    ctx.fillText(emoji, x, y + 1);
    ctx.filter = 'none';
    ctx.globalAlpha = alpha * 0.35;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.fillText(emoji, x, y);
  } else if (style === 'spotted') {
    const grey = (photoFade || 0) * 0.9;
    if (grey > 0.02) ctx.filter = `grayscale(${grey})`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, x, y);
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.fillText(emoji, x, y);
  }

  ctx.restore();
}

function rarityGlowRgba(rarity, alpha) {
  const hex = RARITY_COLORS[rarity] || RARITY_COLORS.common;
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function getAlbumSpeciesCount() {
  return Object.keys(loadAlbum()).length;
}

function appendAlbumSectionLabel(text, isSub) {
  const li = document.createElement('li');
  li.className = isSub
    ? 'collection-section-label collection-section-label-sub'
    : 'collection-section-label';
  li.textContent = text;
  collectionList.appendChild(li);
}

function appendAlbumDiscoveredRow(type) {
  const li = document.createElement('li');
  li.className = `collection-item collection-item-tappable spotted-${type.rarity}`;
  const emojiSpan = document.createElement('span');
  emojiSpan.className = 'collection-emoji';
  emojiSpan.appendChild(createCreatureSpriteImg(type, { size: 28 }));
  const nameSpan = document.createElement('span');
  nameSpan.className = 'collection-name';
  nameSpan.textContent = type.name;
  const metaSpan = document.createElement('span');
  metaSpan.className = 'collection-meta';
  metaSpan.textContent = 'View card ›';
  li.append(emojiSpan, nameSpan, metaSpan);
  li.addEventListener('click', () => {
    if (typeof openFishCardFromAlbum === 'function') {
      openFishCardFromAlbum(type);
    } else {
      showFishCard(type);
    }
  });
  collectionList.appendChild(li);
}

function appendAlbumUndiscoveredRow(type) {
  const li = document.createElement('li');
  li.className = 'collection-item undiscovered';
  li.innerHTML =
    `<span class="collection-emoji collection-emoji-silhouette" aria-hidden="true"></span>` +
    `<span class="collection-name">Unknown species</span>` +
    `<span class="collection-meta">${type.minDepth}m+</span>`;
  collectionList.appendChild(li);
}

function renderAlbum() {
  const album = loadAlbum();
  const speciesCount = getAlbumSpeciesCount();
  const totalSpecies = CREATURE_TYPES.length;
  const tier = getTankTier();
  const earnedIdx = getEarnedTankTierIndex();
  const appliedIdx = getAppliedTankTierIndex();
  collectionProgress.textContent = `${speciesCount} / ${totalSpecies} species in album`;

  const tankInfoEl = document.getElementById('albumTankInfo');
  if (tankInfoEl) {
    const next = getNextTankUpgrade();
    let line = `🫧 ${tier.label}`;
    if (earnedIdx > appliedIdx) {
      const reason = formatTankUnlockReason(earnedIdx);
      line += ` — ${TANK_UPGRADES[earnedIdx].label} ready at surface`;
      if (reason) line += ` (${reason})`;
    } else if (next) {
      const label = RARITY_LABELS[next.rarity] || next.rarity;
      line += ` — collect all ${label} species (${next.remaining} left) for ${next.tier.label}`;
    } else {
      line += ' — all rarity tiers complete';
    }
    tankInfoEl.textContent = line;
  }

  collectionList.innerHTML = '';

  if (speciesCount === 0) {
    const empty = document.createElement('li');
    empty.className = 'collection-empty-msg';
    empty.textContent = 'No species yet — dive, photograph, and surface to archive your first card!';
    collectionList.appendChild(empty);
  }

  for (const rarity of RARITY_ORDER) {
    const inTier = CREATURE_TYPES.filter((t) => t.rarity === rarity);
    const discovered = inTier
      .filter((t) => album[t.id])
      .sort((a, b) => a.minDepth - b.minDepth);
    const undiscovered = inTier
      .filter((t) => !album[t.id])
      .sort((a, b) => a.minDepth - b.minDepth);

    if (discovered.length === 0 && undiscovered.length === 0) continue;

    const rarityLabel = RARITY_LABELS[rarity] || rarity;
    appendAlbumSectionLabel(`${rarityLabel} · ${discovered.length}/${inTier.length}`, false);

    for (const type of discovered) appendAlbumDiscoveredRow(type);
    for (const type of undiscovered) appendAlbumUndiscoveredRow(type);
  }
}

function isActiveDive() {
  if (!diveActive) return false;
  if (gameState === 'gameover' || gameState === 'menu') return false;
  if (collectionScreen && !collectionScreen.classList.contains('hidden')) return false;
  return gameState === 'playing' || gameState === 'paused';
}

/** Mini strip visible only while diving and full card / tank overlay is closed */
function shouldShowDiveMiniStrip() {
  if (!isActiveDive()) return false;
  if (typeof isRewardOverlayOpen === 'function' && isRewardOverlayOpen()) return false;
  return pendingSpots.length > 0;
}

function openAlbum() {
  if (!collectionScreen.classList.contains('hidden')) return;
  collectionReturnState = gameState;
  if (gameState === 'playing') gameState = 'paused';
  if (typeof Sounds !== 'undefined') Sounds.stopAmbience();
  renderAlbum();
  collectionScreen.classList.remove('hidden');
  syncDiveMiniCardStrip();
}

function closeAlbum() {
  if (collectionScreen.classList.contains('hidden')) return;
  collectionScreen.classList.add('hidden');
  if (collectionReturnState === 'playing') {
    gameState = 'playing';
    lastTime = performance.now();
    if (typeof Sounds !== 'undefined') Sounds.startAmbience();
    requestAnimationFrame(loop);
  }
  collectionReturnState = null;
  syncDiveMiniCardStrip();
}

const WORLD = {
  surfaceY: 0, // set on resize — sea level at ~46% screen height
  /** Shallow band: air refill + save pending species (matches on-screen hint) */
  surfaceDepthM: 3,
  surfaceCommitDelay: 0.12,
  surfaceRefillZone: 70,
  pixelsPerMeter: 9,
  creatureSpawnInterval: 4.5,
  maxCreatures: 15,
  preloadAheadM: 90,
  spawnAheadMin: 24,
  spawnAheadMax: 85,
  creatureOffScreenCull: 100,
  creatureSpawnBeyond: 48,
  obstacleSpawnInterval: 12,
  spotRadius: 36,
  viewfinderRadius: 88,
  airDrainBase: 1.4,
  airDrainPerMeter: 0.045,
  airDepthFactor: 80,
  surfaceRefillRate: 280,
  shallowAirBonus: 0.8,
  shallowDepth: 25,
  visualDarknessScale: 350,
  sunlightFadeDepth: 100,
  cliffMinDepth: 22,
  cliffLayoutDepth: 2500,
  dive: {
    baseSink: 0.58,
    diveTiltBoost: 10,
    riseTiltBoost: 22,
    maxRate: 8.5,
    minRate: -12,
  },
};

let diverAnchorY = 0;

// --- Game state ---
const COOKIE_DAYS = 365;

let gameState = 'menu'; // menu | playing | paused | gameover
let collectionReturnState = null;
let w = 0;
let h = 0;
let lastTime = 0;

const diver = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  radius: 22,
  facing: 1,
};

let depth = 0; // meters (virtual)
let maxDepthReached = 0;
let air = 800;
let pendingSpots = [];
let hasLeftShallow = false;
let surfaceCommitTimer = 0;
let surfaceCommitted = false;
let albumArchiveActive = false;
let diveActive = false;
let divePhotoCount = 0;
let airWarningSoundStage = 0;
let pendingLostCardAnnounce = 0;

const NET_ESCAPE = {
  required: 120,
  shakeThreshold: 6.5,
  airDrainPerSec: 28,
};

const DASH = {
  speed: 520,
  duration: 0.15,
  airDrainPerSec: 115,
};

let dash = {
  active: false,
  timer: 0,
  nx: 1,
  ny: 0,
};

const NET_VISUAL = {
  emojiFontPx: 36,
  tangleAlpha: 0.88,
  escapeRingRadius: 44,
  escapeRingWidth: 5,
};

const HAZARD_AIR = {
  coral: 20,
  cliffBump: 24,
  cliffScrapePerSec: 12,
  rock: 42,
  mine: 255,
};

const STAGE_BOTTLE = {
  restoreRatio: 0.3,
  radius: 24,
  maxWorld: 4,
  minDepth: 16,
  photosPerSpawn: 10,
};

let netTangle = {
  active: false,
  netObstacle: null,
  escapeProgress: 0,
  visualX: 0,
  visualY: 0,
};

let creatures = [];
let obstacles = [];
let stageBottles = [];
let stageBottleLastMilestone = 0;
let ambientBubbles = [];
let marineSnow = [];
let marineSnowTimer = 0;
let diverBubbles = [];
let diverBubbleTimer = 0;
let cliffs = [];
let scrollDecor = [];
let particles = [];

// Gyro / motion — uses devicemotion + deviceorientation with screen-aware mapping
const motion = {
  tiltX: 0,
  tiltY: 0,
  orientTiltX: 0,
  orientTiltY: 0,
  motionTiltX: 0,
  motionTiltY: 0,
  orientTime: 0,
  motionTime: 0,
  lastUpdate: 0,
  source: null,
  listenersOn: false,
  calibratingUntil: 0,
  orientCal: { beta: 0, gamma: 0 },
  motionCal: { x: 0, y: 0, z: 0 },
  smooth: { x: 0, y: 0, z: 0 },
  orientReady: false,
  motionReady: false,
};

const MOTION = {
  sensitivity: 22,
  pitchSensitivity: 4,
  smoothFactor: 0.18,
  pitchSmoothFactor: 0.62,
  staleMs: 400,
  calibrateMs: 900,
};

function getScreenAngle() {
  if (screen.orientation && typeof screen.orientation.angle === 'number') {
    return screen.orientation.angle;
  }
  return window.orientation ?? 0;
}

function mapScreenTilt(rawX, rawY) {
  const angle = ((getScreenAngle() % 360) + 360) % 360;
  switch (angle) {
    case 90: return { x: -rawY, y: rawX };
    case 180: return { x: -rawX, y: -rawY };
    case 270: return { x: rawY, y: -rawX };
    default: return { x: rawX, y: rawY };
  }
}

function applyTilt(rawX, rawY, source) {
  const mapped = source === 'motion'
    ? { x: rawX, y: rawY }
    : mapScreenTilt(rawX, rawY);
  const tx = clamp(mapped.x / MOTION.sensitivity, -1, 1);
  const ty = clamp(mapped.y / MOTION.pitchSensitivity, -1, 1);

  if (source === 'orientation') {
    motion.orientTiltX = tx;
    motion.orientTiltY = ty;
    motion.orientTime = performance.now();
  } else {
    motion.motionTiltX = tx;
    motion.motionTiltY = ty;
    motion.motionTime = performance.now();
  }

  motion.lastUpdate = performance.now();
  motion.source = source;
  syncEffectiveTilt();
}

function syncEffectiveTilt() {
  const orientLive = performance.now() - motion.orientTime < MOTION.staleMs;
  const motionLive = performance.now() - motion.motionTime < MOTION.staleMs;

  if (orientLive && motionLive) {
    motion.tiltX = (motion.orientTiltX + motion.motionTiltX) * 0.5;
    motion.tiltY = motion.orientTiltY;
    return;
  }

  if (orientLive) {
    motion.tiltX = motion.orientTiltX;
    motion.tiltY = motion.orientTiltY;
    return;
  }

  if (motionLive) {
    motion.tiltX = motion.motionTiltX;
    motion.tiltY = motion.motionTiltY;
    return;
  }

  motion.tiltX = 0;
  motion.tiltY = 0;
}

function gravityToTilt(dx, dy, dz) {
  const angle = ((getScreenAngle() % 360) + 360) % 360;
  switch (angle) {
    case 90:
      return { x: dy, y: -dx };
    case 180:
      return { x: -dx, y: -dy };
    case 270:
      return { x: -dy, y: dx };
    default:
      // Portrait: roll on x, pitch (dive/rise) on y gravity axis
      return { x: dx, y: dy };
  }
}

function handleOrientation(e) {
  if (gameState !== 'playing') return;

  const beta = e.beta;
  const gamma = e.gamma;
  if (beta == null || gamma == null) return;

  if (!motion.orientReady) {
    motion.orientCal.beta = beta;
    motion.orientCal.gamma = gamma;
    motion.orientReady = true;
  }

  const relBeta = beta - motion.orientCal.beta;
  const relGamma = gamma - motion.orientCal.gamma;
  // relBeta+ = tilt top away (dive), relBeta- = tilt top toward you (rise)
  applyTilt(relGamma, relBeta, 'orientation');
}

function handleDeviceMotion(e) {
  if (gameState !== 'playing') return;

  const g = e.accelerationIncludingGravity;
  if (!g || g.x == null || g.y == null || g.z == null) return;

  const f = MOTION.smoothFactor;
  const fPitch = MOTION.pitchSmoothFactor;
  motion.smooth.x = motion.smooth.x * (1 - f) + g.x * f;
  motion.smooth.y = motion.smooth.y * (1 - fPitch) + g.y * fPitch;
  motion.smooth.z = motion.smooth.z * (1 - fPitch) + g.z * fPitch;

  if (performance.now() < motion.calibratingUntil) {
    motion.motionCal.x = motion.smooth.x;
    motion.motionCal.y = motion.smooth.y;
    motion.motionCal.z = motion.smooth.z;
    motion.motionReady = true;
    return;
  }

  if (!motion.motionReady) return;

  const dx = motion.smooth.x - motion.motionCal.x;
  const dy = motion.smooth.y - motion.motionCal.y;
  const dz = motion.smooth.z - motion.motionCal.z;

  const grav = gravityToTilt(dx, dy, dz);
  applyTilt(grav.x, grav.y, 'motion');

  if (netTangle.active) {
    const acc = e.acceleration;
    let jerk;
    if (acc && acc.x != null) {
      jerk = Math.hypot(acc.x, acc.y, acc.z);
    } else {
      jerk = Math.hypot(dx, dy, dz) * 14;
    }
    if (jerk > NET_ESCAPE.shakeThreshold) {
      netTangle.escapeProgress += jerk * 0.3;
    }
  }
}

function addNetShakeFromPointer(dx, dy) {
  if (!netTangle.active) return;
  const jerk = Math.hypot(dx, dy);
  if (jerk > 4) {
    netTangle.escapeProgress += jerk * 0.38;
  }
}

function releaseFromNet() {
  const net = netTangle.netObstacle;
  if (net) {
    obstacles = obstacles.filter((o) => o !== net);
  }
  netTangle.active = false;
  netTangle.netObstacle = null;
  netTangle.escapeProgress = 0;
  updateNetEscapeHint();
  if (typeof Sounds !== 'undefined') Sounds.netEscape();
  invulnTimer = 1.8;
  diver.vx += (Math.random() - 0.5) * 200;
  if (navigator.vibrate) {
    try {
      navigator.vibrate(40);
    } catch {
      // ignored
    }
  }
}

function updateNetTangle(dt) {
  if (!netTangle.active) return false;

  const o = netTangle.netObstacle;
  if (!o) {
    netTangle.active = false;
    return false;
  }

  const pull = Math.min(1, dt * 2.8);
  diver.x += (o.x - diver.x) * pull;
  syncNetTangleToDiver();
  air -= NET_ESCAPE.airDrainPerSec * dt * 1.15;

  if (netTangle.escapeProgress >= NET_ESCAPE.required) {
    releaseFromNet();
    showSpotToast('🕸️ Free!');
    return false;
  }

  return true;
}

function motionIsLive() {
  return performance.now() - motion.lastUpdate < MOTION.staleMs;
}

function ensureMotionListeners() {
  if (motion.listenersOn) return;
  motion.listenersOn = true;
  window.addEventListener('deviceorientation', handleOrientation, true);
  window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  window.addEventListener('devicemotion', handleDeviceMotion, true);
}

function needsMotionPermission() {
  return (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') ||
    (typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function');
}

async function requestMotionPermission() {
  if (!window.isSecureContext) {
    return { granted: false, reason: 'insecure' };
  }

  let orientGranted = true;
  let motionGranted = true;

  try {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      orientGranted = (await DeviceOrientationEvent.requestPermission()) === 'granted';
    }
    if (typeof DeviceMotionEvent !== 'undefined' &&
        typeof DeviceMotionEvent.requestPermission === 'function') {
      motionGranted = (await DeviceMotionEvent.requestPermission()) === 'granted';
    }
  } catch {
    return { granted: false, reason: 'error' };
  }

  ensureMotionListeners();
  return {
    granted: orientGranted || motionGranted,
    orientGranted,
    motionGranted,
    reason: orientGranted || motionGranted ? 'ok' : 'denied',
  };
}

function calibrateGyro() {
  motion.tiltX = 0;
  motion.tiltY = 0;
  motion.orientTiltX = 0;
  motion.orientTiltY = 0;
  motion.motionTiltX = 0;
  motion.motionTiltY = 0;
  motion.orientTime = 0;
  motion.motionTime = 0;
  motion.lastUpdate = 0;
  motion.source = null;
  motion.orientReady = false;
  motion.motionReady = false;
  motion.orientCal = { beta: 0, gamma: 0 };
  motion.motionCal = { x: 0, y: 0, z: 0 };
  motion.smooth = { x: 0, y: 0, z: 0 };
  motion.calibratingUntil = performance.now() + MOTION.calibrateMs;
}

let spawnCreatureTimer = 0;
let spawnObstacleTimer = 0;
let toastTimer = 0;
let invulnTimer = 0;

// --- Resize ---
function resize() {
  w = window.innerWidth;
  h = window.innerHeight;
  WORLD.surfaceY = h * 0.46;
  diverAnchorY = h * 0.5;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

window.addEventListener('resize', resize);
resize();

ensureMotionListeners();

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function depthDarkness(d) {
  return clamp(1 - Math.exp(-d / WORLD.visualDarknessScale), 0, 0.92);
}

function sunlightAlpha(d) {
  if (d <= 0) return 1;
  const end = WORLD.sunlightFadeDepth;
  if (d >= end) return 0;
  const t = d / end;
  const ease = t * t * (3 - 2 * t);
  return 1 - ease;
}

function formatDepth(d) {
  if (d < 10) return d.toFixed(1) + 'm';
  if (d >= 1000) return (d / 1000).toFixed(1) + 'km';
  return Math.round(d) + 'm';
}

// --- Spawning ---
function pickCreatureForDepth(d) {
  const eligible = CREATURE_TYPES.filter((c) => d >= c.minDepth);
  if (eligible.length === 0) return CREATURE_TYPES[0];

  // Deeper = boost weight of high-minDepth creatures
  const depthBonus = 1 + d / 120;
  const weights = eligible.map((c) => {
    let w = c.weight;
    if (c.minDepth > 80) w *= depthBonus * 1.4;
    if (c.minDepth > 200) w *= depthBonus;
    if (c.minDepth > 400) w *= depthBonus * 1.2;
    if (c.rarity === 'legendary' && d < c.minDepth + 15) w *= 0.55;
    return w;
  });

  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < eligible.length; i++) {
    r -= weights[i];
    if (r <= 0) return eligible[i];
  }
  return eligible[eligible.length - 1];
}

function spawnCreatureAtDepth(spawnDepth) {
  if (creatures.length >= WORLD.maxCreatures) return false;
  if (creatures.some((c) => Math.abs(c.depth - spawnDepth) < 7)) return false;

  const type = pickCreatureForDepth(spawnDepth);
  const size = getCreatureSizeScale(type);
  const entry = pickCreatureEntrySpawn(spawnDepth, type);
  creatures.push({
    type,
    x: entry?.x ?? pickCreatureSpawnX(spawnDepth),
    depth: spawnDepth,
    spotted: false,
    photoFade: 0,
    radius: size.radius,
  });
  initCreatureSwimState(creatures[creatures.length - 1], entry?.facing);
  return true;
}

function spawnCreature() {
  const spawnDepth =
    depth + WORLD.spawnAheadMin + Math.random() * (WORLD.spawnAheadMax - WORLD.spawnAheadMin);
  spawnCreatureAtDepth(spawnDepth);
}

function initCreaturePreload() {
  creatures = [];
  for (let d = 2; d < 70; d += 14 + Math.random() * 10) {
    if (creatures.length >= WORLD.maxCreatures) break;
    spawnCreatureAtDepth(d);
  }
}

function maintainShallowCreatures() {
  if (depth > 38) return;

  const shallowMin = 1;
  const shallowMax = Math.max(shallowMin + 2, Math.min(depth + 10, 24));
  const shallowBand = creatures.filter(
    (c) =>
      c.depth >= shallowMin &&
      c.depth <= shallowMax &&
      !(c.spotted && (c.photoFade || 0) >= 1)
  );
  const target = depth < 15 ? 6 : 3;
  if (shallowBand.length >= target || creatures.length >= WORLD.maxCreatures) return;

  let guard = 0;
  for (
    let d = shallowMin;
    d <= shallowMax &&
    shallowBand.length + guard < target &&
    creatures.length < WORLD.maxCreatures &&
    guard < 24;
    d += 3 + Math.random() * 5
  ) {
    if (spawnCreatureAtDepth(d)) guard++;
  }
}

function maintainCreaturePreload() {
  const targetDepth = depth + WORLD.preloadAheadM;
  let d = depth + WORLD.spawnAheadMin;
  let guard = 0;
  while (d < targetDepth && creatures.length < WORLD.maxCreatures && guard < 42) {
    guard++;
    if (spawnCreatureAtDepth(d)) {
      d += 9 + Math.random() * 9;
    } else {
      d += 5;
    }
  }
  maintainShallowCreatures();
}

function getDeepParticleFactor() {
  return clamp((depth - 20) / 130, 0, 1);
}

function spawnMarineSnow() {
  const { bottom: bottomDepth } = getVisibleDepthRange();
  marineSnow.push({
    x: Math.random() * w,
    worldDepth: bottomDepth + Math.random() * 12,
    r: 0.6 + Math.random() * 2.4,
    drift: (Math.random() - 0.5) * 10,
    wobble: Math.random() * Math.PI * 2,
    alpha: 0.12 + Math.random() * 0.38,
  });
}

function maybeSpawnStageBottleAfterPhoto() {
  const totalPhotos = getTotalPhotoCount();
  const milestone = Math.floor(totalPhotos / STAGE_BOTTLE.photosPerSpawn);
  if (milestone < 1 || milestone <= stageBottleLastMilestone) return false;
  stageBottleLastMilestone = milestone;

  if (stageBottles.length >= STAGE_BOTTLE.maxWorld) return false;

  const spawnDepth = Math.max(depth + 4 + Math.random() * 10, STAGE_BOTTLE.minDepth);
  const spawnX = pickCreatureSpawnX(spawnDepth);
  return spawnStageBottleAtDepth(spawnDepth, spawnX);
}

function collectStageBottle(bottleIndex) {
  const maxAir = getMaxAir();
  const restore = maxAir * STAGE_BOTTLE.restoreRatio;
  air = Math.min(maxAir, air + restore);
  stageBottles.splice(bottleIndex, 1);
  const pct = Math.round(STAGE_BOTTLE.restoreRatio * 100);
  showSpotToast(`Stage bottle — +${pct}% air`);
  if (typeof Sounds !== 'undefined') Sounds.stageBottle();
  updateStageTankHint();
}

function spawnStageBottleAtDepth(spawnDepth, spawnX) {
  if (spawnDepth < STAGE_BOTTLE.minDepth) return false;
  stageBottles.push({
    x: spawnX ?? pickCreatureSpawnX(spawnDepth),
    depth: spawnDepth,
    radius: STAGE_BOTTLE.radius,
  });
  return true;
}

function initStageBottlePreload() {
  stageBottles = [];
}

function spawnObstacle() {
  const spawnDepth = depth + 4 + Math.random() * 18;

  const spawnPool = OBSTACLE_TYPES.filter((t) => {
    if (t.id !== 'coral') return true;
    return cliffs.some((c) => spawnDepth >= c.depthTop && spawnDepth <= c.depthBottom);
  });
  if (!spawnPool.length) return;

  const total = spawnPool.reduce((sum, t) => sum + t.weight, 0);
  let roll = Math.random() * total;
  let type = spawnPool[0];
  for (const candidate of spawnPool) {
    roll -= candidate.weight;
    if (roll <= 0) {
      type = candidate;
      break;
    }
  }

  if (type.id === 'coral') {
    if (!spawnCoralOnCliff(spawnDepth)) return;
    return;
  }

  const margin = 40;
  obstacles.push({
    type,
    x: margin + Math.random() * (w - margin * 2),
    depth: spawnDepth,
    radius: type.radius,
  });
}

function spawnCoralOnCliff(spawnDepth) {
  const cliff = cliffs.find((c) => spawnDepth >= c.depthTop && spawnDepth <= c.depthBottom);
  if (!cliff) return false;

  const coralType = OBSTACLE_TYPES.find((t) => t.id === 'coral');
  if (!coralType) return false;

  const gapLeft = cliffGapCenterX(cliff) - cliffGapWidth(cliff) / 2;
  const gapRight = cliffGapCenterX(cliff) + cliffGapWidth(cliff) / 2;
  const onLeftWall = Math.random() < 0.5;
  const profile = onLeftWall ? cliff.leftEdgeProfile : cliff.rightEdgeProfile;
  const t = (spawnDepth - cliff.depthTop) / Math.max(0.1, cliff.depthBottom - cliff.depthTop);
  const inset = cliffProfileOffset(profile, clamp(t, 0, 1)) + 14 + Math.random() * 22;
  const x = onLeftWall
    ? Math.max(20, gapLeft - inset)
    : Math.min(w - 20, gapRight + inset);

  obstacles.push({
    type: coralType,
    x,
    depth: spawnDepth,
    radius: coralType.radius,
    onCliff: true,
  });
  return true;
}

function cliffHash(seed) {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function generateCliffKelp(depthTop, side) {
  const kelp = [];
  const seed = depthTop * 61.7 + side * 29.3;
  const gapOnRight = side === 0;
  const count = 1 + Math.floor(cliffHash(seed) * 2);

  for (let i = 0; i < count; i++) {
    kelp.push({
      t: 0.1 + cliffHash(seed + i * 5.3) * 0.8,
      strands: 2 + Math.floor(cliffHash(seed + i * 2.7) * 3),
      lean: (gapOnRight ? -1 : 1) * (0.35 + cliffHash(seed + i * 4.1) * 0.55),
      length: 28 + cliffHash(seed + i * 6.3) * 58,
      phase: cliffHash(seed + i * 8.9) * Math.PI * 2,
    });
  }

  return kelp;
}

function generateCliffEdgeProfile(depthTop, side) {
  const points = 16;
  const profile = [];
  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const s = depthTop * 0.41 + side * 9.13 + i * 1.83;
    const n =
      Math.sin(s) * 0.45 +
      Math.sin(s * 2.17) * 0.28 +
      Math.sin(s * 0.53 + 1.2) * 0.18;
    profile.push({ t, inset: 3 + n * 10 + (i % 4) * 1.5 });
  }
  return profile;
}

function cliffProfileOffset(profile, t) {
  if (!profile?.length) return 0;
  const idx = t * (profile.length - 1);
  const i0 = Math.floor(idx);
  const i1 = Math.min(profile.length - 1, i0 + 1);
  const f = idx - i0;
  return profile[i0].inset + (profile[i1].inset - profile[i0].inset) * f;
}

function cliffGapCenterX(cliff) {
  return cliff.gapCenterNorm * w;
}

function cliffGapWidth(cliff) {
  return cliff.gapWidthNorm * w;
}

function forEachCliffWallSegment(drawFn) {
  const seaLevel = getSeaLevelY();
  for (const cliff of cliffs) {
    const yTop = worldToScreenY(cliff.depthTop);
    const yBottom = worldToScreenY(cliff.depthBottom);
    const bandH = Math.max(8, yBottom - yTop);
    if (yBottom < seaLevel - 10 || yTop > h + 30) continue;

    const gapLeft = cliffGapCenterX(cliff) - cliffGapWidth(cliff) / 2;
    const gapRight = cliffGapCenterX(cliff) + cliffGapWidth(cliff) / 2;
    const drawTop = Math.max(yTop, seaLevel);
    drawFn(0, gapLeft, drawTop, bandH, cliff, true);
    drawFn(gapRight, w - gapRight, drawTop, bandH, cliff, false);
  }
}

function isPointOnCliffWall(screenX, worldDepth) {
  const pad = 10;
  for (const cliff of cliffs) {
    if (worldDepth < cliff.depthTop - 0.5 || worldDepth > cliff.depthBottom + 0.5) continue;
    const gapLeft = cliffGapCenterX(cliff) - cliffGapWidth(cliff) / 2;
    const gapRight = cliffGapCenterX(cliff) + cliffGapWidth(cliff) / 2;
    if (screenX < gapLeft - pad || screenX > gapRight + pad) return true;
  }
  return false;
}

function isDepthInCliffBand(spawnDepth) {
  return cliffs.some((cliff) => spawnDepth >= cliff.depthTop && spawnDepth <= cliff.depthBottom);
}

function pickCreatureSpawnX(spawnDepth) {
  const margin = 50;
  for (const cliff of cliffs) {
    if (spawnDepth < cliff.depthTop || spawnDepth > cliff.depthBottom) continue;
    const gapLeft = cliffGapCenterX(cliff) - cliffGapWidth(cliff) / 2;
    const gapRight = cliffGapCenterX(cliff) + cliffGapWidth(cliff) / 2;
    const pad = 22;
    const left = gapLeft + pad;
    const right = gapRight - pad;
    if (right > left + 20) return left + Math.random() * (right - left);
  }
  return margin + Math.random() * (w - margin * 2);
}

/** Spawn just off-screen so fish swim into the frame. */
function pickCreatureEntrySpawn(spawnDepth, type) {
  if (isDepthInCliffBand(spawnDepth)) return null;

  const swim = getCreatureSwim(type);
  if (swim.style === 'settled') return null;

  const beyond = WORLD.creatureSpawnBeyond + Math.random() * 28;
  const fromLeft = Math.random() < 0.5;
  return {
    x: fromLeft ? -beyond : w + beyond,
    facing: fromLeft ? 1 : -1,
  };
}

function initCliffs() {
  cliffs = [];
  let d = WORLD.cliffMinDepth + 6;
  let i = 0;

  while (d < WORLD.cliffLayoutDepth) {
    const thickness = 16 + (i % 4) * 6;
    const gapWidthNorm = clamp(0.58 + (i % 5) * 0.045, 0.56, 0.82);
    const half = gapWidthNorm / 2;
    const travel = 1 - gapWidthNorm - 0.06;
    const gapCenterNorm = half + 0.03 + ((i * 41 + 7) % Math.max(1, Math.floor(travel * 100))) / 100;

    cliffs.push({
      depthTop: d,
      depthBottom: d + thickness,
      gapCenterNorm,
      gapWidthNorm,
      leftEdgeProfile: generateCliffEdgeProfile(d, 0),
      rightEdgeProfile: generateCliffEdgeProfile(d, 1),
      leftKelp: generateCliffKelp(d, 0),
      rightKelp: generateCliffKelp(d, 1),
    });

    d += 72 + (i % 5) * 24;
    i++;
  }
}

function diverInCliffBand(cliff) {
  return depth >= cliff.depthTop && depth <= cliff.depthBottom;
}

function diverBlockedByCliff(cliff) {
  if (!diverInCliffBand(cliff)) return false;
  const gapLeft = cliffGapCenterX(cliff) - cliffGapWidth(cliff) / 2;
  const gapRight = cliffGapCenterX(cliff) + cliffGapWidth(cliff) / 2;
  const pad = diver.radius - 6;
  return diver.x < gapLeft + pad || diver.x > gapRight - pad;
}

function pushDiverThroughCliffGap(cliff) {
  const gapLeft = cliffGapCenterX(cliff) - cliffGapWidth(cliff) / 2 + diver.radius - 2;
  const gapRight = cliffGapCenterX(cliff) + cliffGapWidth(cliff) / 2 - diver.radius + 2;
  if (diver.x < gapLeft) diver.x = gapLeft;
  if (diver.x > gapRight) diver.x = gapRight;
}

function initScrollDecor() {
  scrollDecor = [];
  for (let i = 0; i < 80; i++) {
    scrollDecor.push({
      worldDepth: 3 + i * 4 + Math.random() * 3,
      x: Math.random() * Math.max(w, 300),
      kind: i % 3,
      size: 0.6 + Math.random() * 0.8,
    });
  }
}

function initAmbientBubbles() {
  ambientBubbles = [];
  for (let i = 0; i < 36; i++) {
    ambientBubbles.push({
      x: Math.random() * Math.max(w, 300),
      worldDepth: 3 + Math.random() * 220,
      r: 1.5 + Math.random() * 5,
      wobble: Math.random() * Math.PI * 2,
    });
  }
}

function spawnDiverBubble() {
  diverBubbles.push({
    x: diver.x + (Math.random() - 0.5) * 10,
    y: diver.y - 16 + (Math.random() - 0.5) * 8,
    vx: (Math.random() - 0.5) * 12,
    vy: -(40 + Math.random() * 35),
    r: 1.5 + Math.random() * 2.5,
    life: 2,
    maxLife: 2,
    wobble: Math.random() * Math.PI * 2,
  });
}

function vibrateHit(severity) {
  if (typeof Sounds !== 'undefined') Sounds.hit();
  if (!navigator.vibrate) return;
  try {
    if (severity === 'deadly') {
      navigator.vibrate([140, 50, 180]);
    } else {
      navigator.vibrate(90);
    }
  } catch {
    // ignored — unsupported or blocked without user gesture
  }
}

// --- Game flow ---
function resetGame() {
  tryApplyEarnedTankUpgrade(false);
  diver.x = w / 2;
  diver.y = diverAnchorY;
  diver.vx = 0;
  diver.vy = 0;
  depth = 0;
  maxDepthReached = 0;
  air = getMaxAir();
  pendingSpots = [];
  hasLeftShallow = false;
  surfaceCommitTimer = 0;
  surfaceCommitted = false;
  albumArchiveActive = false;
  clearDiveMiniCards();
  divePhotoCount = 0;
  airWarningSoundStage = 0;
  netTangle.active = false;
  netTangle.netObstacle = null;
  netTangle.escapeProgress = 0;
  updateNetEscapeHint();
  creatures = [];
  obstacles = [];
  stageBottles = [];
  stageBottleLastMilestone = Math.floor(getTotalPhotoCount() / STAGE_BOTTLE.photosPerSpawn);
  marineSnow = [];
  marineSnowTimer = 0;
  particles = [];
  spawnCreatureTimer = 0;
  spawnObstacleTimer = 0;
  invulnTimer = 0;
  diverBubbleTimer = 0;
  diverBubbles = [];
  dash.active = false;
  dash.timer = 0;
  dash.nx = 1;
  dash.ny = 0;
  calibrateGyro();
  initScrollDecor();
  initAmbientBubbles();
  initCliffs();
  initCreaturePreload();
  initStageBottlePreload();
  updateHUD();
}

async function startGame() {
  if (typeof Sounds !== 'undefined') Sounds.unlock();

  httpsHint.classList.add('hidden');
  motionHint.classList.add('hidden');

  if (!window.isSecureContext) {
    httpsHint.classList.remove('hidden');
  }

  const perm = await requestMotionPermission();
  if (!perm.granted && needsMotionPermission()) {
    if (perm.reason === 'insecure') {
      httpsHint.classList.remove('hidden');
    } else {
      motionHint.classList.remove('hidden');
    }
  }

  ensureMotionListeners();
  if (typeof Sounds !== 'undefined') {
    Sounds.unlock();
    Sounds.stopAmbience();
  }
  resetGame();
  diveActive = true;
  gameState = 'playing';
  startScreen.classList.add('hidden');
  gameOverScreen.classList.add('hidden');
  collectionScreen.classList.add('hidden');
  if (typeof resetRewardOverlays === 'function') resetRewardOverlays();
  clearDiveMiniCards();
  hud.classList.remove('hidden');
  pauseHint.classList.remove('hidden');
  setTimeout(() => pauseHint.classList.add('hidden'), 4000);
  if (typeof Sounds !== 'undefined') {
    Sounds.diveStart();
    Sounds.startAmbience();
  }
  if (pendingLostCardAnnounce > 0) {
    const n = pendingLostCardAnnounce;
    pendingLostCardAnnounce = 0;
    showSpotToast(`💔 ${n} dive card${n === 1 ? '' : 's'} lost on last dive`);
  }
  lastTime = performance.now();
  requestAnimationFrame(loop);
}

function updateNetEscapeHint() {
  const el = document.getElementById('netEscapeHint');
  if (!el) return;
  el.classList.toggle('hidden', !netTangle.active);
}

function updatePendingInline() {
  if (pendingInline) pendingInline.classList.add('hidden');
}

function createDiveMiniCardEl(creatureType) {
  const el = document.createElement('div');
  el.className = 'dive-mini-card';
  el.dataset.id = creatureType.id;
  el.dataset.rarity = creatureType.rarity || 'common';
  el.setAttribute('title', creatureType.name);
  el.appendChild(createCreatureSpriteImg(creatureType, { className: 'dive-mini-card-sprite', size: 32 }));
  return el;
}

function syncDiveMiniCardStrip() {
  if (!diveCardStrip || !diveCardStripCards) return;
  if (!shouldShowDiveMiniStrip()) {
    diveCardStrip.classList.add('hidden');
    return;
  }
  const ids = new Set(pendingSpots.map((s) => s.type.id));
  diveCardStripCards.querySelectorAll('.dive-mini-card').forEach((el) => {
    if (!ids.has(el.dataset.id)) el.remove();
  });
  if (pendingSpots.length === 0) {
    diveCardStrip.classList.add('hidden');
    diveCardStrip.classList.remove('dive-card-strip--archiving', 'dive-card-strip--lost');
    return;
  }
  diveCardStrip.classList.remove('hidden');
  const present = new Set(
    [...diveCardStripCards.querySelectorAll('.dive-mini-card')].map((el) => el.dataset.id)
  );
  for (const spot of pendingSpots) {
    if (present.has(spot.type.id)) continue;
    const el = createDiveMiniCardEl(spot.type);
    diveCardStripCards.appendChild(el);
    requestAnimationFrame(() => el.classList.add('dive-mini-card--in'));
  }
}

function addDiveMiniCard(creatureType) {
  syncDiveMiniCardStrip();
}

function clearDiveMiniCards() {
  if (!diveCardStrip || !diveCardStripCards) return;
  diveCardStripCards.innerHTML = '';
  diveCardStrip.classList.add('hidden');
  diveCardStrip.classList.remove('dive-card-strip--archiving', 'dive-card-strip--lost');
}

function animateRemoveDiveMiniCard(creatureId, done) {
  if (!diveCardStripCards) {
    done();
    return;
  }
  const el = diveCardStripCards.querySelector(`.dive-mini-card[data-id="${creatureId}"]`);
  if (!el) {
    done();
    return;
  }
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    el.remove();
    done();
  };
  el.classList.add('dive-mini-card--archived');
  el.addEventListener('transitionend', finish, { once: true });
  setTimeout(finish, 480);
}

function animateLoseDiveMiniCards(done) {
  if (!diveCardStrip || !diveCardStripCards) {
    done();
    return;
  }
  const cards = [...diveCardStripCards.querySelectorAll('.dive-mini-card')];
  if (cards.length === 0) {
    done();
    return;
  }
  diveCardStrip.classList.add('dive-card-strip--lost');
  const label = diveCardStrip.querySelector('.dive-card-strip-label');
  cards.forEach((el, i) => {
    setTimeout(() => el.classList.add('dive-mini-card--lost'), i * 70);
  });
  setTimeout(() => {
    clearDiveMiniCards();
    if (label) label.textContent = 'Dive cards';
    done();
  }, cards.length * 70 + 520);
}

function updateAirWarningHalo(airRatio) {
  if (!airWarningHalo) return;
  const used = 1 - airRatio;
  airWarningHalo.classList.remove('level-1', 'level-2', 'level-3', 'hidden');
  if (used < 0.5 || gameState !== 'playing') {
    airWarningHalo.classList.add('hidden');
    airWarningHalo.setAttribute('aria-hidden', 'true');
    if (used < 0.5) airWarningSoundStage = 0;
    return;
  }
  if (typeof Sounds !== 'undefined') {
    if (used >= 0.85 && airWarningSoundStage < 2) {
      airWarningSoundStage = 2;
      Sounds.criticalAir();
    } else if (used >= 0.5 && airWarningSoundStage < 1) {
      airWarningSoundStage = 1;
      Sounds.lowAir();
    }
  }
  airWarningHalo.setAttribute('aria-hidden', 'false');
  if (used < 0.72) airWarningHalo.classList.add('level-2');
  else airWarningHalo.classList.add('level-3');
}

function updatePendingBadge() {
  updatePendingInline();
  updateNetEscapeHint();
}

function finishSurfaceArchive(newSpeciesCount) {
  albumArchiveActive = false;
  surfaceCommitTimer = 0;
  surfaceCommitted = true;
  updatePendingBadge();

  const willUpgradeTank = getEarnedTankTierIndex() > getAppliedTankTierIndex();
  const nextTank = willUpgradeTank ? TANK_UPGRADES[getEarnedTankTierIndex()] : null;

  let msg = `📷 ${newSpeciesCount} card${newSpeciesCount === 1 ? '' : 's'} archived to album`;
  if (willUpgradeTank && nextTank) {
    const reason = formatTankUnlockReason(getEarnedTankTierIndex());
    msg += `\n🫧 ${nextTank.label} equipped`;
    if (reason) msg += ` — ${reason}`;
  }
  showSpotToast(msg);

  if (typeof Sounds !== 'undefined') {
    Sounds.surface();
    if (newSpeciesCount > 0) Sounds.albumArchive();
  }

  const maxAir = getMaxAir();
  air = Math.min(maxAir, air + maxAir * 0.15);
  updateHUD();

  if (diveCardStrip) diveCardStrip.classList.remove('dive-card-strip--archiving');
  const label = diveCardStrip?.querySelector('.dive-card-strip-label');
  if (label) label.textContent = 'Dive cards';

  tryApplyEarnedTankUpgrade(true);

  if (gameState === 'paused') {
    gameState = 'playing';
    lastTime = performance.now();
    requestAnimationFrame(loop);
  }
}

function archiveNextPendingToAlbum(newSpeciesCount, onComplete) {
  if (pendingSpots.length === 0) {
    onComplete(newSpeciesCount);
    return;
  }
  const spot = pendingSpots[0];
  const id = spot.type.id;
  animateRemoveDiveMiniCard(id, () => {
    addSpeciesToAlbum(spot.type);
    pendingSpots.shift();
    updatePendingBadge();
    setTimeout(() => archiveNextPendingToAlbum(newSpeciesCount, onComplete), 120);
  });
}

function commitPendingAlbum() {
  if (pendingSpots.length === 0 || albumArchiveActive) return;

  const newSpeciesCount = pendingSpots.length;
  albumArchiveActive = true;
  surfaceCommitted = true;
  gameState = 'paused';

  if (typeof cancelDiveCaptureCards === 'function') cancelDiveCaptureCards();

  if (diveCardStrip) {
    diveCardStrip.classList.add('dive-card-strip--archiving');
    const label = diveCardStrip.querySelector('.dive-card-strip-label');
    if (label) label.textContent = 'Archiving…';
  }

  archiveNextPendingToAlbum(newSpeciesCount, () => finishSurfaceArchive(newSpeciesCount));
}

function showGameOverScreen(reason, lostCardCount) {
  if (typeof resetRewardOverlays === 'function') resetRewardOverlays();
  diveActive = false;
  gameState = 'gameover';
  if (typeof Sounds !== 'undefined') {
    Sounds.stopAmbience();
    Sounds.gameOver(reason);
  }
  hud.classList.add('hidden');
  clearDiveMiniCards();

  const icon = document.getElementById('gameOverIcon');
  const title = document.getElementById('gameOverTitle');
  const message = document.getElementById('gameOverMessage');

  if (reason === 'air') {
    icon.textContent = '💨';
    title.textContent = 'Out of Air';
    message.textContent =
      'Surface to archive dive cards into your album and refill air. Upgrade your tank by collecting every species in a rarity tier (Common → Legendary).';
  } else if (reason === 'obstacle') {
    icon.textContent = '💥';
    title.textContent = 'Collision!';
    message.textContent = 'The diver hit a deadly obstacle.';
  } else {
    icon.textContent = '🏆';
    title.textContent = 'Great Dive!';
    message.textContent = 'You made it back safely.';
  }

  document.getElementById('finalAlbum').textContent = String(getAlbumSpeciesCount());
  document.getElementById('finalDepth').textContent = formatDepth(maxDepthReached);
  gameOverScreen.classList.remove('hidden');
  if (airWarningHalo) airWarningHalo.classList.add('hidden');
}

function endGame(reason) {
  if (typeof cancelDiveCaptureCards === 'function') cancelDiveCaptureCards();

  const lostPending = pendingSpots.length;
  if (lostPending > 0) {
    pendingLostCardAnnounce = lostPending;
    gameState = 'paused';
    animateLoseDiveMiniCards(() => {
      pendingSpots = [];
      albumArchiveActive = false;
      updatePendingBadge();
      showGameOverScreen(reason, lostPending);
    });
    return;
  }

  pendingLostCardAnnounce = 0;
  showGameOverScreen(reason, 0);
}

function showSpotToast(text) {
  spotToast.textContent = text;
  spotToast.classList.remove('hidden');
  toastTimer = 1.8;
}

// --- Physics & logic ---
function getVisibleDepthRange() {
  const ppm = WORLD.pixelsPerMeter;
  return {
    top: depth - Math.max(0, diverAnchorY - WORLD.surfaceY) / ppm,
    bottom: depth + (h - diverAnchorY) / ppm,
  };
}

function worldToScreenY(worldDepthM) {
  return diverAnchorY + (worldDepthM - depth) * WORLD.pixelsPerMeter;
}

function getSeaLevelY() {
  return worldToScreenY(0);
}

function updateDiverScreenY() {
  diver.y = diverAnchorY;
}

function depthToScreenY(entityDepth) {
  return worldToScreenY(entityDepth);
}

function cullWorldEntities() {
  const seaLevel = getSeaLevelY();
  const keepBehindM = 30;
  const keepAheadM = WORLD.preloadAheadM + 25;
  creatures = creatures.filter((c) => {
    if (c.spotted && (c.photoFade || 0) >= 1) return false;
    if (c.x < -WORLD.creatureOffScreenCull || c.x > w + WORLD.creatureOffScreenCull) return false;
    if (c.depth > depth + keepAheadM) return false;
    if (c.depth < depth - keepBehindM) {
      // Keep fauna between the diver and the surface while ascending.
      if (c.depth >= 0 && c.depth <= depth) {
        const sy = depthToScreenY(c.depth);
        return sy > seaLevel - 60 && sy < h + 40;
      }
      return false;
    }
    const sy = depthToScreenY(c.depth);
    return sy > seaLevel - 60;
  });
  obstacles = obstacles.filter((o) => {
    const sy = depthToScreenY(o.depth);
    return sy > seaLevel - 60 && sy < h + 100 && o.depth > depth - 25;
  });
  stageBottles = stageBottles.filter((b) => {
    return b.depth > depth - 30 && b.depth < depth + WORLD.preloadAheadM + 30;
  });
}

function canDash() {
  if (gameState !== 'playing' || netTangle.active || dash.active) return false;
  if (typeof isRewardOverlayOpen === 'function' && isRewardOverlayOpen()) return false;
  return true;
}

function computeDiveRate() {
  syncEffectiveTilt();
  let diveRate = WORLD.dive.baseSink;
  if (motionIsLive()) {
    const pitch = pitchResponse(motion.tiltY);
    if (pitch > 0) {
      const diveGain = 1 + pitch * 0.55;
      diveRate += pitch * WORLD.dive.diveTiltBoost * diveGain;
    } else if (pitch < 0) {
      const riseGain = 1 + Math.abs(pitch) * 1.2;
      diveRate += pitch * WORLD.dive.riseTiltBoost * riseGain;
    }
  }
  diveRate = clamp(diveRate, WORLD.dive.minRate, WORLD.dive.maxRate);
  if (depth <= 0 && diveRate < 0) diveRate = 0;
  return diveRate;
}

function getDashVector() {
  let hx = diver.vx;
  let vy = computeDiveRate();

  if (Math.abs(hx) < 20 && motionIsLive() && Math.abs(motion.tiltX) > 0.04) {
    hx = motion.tiltX * 120;
  } else if (Math.abs(hx) < 5) {
    hx = (diver.facing || 1) * 40;
  }

  const hy = vy * WORLD.pixelsPerMeter;
  const mag = Math.hypot(hx, hy);
  if (mag < 1e-3) {
    return { nx: diver.facing || 1, ny: 0.35 };
  }
  return { nx: hx / mag, ny: hy / mag };
}

function tryDash() {
  if (!canDash()) return false;
  unlockGameAudio();

  const vec = getDashVector();
  dash.nx = vec.nx;
  dash.ny = vec.ny;
  dash.active = true;
  dash.timer = DASH.duration;
  if (Math.abs(dash.nx) > 0.12) diver.facing = Math.sign(dash.nx);
  diver.vx = dash.nx * DASH.speed;

  for (let i = 0; i < 6; i++) spawnDiverBubble();
  if (typeof Sounds !== 'undefined') Sounds.dash();
  return true;
}

function cancelDash() {
  if (!dash.active) return;
  dash.active = false;
  dash.timer = 0;
}

function updateHUD() {
  depthValue.textContent = formatDepth(depth);
  const maxAir = getMaxAir();
  const airRatio = clamp(air / maxAir, 0, 1);
  const pct = Math.round(airRatio * 100);
  const tankLabel = document.getElementById('tankLabel');
  if (tankLabel) tankLabel.textContent = getTankTier().label;
  airPercent.textContent = pct + '%';
  airBar.style.transform = `scaleX(${airRatio})`;
  airBar.style.opacity = airRatio <= 0 ? '0' : '1';
  airBar.classList.toggle('low', pct < 40 && pct > 0);
  airBar.classList.toggle('critical', pct < 15 && pct > 0);
  updatePendingInline();
  updateStageTankHint();
  updateNetEscapeHint();
  updateAirWarningHalo(airRatio);
}

function pitchResponse(tiltY) {
  const sign = Math.sign(tiltY) || 0;
  const mag = Math.abs(tiltY);
  if (sign > 0) {
    return Math.pow(mag, 0.52);
  }
  return -Math.pow(mag, 0.32);
}

function dashDepthRate() {
  return dash.ny * (DASH.speed / WORLD.pixelsPerMeter);
}

function update(dt) {
  if (gameState !== 'playing') return;

  const accelX = 680;
  const maxSpeedX = 500;
  const dragX = 0.92;

  let diveRate = computeDiveRate();

  const tangled = updateNetTangle(dt);
  if (tangled) {
    diveRate *= 0.12;
    diver.vx *= 0.72;
  }

  if (dash.active) {
    dash.timer -= dt;
    diver.vx = dash.nx * DASH.speed;
    let depthDelta = dashDepthRate() * dt;
    if (depth <= 0 && depthDelta < 0) depthDelta = 0;
    depth = Math.max(0, depth + depthDelta);
    maxDepthReached = Math.max(maxDepthReached, depth);
    if (dash.timer <= 0) {
      dash.active = false;
      diver.vx = dash.nx * DASH.speed * 0.35;
    }
  } else {
    depth = Math.max(0, depth + diveRate * dt);
    maxDepthReached = Math.max(maxDepthReached, depth);

    if (!tangled) {
      if (motionIsLive()) {
        const boostX = 1 + Math.abs(motion.tiltX) * 0.15;
        diver.vx += motion.tiltX * accelX * boostX * dt;
      }

      diver.vx *= dragX;
      diver.vx = clamp(diver.vx, -maxSpeedX, maxSpeedX);
    }
  }
  diver.x += diver.vx * dt;
  diver.x = clamp(diver.x, diver.radius + 8, w - diver.radius - 8);

  updateDiverScreenY();

  if (diver.vx > 5) diver.facing = 1;
  if (diver.vx < -5) diver.facing = -1;

  // Air mechanics
  const maxAir = getMaxAir();
  const shallowZone = depth < WORLD.surfaceDepthM;
  const fastRefillZone = depth < WORLD.surfaceDepthM * 0.6;

  if (depth > 8) hasLeftShallow = true;

  if (shallowZone) {
    const refillRate = fastRefillZone
      ? WORLD.surfaceRefillRate
      : WORLD.surfaceRefillRate * 0.55;
    air = Math.min(maxAir, air + refillRate * dt);
    if (dash.active) air -= DASH.airDrainPerSec * dt;

    if (pendingSpots.length > 0 && !surfaceCommitted && !albumArchiveActive) {
      surfaceCommitTimer += dt;
      const instantCommit = depth <= 0.2 || surfaceCommitTimer >= WORLD.surfaceCommitDelay;
      if (instantCommit) {
        commitPendingAlbum();
      }
    } else if (pendingSpots.length === 0) {
      surfaceCommitTimer = 0;
      surfaceCommitted = false;
    }
  } else {
    surfaceCommitTimer = 0;
    surfaceCommitted = false;
    const depthFactor = 1 + depth / WORLD.airDepthFactor;
    let drain =
      (WORLD.airDrainBase + depth * WORLD.airDrainPerMeter) * depthFactor * getAirDrainScale();
    if (depth < WORLD.shallowDepth) {
      drain = Math.max(0.5, drain - WORLD.shallowAirBonus);
    }
    if (dash.active) drain += DASH.airDrainPerSec;
    air -= drain * dt;
  }
  air = clamp(air, 0, maxAir);

  if (air <= 0) {
    endGame('air');
    return;
  }

  // Spawning
  maintainCreaturePreload();

  spawnCreatureTimer -= dt;
  if (spawnCreatureTimer <= 0 && creatures.length < WORLD.maxCreatures) {
    spawnCreature();
    spawnCreatureTimer = WORLD.creatureSpawnInterval * (0.85 + Math.random() * 0.5);
  }

  spawnObstacleTimer -= dt;
  const obstacleRate = Math.max(3, WORLD.obstacleSpawnInterval - depth / 40);
  if (spawnObstacleTimer <= 0 && obstacles.length < 3) {
    spawnObstacle();
    spawnObstacleTimer = obstacleRate * (1.1 + Math.random() * 0.9);
  }

  cullWorldEntities();

  // Update creatures
  for (const c of creatures) {
    if (c.spotted) {
      c.photoFade = Math.min(1, (c.photoFade || 0) + dt * 0.45);
      continue;
    }
    updateCreatureSwim(c, dt);
  }

  // Photograph creatures
  for (const c of creatures) {
    if (c.spotted) continue;
    const sy = depthToScreenY(c.depth);
    const dist = Math.hypot(c.x - diver.x, sy - diver.y);
    if (dist < c.radius + 12) {
      c.spotted = true;
      c.photoFade = 0;

      incrementTotalPhotos(1);
      divePhotoCount += 1;
      maybeSpawnStageBottleAfterPhoto();

      const isNewSpecies =
        !isSpeciesInAlbum(c.type.id) && !isSpeciesPendingThisDive(c.type.id);
      if (isNewSpecies) {
        pendingSpots.push({ type: c.type });
        surfaceCommitted = false;
        addDiveMiniCard(c.type);
        updatePendingBadge();
        if (typeof presentCaptureFishCard === 'function') {
          presentCaptureFishCard(c.type);
        }
        if (typeof Sounds !== 'undefined') Sounds.newSpecies();
      } else if (typeof Sounds !== 'undefined') {
        Sounds.photo();
      }

      showSpotToast(formatPhotoCaptureToast(c.type, isNewSpecies));
      updateStageTankHint();

      for (let i = 0; i < 10; i++) {
        particles.push({
          x: c.x,
          y: sy,
          vx: (Math.random() - 0.5) * 140,
          vy: (Math.random() - 0.5) * 140,
          life: 0.45,
          color: '#ffffff',
        });
      }
    }
  }

  // Stage bottle pickup
  for (let bi = stageBottles.length - 1; bi >= 0; bi--) {
    const bottle = stageBottles[bi];
    const sy = depthToScreenY(bottle.depth);
    const dist = Math.hypot(bottle.x - diver.x, sy - diver.y);
    if (dist >= bottle.radius + diver.radius - 14) continue;
    collectStageBottle(bi);
  }

  // Obstacle collision
  if (invulnTimer > 0) invulnTimer -= dt;

  for (let oi = obstacles.length - 1; oi >= 0; oi--) {
    const o = obstacles[oi];
    const sy = depthToScreenY(o.depth);
    const dist = Math.hypot(o.x - diver.x, sy - diver.y);
    if (dist >= o.radius + diver.radius - 18) continue;
    if (invulnTimer > 0 && o.type.id !== 'net') continue;

    if (o.type.id === 'mine') {
      air -= HAZARD_AIR.mine;
      obstacles.splice(oi, 1);
      spawnMineExplosion(o.x, sy);
      invulnTimer = 2.8;
      diver.vx *= -0.5;
      vibrateHit('deadly');
      if (typeof Sounds !== 'undefined' && Sounds.explosion) Sounds.explosion();
      else if (typeof Sounds !== 'undefined') Sounds.hit();
      showSpotToast('💥 Bomb!');
      if (air <= 0) {
        endGame('air');
        return;
      }
      continue;
    }

    if (o.type.deadly) {
      air -= HAZARD_AIR.rock;
      invulnTimer = 2.4;
      vibrateHit('deadly');
      showSpotToast('💥 Rock collision!');
      if (air <= 0) {
        endGame('air');
        return;
      }
      continue;
    }

    if (o.type.id === 'net') {
      if (!netTangle.active) {
          cancelDash();
          netTangle.active = true;
          netTangle.netObstacle = o;
          netTangle.escapeProgress = 0;
          syncNetTangleToDiver();
        air -= 8;
        vibrateHit('harmful');
        updateNetEscapeHint();
        if (typeof Sounds !== 'undefined') Sounds.netTangle();
        showSpotToast('🕸️ Tangled!\nShake phone to escape');
      }
      if (air <= 0) {
        endGame('air');
        return;
      }
      continue;
    }

    if (o.type.id === 'coral') {
      air -= HAZARD_AIR.coral;
      invulnTimer = 1.8;
      diver.vx *= o.type.slow ?? 0.75;
      vibrateHit('harmful');
      if (typeof Sounds !== 'undefined') Sounds.coral();
      showSpotToast('🪸 Coral — air loss!');
      if (air <= 0) {
        endGame('air');
        return;
      }
      continue;
    }

    air -= o.type.airDrain || 5;
    invulnTimer = 2;
    diver.vx *= o.type.slow ?? 0.75;
    vibrateHit('harmful');
    showSpotToast('⚠️ Watch out!');
    if (air <= 0) {
      endGame('air');
      return;
    }
  }

  // Cliff collision — navigate through gaps
  for (const cliff of cliffs) {
    if (!diverBlockedByCliff(cliff)) continue;
    pushDiverThroughCliffGap(cliff);
    diver.vx *= -0.35;
    air -= HAZARD_AIR.cliffScrapePerSec * dt;

    if (invulnTimer > 0) continue;

    air -= HAZARD_AIR.cliffBump;
    invulnTimer = 1.35;
    vibrateHit('harmful');
    showSpotToast('🪨 Cliff — air loss!');
    if (air <= 0) {
      endGame('air');
      return;
    }
  }

  // Ambient ocean bubbles — rise through world space, never recycled
  for (const b of ambientBubbles) {
    b.worldDepth -= (0.22 + getDeepParticleFactor() * 0.18) * dt;
  }
  ambientBubbles = ambientBubbles.filter((b) => b.worldDepth > -1.5);
  const deepFactor = getDeepParticleFactor();
  if (deepFactor > 0 && ambientBubbles.length < 55 + Math.floor(deepFactor * 40)) {
    const { bottom: bottomDepth } = getVisibleDepthRange();
    ambientBubbles.push({
      x: Math.random() * w,
      worldDepth: bottomDepth + 4 + Math.random() * 16,
      r: 1 + Math.random() * (2.5 + deepFactor * 3),
      wobble: Math.random() * Math.PI * 2,
    });
  }

  marineSnowTimer -= dt;
  const snowCap = 35 + Math.floor(deepFactor * 85);
  const snowRate = 0.35 + deepFactor * 2.8;
  if (deepFactor > 0.05 && marineSnow.length < snowCap && marineSnowTimer <= 0) {
    const batch = 1 + Math.floor(deepFactor * 3);
    for (let i = 0; i < batch; i++) spawnMarineSnow();
    marineSnowTimer = 0.04 + Math.random() * (0.14 - deepFactor * 0.06);
  }
  const tSnow = performance.now() * 0.001;
  for (const s of marineSnow) {
    s.worldDepth -= (0.06 + deepFactor * 0.14) * dt;
    s.x += (s.drift + Math.sin(s.wobble + tSnow) * 6) * dt;
  }
  marineSnow = marineSnow.filter((s) => s.worldDepth > depth - 8);

  // Diver regulator bubbles — 2s screen-space fade
  diverBubbleTimer -= dt;
  if (depth > 12 && diverBubbleTimer <= 0) {
    spawnDiverBubble();
    if (deepFactor > 0.35 && Math.random() < deepFactor) spawnDiverBubble();
    diverBubbleTimer = 0.12 + Math.random() * (0.14 - deepFactor * 0.05);
  }

  diverBubbles = diverBubbles.filter((b) => {
    b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.vy -= 18 * dt;
    return b.life > 0;
  });

  const { top: topDepth, bottom: bottomDepth } = getVisibleDepthRange();

  scrollDecor = scrollDecor.filter((d) => d.worldDepth > topDepth - 12 && d.worldDepth < bottomDepth + 30);
  if (scrollDecor.length < 50) {
    for (let i = 0; i < 15; i++) {
      scrollDecor.push({
        worldDepth: bottomDepth + 4 + Math.random() * 20,
        x: Math.random() * w,
        kind: Math.floor(Math.random() * 3),
        size: 0.6 + Math.random() * 0.8,
      });
    }
  }

  // Particles
  particles = particles.filter((p) => {
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    return p.life > 0;
  });

  if (toastTimer > 0) {
    toastTimer -= dt;
    if (toastTimer <= 0) spotToast.classList.add('hidden');
  }

  updateHUD();
}

// --- Rendering ---
function drawOcean() {
  const seaLevel = getSeaLevelY();
  const waterTop = Math.max(0, seaLevel);
  const t = performance.now() * 0.002;
  const darkness = depthDarkness(depth);
  const sunLight = sunlightAlpha(depth);
  const shallowTop = mixColor('#1e7a8c', '#0a2430', darkness * 0.65);
  const deepBot = mixColor('#0f5568', '#030a12', darkness * 0.8);

  // Full-screen water base (visible when surface has scrolled off-screen)
  const baseGrad = ctx.createLinearGradient(0, 0, 0, h);
  baseGrad.addColorStop(0, shallowTop);
  baseGrad.addColorStop(1, deepBot);
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, w, h);

  // Sky above scrolling sea level
  if (seaLevel > 0) {
    ctx.globalAlpha = clamp(seaLevel / 40, 0.15, 1);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, seaLevel);
    skyGrad.addColorStop(0, '#87ceeb');
    skyGrad.addColorStop(1, '#4a9ec9');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, seaLevel);
    ctx.globalAlpha = 1;

    const sunY = seaLevel * 0.45;
    if (sunY > 24 && sunLight > 0.01) {
      ctx.save();
      ctx.globalAlpha = sunLight * clamp(seaLevel / 60, 0, 1);
      ctx.shadowColor = 'rgba(255, 220, 140, 0.6)';
      ctx.shadowBlur = 28 * sunLight;
      ctx.beginPath();
      ctx.arc(w * 0.75, sunY, 35, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
      ctx.fill();
      ctx.restore();
    }
  }

  // Shallow water tint from sea level downward
  const waterGrad = ctx.createLinearGradient(0, waterTop, 0, h);
  waterGrad.addColorStop(0, shallowTop);
  waterGrad.addColorStop(1, deepBot);
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, waterTop, w, h - waterTop);

  // Subsurface sun glow — fades smoothly with depth
  if (sunLight > 0.005 && waterTop < h) {
    const glowH = 80 + sunLight * 160;
    const glowGrad = ctx.createLinearGradient(0, waterTop, 0, waterTop + glowH);
    glowGrad.addColorStop(0, `rgba(130, 210, 255, ${0.42 * sunLight})`);
    glowGrad.addColorStop(0.45, `rgba(80, 170, 220, ${0.18 * sunLight})`);
    glowGrad.addColorStop(1, 'rgba(80, 170, 220, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, waterTop, w, glowH);
  }

  // Clip underwater for scroll layers
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, waterTop, w, h - waterTop);
  ctx.clip();

  const { top: topDepth, bottom: bottomDepth } = getVisibleDepthRange();

  // Scrolling horizontal depth bands (world-locked)
  const bandStep = 10;
  const bandStart = Math.floor(topDepth / bandStep) * bandStep;
  for (let wm = bandStart; wm <= bottomDepth + bandStep; wm += bandStep) {
    const sy = worldToScreenY(wm);
    if (sy < waterTop - 2 || sy > h + 2) continue;

    const bandDark = depthDarkness(wm);
    ctx.strokeStyle = `rgba(255,255,255,${0.04 + bandDark * 0.02})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, sy);
    ctx.lineTo(w, sy);
    ctx.stroke();

    ctx.fillStyle = `rgba(0, 20, 40, ${0.06 + (wm % 120 === 0 ? 0.08 : 0)})`;
    ctx.fillRect(0, sy, w, 3);
  }

  // Scrolling decor (seaweed dots, rocks — world-locked)
  for (const d of scrollDecor) {
    const sy = worldToScreenY(d.worldDepth);
    if (sy < waterTop || sy > h + 20) continue;

    const sway = Math.sin(t + d.x * 0.01) * 4;
    ctx.globalAlpha = 0.25 + darkness * 0.15;

    if (d.kind === 0) {
      ctx.fillStyle = '#1a5c4a';
      ctx.beginPath();
      ctx.ellipse(d.x + sway, sy, 3 * d.size, 14 * d.size, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 1) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(d.x, sy, 3, 3);
    } else {
      ctx.fillStyle = '#2a4a5a';
      ctx.beginPath();
      ctx.arc(d.x, sy, 5 * d.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();

  // Underwater photo grade — warm tint + lens vignette
  if (waterTop < h) {
    ctx.fillStyle = `rgba(255, 210, 170, ${0.035 * (1 - darkness * 0.4)})`;
    ctx.fillRect(0, waterTop, w, h - waterTop);

    const vig = ctx.createRadialGradient(w * 0.5, h * 0.48, w * 0.18, w * 0.5, h * 0.5, w * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, `rgba(0,0,0,${0.22 + darkness * 0.18})`);
    ctx.fillStyle = vig;
    ctx.fillRect(0, waterTop, w, h - waterTop);
  }

  // Surface wave — scrolls up as you dive
  if (seaLevel > -40 && seaLevel < h + 40) {
    ctx.strokeStyle = `rgba(255,255,255,${clamp(0.45 * sunLight - depth / 300, 0.04, 0.4)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 8) {
      const y = seaLevel + Math.sin(x * 0.02 + t) * 4;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  // Light rays — smooth depth fade (not a hard cutoff)
  if (sunLight > 0.008) {
    const rayOrigin = clamp(seaLevel, 0, h * 0.12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, waterTop, w, h - waterTop);
    ctx.clip();
    ctx.globalAlpha = sunLight * 0.3;
    for (let i = 0; i < 5; i++) {
      const x = w * (0.15 + i * 0.18);
      ctx.beginPath();
      ctx.moveTo(x, rayOrigin);
      ctx.lineTo(x - 50, h);
      ctx.lineTo(x + 50, h);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.restore();
  }

  // Depth vignette
  ctx.fillStyle = `rgba(0, 5, 15, ${darkness * 0.5})`;
  ctx.fillRect(0, waterTop, w, h - waterTop);
}

function mixColor(hex1, hex2, t) {
  const a = parseInt(hex1.slice(1), 16);
  const b = parseInt(hex2.slice(1), 16);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function drawAmbientBubbles() {
  const t = performance.now() * 0.002;
  const seaLevel = getSeaLevelY();
  const deepBoost = 1 + getDeepParticleFactor() * 0.55;
  for (const b of ambientBubbles) {
    const sy = worldToScreenY(b.worldDepth);
    if (sy > h + 10) continue;

    let alpha = 0.22 * deepBoost;
    if (sy < seaLevel + 40) {
      alpha *= clamp((sy - (seaLevel - 25)) / 65, 0, 1);
    }
    if (alpha <= 0.01) continue;

    ctx.fillStyle = `rgba(255,255,255,${Math.min(0.42, alpha)})`;
    const sx = b.x + Math.sin(b.wobble + t) * 6;
    ctx.beginPath();
    ctx.arc(sx, sy, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMarineSnow() {
  const t = performance.now() * 0.0015;
  for (const s of marineSnow) {
    const sy = worldToScreenY(s.worldDepth);
    if (sy < -8 || sy > h + 8) continue;
    const sx = s.x + Math.sin(s.wobble + t) * 8;
    ctx.fillStyle = `rgba(210, 230, 255, ${s.alpha})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDiverBubbles() {
  const t = performance.now() * 0.002;
  for (const b of diverBubbles) {
    const alpha = clamp(b.life / b.maxLife, 0, 1) * 0.55;
    if (alpha <= 0.01) continue;

    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    const sx = b.x + Math.sin(b.wobble + t) * 4;
    ctx.beginPath();
    ctx.arc(sx, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawViewfinderBrackets(x, y, size, color, alpha) {
  const arm = size * 0.32;
  const half = size * 0.55;
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  const corners = [
    [-half, -half, 1, 1],
    [half, -half, -1, 1],
    [half, half, -1, -1],
    [-half, half, 1, -1],
  ];

  for (const [cx, cy, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + cx, y + cy + dy * arm);
    ctx.lineTo(x + cx, y + cy);
    ctx.lineTo(x + cx + dx * arm, y + cy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawBiolumeGlow(x, y, type, phase = 0) {
  const pulse = 0.9 + 0.1 * Math.sin(phase * 2.2);
  const radius = getCreatureSizeScale(type).glow * pulse;
  const core = rarityGlowRgba(type.rarity, 0.72);
  const mid = rarityGlowRgba(type.rarity, 0.26);

  ctx.save();
  const grad = ctx.createRadialGradient(x, y, 2, x, y, radius);
  grad.addColorStop(0, core);
  grad.addColorStop(0.55, mid);
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCreatureGlows() {
  for (const c of creatures) {
    const { type, spotted } = c;
    if (spotted || !isNewSpeciesForGlow(type)) continue;
    const y = depthToScreenY(c.depth);
    if (y < getSeaLevelY() - 20 || y > h + 40) continue;
    if (isPointOnCliffWall(c.x, c.depth)) continue;
    drawBiolumeGlow(c.x, y, type, c.phase);
  }
}

function drawCreature(c) {
  const { type, x, spotted } = c;
  const y = depthToScreenY(c.depth);
  const seaLevel = getSeaLevelY();
  if (y > h + 40) return;
  if (y < seaLevel - 45) return;
  if (x < -70 || x > w + 70) return;

  const fade = c.photoFade || 0;
  let alpha = spotted ? Math.max(0, 1 - fade) : 1;
  if (y < seaLevel + 35) {
    alpha *= clamp((y - (seaLevel - 30)) / 65, 0, 1);
  }
  if (alpha <= 0.02) return;

  let style = 'color';
  if (spotted) {
    style = 'spotted';
  }
  // Pixel sprites stay full-color in the water so they are visible to frame and shoot.
  // Undiscovered mystery is handled in the album and on first-capture cards.

  drawCreatureSprite(
    ctx,
    x,
    y,
    type,
    style,
    alpha,
    fade,
    shouldFlipCreatureSprite(type, c.facing ?? 1)
  );

  const size = getCreatureSizeScale(type);

  if (spotted && alpha > 0.15) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 17px system-ui';
    ctx.fillStyle = '#34d399';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('✓', x + size.height * 0.55, y - size.height * 0.4);
    ctx.restore();
  } else if (!spotted) {
    const dist = Math.hypot(x - diver.x, y - diver.y);
    if (dist < WORLD.viewfinderRadius && !isPointOnCliffWall(x, c.depth)) {
      const inShot = dist < c.radius + 12;
      drawViewfinderBrackets(
        x,
        y,
        size.bracket,
        RARITY_COLORS[type.rarity],
        inShot ? 0.95 : 0.45
      );
    }
  }
}

function spawnMineExplosion(x, sy) {
  for (let i = 0; i < 28; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 90 + Math.random() * 260;
    const colors = ['#fef08a', '#f97316', '#ef4444', '#78716c', '#ffffff'];
    particles.push({
      x,
      y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.3 + Math.random() * 0.45,
      color: colors[i % colors.length],
    });
  }
}

function buildCliffWallPath(x, wallW, drawTop, bandH, cliff, faceGapOnRight) {
  const profile = faceGapOnRight ? cliff.leftEdgeProfile : cliff.rightEdgeProfile;
  const gapEdgeX = faceGapOnRight ? x + wallW : x;
  const outerX = faceGapOnRight ? x : x + wallW;
  const inward = faceGapOnRight ? -1 : 1;
  const steps = Math.max(18, Math.floor(bandH / 4));
  const seed = cliff.depthTop * 17 + (faceGapOnRight ? 1 : 2) * 31;

  ctx.beginPath();
  ctx.moveTo(outerX, drawTop);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const y = drawTop + bandH * t;
    const outerJag =
      Math.sin(seed + t * 9.7) * 9 +
      Math.sin(seed * 0.6 + t * 4.2) * 6 +
      Math.sin(seed * 1.9 + t * 22) * 3;
    const ox = outerX + (faceGapOnRight ? -1 : 1) * Math.abs(outerJag);
    ctx.lineTo(ox, y);
  }

  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = drawTop + bandH * t;
    const inset = cliffProfileOffset(profile, t);
    const drip = Math.sin(seed * 1.4 + t * 14.5) * 4 + Math.sin(seed * 0.8 + t * 31) * 2;
    ctx.lineTo(gapEdgeX + inward * (inset + drip), y);
  }

  ctx.closePath();
}

function paintCliffStrata(x, wallW, drawTop, bandH, cliff, faceGapOnRight, detailed) {
  if (wallW <= 0) return;

  const gapEdgeX = faceGapOnRight ? x + wallW : x;
  const outerX = faceGapOnRight ? x : x + wallW;
  const inward = faceGapOnRight ? -1 : 1;
  const seed = cliff.depthTop * 13 + (faceGapOnRight ? 3 : 9);

  buildCliffWallPath(x, wallW, drawTop, bandH, cliff, faceGapOnRight);

  const bodyGrad = ctx.createLinearGradient(outerX, drawTop, gapEdgeX, drawTop + bandH);
  bodyGrad.addColorStop(0, '#62756b');
  bodyGrad.addColorStop(0.28, '#445850');
  bodyGrad.addColorStop(0.62, '#2c3b35');
  bodyGrad.addColorStop(1, '#121c19');
  ctx.fillStyle = bodyGrad;
  ctx.fill();

  if (!detailed) return;

  ctx.save();
  buildCliffWallPath(x, wallW, drawTop, bandH, cliff, faceGapOnRight);
  ctx.clip();

  const strataCount = Math.max(5, Math.floor(bandH / 16));
  for (let i = 0; i < strataCount; i++) {
    const t = i / strataCount;
    const bandTop = drawTop + bandH * t;
    const bandHgt = bandH / strataCount;
    const wave = cliffHash(seed + i * 4.7) * 5;

    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(x - 4, bandTop, wallW + 8, bandHgt);

    ctx.strokeStyle = `rgba(0, 0, 0, ${0.12 + (i % 3) * 0.04})`;
    ctx.lineWidth = 1.2 + (i % 2) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, bandTop + wave);
    for (let px = x; px <= x + wallW + 6; px += 10) {
      ctx.lineTo(px, bandTop + wave + Math.sin(px * 0.04 + seed + i) * 2.5);
    }
    ctx.stroke();
  }

  const colCount = Math.max(2, Math.floor(wallW / 55));
  for (let c = 0; c < colCount; c++) {
    const cx = x + (wallW * (c + 0.5)) / colCount;
    const colGrad = ctx.createLinearGradient(cx - 14, drawTop, cx + 14, drawTop);
    colGrad.addColorStop(0, 'rgba(0,0,0,0.14)');
    colGrad.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    colGrad.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = colGrad;
    ctx.fillRect(cx - 16, drawTop, 32, bandH);
  }

  const shadowGrad = ctx.createLinearGradient(gapEdgeX - inward * 36, drawTop, gapEdgeX, drawTop);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
  ctx.fillStyle = shadowGrad;
  ctx.fillRect(
    faceGapOnRight ? gapEdgeX - 40 : gapEdgeX,
    drawTop,
    40,
    bandH
  );

  ctx.fillStyle = 'rgba(120, 220, 180, 0.12)';
  for (let i = 0; i < Math.floor(bandH / 28); i++) {
    const bx = x + 10 + ((i * 41 + seed) % Math.max(1, wallW - 20));
    const by = drawTop + 8 + i * 28;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  buildCliffWallPath(x, wallW, drawTop, bandH, cliff, faceGapOnRight);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function kelpAnchorOnGapEdge(strand, x, wallW, drawTop, bandH, cliff, faceGapOnRight) {
  const profile = faceGapOnRight ? cliff.leftEdgeProfile : cliff.rightEdgeProfile;
  const gapEdgeX = faceGapOnRight ? x + wallW : x;
  const inward = faceGapOnRight ? -1 : 1;
  const inset = cliffProfileOffset(profile, strand.t);
  return {
    px: gapEdgeX + inward * inset,
    py: drawTop + bandH * strand.t,
  };
}

function paintCliffKelp(x, wallW, drawTop, bandH, kelp, cliff, faceGapOnRight) {
  if (!kelp?.length) return;

  const t = performance.now() * 0.0015;

  ctx.save();
  ctx.lineCap = 'round';

  for (const strand of kelp) {
    const { px, py } = kelpAnchorOnGapEdge(strand, x, wallW, drawTop, bandH, cliff, faceGapOnRight);
    const anchorX = px + (faceGapOnRight ? -1 : 1) * 6;
    const anchorY = py;
    const segments = 6;

    for (let s = 0; s < strand.strands; s++) {
      const spread = (s - (strand.strands - 1) / 2) * 7;
      const baseX = anchorX + spread;
      const points = [{ x: baseX, y: anchorY }];

      for (let i = 1; i <= segments; i++) {
        const frac = i / segments;
        const sway = Math.sin(t * 1.4 + strand.phase + i * 0.85 + s) * (6 + frac * 14);
        points.push({
          x: baseX + strand.lean * frac * strand.length * 0.42 + sway,
          y: anchorY + frac * strand.length,
        });
      }

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const cur = points[i];
        ctx.quadraticCurveTo(
          (prev.x + cur.x) / 2 + strand.lean * 2,
          (prev.y + cur.y) / 2,
          cur.x,
          cur.y
        );
      }
      ctx.strokeStyle = '#1a523c';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      for (let i = 2; i < points.length; i += 2) {
        const leaf = points[i];
        const frac = i / segments;
        ctx.fillStyle = `rgba(${34 + i * 4}, ${96 + i * 3}, ${62 + i * 2}, ${0.55 + frac * 0.25})`;
        ctx.beginPath();
        ctx.ellipse(
          leaf.x + strand.lean * 4,
          leaf.y,
          4 + frac * 5,
          2 + frac * 3,
          strand.lean * 0.25,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function paintCliffWallSegment(x, wallW, drawTop, bandH, cliff, faceGapOnRight, detailed) {
  paintCliffStrata(x, wallW, drawTop, bandH, cliff, faceGapOnRight, detailed);
  if (detailed) {
    const kelp = faceGapOnRight ? cliff.leftKelp : cliff.rightKelp;
    paintCliffKelp(x, wallW, drawTop, bandH, kelp, cliff, faceGapOnRight);
  }
}

function drawCliffs() {
  forEachCliffWallSegment((x, wallW, drawTop, bandH, cliff, faceGapOnRight) => {
    paintCliffWallSegment(x, wallW, drawTop, bandH, cliff, faceGapOnRight, true);
  });
}

/** Repaint cliff walls over fish FX so biolume/viewfinder never tint the rock. */
function drawCliffOccluder() {
  forEachCliffWallSegment((x, wallW, drawTop, bandH, cliff, faceGapOnRight) => {
    paintCliffWallSegment(x, wallW, drawTop, bandH, cliff, faceGapOnRight, false);
  });
}

function drawObstacle(o) {
  if (o.type.id === 'net' && netTangle.netObstacle === o && netTangle.active) return;

  const y = depthToScreenY(o.depth);
  if (y < getSeaLevelY() - 20 || y > h + 40) return;

  ctx.font = `${NET_VISUAL.emojiFontPx}px serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(o.type.emoji, o.x, y);
}

function drawStageBottle(bottle) {
  const y = depthToScreenY(bottle.depth);
  if (y < getSeaLevelY() - 20 || y > h + 40) return;

  const cx = bottle.x;
  const tankW = 18;
  const tankH = 32;
  const tankTop = y - tankH * 0.35;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';

  ctx.shadowColor = 'rgba(251, 191, 36, 0.55)';
  ctx.shadowBlur = 14;
  ctx.fillStyle = '#78716c';
  ctx.fillRect(cx - tankW / 2, tankTop, tankW, tankH);
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#57534e';
  ctx.fillRect(cx - tankW / 2 - 2, tankTop + 5, 3, 10);
  ctx.fillRect(cx + tankW / 2 - 1, tankTop + 5, 3, 10);

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(cx - tankW / 2 + 2, tankTop + 3, tankW - 4, tankH - 6);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.fillText('STAGE', cx, tankTop - 5);

  ctx.restore();
}

function drawDiver() {
  const { x, y } = getDiverDrawCenter();
  const { facing } = diver;
  const invuln = invulnTimer > 0 && Math.floor(invulnTimer * 10) % 2 === 0;

  if (invuln) ctx.globalAlpha = 0.5;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);

  // Body
  ctx.fillStyle = '#1e3a5f';
  ctx.beginPath();
  ctx.ellipse(0, 0, 18, 24, 0, 0, Math.PI * 2);
  ctx.fill();

  // Suit stripe
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-4, -8, 8, 20);

  // Tank
  const tankTop = -6;
  const tankH = 20;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(-22, tankTop - 4, 10, tankH + 8);
  const tankFill = clamp(air / getMaxAir(), 0, 1);
  const fillH = tankH * tankFill;
  if (fillH > 0.5) {
    ctx.fillStyle = tankFill > 0.12 ? '#38bdf8' : '#ef4444';
    ctx.fillRect(-20, tankTop + tankH - fillH, 6, fillH);
  }

  // Mask
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(8, -6, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(100,200,255,0.6)';
  ctx.beginPath();
  ctx.arc(10, -6, 6, 0, Math.PI * 2);
  ctx.fill();

  // Fins
  ctx.fillStyle = '#0ea5e9';
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(-18, 32);
  ctx.lineTo(5, 24);
  ctx.closePath();
  ctx.fill();

  // Bubbles from regulator when deep — handled in update via spawnDiverBubble()

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawNetEscapeRing() {
  if (!netTangle.active) return;

  const remaining = 1 - clamp(netTangle.escapeProgress / NET_ESCAPE.required, 0, 1);
  const { x: cx, y: cy } = getDiverDrawCenter();
  const start = -Math.PI / 2;

  drawDiver();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = NET_VISUAL.tangleAlpha;
  ctx.font = `${NET_VISUAL.emojiFontPx}px serif`;
  ctx.fillText('🕸️', cx, cy);
  ctx.restore();

  const r = NET_VISUAL.escapeRingRadius;
  ctx.lineCap = 'round';

  ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
  ctx.lineWidth = NET_VISUAL.escapeRingWidth + 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  if (remaining > 0.01) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = NET_VISUAL.escapeRingWidth;
    ctx.shadowColor = 'rgba(239, 68, 68, 0.55)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + Math.PI * 2 * remaining);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function depthMarkerInterval(d) {
  if (d < 100) return 20;
  if (d < 500) return 50;
  if (d < 2000) return 100;
  return 250;
}

function drawDepthMarker() {
  const seaLevel = getSeaLevelY();
  const { top: topDepth, bottom: bottomDepth } = getVisibleDepthRange();
  const interval = depthMarkerInterval(depth);
  const firstMark = Math.max(0, Math.floor(topDepth / interval) * interval);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'right';

  for (let m = firstMark; m <= bottomDepth + interval; m += interval) {
    const y = worldToScreenY(m);
    if (y < seaLevel + 8 || y > h - 16) continue;
    ctx.fillText(formatDepth(m), w - 12, y + 4);
    ctx.strokeStyle = 'rgba(125, 211, 252, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function render() {
  ctx.clearRect(0, 0, w, h);
  drawOcean();
  drawDepthMarker();
  drawCreatureGlows();
  drawCliffs();
  drawAmbientBubbles();
  drawMarineSnow();

  for (const o of obstacles) drawObstacle(o);
  for (const c of creatures) drawCreature(c);
  if (!netTangle.active) drawDiver();
  drawNetEscapeRing();
  drawDiverBubbles();
  drawParticles();
  drawCliffOccluder();
  for (const bottle of stageBottles) drawStageBottle(bottle);

  // Surface zone hint
  if (depth < WORLD.surfaceDepthM && air < getMaxAir() * 0.95) {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.7)';
    ctx.font = '13px system-ui';
    ctx.textAlign = 'center';
    const surfaceHint =
      pendingSpots.length > 0
        ? `↕ Surface to archive ${pendingSpots.length} dive card${pendingSpots.length === 1 ? '' : 's'}`
        : '↕ Refilling air at surface';
    ctx.fillText(surfaceHint, w / 2, getSeaLevelY() - 12);
  }
}

function loop(now) {
  if (gameState !== 'playing') return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

// --- Events ---
function unlockGameAudio() {
  if (typeof Sounds !== 'undefined') Sounds.unlock();
}

startBtn.addEventListener('touchstart', unlockGameAudio, { passive: true });
restartBtn.addEventListener('touchstart', unlockGameAudio, { passive: true });
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', () => {
  gameOverScreen.classList.add('hidden');
  startGame();
});
collectionCloseBtn.addEventListener('click', closeAlbum);
if (albumStatBtn) {
  albumStatBtn.addEventListener('click', openAlbum);
  albumStatBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openAlbum();
    }
  });
}
const collectionResetBtn = document.getElementById('collectionResetBtn');
if (collectionResetBtn) {
  collectionResetBtn.addEventListener('click', resetAlbum);
}

// Show HTTPS hint on load when opened over plain HTTP on mobile
if (!window.isSecureContext && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
  httpsHint.classList.remove('hidden');
}

migratePhotoCountIfNeeded();
migrateTankTierIfNeeded();
preloadCreatureSprites(CREATURE_TYPES);
if (getCookie(TANK_TIER_COOKIE) == null && getCookie(TANK_APPLIED_COOKIE) == null) {
  setAppliedTankTierIndex(0);
}

// Prevent scroll on game canvas; allow scrolling in overlays
document.addEventListener('touchmove', (e) => {
  if (e.target.closest('.collection-scroll, .fish-card, .overlay')) return;
  e.preventDefault();
}, { passive: false });

// Tap anywhere on the dive view to dash (direction follows gyro tilt)
const appEl = document.getElementById('app');

let netShakePointer = null;

function pointerInputAllowed() {
  if (gameState !== 'playing') return false;
  if (typeof isRewardOverlayOpen === 'function' && isRewardOverlayOpen()) return false;
  return true;
}

function isDashPointerTarget(e) {
  if (!pointerInputAllowed()) return false;
  if (e.target.closest('button, a, .fish-card, .collection-scroll, .overlay:not(.hidden)')) {
    return false;
  }
  return true;
}

function handleDashPointerDown(e) {
  if (!e.isPrimary) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (!isDashPointerTarget(e)) return;
  unlockGameAudio();
  tryDash();
  if (netTangle.active) {
    netShakePointer = { id: e.pointerId, lastX: e.clientX, lastY: e.clientY };
    try {
      (e.currentTarget || appEl).setPointerCapture(e.pointerId);
    } catch {
      // ignored
    }
  }
}

function handleDashPointerMove(e) {
  if (!netTangle.active || !netShakePointer || netShakePointer.id !== e.pointerId) return;
  const dx = e.clientX - netShakePointer.lastX;
  const dy = e.clientY - netShakePointer.lastY;
  netShakePointer.lastX = e.clientX;
  netShakePointer.lastY = e.clientY;
  if (dx !== 0 || dy !== 0) addNetShakeFromPointer(dx, dy);
}

function clearNetShakePointer(e) {
  if (netShakePointer && netShakePointer.id === e.pointerId) {
    netShakePointer = null;
  }
}

if (appEl) {
  appEl.addEventListener('pointerdown', handleDashPointerDown, { capture: true });
  appEl.addEventListener('pointermove', handleDashPointerMove, { capture: true });
  appEl.addEventListener('pointerup', clearNetShakePointer, { capture: true });
  appEl.addEventListener('pointercancel', clearNetShakePointer, { capture: true });
}

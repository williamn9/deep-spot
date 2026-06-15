/**
 * Fish Card & Tank Upgrade overlay UI, queue, and share-as-image
 */

const fishCardScreen = document.getElementById('fishCardScreen');
const fishCardRarity = document.getElementById('fishCardRarity');
const fishCardEmoji = document.getElementById('fishCardEmoji');
const fishCardName = document.getElementById('fishCardName');
const fishCardDesc = document.getElementById('fishCardDesc');
const fishCardFacts = document.getElementById('fishCardFacts');
const fishCardPoints = document.getElementById('fishCardPoints');
const fishCardShareBtn = document.getElementById('fishCardShareBtn');
const fishCardCloseBtn = document.getElementById('fishCardCloseBtn');

const tankCardScreen = document.getElementById('tankCardScreen');
const tankCardEmoji = document.getElementById('tankCardEmoji');
const tankCardName = document.getElementById('tankCardName');
const tankCardStats = document.getElementById('tankCardStats');
const tankCardShareBtn = document.getElementById('tankCardShareBtn');
const tankCardCloseBtn = document.getElementById('tankCardCloseBtn');

const shareCanvas = document.createElement('canvas');
shareCanvas.width = 600;
shareCanvas.height = 880;

let fishCardCreature = null;
let tankCardData = null;
let overlayPauseState = null;
const overlayQueue = [];
const diveCaptureQueue = [];

// RARITY_LABELS and RARITY_COLORS come from game.js (do not redeclare — breaks this file)

function isRewardOverlayOpen() {
  return (
    (fishCardScreen && !fishCardScreen.classList.contains('hidden')) ||
    (tankCardScreen && !tankCardScreen.classList.contains('hidden'))
  );
}

function isFishCardOpen() {
  return isRewardOverlayOpen();
}

function resetRewardOverlays() {
  overlayQueue.length = 0;
  diveCaptureQueue.length = 0;
  overlayAfterQueueDone = null;
  overlayPauseState = null;
  fishCardCreature = null;
  tankCardData = null;
  if (fishCardScreen) {
    fishCardScreen.classList.add('hidden');
    fishCardScreen.setAttribute('aria-hidden', 'true');
  }
  if (tankCardScreen) {
    tankCardScreen.classList.add('hidden');
    tankCardScreen.setAttribute('aria-hidden', 'true');
  }
}

function captureOverlayPauseState() {
  if (!overlayPauseState) {
    overlayPauseState = {
      gameState,
      collectionOpen: collectionScreen && !collectionScreen.classList.contains('hidden'),
      reopenAlbum: false,
    };
  }
  if (gameState === 'playing') {
    gameState = 'paused';
  }
}

function hideAlbumForCard() {
  if (!collectionScreen || collectionScreen.classList.contains('hidden')) return;
  collectionScreen.classList.add('hidden');
  if (overlayPauseState) overlayPauseState.reopenAlbum = true;
}

function finishOverlaySequence() {
  const state = overlayPauseState;
  overlayPauseState = null;

  if (!state) return;

  if (state.reopenAlbum && collectionScreen) {
    collectionScreen.classList.remove('hidden');
    return;
  }

  if (state.collectionOpen) return;

  if (state.gameState === 'playing') {
    gameState = 'playing';
    lastTime = performance.now();
    if (typeof Sounds !== 'undefined') Sounds.startAmbience();
    requestAnimationFrame(loop);
  }
}

/** Keep reward cards above the canvas/HUD after display */
function bringRewardOverlayToFront(screen) {
  if (!screen || !screen.parentElement) return;
  screen.parentElement.appendChild(screen);
}

function showQueuedOverlay(item) {
  if (!item) return false;
  if (item.kind === 'tank') {
    return showTankCard(item.prevTier, item.newTier);
  }
  if (item.kind === 'fish') {
    return showFishCard(item.data);
  }
  return false;
}

function tryShowNextOverlay() {
  if (isRewardOverlayOpen()) return true;

  while (overlayQueue.length > 0) {
    const item = overlayQueue[0];
    if (showQueuedOverlay(item)) {
      overlayQueue.shift();
      return true;
    }
    overlayQueue.shift();
  }

  return false;
}

function completeOverlaySequence() {
  const afterDone = overlayAfterQueueDone;
  overlayAfterQueueDone = null;
  finishOverlaySequence();
  if (afterDone) afterDone();
}

function enqueueFishCards(creatureTypes) {
  for (const t of creatureTypes) {
    if (t) overlayQueue.push({ kind: 'fish', data: t });
  }
  if (!tryShowNextOverlay()) completeOverlaySequence();
}

let overlayAfterQueueDone = null;

function cancelDiveCaptureCards() {
  diveCaptureQueue.length = 0;
  if (fishCardScreen && !fishCardScreen.classList.contains('hidden')) {
    fishCardScreen.classList.add('hidden');
    fishCardScreen.setAttribute('aria-hidden', 'true');
    fishCardCreature = null;
  }
  if (overlayPauseState?.fromDiveCapture) {
    overlayPauseState = null;
  }
}

function resumeAfterDiveCapture() {
  const state = overlayPauseState;
  overlayPauseState = null;
  diveCaptureQueue.length = 0;
  if (typeof albumArchiveActive !== 'undefined' && albumArchiveActive) return;
  if (state?.gameState === 'playing') {
    gameState = 'playing';
    lastTime = performance.now();
    if (typeof Sounds !== 'undefined') Sounds.startAmbience();
    requestAnimationFrame(loop);
  }
  if (typeof syncDiveMiniCardStrip === 'function') syncDiveMiniCardStrip();
}

/** Full card when a new species is photographed */
function presentCaptureFishCard(creatureType) {
  if (!creatureType) return;
  diveCaptureQueue.push(creatureType);
  if (isRewardOverlayOpen()) return;
  showNextDiveCaptureCard();
}

function showNextDiveCaptureCard() {
  if (diveCaptureQueue.length === 0) {
    resumeAfterDiveCapture();
    return;
  }
  if (!overlayPauseState) {
    overlayPauseState = {
      gameState,
      collectionOpen: false,
      reopenAlbum: false,
      fromDiveCapture: true,
    };
    if (gameState === 'playing') gameState = 'paused';
  }
  displayFishCard(diveCaptureQueue[0]);
}

function enqueueTankUpgrade(prevTier, newTier) {
  if (!newTier || !prevTier || newTier.tier <= prevTier.tier) return;
  overlayQueue.push({ kind: 'tank', prevTier, newTier });
  if (!tryShowNextOverlay()) completeOverlaySequence();
}

function openFishCardFromAlbum(creatureType) {
  if (!overlayPauseState) {
    overlayPauseState = {
      gameState,
      collectionOpen: true,
      reopenAlbum: true,
    };
    if (gameState === 'playing') gameState = 'paused';
  }
  showFishCard(creatureType);
}

function wrapCanvasLines(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, cy);
    cy += lineHeight;
  }
  return cy;
}

function drawFishCardToCanvas(info) {
  const c = shareCanvas.getContext('2d');
  const w = shareCanvas.width;
  const h = shareCanvas.height;
  const pad = 40;
  const rarityColor = RARITY_COLORS[info.rarity] || '#94a3b8';

  c.clearRect(0, 0, w, h);

  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0c2340');
  bg.addColorStop(0.45, '#0a1628');
  bg.addColorStop(1, '#050d18');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  c.strokeStyle = rarityColor;
  c.lineWidth = 4;
  c.strokeRect(20, 20, w - 40, h - 40);

  c.fillStyle = rarityColor;
  c.font = 'bold 22px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText((RARITY_LABELS[info.rarity] || info.rarity).toUpperCase(), w / 2, 72);

  c.font = '120px serif';
  drawCreatureSpriteToCanvas(c, info, w / 2, 240, 140);

  c.fillStyle = '#e8f4ff';
  c.font = 'bold 42px system-ui, sans-serif';
  c.fillText(info.name, w / 2, 300);

  c.font = '20px system-ui, sans-serif';
  c.fillStyle = 'rgba(232, 244, 255, 0.75)';
  c.fillText(`+${info.points} pts · ${info.minDepth}m+`, w / 2, 340);

  c.textAlign = 'left';
  c.fillStyle = 'rgba(232, 244, 255, 0.92)';
  c.font = '22px system-ui, sans-serif';
  let y = wrapCanvasLines(c, info.description, pad, 390, w - pad * 2, 30);

  c.fillStyle = rarityColor;
  c.font = 'bold 18px system-ui, sans-serif';
  c.fillText('Did you know?', pad, y + 24);
  y += 52;

  c.fillStyle = 'rgba(232, 244, 255, 0.88)';
  c.font = '19px system-ui, sans-serif';
  for (const fact of info.facts) {
    y = wrapCanvasLines(c, `• ${fact}`, pad + 8, y, w - pad * 2 - 8, 28) + 12;
  }

  c.textAlign = 'center';
  c.fillStyle = 'rgba(125, 211, 252, 0.65)';
  c.font = '18px system-ui, sans-serif';
  c.fillText('Deep Spot', w / 2, h - 48);

  return shareCanvas;
}

function buildTankCardCopy(prevTier, newTier) {
  const next = getNextTankUpgrade();
  const stats = `Air ${prevTier.maxAir} → ${newTier.maxAir}`;
  const unlockedRarity =
    newTier.rarityComplete && typeof RARITY_LABELS !== 'undefined'
      ? RARITY_LABELS[newTier.rarityComplete]
      : newTier.rarityComplete;
  const unlockLine = unlockedRarity
    ? `Unlocked: every ${unlockedRarity} species in your album`
    : '';
  const rarityName =
    typeof RARITY_LABELS !== 'undefined' && next ? RARITY_LABELS[next.rarity] : next?.rarity;
  const nextLine = next
    ? `Next: ${next.tier.label} — collect all ${rarityName} species (${next.remaining} left)`
    : 'All rarity tiers complete — maximum tank';
  const sub = unlockLine ? `${unlockLine}\n${nextLine}` : nextLine;
  return { stats, sub };
}

function drawTankCardToCanvas(prevTier, newTier) {
  const c = shareCanvas.getContext('2d');
  const w = shareCanvas.width;
  const h = shareCanvas.height;
  const pad = 40;
  const accent = '#38bdf8';
  const copy = buildTankCardCopy(prevTier, newTier);

  c.clearRect(0, 0, w, h);

  const bg = c.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0c2848');
  bg.addColorStop(0.5, '#0a1628');
  bg.addColorStop(1, '#050d18');
  c.fillStyle = bg;
  c.fillRect(0, 0, w, h);

  c.strokeStyle = accent;
  c.lineWidth = 4;
  c.strokeRect(20, 20, w - 40, h - 40);

  c.fillStyle = accent;
  c.font = 'bold 22px system-ui, sans-serif';
  c.textAlign = 'center';
  c.fillText('TANK UPGRADE', w / 2, 72);

  c.font = '120px serif';
  c.fillText('🫧', w / 2, 230);

  c.fillStyle = '#e8f4ff';
  c.font = 'bold 40px system-ui, sans-serif';
  c.fillText(newTier.label, w / 2, 300);

  c.font = '24px system-ui, sans-serif';
  c.fillStyle = 'rgba(232, 244, 255, 0.85)';
  c.fillText(copy.stats, w / 2, 350);

  c.font = '18px system-ui, sans-serif';
  c.fillStyle = 'rgba(232, 244, 255, 0.6)';
  wrapCanvasLines(c, copy.sub, w / 2, 390, w - pad * 2, 24);

  c.textAlign = 'center';
  c.fillStyle = 'rgba(125, 211, 252, 0.65)';
  c.font = '18px system-ui, sans-serif';
  c.fillText('Deep Spot', w / 2, h - 48);

  return shareCanvas;
}

async function shareCanvasAsImage(fileName, title, text) {
  const blob = await new Promise((resolve, reject) => {
    shareCanvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create image'))), 'image/png');
  });

  const file = new File([blob], fileName, { type: 'image/png' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title, text });
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function shareFishCardImage(info) {
  if (typeof preloadCreatureSprites === 'function') {
    await preloadCreatureSprites();
  }
  drawFishCardToCanvas(info);
  await shareCanvasAsImage(
    `deep-spot-${info.id}.png`,
    `${info.name} — Deep Spot`,
    `I discovered the ${info.name} in Deep Spot!`
  );
}

async function shareTankCardImage(prevTier, newTier) {
  drawTankCardToCanvas(prevTier, newTier);
  await shareCanvasAsImage(
    `deep-spot-tank-${newTier.tier}.png`,
    `${newTier.label} — Deep Spot`,
    `I unlocked the ${newTier.label} in Deep Spot by completing a rarity tier!`
  );
}

function populateFishCard(creatureType) {
  if (!fishCardScreen) return false;
  const info = getFishCardInfo(creatureType);
  fishCardCreature = creatureType;
  fishCardScreen.dataset.rarity = info.rarity;
  const cardEl = fishCardScreen.querySelector('.fish-card');
  if (cardEl) cardEl.dataset.rarity = info.rarity;
  if (fishCardRarity) fishCardRarity.textContent = RARITY_LABELS[info.rarity] || info.rarity;
  if (typeof setFishCardArt === 'function') {
    setFishCardArt(creatureType);
  } else if (fishCardEmoji) {
    fishCardEmoji.textContent = info.emoji;
  }
  if (fishCardName) fishCardName.textContent = info.name;
  if (fishCardDesc) fishCardDesc.textContent = info.description;
  if (fishCardPoints) {
    fishCardPoints.textContent = `+${info.points} pts · usually ${info.minDepth}m+`;
  }
  if (fishCardFacts) {
    fishCardFacts.innerHTML = '';
    for (const fact of info.facts) {
      const li = document.createElement('li');
      li.textContent = fact;
      fishCardFacts.appendChild(li);
    }
  }
  return true;
}

function populateTankCard(prevTier, newTier) {
  tankCardData = { prevTier, newTier };
  const copy = buildTankCardCopy(prevTier, newTier);
  if (tankCardName) tankCardName.textContent = newTier.label;
  if (tankCardStats) tankCardStats.textContent = `${copy.stats}\n${copy.sub}`;
}

function revealOverlayScreen(screen) {
  if (!screen) return;
  bringRewardOverlayToFront(screen);
  screen.classList.remove('hidden');
  screen.setAttribute('aria-hidden', 'false');
  refreshDiveMiniStripAfterCard();
}

function displayFishCard(creatureType) {
  if (!fishCardScreen || !creatureType) return false;

  hideAlbumForCard();
  if (tankCardScreen) tankCardScreen.classList.add('hidden');

  if (!populateFishCard(creatureType)) return false;
  if (typeof Sounds !== 'undefined') {
    Sounds.stopAmbience();
    Sounds.cardReveal();
  }
  revealOverlayScreen(fishCardScreen);
  return true;
}

function showFishCard(creatureType) {
  captureOverlayPauseState();
  return displayFishCard(creatureType);
}

function showTankCard(prevTier, newTier) {
  if (!tankCardScreen || !newTier) return false;

  captureOverlayPauseState();
  hideAlbumForCard();
  if (fishCardScreen) fishCardScreen.classList.add('hidden');
  fishCardCreature = null;

  populateTankCard(prevTier, newTier);
  revealOverlayScreen(tankCardScreen);
  return true;
}

function closeRewardOverlay() {
  const fromDiveCapture = overlayPauseState?.fromDiveCapture;

  if (fishCardScreen && !fishCardScreen.classList.contains('hidden')) {
    fishCardScreen.classList.add('hidden');
    fishCardScreen.setAttribute('aria-hidden', 'true');
    fishCardCreature = null;
  }
  if (tankCardScreen && !tankCardScreen.classList.contains('hidden')) {
    tankCardScreen.classList.add('hidden');
    tankCardScreen.setAttribute('aria-hidden', 'true');
    tankCardData = null;
  }

  if (fromDiveCapture) {
    diveCaptureQueue.shift();
    if (diveCaptureQueue.length > 0) {
      showNextDiveCaptureCard();
      return;
    }
    resumeAfterDiveCapture();
    return;
  }

  if (!tryShowNextOverlay()) completeOverlaySequence();
  refreshDiveMiniStripAfterCard();
}

function refreshDiveMiniStripAfterCard() {
  if (typeof syncDiveMiniCardStrip === 'function') {
    requestAnimationFrame(() => syncDiveMiniCardStrip());
  }
}

function closeFishCard() {
  closeRewardOverlay();
}

if (fishCardShareBtn) {
  fishCardShareBtn.addEventListener('click', () => {
    if (!fishCardCreature) return;
    const info = getFishCardInfo(fishCardCreature);
    fishCardShareBtn.disabled = true;
    fishCardShareBtn.setAttribute('aria-busy', 'true');
    shareFishCardImage(info)
      .catch(() => {
        alert('Could not share this card. Try again or use a browser that supports image sharing.');
      })
      .finally(() => {
        fishCardShareBtn.disabled = false;
        fishCardShareBtn.removeAttribute('aria-busy');
      });
  });
}

if (fishCardCloseBtn) {
  fishCardCloseBtn.addEventListener('click', closeFishCard);
}

if (tankCardShareBtn) {
  tankCardShareBtn.addEventListener('click', () => {
    if (!tankCardData) return;
    tankCardShareBtn.disabled = true;
    tankCardShareBtn.setAttribute('aria-busy', 'true');
    shareTankCardImage(tankCardData.prevTier, tankCardData.newTier)
      .catch(() => {
        alert('Could not share this card. Try again or use a browser that supports image sharing.');
      })
      .finally(() => {
        tankCardShareBtn.disabled = false;
        tankCardShareBtn.removeAttribute('aria-busy');
      });
  });
}

if (tankCardCloseBtn) {
  tankCardCloseBtn.addEventListener('click', closeFishCard);
}

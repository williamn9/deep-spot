/**
 * Creature sprite loading and drawing (PNG assets from Figma sprite sheet)
 */

const SPRITE_BASE = 'assets/sprites/';
const SPRITE_VERSION = '19';
const spriteCache = Object.create(null);
let spritesReady = false;
let spritesReadyPromise = null;

function creatureSpriteUrl(creatureId) {
  return `${SPRITE_BASE}${creatureId}.png?v=${SPRITE_VERSION}`;
}

function loadCreatureSprite(creatureId) {
  if (spriteCache[creatureId]) return spriteCache[creatureId];
  const img = new Image();
  img.src = creatureSpriteUrl(creatureId);
  img.decoding = 'async';
  spriteCache[creatureId] = img;
  return img;
}

function preloadCreatureSprites(creatureTypes) {
  if (spritesReadyPromise) return spritesReadyPromise;
  const types = creatureTypes || (typeof CREATURE_TYPES !== 'undefined' ? CREATURE_TYPES : []);
  spritesReadyPromise = Promise.all(
    types.map(
      (type) =>
        new Promise((resolve) => {
          const img = loadCreatureSprite(type.id);
          if (img.complete && img.naturalWidth) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  ).then(() => {
    spritesReady = true;
  });
  return spritesReadyPromise;
}

function isCreatureSpriteReady(creatureId) {
  const img = spriteCache[creatureId];
  return !!(img && img.complete && img.naturalWidth);
}

function createCreatureSpriteImg(type, options = {}) {
  const { className = 'creature-sprite', size = 28, silhouette = false } = options;
  const img = document.createElement('img');
  img.src = creatureSpriteUrl(type.id);
  img.alt = type.name;
  img.className = className + (silhouette ? ' creature-sprite--silhouette' : '');
  img.width = size;
  img.height = size;
  img.loading = 'lazy';
  img.draggable = false;
  return img;
}

function shouldFlipCreatureSprite(type, facing) {
  const swim =
    typeof CREATURE_SWIM !== 'undefined'
      ? CREATURE_SWIM[type.id] || CREATURE_SWIM._default
      : null;
  if (swim && swim.spriteFacesLeft === true) return facing > 0;
  if (swim && swim.spriteFacesLeft === false) return facing < 0;
  // Pixel sheet art faces right by default.
  return facing < 0;
}

function drawCreatureSprite(ctx, x, y, type, style, alpha, photoFade, flip, targetH = 40) {
  const img = loadCreatureSprite(type.id);
  if (!img.complete || !img.naturalWidth) {
    if (typeof drawCreatureEmoji === 'function') {
      drawCreatureEmoji(x, y, type.emoji, style, alpha, photoFade, flip);
    }
    return;
  }

  const scale = targetH / img.naturalHeight;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;

  ctx.save();
  ctx.globalAlpha = alpha;
  if (flip) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.translate(-x, -y);
  }

  if (style === 'silhouette') {
    // Match emoji ghost look — dark shape + blue tint (not flat black shadow).
    ctx.filter = 'brightness(0) saturate(0)';
    ctx.globalAlpha = alpha * 0.9;
    ctx.drawImage(img, x - w / 2, y - h / 2 + 1, w, h);
    ctx.filter = 'none';
    ctx.globalAlpha = alpha * 0.42;
    ctx.filter = 'brightness(0.6) sepia(1) hue-rotate(165deg) saturate(3)';
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
    ctx.filter = 'none';
  } else if (style === 'spotted') {
    const grey = (photoFade || 0) * 0.9;
    if (grey > 0.02) ctx.filter = `grayscale(${grey}) brightness(1.1)`;
    else ctx.filter = 'brightness(1.15) saturate(1.05)';
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  } else {
    // Emoji used white fill; boost sprites so they stay readable on dark water.
    ctx.filter = 'brightness(1.2) saturate(1.08) contrast(1.05)';
    ctx.drawImage(img, x - w / 2, y - h / 2, w, h);
  }

  ctx.restore();
}

function drawCreatureSpriteToCanvas(canvasCtx, type, cx, cy, maxH = 120) {
  const img = loadCreatureSprite(type.id);
  if (!img.complete || !img.naturalWidth) {
    canvasCtx.font = `${maxH}px serif`;
    canvasCtx.textAlign = 'center';
    canvasCtx.textBaseline = 'middle';
    canvasCtx.fillText(type.emoji, cx, cy);
    return;
  }
  const scale = maxH / img.naturalHeight;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  canvasCtx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
}

function setFishCardArt(type) {
  const el = document.getElementById('fishCardEmoji');
  if (!el) return;
  el.innerHTML = '';
  const img = createCreatureSpriteImg(type, { className: 'fish-card-art-img', size: 160 });
  el.appendChild(img);
}

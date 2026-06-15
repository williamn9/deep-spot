#!/usr/bin/env python3
"""Build species-data.js and slice the Figma fish-spike sprite sheet."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SPRITES_DIR = ROOT / "web" / "assets" / "sprites"
SHEET_PATH = SPRITES_DIR / "sprite-sheet.png"
SPIKE_SHEET_PATH = SPRITES_DIR / "spike-sheet.png"
TINY_SHEET_PATH = SPRITES_DIR / "tiny-sheet.png"
FIGMA_TINY_SMALL_SHEET_PATH = SPRITES_DIR / "figma-tiny-small-sheet.png"
FIGMA_TSM_SHEET_PATH = SPRITES_DIR / "figma-tiny-small-medium-sheet.png"
FIGMA_LARGE_SHEET_PATH = SPRITES_DIR / "figma-large-sheet.png"
FIGMA_GIANT_SHEET_PATH = SPRITES_DIR / "figma-giant-sheet.png"
OUT_JS = ROOT / "web" / "js" / "species-data.js"

# Size-group spike sheet order (left→right, top→bottom across bands below)
SIZE_GRID_IDS = [
    # Tiny (25)
    "pistolshrimp", "shrimp", "goby", "blenny", "fireworm", "clownfish", "damselfish", "hatchetfish",
    "sanddollar", "urchin", "anchovy", "barreleye", "crab",
    "seahorse", "sergeant", "yeticrab", "fangtooth", "dragonfish", "butterflyfish", "sardine",
    "silverside", "loosejaw", "dumbo", "lanternfish", "pipefish",
    # Small (25)
    "angler", "atolla", "swallower", "nautilus", "snailfish", "blobfish", "bluetang", "triggerfish",
    "shell", "starfish", "tripod", "vampire", "flyingfish", "cucumber", "lionfish", "anemone", "jelly",
    "yellowtail", "boxfish", "mullet", "cuttlefish", "isopod", "glasssponge", "parrotfish", "ray",
    # Medium (19)
    "lobster", "viperfish", "snapper", "deeplobster", "barracuda", "gulper", "grouper", "octopus",
    "seakrait", "eel", "turtle", "bonnethead", "stingray", "seal", "shark", "coelacanth", "frilled",
    "tubeworm", "wolfeel",
    # Large (21)
    "dolphin", "eagleray", "sealion", "dugong", "nurseshark", "sunfish", "manatee", "spidercrab",
    "goblin", "hammerhead", "sixgill", "beluga", "gpo", "narwhal", "thresher", "tigershark", "manta",
    "megamouth", "greenland", "oarfish", "orca",
    # Giant (10)
    "stygiomedusa", "whaleshark", "squid", "colossal", "humpback", "spermwhale", "leviathan", "kraken",
    "whale", "wyrm",
]

# (y0, y1, sprite_count, min_blob_area, min_blob_xc)
SPIKE_BANDS = [
    (22, 66, 13, 180, 110),
    (79, 121, 12, 180, 110),
    (149, 199, 13, 180, 110),
    (208, 256, 12, 180, 110),
    (283, 332, 19, 350, 110),
    (363, 405, 11, 450, 140),
    (418, 468, 10, 450, 140),
    (488, 554, 10, 450, 110),
]

SPIKE_X0 = 100
SPIKE_X1 = 1010
MIN_BLOB_WIDTH = 22

TINY_GRID_IDS = SIZE_GRID_IDS[:25]
SMALL_GRID_IDS = SIZE_GRID_IDS[25:50]
MEDIUM_GRID_IDS = SIZE_GRID_IDS[50:69]
LARGE_GRID_IDS = SIZE_GRID_IDS[69:90]
GIANT_GRID_IDS = SIZE_GRID_IDS[90:100]
TINY_COLS = TINY_ROWS = 5
TINY_CELL_INSET = 5

FIGMA_COLS = 11
FIGMA_CELL_INSET = 6
FIGMA_CONTENT_THRESH = 0.02
# Row bands on the masked 2816×1536 Figma frame (node 8:25): (y0, y1, skip_cols, pick_cols)
FIGMA_TINY_ROW_BANDS = [
    (51, 205, frozenset(), None),
    (302, 445, frozenset(), None),
    (536, 700, frozenset(), None),
]
FIGMA_SMALL_ROW_BANDS = [
    (830, 1003, frozenset(), None),
    (1064, 1270, frozenset(), None),
    (1337, 1489, frozenset(), [4, 5, 6, 8, 9, 10]),
]

# Figma node 11:29 — 2048×2048 sheet, 9 columns; (y0, y1, max_cols)
FIGMA_TSM_COLS = 9
FIGMA_TSM_TINY_ROWS = [(24, 182, 9), (214, 403, 9), (416, 593, 8)]
# Row 3 has an extra leading fish (not in catalog); skip it so butterflyfish→pipefish align
FIGMA_TSM_TINY_CELL_IDS = [*TINY_GRID_IDS[:18], None, *TINY_GRID_IDS[18:]]
FIGMA_TSM_SMALL_ROWS = [(717, 906, 9), (930, 1119, 9), (1145, 1330, 7)]
FIGMA_TSM_MEDIUM_ROWS = [(1425, 1618, 6), (1629, 1836, 8), (1854, 2039, 5)]
# Row 0 has 6 creatures (no grouper); row 1 skips leading grouper bleed cell
FIGMA_TSM_MEDIUM_CELL_IDS = [*MEDIUM_GRID_IDS[:6], None, *MEDIUM_GRID_IDS[7:14], *MEDIUM_GRID_IDS[14:19]]
# Explicit bounds for cells where blob splits are too narrow (x0, y0, x1, y1)
FIGMA_TSM_CELL_OVERRIDES = {
    "nautilus": (820, 717, 1040, 906),
    "octopus": (308, 1629, 656, 1836),
    "barracuda": (1255, 1425, 1635, 1618),
    "gulper": (1648, 1425, 1982, 1618),
    "grouper": (0, 1629, 328, 1836),
}

# Figma node 11:28 — 2752×764 sheet; (x0, y0, x1, y1, species_id)
FIGMA_LARGE_CELLS = [
    # row 1 (8)
    (47, 81, 352, 247, "dolphin"),
    (359, 69, 617, 261, "eagleray"),
    (632, 76, 868, 257, "sealion"),
    (883, 98, 1244, 245, "dugong"),
    (1258, 102, 1632, 245, "nurseshark"),
    (1651, 43, 1917, 303, "sunfish"),
    (1933, 87, 2332, 264, "manatee"),
    (2400, 95, 2695, 276, "spidercrab"),
    # row 2 (7)
    (45, 347, 449, 493, "goblin"),
    (445, 330, 850, 497, "hammerhead"),
    (863, 351, 1331, 493, "beluga"),
    (1345, 330, 1641, 522, "gpo"),
    (1649, 387, 2040, 487, "narwhal"),
    (2025, 357, 2302, 485, "sixgill"),
    (2309, 331, 2695, 505, "thresher"),
    # row 3 (6 catalog species; first cell is generic great white — skipped)
    (424, 567, 797, 721, "tigershark"),
    (797, 541, 1041, 746, "manta"),
    (1045, 551, 1545, 736, "megamouth"),
    (1550, 551, 1890, 736, "greenland"),
    (1937, 558, 2307, 732, "oarfish"),
    (2315, 541, 2695, 735, "orca"),
]

# Figma node 11:27 — 2816×1536 sheet; (y0, y1, x0, x1, species_id)
FIGMA_GIANT_CELLS = [
    (28, 292, 18, 940, "humpback"),
    (28, 292, 944, 2798, "whale"),
    (304, 568, 944, 1846, "spermwhale"),
    (304, 568, 1846, 2798, "whaleshark"),
    (572, 918, 18, 940, "squid"),
    (572, 918, 944, 1846, "colossal"),
    (572, 918, 1846, 2798, "angler"),
    (868, 1508, 18, 540, "stygiomedusa"),
    (868, 1508, 548, 1413, "kraken"),
    (868, 1508, 1417, 2798, "wyrm"),
]

FIGMA_BLOB_PAD = 10

# Grid order: left-to-right, top-to-bottom (matches agreed 100-species list)
SPECIES = [
    # Common (25)
    ("sardine", "Sardine", "common", "🐟", "school"),
    ("shrimp", "Reef Shrimp", "common", "🦐", "dart"),
    ("clownfish", "Clownfish", "common", "🐠", "hover"),
    ("shell", "Queen Conch", "common", "🐚", "settled"),
    ("crab", "Hermit Crab", "common", "🦀", "bottom"),
    ("anchovy", "Anchovy", "common", "🐟", "school"),
    ("silverside", "Silverside", "common", "🐟", "school"),
    ("damselfish", "Damselfish", "common", "🐠", "cruise"),
    ("parrotfish", "Parrotfish", "common", "🐟", "cruise"),
    ("butterflyfish", "Butterflyfish", "common", "🐠", "hover"),
    ("blenny", "Blenny", "common", "🐟", "cruise"),
    ("goby", "Goby", "common", "🐟", "cruise"),
    ("seahorse", "Seahorse", "common", "🐴", "hover"),
    ("pipefish", "Pipefish", "common", "🐟", "cruise"),
    ("starfish", "Sea Star", "common", "⭐", "settled"),
    ("urchin", "Sea Urchin", "common", "🦔", "settled"),
    ("anemone", "Magnificent Anemone", "common", "🌸", "settled"),
    ("pistolshrimp", "Pistol Shrimp", "common", "🦐", "dart"),
    ("bluetang", "Blue Tang", "common", "🐟", "hover"),
    ("yellowtail", "Yellowtail Snapper", "common", "🐟", "cruise"),
    ("sergeant", "Sergeant Major", "common", "🐟", "school"),
    ("mullet", "Striped Mullet", "common", "🐟", "school"),
    ("sanddollar", "Sand Dollar", "common", "🪙", "settled"),
    ("cucumber", "Sea Cucumber", "common", "🥒", "bottom"),
    ("fireworm", "Fireworm", "common", "🪱", "bottom"),
    # Uncommon (25)
    ("jelly", "Moon Jelly", "uncommon", "🪼", "drift"),
    ("seal", "Harbor Seal", "uncommon", "🦭", "fast_cruise"),
    ("turtle", "Sea Turtle", "uncommon", "🐢", "cruise"),
    ("dolphin", "Dolphin", "uncommon", "🐬", "fast_cruise"),
    ("octopus", "Octopus", "uncommon", "🐙", "jet"),
    ("lobster", "Spiny Lobster", "uncommon", "🦞", "bottom"),
    ("lionfish", "Lionfish", "uncommon", "🐡", "hover"),
    ("stingray", "Southern Stingray", "uncommon", "🐟", "glide"),
    ("manta", "Manta Ray", "uncommon", "🐟", "glide"),
    ("barracuda", "Barracuda", "uncommon", "🐟", "fast_cruise"),
    ("grouper", "Nassau Grouper", "uncommon", "🐟", "stalk"),
    ("snapper", "Red Snapper", "uncommon", "🐟", "cruise"),
    ("triggerfish", "Picasso Triggerfish", "uncommon", "🐡", "hover"),
    ("boxfish", "Boxfish", "uncommon", "🐡", "hover"),
    ("nautilus", "Chambered Nautilus", "uncommon", "🐚", "cruise"),
    ("cuttlefish", "Cuttlefish", "uncommon", "🦑", "jet"),
    ("sealion", "Sea Lion", "uncommon", "🦭", "fast_cruise"),
    ("manatee", "Manatee", "uncommon", "🐋", "cruise"),
    ("dugong", "Dugong", "uncommon", "🐋", "cruise"),
    ("seakrait", "Banded Sea Krait", "uncommon", "🐍", "cruise"),
    ("bonnethead", "Bonnethead Shark", "uncommon", "🦈", "patrol"),
    ("nurseshark", "Nurse Shark", "uncommon", "🦈", "patrol"),
    ("wolfeel", "Wolf Eel", "uncommon", "🐍", "stalk"),
    ("sunfish", "Ocean Sunfish", "uncommon", "🐟", "glide"),
    ("flyingfish", "Flying Fish", "uncommon", "🐟", "dart"),
    # Rare (25)
    ("ray", "Pufferfish", "rare", "🐡", "hover"),
    ("eel", "Moray Eel", "rare", "🐍", "stalk"),
    ("shark", "Reef Shark", "rare", "🦈", "patrol"),
    ("angler", "Anglerfish", "rare", "🐟", "stalk"),
    ("viperfish", "Viperfish", "rare", "🐉", "dart"),
    ("blobfish", "Blobfish", "rare", "🫠", "drift"),
    ("eagleray", "Eagle Ray", "rare", "🐟", "glide"),
    ("thresher", "Thresher Shark", "rare", "🦈", "patrol"),
    ("hammerhead", "Hammerhead Shark", "rare", "🦈", "patrol"),
    ("whaleshark", "Whale Shark", "rare", "🦈", "glide"),
    ("tigershark", "Tiger Shark", "rare", "🦈", "patrol"),
    ("oarfish", "Oarfish", "rare", "🐟", "glide"),
    ("gulper", "Gulper Eel", "rare", "🐍", "stalk"),
    ("dragonfish", "Black Dragonfish", "rare", "🐟", "dart"),
    ("fangtooth", "Fangtooth", "rare", "🐟", "dart"),
    ("atolla", "Atolla Jelly", "rare", "🪼", "drift"),
    ("dumbo", "Dumbo Octopus", "rare", "🐙", "drift"),
    ("goblin", "Goblin Shark", "rare", "🦈", "stalk"),
    ("frilled", "Frilled Shark", "rare", "🦈", "stalk"),
    ("sixgill", "Sixgill Shark", "rare", "🦈", "patrol"),
    ("barreleye", "Barreleye", "rare", "🐟", "drift"),
    ("hatchetfish", "Hatchetfish", "rare", "🐟", "drift"),
    ("loosejaw", "Stoplight Loosejaw", "rare", "🐟", "dart"),
    ("deeplobster", "Deep-sea Lobster", "rare", "🦞", "bottom"),
    ("lanternfish", "Lanternfish", "rare", "🐟", "school"),
    # Legendary (25)
    ("squid", "Giant Squid", "legendary", "🦑", "jet"),
    ("whale", "Blue Whale", "legendary", "🐋", "glide"),
    ("coelacanth", "Coelacanth", "legendary", "🐟", "glide"),
    ("vampire", "Vampire Squid", "legendary", "🦑", "drift"),
    ("leviathan", "Abyssal Leviathan", "legendary", "🐋", "glide"),
    ("spermwhale", "Sperm Whale", "legendary", "🐋", "glide"),
    ("orca", "Orca", "legendary", "🐋", "fast_cruise"),
    ("humpback", "Humpback Whale", "legendary", "🐋", "glide"),
    ("narwhal", "Narwhal", "legendary", "🦄", "cruise"),
    ("beluga", "Beluga", "legendary", "🐋", "cruise"),
    ("colossal", "Colossal Squid", "legendary", "🦑", "jet"),
    ("gpo", "Giant Pacific Octopus", "legendary", "🐙", "jet"),
    ("megamouth", "Megamouth Shark", "legendary", "🦈", "glide"),
    ("greenland", "Greenland Shark", "legendary", "🦈", "glide"),
    ("isopod", "Giant Isopod", "legendary", "🐛", "bottom"),
    ("spidercrab", "Japanese Spider Crab", "legendary", "🦀", "bottom"),
    ("yeticrab", "Yeti Crab", "legendary", "🦀", "bottom"),
    ("stygiomedusa", "Stygiomedusa", "legendary", "🪼", "drift"),
    ("snailfish", "Mariana Snailfish", "legendary", "🐟", "drift"),
    ("glasssponge", "Glass Sponge", "legendary", "🧽", "settled"),
    ("tubeworm", "Giant Tube Worm", "legendary", "🪱", "settled"),
    ("swallower", "Black Swallower", "legendary", "🐟", "stalk"),
    ("tripod", "Tripod Fish", "legendary", "🐟", "settled"),
    ("kraken", "Midnight Kraken", "legendary", "🐙", "glide"),
    ("wyrm", "Hadal Wyrm", "legendary", "🐉", "glide"),
]

SWIM_PRESETS = {
    "school": {"style": "school", "speed": 52, "vert": 5, "wobble": 12, "phaseSpd": 3.5, "depthRange": 6},
    "dart": {"style": "dart", "speed": 38, "vert": 10, "phaseSpd": 4.8, "depthRange": 3},
    "hover": {"style": "hover", "speed": 22, "vert": 4, "wobble": 8, "phaseSpd": 2.8, "depthRange": 2},
    "settled": {"style": "settled", "phaseSpd": 0.35, "depthRange": 0.35, "noFlip": True},
    "bottom": {"style": "bottom", "speed": 14, "phaseSpd": 2.2, "depthRange": 2},
    "drift": {"style": "drift", "speed": 14, "vert": 9, "drift": 7, "phaseSpd": 1.3, "depthRange": 9},
    "fast_cruise": {"style": "fast_cruise", "speed": 44, "vert": 7, "wobble": 10, "phaseSpd": 2.4, "depthRange": 11},
    "cruise": {"style": "cruise", "speed": 20, "vert": 4, "wobble": 6, "phaseSpd": 1.4, "depthRange": 9},
    "jet": {"style": "jet", "speed": 30, "vert": 10, "phaseSpd": 1.55, "depthRange": 7},
    "stalk": {"style": "stalk", "speed": 18, "wobble": 20, "vert": 3, "phaseSpd": 2.1, "depthRange": 4},
    "patrol": {"style": "patrol", "speed": 40, "vert": 6, "wobble": 5, "phaseSpd": 1.9, "depthRange": 14},
    "glide": {"style": "glide", "speed": 24, "vert": 7, "phaseSpd": 0.85, "depthRange": 22},
}

SWIM_OVERRIDES = {
    "shell": {"style": "settled", "phaseSpd": 0.35, "depthRange": 0.35, "noFlip": True},
    "lobster": {"style": "bottom", "speed": 11, "phaseSpd": 1.7, "depthRange": 3},
    "ray": {"style": "hover", "speed": 16, "vert": 5, "wobble": 11, "phaseSpd": 1.6, "depthRange": 5},
    "angler": {"style": "stalk", "speed": 7, "wobble": 5, "vert": 2, "phaseSpd": 1, "depthRange": 3},
    "squid": {"style": "jet", "speed": 34, "vert": 13, "phaseSpd": 1.85, "depthRange": 11},
    "whale": {"style": "glide", "speed": 24, "vert": 7, "phaseSpd": 0.85, "depthRange": 22},
    "viperfish": {"style": "dart", "speed": 32, "vert": 9, "phaseSpd": 3.1, "depthRange": 9},
    "blobfish": {"style": "drift", "speed": 7, "vert": 2.5, "drift": 3, "phaseSpd": 0.75, "depthRange": 4},
    "coelacanth": {"style": "glide", "speed": 13, "vert": 4, "phaseSpd": 0.65, "depthRange": 9},
    "vampire": {"style": "drift", "speed": 11, "vert": 6, "drift": 5, "phaseSpd": 0.95, "depthRange": 13},
    "leviathan": {"style": "glide", "speed": 16, "vert": 9, "phaseSpd": 0.5, "depthRange": 28},
    "kraken": {"style": "glide", "speed": 18, "vert": 10, "phaseSpd": 0.45, "depthRange": 30},
    "wyrm": {"style": "glide", "speed": 14, "vert": 11, "phaseSpd": 0.4, "depthRange": 32},
}

# Source art faces right — default flip-when-facing-left applies.
SPRITE_FACES_RIGHT = frozenset({
    "atolla", "beluga", "clownfish", "dolphin", "dugong", "dumbo", "eagleray",
    "goblin", "greenland", "hatchetfish", "isopod", "lobster", "loosejaw",
    "manatee", "manta", "narwhal", "nurseshark", "oarfish", "orca", "pipefish", "sealion",
    "sergeant", "sixgill", "snapper", "spidercrab", "thresher", "tigershark", "wolfeel",
    "wyrm", "yeticrab",
})

# Radial / vertical / stationary — horizontal flip is meaningless.
SPRITE_ORIENT_NEUTRAL = frozenset({
    "anemone", "glasssponge", "jelly", "sanddollar", "shell", "starfish", "stygiomedusa", "urchin",
})


def apply_sprite_orient(species_id: str, preset: dict) -> dict:
    preset = dict(preset)
    if species_id in SPRITE_ORIENT_NEUTRAL:
        preset["spriteNoFlip"] = True
    elif species_id not in SPRITE_FACES_RIGHT:
        preset["spriteFacesLeft"] = True
    return preset

RARITY_BANDS = {
    "common": {"min": 0, "max": 14, "points": (8, 16), "weight": (28, 36)},
    "uncommon": {"min": 15, "max": 79, "points": (22, 44), "weight": (15, 24)},
    "rare": {"min": 45, "max": 250, "points": (50, 98), "weight": (5, 12)},
    "legendary": {"min": 100, "max": 750, "points": (120, 300), "weight": (1, 5)},
}


def tier_index(species_id: str, rarity: str) -> int:
    ids = [s[0] for s in SPECIES if s[2] == rarity]
    return ids.index(species_id)


def stats_for(species_id: str, rarity: str, idx_in_all: int) -> dict:
    band = RARITY_BANDS[rarity]
    tier_i = tier_index(species_id, rarity)
    tier_n = max(1, len([s for s in SPECIES if s[2] == rarity]) - 1)
    t = tier_i / tier_n
    min_depth = round(band["min"] + (band["max"] - band["min"]) * t)
    p0, p1 = band["points"]
    points = round(p0 + (p1 - p0) * t)
    w0, w1 = band["weight"]
    weight = round(w1 - (w1 - w0) * t)
    return {"minDepth": min_depth, "points": points, "weight": weight}


TARGET_CANVAS = 128
TARGET_BODY = 104
ELONGATED_CANVAS_W = 256
ELONGATED_ASPECT = 2.2
CELL_INSET = 6
CHROMA_PAD = 2


def _sheet_bg_color(rgb):
    import numpy as np

    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)
    return np.median(border, axis=0)


def _background_mask(r, g, b, bg, tol: int = 32):
    """Background pixels reachable from the image border."""
    import numpy as np
    from collections import deque

    dist = np.abs(r.astype(int) - bg[0]) + np.abs(g.astype(int) - bg[1]) + np.abs(b.astype(int) - bg[2])
    is_bg = dist <= tol
    is_white = (r > 200) & (g > 200) & (b > 200)
    is_black = (r < 8) & (g < 8) & (b < 8)
    candidate = is_bg | is_white | is_black

    h, w = candidate.shape
    bg_mask = np.zeros((h, w), dtype=bool)
    q = deque()

    def seed(x: int, y: int) -> None:
        if candidate[y, x] and not bg_mask[y, x]:
            bg_mask[y, x] = True
            q.append((x, y))

    for x in range(w):
        seed(x, 0)
        seed(x, h - 1)
    for y in range(h):
        seed(0, y)
        seed(w - 1, y)

    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and candidate[ny, nx] and not bg_mask[ny, nx]:
                bg_mask[ny, nx] = True
                q.append((nx, ny))

    return bg_mask


def chroma_key(img: Image.Image, bg=None) -> Image.Image:
    """Remove sheet background without punching holes in creature pixels."""
    import numpy as np

    arr = np.array(img.convert("RGBA"))
    rgb = arr[..., :3]
    if bg is None:
        sheet_bg = _sheet_bg_color(rgb)
    else:
        sheet_bg = np.asarray(bg, dtype=np.float64)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    is_bg = _background_mask(r, g, b, sheet_bg)
    # Figma cell interiors use a brighter blue than the outer sheet border.
    is_bg |= (b > 150) & (r < 60) & (g < 90)
    arr[is_bg, 3] = 0
    return Image.fromarray(arr)


def largest_blob_bbox(img: Image.Image):
    import numpy as np
    from collections import deque

    arr = np.array(img)
    mask = arr[..., 3] > 8
    if not mask.any():
        return None

    h, w = mask.shape
    visited = np.zeros_like(mask)
    best = None
    best_area = 0

    for y in range(h):
        for x in range(w):
            if not mask[y, x] or visited[y, x]:
                continue
            q = deque([(x, y)])
            visited[y, x] = True
            minx = maxx = x
            miny = maxy = y
            area = 0
            while q:
                cx, cy = q.popleft()
                area += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        q.append((nx, ny))
            bw = maxx - minx + 1
            bh = maxy - miny + 1
            if bw < 20 or bh < 20:
                continue
            if max(bw, bh) / max(1, min(bw, bh)) > 12:
                continue
            if area > best_area:
                best_area = area
                best = (minx, miny, maxx + 1, maxy + 1)

    return best


def sprite_content_bbox(img: Image.Image):
    """Tight bounds around all opaque pixels (handles grid-line gaps between blob parts)."""
    import numpy as np

    arr = np.array(img)
    ys, xs = np.where(arr[..., 3] > 8)
    if len(xs) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def normalize_sprite(tile: Image.Image, sheet_bg=None) -> Image.Image:
    """Isolate the main creature and scale it to a consistent visual size."""
    keyed = chroma_key(tile, sheet_bg)
    bbox = sprite_content_bbox(keyed)
    if bbox is None:
        bbox = largest_blob_bbox(keyed)
    if not bbox:
        return Image.new("RGBA", (TARGET_CANVAS, TARGET_CANVAS), (0, 0, 0, 0))

    minx, miny, maxx, maxy = bbox
    pad = CHROMA_PAD
    crop = keyed.crop(
        (
            max(0, minx - pad),
            max(0, miny - pad),
            min(keyed.width, maxx + pad),
            min(keyed.height, maxy + pad),
        )
    )

    cw, ch = crop.size
    aspect = cw / max(ch, 1)
    if aspect >= ELONGATED_ASPECT:
        # Long thin creatures (whales, barracuda): scale by body height, not overall width.
        scale = TARGET_BODY / ch
        nw = max(1, round(cw * scale))
        nh = max(1, round(ch * scale))
        if nw > ELONGATED_CANVAS_W:
            scale *= ELONGATED_CANVAS_W / nw
            nw = max(1, round(cw * scale))
            nh = max(1, round(ch * scale))
        canvas_w = min(max(TARGET_CANVAS, nw + 8), ELONGATED_CANVAS_W)
    else:
        scale = TARGET_BODY / max(cw, ch, 1)
        nw = max(1, round(cw * scale))
        nh = max(1, round(ch * scale))
        canvas_w = TARGET_CANVAS

    resized = crop.resize((nw, nh), Image.Resampling.NEAREST)

    canvas = Image.new("RGBA", (canvas_w, TARGET_CANVAS), (0, 0, 0, 0))
    ox = (canvas_w - nw) // 2
    oy = (TARGET_CANVAS - nh) // 2
    canvas.paste(resized, (ox, oy), resized)
    return canvas


def _find_spike_blobs(mask, y0: int, y1: int, min_area: int, min_xc: int) -> list[tuple]:
    import numpy as np

    sub = mask[y0:y1, SPIKE_X0:SPIKE_X1]
    h, w = sub.shape
    visited = np.zeros_like(sub)
    blobs: list[tuple] = []

    for y in range(h):
        for x in range(w):
            if not sub[y, x] or visited[y, x]:
                continue
            stack = [(x, y)]
            visited[y, x] = True
            minx = maxx = x
            miny = maxy = y
            area = 0
            while stack:
                cx, cy = stack.pop()
                area += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and sub[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((nx, ny))

            bw = maxx - minx + 1
            bh = maxy - miny + 1
            xc = (minx + maxx) // 2 + SPIKE_X0
            if area >= min_area and bh >= 10 and bw >= MIN_BLOB_WIDTH and bw < 150 and xc >= min_xc:
                blobs.append(
                    (
                        area,
                        minx + SPIKE_X0,
                        miny + y0,
                        maxx + 1 + SPIKE_X0,
                        maxy + 1 + y0,
                        xc,
                    )
                )

    blobs.sort(key=lambda b: b[5])
    return blobs


def _expand_centers(centers: list[int], count: int) -> list[int]:
    centers = list(centers)
    while len(centers) < count:
        gaps = [(centers[i + 1] - centers[i], i) for i in range(len(centers) - 1)]
        _, idx = max(gaps)
        centers.insert(idx + 1, (centers[idx] + centers[idx + 1]) // 2)
    return centers[:count]


def _boxes_from_centers(centers: list[int], y0: int, y1: int) -> list[tuple[int, int, int, int]]:
    bounds = [SPIKE_X0] + [(centers[i] + centers[i + 1]) // 2 for i in range(len(centers) - 1)] + [SPIKE_X1]
    boxes: list[tuple[int, int, int, int]] = []
    for i in range(len(centers)):
        left = bounds[i] + (2 if i else 0)
        right = bounds[i + 1] - (2 if i < len(centers) - 1 else 0)
        boxes.append((left, y0 + 3, right, y1 - 3))
    return boxes


def _uniform_boxes(y0: int, y1: int, cols: int, inset: int = 4) -> list[tuple[int, int, int, int]]:
    width = SPIKE_X1 - SPIKE_X0
    boxes: list[tuple[int, int, int, int]] = []
    for col in range(cols):
        left = SPIKE_X0 + round(col * width / cols) + inset
        right = (SPIKE_X0 + round((col + 1) * width / cols) - inset) if col < cols - 1 else SPIKE_X1 - inset
        boxes.append((left, y0 + inset, right, y1 - inset))
    return boxes


def _spike_band_boxes(mask, y0: int, y1: int, count: int, min_area: int, min_xc: int) -> list[tuple[int, int, int, int]]:
    blobs = _find_spike_blobs(mask, y0, y1, min_area, min_xc)
    if len(blobs) >= count:
        return [(b[1] - 3, b[2] - 3, b[3] + 3, b[4] + 3) for b in blobs[:count]]
    if len(blobs) >= max(3, count // 2):
        centers = _expand_centers([b[5] for b in blobs], count)
        return _boxes_from_centers(centers, y0, y1)
    return _uniform_boxes(y0, y1, count)


def slice_spike_size_sheet() -> int:
    """Slice the size-group spike sheet (Tiny → Giant rows)."""
    if not SPIKE_SHEET_PATH.exists():
        return 0

    assert len(SIZE_GRID_IDS) == sum(band[2] for band in SPIKE_BANDS)

    sheet = Image.open(SPIKE_SHEET_PATH).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    arr = np.array(sheet)
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    bg = _sheet_bg_color(arr[..., :3])
    mask = (~_background_mask(r, g, b, bg)) & (a > 10)

    idx = 0
    for y0, y1, count, min_area, min_xc in SPIKE_BANDS:
        for box in _spike_band_boxes(mask, y0, y1, count, min_area, min_xc):
            species_id = SIZE_GRID_IDS[idx]
            out = normalize_sprite(sheet.crop(box), sheet_bg)
            out.save(SPRITES_DIR / f"{species_id}.png", format="PNG")
            idx += 1

    return idx


def slice_tiny_sheet() -> int:
    """Slice the dedicated 5×5 Tiny-species sheet (overrides spike-sheet tiny band)."""
    if not TINY_SHEET_PATH.exists():
        return 0

    assert len(TINY_GRID_IDS) == TINY_COLS * TINY_ROWS

    sheet = Image.open(TINY_SHEET_PATH).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    cell_w = sheet.width / TINY_COLS
    cell_h = sheet.height / TINY_ROWS

    for i, species_id in enumerate(TINY_GRID_IDS):
        row, col = divmod(i, TINY_COLS)
        left = round(col * cell_w) + TINY_CELL_INSET
        top = round(row * cell_h) + TINY_CELL_INSET
        right = (round((col + 1) * cell_w) - TINY_CELL_INSET) if col < TINY_COLS - 1 else sheet.width
        bottom = (round((row + 1) * cell_h) - TINY_CELL_INSET) if row < TINY_ROWS - 1 else sheet.height
        tile = sheet.crop((left, top, right, bottom))
        out = normalize_sprite(tile, sheet_bg)
        out.save(SPRITES_DIR / f"{species_id}.png", format="PNG")

    return len(TINY_GRID_IDS)


def _figma_sprite_mask(sheet: Image.Image):
    import numpy as np

    arr = np.array(sheet.convert("RGBA"))
    rgb = arr[..., :3]
    r, g, b, a = arr[..., 0], arr[..., 1], arr[..., 2], arr[..., 3]
    bg = _sheet_bg_color(rgb)
    return (~_background_mask(r, g, b, bg)) & (a > 10)


def _find_row_blobs(
    mask,
    y0: int,
    y1: int,
    x0: int,
    x1: int,
    min_area: int,
    min_width: int,
    max_width: int,
) -> list[tuple]:
    import numpy as np

    sub = mask[y0:y1, x0:x1]
    h, w = sub.shape
    visited = np.zeros_like(sub)
    blobs: list[tuple] = []

    for y in range(h):
        for x in range(w):
            if not sub[y, x] or visited[y, x]:
                continue
            stack = [(x, y)]
            visited[y, x] = True
            minx = maxx = x
            miny = maxy = y
            area = 0
            while stack:
                cx, cy = stack.pop()
                area += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and sub[ny, nx] and not visited[ny, nx]:
                        visited[ny, nx] = True
                        stack.append((nx, ny))

            bw = maxx - minx + 1
            bh = maxy - miny + 1
            if area >= min_area and bw >= min_width and bw <= max_width and bh >= 8:
                xc = (minx + maxx) / 2 + x0
                blobs.append((area, minx + x0, miny + y0, maxx + 1 + x0, maxy + 1 + y0, xc, bw))

    blobs.sort(key=lambda b: b[5])
    return blobs


def _merge_nearby_blobs(blobs: list[tuple], min_sep: float) -> list[tuple]:
    if not blobs:
        return blobs
    merged: list[tuple] = []
    for blob in blobs:
        if merged and blob[5] - merged[-1][5] < min_sep:
            prev = merged[-1]
            merged[-1] = (
                prev[0] + blob[0],
                min(prev[1], blob[1]),
                min(prev[2], blob[2]),
                max(prev[3], blob[3]),
                max(prev[4], blob[4]),
                (prev[5] + blob[5]) / 2,
                max(prev[6], blob[6]),
            )
        else:
            merged.append(blob)
    return merged


def _select_spaced_blobs(blobs: list[tuple], count: int) -> list[tuple]:
    if len(blobs) <= count:
        return blobs
    min_sep = (blobs[-1][5] - blobs[0][5]) / max(count, 1) * 0.55
    picked: list[tuple] = []
    for blob in sorted(blobs, key=lambda b: -b[0]):
        if all(abs(blob[5] - other[5]) >= min_sep for other in picked):
            picked.append(blob)
        if len(picked) == count:
            break
    if len(picked) < count:
        picked = blobs[:count]
    return sorted(picked[:count], key=lambda b: b[5])


def _blob_box(blob: tuple, pad: int, width: int, height: int) -> tuple[int, int, int, int]:
    return (
        max(0, blob[1] - pad),
        max(0, blob[2] - pad),
        min(width, blob[3] + pad),
        min(height, blob[4] + pad),
    )


def _projection_row_boxes(
    mask,
    y0: int,
    y1: int,
    count: int,
    width: int,
    height: int,
    *,
    margin: int = 16,
    smooth: int = 15,
) -> list[tuple[int, int, int, int]]:
    """Split a row band at vertical gutters using column pixel density."""
    import numpy as np

    sub = mask[y0:y1, :width].astype(np.float32)
    proj = sub.sum(axis=0)
    kernel = np.ones(max(3, smooth)) / max(3, smooth)
    smooth_proj = np.convolve(proj, kernel, mode="same")

    seg_w = width / count
    splits = [0]
    for i in range(1, count):
        lo = int((i - 0.45) * seg_w)
        hi = int((i + 0.45) * seg_w)
        lo = max(margin, lo)
        hi = min(width - margin, hi)
        if lo >= hi:
            splits.append(round(i * seg_w))
            continue
        splits.append(lo + int(np.argmin(smooth_proj[lo:hi])))
    splits.append(width)

    pad = FIGMA_BLOB_PAD
    boxes: list[tuple[int, int, int, int]] = []
    for i in range(count):
        left = max(0, splits[i] - (pad if i else 0))
        right = min(width, splits[i + 1] + (pad if i < count - 1 else 0))
        boxes.append((left, y0, right, y1))
    return boxes


def _pick_row_boxes(mask, y0: int, y1: int, count: int, width: int, height: int) -> list[tuple[int, int, int, int]]:
    row_h = y1 - y0
    min_area = max(250, row_h * width // (count * 10))
    min_width = max(8, width // (count * 5))
    # Giant/wide creatures can span most of a column — don't cap blob width too low.
    max_width = max(min_width, width * 2 // 3)
    blobs = _find_row_blobs(mask, y0, y1, 0, width, min_area, min_width, max_width)
    blobs = _merge_nearby_blobs(blobs, max(20, width // (count * 3)))
    if len(blobs) >= count:
        return [_blob_box(b, FIGMA_BLOB_PAD, width, height) for b in _select_spaced_blobs(blobs, count)]

    return _projection_row_boxes(mask, y0, y1, count, width, height)


def _slice_figma_blob_sheet(
    sheet_path: Path,
    sections: list[tuple[list[tuple[int, int, int]], list[str | None]]],
) -> int:
    if not sheet_path.exists():
        return 0

    sheet = Image.open(sheet_path).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    mask = _figma_sprite_mask(sheet)
    width = sheet.width
    height = sheet.height
    total = 0

    for row_bands, species_ids in sections:
        idx = 0
        for y0, y1, count in row_bands:
            for box in _pick_row_boxes(mask, y0, y1, count, width, height):
                species_id = species_ids[idx]
                idx += 1
                if species_id is None:
                    continue
                normalize_sprite(sheet.crop(box), sheet_bg).save(SPRITES_DIR / f"{species_id}.png", format="PNG")
                total += 1
        assert idx == len(species_ids)

    return total


def _figma_filled_cols(mask, width: int, y0: int, y1: int) -> list[int]:
    filled: list[int] = []
    for col in range(FIGMA_COLS):
        left = round(col * width / FIGMA_COLS) + FIGMA_CELL_INSET
        right = (
            (round((col + 1) * width / FIGMA_COLS) - FIGMA_CELL_INSET)
            if col < FIGMA_COLS - 1
            else width - FIGMA_CELL_INSET
        )
        top = y0 + FIGMA_CELL_INSET
        bottom = y1 - FIGMA_CELL_INSET
        if mask[top:bottom, left:right].mean() > FIGMA_CONTENT_THRESH:
            filled.append(col)
    return filled


def slice_figma_tiny_small_sheet() -> int:
    """Slice Tiny + Small from the masked Figma fish-spike frame (node 8:25)."""
    if not FIGMA_TINY_SMALL_SHEET_PATH.exists():
        return 0

    sheet = Image.open(FIGMA_TINY_SMALL_SHEET_PATH).convert("RGBA")
    import numpy as np

    width = sheet.width
    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    mask = _figma_sprite_mask(sheet)
    count = 0

    for row_bands, species_ids in (
        (FIGMA_TINY_ROW_BANDS, TINY_GRID_IDS),
        (FIGMA_SMALL_ROW_BANDS, SMALL_GRID_IDS),
    ):
        idx = 0
        for y0, y1, skip_cols, pick_cols in row_bands:
            filled = _figma_filled_cols(mask, width, y0, y1)
            if pick_cols is not None:
                cols = [col for col in pick_cols if col in filled]
            else:
                cols = [col for col in filled if col not in skip_cols]
            remaining = len(species_ids) - idx
            for col in cols[:remaining]:
                species_id = species_ids[idx]
                left = round(col * width / FIGMA_COLS) + FIGMA_CELL_INSET
                right = (
                    (round((col + 1) * width / FIGMA_COLS) - FIGMA_CELL_INSET)
                    if col < FIGMA_COLS - 1
                    else width - FIGMA_CELL_INSET
                )
                tile = sheet.crop((left, y0 + FIGMA_CELL_INSET, right, y1 - FIGMA_CELL_INSET))
                normalize_sprite(tile, sheet_bg).save(SPRITES_DIR / f"{species_id}.png", format="PNG")
                idx += 1
                count += 1
        assert idx == len(species_ids)

    return count


def _apply_tsm_cell_overrides(sheet_path: Path) -> None:
    if not FIGMA_TSM_CELL_OVERRIDES or not sheet_path.exists():
        return

    sheet = Image.open(sheet_path).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    for species_id, (x0, y0, x1, y1) in FIGMA_TSM_CELL_OVERRIDES.items():
        normalize_sprite(sheet.crop((x0, y0, x1, y1)), sheet_bg).save(
            SPRITES_DIR / f"{species_id}.png", format="PNG"
        )


def slice_figma_tsm_sheet() -> int:
    """Slice Tiny + Small + Medium from the Figma fish-spike frame (node 11:29)."""
    count = _slice_figma_blob_sheet(
        FIGMA_TSM_SHEET_PATH,
        [
            (FIGMA_TSM_TINY_ROWS, FIGMA_TSM_TINY_CELL_IDS),
            (FIGMA_TSM_SMALL_ROWS, SMALL_GRID_IDS),
            (FIGMA_TSM_MEDIUM_ROWS, FIGMA_TSM_MEDIUM_CELL_IDS),
        ],
    )
    _apply_tsm_cell_overrides(FIGMA_TSM_SHEET_PATH)
    return count


def _slice_figma_explicit_cells(sheet_path: Path, cells: list[tuple[int, int, int, int, str]]) -> int:
    if not sheet_path.exists():
        return 0

    sheet = Image.open(sheet_path).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    for x0, y0, x1, y1, species_id in cells:
        normalize_sprite(sheet.crop((x0, y0, x1, y1)), sheet_bg).save(
            SPRITES_DIR / f"{species_id}.png", format="PNG"
        )
    return len(cells)


def slice_figma_large_sheet() -> int:
    """Slice Large species from the Figma fish-spike frame (node 11:28)."""
    return _slice_figma_explicit_cells(FIGMA_LARGE_SHEET_PATH, FIGMA_LARGE_CELLS)


def slice_figma_giant_sheet() -> int:
    """Slice Giant species from the Figma fish-spike frame (node 11:27)."""
    if not FIGMA_GIANT_SHEET_PATH.exists():
        return 0

    sheet = Image.open(FIGMA_GIANT_SHEET_PATH).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    for y0, y1, x0, x1, species_id in FIGMA_GIANT_CELLS:
        tile = sheet.crop((x0, y0, x1, y1))
        normalize_sprite(tile, sheet_bg).save(SPRITES_DIR / f"{species_id}.png", format="PNG")

    return len(FIGMA_GIANT_CELLS)


def slice_sprites() -> None:
    if not SHEET_PATH.exists():
        raise SystemExit(f"Missing sprite sheet: {SHEET_PATH}")
    sheet = Image.open(SHEET_PATH).convert("RGBA")
    import numpy as np

    sheet_bg = _sheet_bg_color(np.array(sheet)[..., :3])
    cols, rows = 10, 10
    cell_w = sheet.width / cols
    cell_h = sheet.height / rows
    assert len(SPECIES) == cols * rows
    for i, (species_id, *_rest) in enumerate(SPECIES):
        row, col = divmod(i, cols)
        left = round(col * cell_w) + CELL_INSET
        top = round(row * cell_h) + CELL_INSET
        right = (round((col + 1) * cell_w) - CELL_INSET) if col < cols - 1 else sheet.width
        bottom = (round((row + 1) * cell_h) - CELL_INSET) if row < rows - 1 else sheet.height
        tile = sheet.crop((left, top, right, bottom))
        out = normalize_sprite(tile, sheet_bg)
        out.save(SPRITES_DIR / f"{species_id}.png", format="PNG")


def js_object(obj: dict) -> str:
    return json.dumps(obj, indent=2).replace('"', "'")


def write_species_js() -> None:
    size_group_by_id: dict[str, str] = {}
    for group_name, ids in (
        ("tiny", TINY_GRID_IDS),
        ("small", SMALL_GRID_IDS),
        ("medium", MEDIUM_GRID_IDS),
        ("large", LARGE_GRID_IDS),
        ("giant", GIANT_GRID_IDS),
    ):
        for species_id in ids:
            size_group_by_id[species_id] = group_name

    creatures = []
    swim = {"_default": {"style": "cruise", "speed": 28, "vert": 3, "wobble": 10, "phaseSpd": 2, "depthRange": 4}}
    for i, (species_id, name, rarity, emoji, swim_key) in enumerate(SPECIES):
        st = stats_for(species_id, rarity, i)
        creatures.append(
            {
                "id": species_id,
                "emoji": emoji,
                "name": name,
                "rarity": rarity,
                "sizeGroup": size_group_by_id[species_id],
                "points": st["points"],
                "minDepth": st["minDepth"],
                "weight": st["weight"],
            }
        )
        preset = dict(SWIM_PRESETS[swim_key])
        if species_id in SWIM_OVERRIDES:
            preset.update(SWIM_OVERRIDES[species_id])
        swim[species_id] = apply_sprite_orient(species_id, preset)

    lines = [
        "/**",
        " * Deep Spot species catalog — 100 species (size-group spike sheet).",
        " * Generated by scripts/build-species-from-spike.py",
        " */",
        "const CREATURE_TYPES = " + json.dumps(creatures, indent=2) + ";",
        "",
        "const CREATURE_SWIM = " + json.dumps(swim, indent=2) + ";",
        "",
    ]
    OUT_JS.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    SPRITES_DIR.mkdir(parents=True, exist_ok=True)
    spike_n = slice_spike_size_sheet()
    if spike_n:
        print(f"Sliced {spike_n} sprites from {SPIKE_SHEET_PATH.name}")
    else:
        slice_sprites()
        print(f"Sliced {len(SPECIES)} sprites from legacy {SHEET_PATH.name}")
    tsm_n = slice_figma_tsm_sheet()
    if tsm_n:
        print(f"Overwrote {tsm_n} tiny/small/medium sprites from {FIGMA_TSM_SHEET_PATH.name}")
    else:
        figma_n = slice_figma_tiny_small_sheet()
        if figma_n:
            print(f"Overwrote {figma_n} tiny/small sprites from {FIGMA_TINY_SMALL_SHEET_PATH.name}")
        else:
            tiny_n = slice_tiny_sheet()
            if tiny_n:
                print(f"Overwrote {tiny_n} tiny sprites from {TINY_SHEET_PATH.name}")
    large_n = slice_figma_large_sheet()
    if large_n:
        print(f"Overwrote {large_n} large sprites from {FIGMA_LARGE_SHEET_PATH.name}")
    giant_n = slice_figma_giant_sheet()
    if giant_n:
        print(f"Overwrote {giant_n} giant sprites from {FIGMA_GIANT_SHEET_PATH.name}")
    write_species_js()
    print(f"Wrote sprites to {SPRITES_DIR}")
    print(f"Wrote {OUT_JS}")


if __name__ == "__main__":
    main()

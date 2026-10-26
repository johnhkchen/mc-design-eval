import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86620.cells.json`, "utf8"));

const W = 18, H = 30, D = 21;
const SH = 3; // storey height in blocks

const g = new Voxels([W, H, D]);

// Palette: 1980s Class-A office. Buff stone spandrels with a darker belt course,
// quartz mullions, tinted blue glass, granite plinth, stone cornice.
const BASE = "polished_granite";
const PILLAR = "smooth_quartz";
const SPANDREL = "smooth_sandstone";
const BELT = "stone_bricks";
const GLASS = "light_blue_stained_glass";
const CAP = "smooth_quartz";
const CORNICE = "stone_bricks";
const SLAB = "smooth_stone";
const PH_WALL = "gray_concrete";
const PH_GLASS = "gray_stained_glass";

const key = (x, z) => `${x},${z}`;
const cm = new Map(cells.map((c) => [key(c[0], c[1]), c]));
const has = (x, z) => cm.has(key(x, z));

// Facade depth: 1 = perimeter cell, increasing inward (BFS from exterior).
const depth = new Map();
const queue = [];
for (const c of cells) {
  const [x, z] = c;
  if (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1)) {
    depth.set(key(x, z), 1);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]) {
    const k = key(nx, nz);
    if (cm.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(cm.get(k));
    }
  }
}

// Entrance: front (min-z) perimeter cell nearest the axis centre.
let ent = null;
for (const c of cells) {
  const [x, z] = c;
  if (depth.get(key(x, z)) === 1 && !has(x, z - 1)) {
    if (!ent || Math.abs(x - (W - 1) / 2) < Math.abs(ent[0] - (W - 1) / 2)) ent = c;
  }
}
const entKey = ent ? key(ent[0], ent[1]) : null;
const entGnd = ent ? Math.round(ent[2]) : 0;

// Front-row bay around the entrance: the three cells centred on the door.
const lobbyKeys = new Set();
if (ent) {
  for (const dx of [-1, 0, 1]) lobbyKeys.add(key(ent[0] + dx, ent[1]));
}

for (const c of cells) {
  const [x, z, gnd, roof] = c.map((v) => Math.round(v));
  const d = depth.get(key(x, z)) ?? 99;
  const perim = d === 1;
  const missingX = !has(x - 1, z) || !has(x + 1, z);
  const missingZ = !has(x, z - 1) || !has(x, z + 1);
  const pillar = perim && ((missingZ && x % 3 === 0) || (missingX && z % 3 === 0) || (missingX && missingZ));

  // Foundation / plinth: solid from 0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) g.set(x, y, z, BASE);

  // Storeys from ground to roof.
  for (let y = gnd; y < roof; y++) {
    const r = (y - gnd) % SH;
    const lvl = Math.floor((y - gnd) / SH);

    if (perim) {
      if (pillar) {
        g.set(x, y, z, PILLAR);
      } else if (lvl === 0 && r === 0) {
        g.set(x, y, z, BASE);
      } else if (lvl === 0 && r === 1 && lobbyKeys.has(key(x, z))) {
        // Lobby glass around the entrance
        g.set(x, y, z, GLASS);
      } else if (r === 1) {
        const warm = lvl >= 1 && (x * 5 + z * 7 + y * 11) % 13 === 0;
        g.set(x, y, z, warm ? "glowstone" : GLASS);
      } else if (r === 0) {
        // Belt course at each storey line gives horizontal banding
        g.set(x, y, z, BELT);
      } else {
        g.set(x, y, z, SPANDREL);
      }
    } else {
      // Interior: floor slab per storey, otherwise air.
      if (r === 0) g.set(x, y, z, SLAB);
    }
  }

  // Cornice: two-course parapet at the top of the main massing.
  if (roof - 1 >= gnd) {
    g.set(x, roof - 1, z, perim ? CAP : SLAB);
    if (perim && roof - 2 >= gnd) g.set(x, roof - 2, z, CORNICE);
  }

  // Setback penthouse: cells at least 3 in from the perimeter.
  if (d >= 4 && roof + 2 < H) {
    g.set(x, roof, z, SLAB); // floor sitting on main roof
    if (d === 4) {
      const pen = (x + z) % 2 === 0;
      g.set(x, roof + 1, z, pen ? PH_GLASS : PH_WALL);
    }
    g.set(x, roof + 2, z, CAP);
  }
}

// Entrance: canopy over the lobby bay, doors, and hanging lanterns.
if (ent) {
  const [ex, ez] = ent;
  const gnd = entGnd;
  const canopyY = gnd + 3;
  // Stone canopy projecting from the storey line over the three-cell bay.
  for (const dx of [-1, 0, 1]) {
    const cx = ex + dx;
    if (has(cx, ez)) g.set(cx, canopyY, ez, CORNICE);
  }
  // Double doors in the centre of the lobby bay.
  const facing = "north";
  g.set(ex, gnd + 1, ez, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, gnd + 2, ez, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Hanging lanterns under the canopy, flanking the door.
  for (const dx of [-1, 1]) {
    const cx = ex + dx;
    if (has(cx, ez)) g.set(cx, gnd + 2, ez, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC86620.nbt`);

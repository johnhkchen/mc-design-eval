import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499753";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 38, D = 26;
const g = new Voxels([W, H, D]);

// Index footprint
const raw = new Map();
for (const [x, z, ground, roof] of cells) {
  raw.set(`${x},${z}`, { x, z, gnd: ground, roof: Number.isFinite(roof) ? roof : ground + 26 });
}
const inFP = (x, z) => raw.has(`${x},${z}`);

// Smooth lidar roof over 3x3 neighbourhood, then clamp to a sensible tower height
const rec = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.roof; n++; }
  }
  const smooth = sum / n;
  const top = Math.round(Math.min(36, Math.max(c.gnd + 10, smooth)));
  rec.set(`${c.x},${c.z}`, { x: c.x, z: c.z, gnd: c.gnd, top });
}

const DOOR_X = 12;
const WIN_STEP = 4;

for (const { x, z, gnd, top } of rec.values()) {
  // Rock foundation up to this cell's ground
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone");

  const fN = !inFP(x, z - 1);
  const fS = !inFP(x, z + 1);
  const fW = !inFP(x - 1, z);
  const fE = !inFP(x + 1, z);
  const boundary = fN || fS || fW || fE;
  const corner = (fN || fS) && (fW || fE);
  const zNS = fN || fS;
  const p = zNS ? x : z;

  for (let y = gnd; y < top - 1; y++) {
    const r = (y - gnd) % 5;

    // Solid masonry core: no floating floors, no void
    if (!boundary) { g.set(x, y, z, "stone_bricks"); continue; }

    if (y === gnd) { g.set(x, y, z, "polished_andesite"); continue; }
    if (corner) { g.set(x, y, z, "stone_bricks"); continue; }
    if (r === 0) { g.set(x, y, z, "chiseled_stone_bricks"); continue; }

    const isWinCol = p >= 2 && p <= 23 && p % WIN_STEP === 2;
    if (r >= 1 && r <= 3 && isWinCol) {
      const lit = r === 2 && p % 8 === 2;
      if (lit) {
        g.set(x, y, z, "glowstone");
      } else if (zNS) {
        g.set(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      } else {
        g.set(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      }
      continue;
    }
    g.set(x, y, z, "stone_bricks");
  }

  // Roof cap and crenellated parapet
  if (top - 1 >= gnd) g.set(x, top - 1, z, "stone_bricks");
  if (boundary) {
    if (corner || p % 2 === 0) g.set(x, top, z, "stone_bricks");
    // storey line course just below the parapet
    if (!corner) g.set(x, top - 2, z, "chiseled_stone_bricks");
  } else {
    // interior roof deck is covered by the cap above; nothing hangs in air
  }

  // Entrance: doorway on the north face with a stone hood and a lit window above
  if (fN && !corner && (x === DOOR_X || x === DOOR_X + 1)) {
    if (x === DOOR_X) {
      g.set(x, gnd, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gnd + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
    g.set(x, gnd + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC72052";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 33, D = 16;
const g = new Voxels([W, H, D]);

// Mid-century Washington office block: pale concrete frame, stone base,
// blue-tinted glazing in recessed bays, stone cornice.
const M = {
  foundation: "stone_bricks",
  base: "polished_andesite",
  pillar: "quartz_block",
  pillarCap: "quartz_slab",
  spandrel: "light_gray_concrete",
  glass: "light_blue_stained_glass_pane",
  cornice: "smooth_stone_slab",
  cornBlock: "smooth_stone",
  deck: "light_gray_concrete",
  floor: "light_gray_concrete",
  plant: "iron_block",
  plantCap: "smooth_stone_slab",
};

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = c;
  map.set(key(x, z), { x, z, ground, roof });
}
const has = (x, z) => map.has(key(x, z));

let minZ = Infinity;
for (const c of cells) minZ = Math.min(minZ, c[1]);

const clampY = (v) => Math.max(0, Math.min(H - 1, v));

// Quantise each cell's roof to whole 3-block storeys above its own ground,
// so the setbacks land on clean tiers instead of lidar noise.
const tierTop = new Map();
let maxTop = 0;
for (const c of map.values()) {
  const gy = clampY(c.ground);
  let n = Math.round((c.roof - gy) / 3);
  n = Math.max(2, Math.min(9, n));
  const roof = gy + 3 * n;
  tierTop.set(key(c.x, c.z), roof);
  maxTop = Math.max(maxTop, roof);
}

for (const c of map.values()) {
  const { x, z } = c;
  const gy = clampY(c.ground);
  const roof = tierTop.get(key(x, z));
  const top = roof - 1; // coping course row
  const bodyTop = top - 1; // last wall row under coping

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, M.foundation);

  const zFace = !has(x, z - 1) || !has(x, z + 1);
  const xFace = !has(x - 1, z) || !has(x + 1, z);
  const edge = zFace || xFace;
  const corner = zFace && xFace;
  const mullion = corner || ((x + z) % 2 === 0);
  const paneProps = zFace && !xFace
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

  const isEntrance = z === minZ && (x === 3 || x === 4);

  // Interior cells: floor slabs and a roof deck, air otherwise.
  if (!edge) {
    for (let y = gy; y < top; y++) {
      const r = y - gy;
      if (r % 3 === 0) g.set(x, y, z, M.floor);
      else if (r % 3 === 1 && (x * 3 + z) % 7 === 0) {
        g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
    g.set(x, top, z, M.deck);
    continue;
  }

  // Edge cells: facade.
  for (let y = gy; y <= top; y++) {
    const r = y - gy;

    if (y === top) {
      // Projecting cornice: coping slab on every edge cell, stone course below.
      g.set(x, y, z, M.cornice, { type: "top", waterlogged: "false" });
      continue;
    }

    if (r === 0) {
      // Ground floor: stone base course with shopfront glazing and entrance.
      if (isEntrance && zFace && z === minZ) {
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half: "lower", hinge: x === 3 ? "left" : "right",
          open: "false", powered: "false",
        });
      } else if (mullion) {
        g.set(x, y, z, M.base);
      } else {
        g.set(x, y, z, M.glass, paneProps);
      }
      continue;
    }

    if (isEntrance && zFace && z === minZ && r === 1) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "south", half: "upper", hinge: x === 3 ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }

    if (r % 3 === 0) {
      // Storey spandrel: pale concrete band with a stone cap line above the glazing.
      g.set(x, y, z, M.spandrel);
    } else if (mullion) {
      g.set(x, y, z, M.pillar);
    } else {
      g.set(x, y, z, M.glass, paneProps);
    }
  }

  // Coping slab row sits on a stone block so the cornice reads as a projecting band.
  g.set(x, bodyTop, z, M.cornBlock);
}

// Roof-level cornice band: step the coping out on the tallest tier, for depth.
for (const c of map.values()) {
  if (!(c.x === 0 || c.x === W - 1 || c.z === minZ || true)) continue;
}

// Plant penthouse: a single centred block of plant rooms on the tallest interior tier.
const plantX = [3, 4];
const plantZ = [6, 7, 8, 9];
for (const c of map.values()) {
  const { x, z } = c;
  const roof = tierTop.get(key(x, z));
  if (roof !== maxTop) continue;
  if (!plantX.includes(x) || !plantZ.includes(z)) continue;
  const gy = clampY(c.ground);
  const top = roof - 1;
  const ph = [top + 1, top + 2];
  for (const y of ph) {
    if (y > H - 2) continue;
    g.set(x, y, z, M.plant);
  }
  if (top + 3 <= H - 1) g.set(x, top + 3, z, M.plantCap, { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

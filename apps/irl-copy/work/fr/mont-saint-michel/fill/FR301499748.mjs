import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499748";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 41, D = 8;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping -------------------------------------------------
const map = new Map();
for (const [x, z, ground, roof] of cells) {
  map.set(`${x},${z}`, { x, z, ground: Math.round(ground), roof: Math.round(roof) });
}
const has = (x, z) => map.has(`${x},${z}`);

const top = Math.max(...cells.map((c) => Math.round(c[3])));
const wallTop = top - 3;

// edge distance: 1 on the perimeter, growing inward
const dist = new Map();
for (const c of map.values()) {
  const perim = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  dist.set(`${c.x},${c.z}`, perim ? 1 : Infinity);
}
for (let it = 0; it < 12; it++) {
  for (const c of map.values()) {
    const k = `${c.x},${c.z}`;
    let best = dist.get(k);
    for (const [nx, nz] of [[c.x - 1, c.z], [c.x + 1, c.z], [c.x, c.z - 1], [c.x, c.z + 1]]) {
      const dd = dist.get(`${nx},${nz}`);
      if (dd !== undefined && dd + 1 < best) best = dd + 1;
    }
    dist.set(k, best);
  }
}
const d = (x, z) => dist.get(`${x},${z}`);

// ---- foundations: solid from y 0 up to each cell's ground --------------------
for (const c of map.values()) {
  for (let y = 0; y < c.ground; y++) g.set(c.x, y, c.z, "stone");
}

// ---- walls -----------------------------------------------------------------
const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const SLAB_TOP = { type: "top", waterlogged: "false" };
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const c of map.values()) {
  const { x, z, ground } = c;
  if (d(x, z) !== 1) continue;
  const mW = !has(x - 1, z), mE = !has(x + 1, z), mN = !has(x, z - 1), mS = !has(x, z + 1);
  const corner = (mW || mE) && (mN || mS);
  const xFace = (mW || mE) && !corner;
  const zFace = (mN || mS) && !corner;
  const a = xFace ? z : x;
  // more glazing: x-faces get three bays, z-faces two
  const windowCol = xFace ? [1, 3, 5].includes(a) : [1, 3, 4].includes(a) && !(mS && x === 2);
  const isDoor = zFace && mS && x === 2;

  for (let y = ground; y <= wallTop; y++) {
    const r = y % 5; // 0 string course, 1 sill, 2-3 glass, 4 lintel
    if (corner) {
      g.set(x, y, z, r === 0 ? "smooth_stone" : "chiseled_stone_bricks");
      continue;
    }
    if (isDoor && (y === ground || y === ground + 1)) {
      const half = y === ground ? "lower" : "upper";
      g.set(x, y, z, "oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    // door surround: stone arch above the door, lantern on the lintel block
    if (isDoor && y === ground + 2) {
      g.set(x, y, z, "chiseled_stone_bricks");
      continue;
    }
    if (r === 0) {
      g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (windowCol && !(isDoor && y < ground + 3)) {
      if (r === 1) { g.set(x, y, z, "stone_brick_slab", SLAB_BOTTOM); continue; }
      if (r === 2 || r === 3) {
        g.set(x, y, z, "glass_pane", xFace ? paneNS : paneEW);
        const storey = Math.floor(y / 5);
        if (r === 2 && (a + storey) % 3 === 0) {
          const ix = mW ? x + 1 : mE ? x - 1 : x;
          const iz = mN ? z + 1 : mS ? z - 1 : z;
          if (has(ix, iz) && d(ix, iz) >= 2) g.set(ix, y, iz, "glowstone");
        }
        continue;
      }
      g.set(x, y, z, "stone_brick_slab", SLAB_TOP); // lintel
      continue;
    }
    g.set(x, y, z, "stone_bricks");
  }

  // lit lantern on the arch of the entrance, standing over the door cell
  if (isDoor) {
    g.set(x, ground + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// ---- interior floors (slabs per storey, ground floor included) --------------
for (const c of map.values()) {
  if (d(c.x, c.z) < 2) continue;
  g.set(c.x, c.ground, c.z, "smooth_stone");
  for (let k = 1; 5 * k <= wallTop; k++) {
    const fy = 5 * k;
    if (fy > c.ground) g.set(c.x, fy, c.z, "smooth_stone");
  }
}

// ---- roof: deck over the whole footprint, cornice, then hipped tiers ---------
const deckY = wallTop + 1;
for (const c of map.values()) {
  g.set(c.x, deckY, c.z, "deepslate_tiles");
}
for (const c of map.values()) {
  if (d(c.x, c.z) === 1) g.set(c.x, deckY + 1, c.z, "stone_brick_slab", SLAB_BOTTOM);
}
for (let k = 1; k <= 2; k++) {
  const y = deckY + k;
  for (const c of map.values()) {
    if (d(c.x, c.z) >= k + 1) g.set(c.x, y, c.z, "deepslate_tiles");
  }
}

g.save(`${DIR}/${ID}.nbt`);

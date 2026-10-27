// The Hotel Britomart, read from the record: a 1920s–30s stripped-classical hotel of about ten storeys. Cream render
// over a dark plinth, a two-storey shopfront with the entrance on the longest street face, window bays on a 3-block
// rhythm, a cornice and parapet, a Moderne setback on the north-east and south, plant on the main roof, and warm
// shroomlight/glowstone behind some glass. Heights come from the lidar: roofs under 36 blocks are noise and take their
// neighbours' median; the rest snap to two tiers, 44 (the tower, ten storeys + cornice) and 40 (the lower wings).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_1038164108.cells.json`, "utf8"));
const SIZE = [34, 57, 25];

const k2 = (x, z) => `${x},${z}`;
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];                       // N, S, W, E
const SIDE = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
const raw = new Map(cells.map(([x, z, g, r]) => [k2(x, z), { x, z, g, r }]));
const inF = (x, z) => raw.has(k2(x, z));
const outward = (x, z) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz));

// 1. roof tiers: lidar noise (under 36) takes the median of valid neighbours; then snap to 44 or 40
const roofTier = new Map();
for (const { x, z, r } of raw.values()) {
  let v = r;
  if (r < 36) {
    const near = [];
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const c = raw.get(k2(x + dx, z + dz));
      if ((dx || dz) && c && c.r >= 36) near.push(c.r);
    }
    near.sort((a, b) => a - b);
    v = near.length ? near[near.length >> 1] : 40;
  }
  roofTier.set(k2(x, z), v >= 42 ? 44 : 40);
}

// 2. depth from the outside wall: 1 = facade, 2 = the air-gap layer behind the glass, 3+ = solid mass
const depth = new Map();
let front = [];
for (const { x, z } of raw.values()) if (outward(x, z).length) { depth.set(k2(x, z), 1); front.push([x, z]); }
for (let d = 1; front.length; d++) {
  const next = [];
  for (const [x, z] of front) for (const [dx, dz] of NB) {
    if (inF(x + dx, z + dz) && !depth.has(k2(x + dx, z + dz))) { depth.set(k2(x + dx, z + dz), d + 1); next.push([x + dx, z + dz]); }
  }
  front = next;
}

// 3. the Moderne setback: the tower's outer two layers on the north-east and south step back at storey 8 (y 32)
const setback = (x, z) => roofTier.get(k2(x, z)) === 44 && depth.get(k2(x, z)) <= 2 && (x >= 31 || z >= 22);
const topOf = (x, z) => (setback(x, z) ? 32 : roofTier.get(k2(x, z)));

// 4. facade bays: one outward side per cell (corners are piers); the pier every third block, two-block windows between,
// each window backed by a depth-2 air pocket. The entrance sits mid-way along the face with the most window bays.
const facade = new Map();
for (const { x, z } of raw.values()) {
  if (depth.get(k2(x, z)) !== 1) continue;
  const out = outward(x, z);
  if (out.length !== 1) { facade.set(k2(x, z), { type: "pier" }); continue; }
  const [nx, nz] = out[0];
  const px = x - nx, pz = z - nz;                                    // the cell inward of this facade cell
  const pocket = inF(px, pz) && depth.get(k2(px, pz)) === 2;
  const t = nx ? z : x;                                              // position along the face
  const type = !pocket ? "wall" : t % 3 === 0 ? "pier" : "window";
  facade.set(k2(x, z), { type, side: SIDE[`${nx},${nz}`], t, x, z, pocket: pocket ? k2(px, pz) : null });
}
const bySide = new Map();
for (const f of facade.values()) if (f.type === "window") bySide.set(f.side, [...(bySide.get(f.side) ?? []), f]);
const face = [...bySide.values()].sort((a, b) => b.length - a.length)[0].sort((a, b) => a.t - b.t);
const mid = face[Math.floor(face.length / 2)];
const door = { type: "window", door: true, canopy: true, ...mid };   // the entrance bay
facade.set(k2(mid.x, mid.z), door);
const partner = face[Math.floor(face.length / 2) + 1] ?? face[Math.floor(face.length / 2) - 1];
facade.set(k2(partner.x, partner.z), { ...partner, type: "window", canopy: true });

// the air pockets behind glass, and which of them hold a warm light
const pockets = new Map();
for (const f of facade.values()) if (f.type === "window" && f.pocket) pockets.set(f.pocket, f);
const lightFor = (p, k) => {
  if (p.door) return null;
  if (k === 0) return p.t % 4 === 1 ? "glowstone" : null;            // shopfront
  return (p.t + 2 * k) % 9 === 4 ? "shroomlight" : null;             // upper storeys
};

// glass panes need their connections set: they join the bays on either side along the face
const paneState = (f) => {
  const ax = f.side === "north" || f.side === "south";
  const solidAt = (x, z) => facade.has(k2(x, z));                    // any facade cell joins: bay, pier or wall
  const a = ax ? solidAt(f.x - 1, f.z) : solidAt(f.x, f.z - 1);
  const b = ax ? solidAt(f.x + 1, f.z) : solidAt(f.x, f.z + 1);
  const on = (v) => (v ? "true" : "false");
  return ax ? { north: "false", south: "false", east: on(b), west: on(a), waterlogged: "false" }
            : { north: on(a), south: on(b), east: "false", west: "false", waterlogged: "false" };
};

const facadeBlock = (f, y, k, s, h) => {
  if (y === h - 1) return ["polished_andesite"];                      // cornice
  if (y === 0) return ["polished_andesite"];                          // plinth
  if (s === 0 || s === 3) return k === 0 && s === 3 && f.canopy ? ["dark_oak_planks"] : ["smooth_quartz"];
  if (!f || f.type === "pier") return k === 0 ? ["polished_andesite"] : ["quartz_pillar"];
  if (f.type === "wall") return ["smooth_quartz"];
  if (k === 0 && f.door) {
    const half = s === 1 ? "lower" : "upper";
    const facing = { north: "south", south: "north", east: "west", west: "east" }[f.side];   // faces inward
    return ["dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" }];
  }
  return k === 0 ? ["glass"] : ["glass_pane", paneState(f)];
};

// 5. place every column: solid from y 0 to its top, facade bays on the outside, air pockets, roof and terrace surfaces
const g = new Voxels(SIZE);
for (const { x, z } of raw.values()) {
  const key = k2(x, z), d = depth.get(key), h = topOf(x, z);
  const f = facade.get(key), p = pockets.get(key);
  for (let y = 0; y < h; y++) {
    const k = y >> 2, s = y & 3;
    let b;
    if (d === 1) b = facadeBlock(f, y, k, s, h);
    else if (d === 2 && p && (s === 1 || s === 2)) b = s === 1 && lightFor(p, k) ? [lightFor(p, k)] : null;
    else if (y === h - 1) b = [setback(x, z) ? "light_gray_concrete" : "gray_concrete"];   // roof membrane or terrace
    else b = ["smooth_quartz"];
    if (b) g.set(x, y, z, b[0], b[1]);
  }
  if (d === 1) g.set(x, h, z, "smooth_quartz");                       // parapet (and the terrace guard on the setbacks)
}

// 6. roof plant: a 2x2 plant room on the tower roof and two air-handling boxes on a wing, on solid cells only
const patch = (w, cond, target) => {
  const cand = [...raw.values()].filter(({ x, z }) => {
    for (let dz = 0; dz < w; dz++) for (let dx = 0; dx < w; dx++) if (!cond(x + dx, z + dz)) return false;
    return true;
  });
  const [tx, tz] = target;
  cand.sort((a, b) => (a.x - tx) ** 2 + (a.z - tz) ** 2 - ((b.x - tx) ** 2 + (b.z - tz) ** 2));
  return cand[0];
};
const interior = (x, z) => inF(x, z) && depth.get(k2(x, z)) >= 3;
const plant = patch(2,(x, z) => interior(x, z) && roofTier.get(k2(x, z)) === 44 && !setback(x, z), [16, 10]);
for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++)
  for (let y = 44; y < 46; y++) g.set(plant.x + dx, y, plant.z + dz, "light_gray_concrete");
const wing = patch(2,(x, z) => interior(x, z) && roofTier.get(k2(x, z)) === 40, [27, 19]);
if (wing) for (let dx = 0; dx < 2; dx++) g.set(wing.x + dx, 40, wing.z, "iron_block");

g.save(`${DIR}/way_1038164108.nbt`);

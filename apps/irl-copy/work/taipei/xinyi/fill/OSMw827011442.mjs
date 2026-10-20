import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office block, c. 1990s: a two-storey granite-and-glass podium
// with a 1-block terrace ledge, then a three-storey white-concrete tower tier with
// blue glass bands, a penthouse core, a parapet and a lightning-rod mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011442";
const W = 18, H = 38, D = 19;
const ROOF = 26;           // roof deck sits at y=26 (about 26 blocks above lowest ground)
const PODIUM_TOP = 11;     // podium slab: terrace level
const PARAPET = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const kk = (x, z) => `${x},${z}`;
const P = (k) => k.split(",").map(Number);

const full = new Set();
const gMap = new Map();
for (const [x, z, g] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  full.add(kk(x, z));
  gMap.set(kk(x, z), Math.max(0, Math.min(24, Math.round(g))));
}

const inset = (set) => {
  const s = new Set();
  for (const k of set) {
    const [x, z] = P(k);
    if (dirs.every(([dx, dz]) => set.has(kk(x + dx, z + dz)))) s.add(k);
  }
  return s;
};

const outsides = (k, set) => {
  const [x, z] = P(k);
  return dirs.filter(([dx, dz]) => !set.has(kk(x + dx, z + dz)));
};

const bbox = (set) => {
  let minX = 1e9, maxX = -1e9, minZ = 1e9, maxZ = -1e9;
  for (const k of set) {
    const [x, z] = P(k);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  }
  return { minX, maxX, minZ, maxZ };
};

const upper = inset(full);     // tower tier footprint (one block in from the podium edge)
const fb = bbox(full);

// Entrance: podium ring cell on the south face (max z), nearest the centre line.
let door = null;
let best = 1e9;
for (const k of full) {
  const [x, z] = P(k);
  if (z !== fb.maxZ) continue;
  if (!outsides(k, full).some(([dx, dz]) => dx === 0 && dz === 1)) continue;
  const d = Math.abs(x - (fb.minX + fb.maxX) / 2);
  if (d < best) { best = d; door = k; }
}

// Wall feature for one ring cell of a tier at a given storey row r (1..4 above its floor slab).
function wallAt(k, x, z, y, r, base, g, tierSet, isTower) {
  const outs = outsides(k, tierSet);
  const corner = outs.length >= 2;
  const tb = bbox(tierSet);
  let pier = corner;
  if (!corner && outs.length === 1) {
    const [dx, dz] = outs[0];
    const idx = dz !== 0 ? x - tb.minX : z - tb.minZ;
    const L = dz !== 0 ? tb.maxX - tb.minX + 1 : tb.maxZ - tb.minZ + 1;
    pier = idx % 3 === 0 || idx === L - 1;
  }
  const baseMat = isTower ? "white_concrete" : "polished_granite";
  const pierMat = isTower ? "white_concrete" : "polished_granite";

  // Entrance on the podium's ground storey.
  if (!isTower && door === k && base === g + 1) {
    if (r === 1) { vox.set(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); return; }
    if (r === 2) { vox.set(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); return; }
    if (r === 3) { vox.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); return; }
  }

  if (r === 1 || r === 4) { vox.set(x, y, z, baseMat); return; }

  if (pier) { vox.set(x, y, z, pierMat); return; }

  // Glass pane: connections follow the face it sits in.
  const alongX = outs.some(([, dz]) => dz !== 0);
  const props = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  vox.set(x, y, z, "light_blue_stained_glass_pane", props);

  // Warm light set behind some panes, in the room air just inside the wall.
  if (r === 2 && outs.length === 1 && ((x * 7 + z * 3 + y) % 4 === 0)) {
    const [dx, dz] = outs[0];
    const ix = x - dx, iz = z - dz;
    const inner = kk(ix, iz);
    if (tierSet.has(inner) && outsides(inner, tierSet).length === 0) {
      vox.set(ix, y, iz, "glowstone");
    }
  }
}

// Foundations, floor slabs, walls.
for (const k of full) {
  const [x, z] = P(k);
  const g = gMap.get(k);
  const isU = upper.has(k);

  for (let y = 0; y <= g; y++) vox.set(x, y, z, "stone_bricks");

  const slabs = new Set([g + 1]);
  for (const s of [6, 11, 16, 21, 26]) if (s > g + 1) slabs.add(s);

  const topY = isU ? ROOF : 12;
  for (let y = g + 1; y <= topY; y++) {
    if (slabs.has(y)) {
      vox.set(x, y, z, y === g + 1 ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    const base = Math.max(...[...slabs].filter((s) => s < y));
    const r = y - base;

    if (!isU) {
      // Podium ring: granite base, glass storeys, terrace railing above the ledge slab.
      if (y === 12) { vox.set(x, y, z, "stone_brick_wall"); continue; }
      wallAt(k, x, z, y, r, base, g, full, false);
    } else {
      if (y <= 10) continue;                          // podium interior air
      if (outsides(k, upper).length === 0) continue;  // tower interior air
      wallAt(k, x, z, y, r, base, g, upper, true);
    }
  }

  // Tower parapet and corner lanterns above the roof deck.
  if (isU && outsides(k, upper).length > 0) {
    vox.set(x, PARAPET, z, "stone_brick_wall");
    if (outsides(k, upper).length >= 2) {
      vox.set(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Penthouse core, inset three blocks from the podium edge.
let core = new Set(upper);
for (let i = 0; i < 2; i++) core = inset(core);
for (const k of core) {
  const [x, z] = P(k);
  for (let y = PARAPET; y <= 29; y++) vox.set(x, y, z, "light_gray_concrete");
  vox.set(x, 30, z, "smooth_stone");
}

// Mast on the core (or on the tower deck if there is no core).
const centreSrc = core.size > 0 ? core : upper;
let cx = 0, cz = 0;
for (const k of centreSrc) { const [x, z] = P(k); cx += x; cz += z; }
cx /= centreSrc.size; cz /= centreSrc.size;
let mast = null, md = 1e9;
for (const k of centreSrc) {
  const [x, z] = P(k);
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < md) { md = d; mast = [x, z]; }
}
if (mast) {
  const top = core.size > 0 ? 30 : ROOF;
  const [mx, mz] = mast;
  for (let y = top + 1; y <= top + 5; y++) {
    vox.set(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
  vox.set(mx, top + 6, mz, "shroomlight");
}

vox.save(`${DIR}/${ID}.nbt`);

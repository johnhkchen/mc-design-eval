// Victory Convention Centre (Auckland): a late-20th-century convention block, concrete frame, basalt plinth,
// glass curtain-wall bays, stepped tiers from the lidar roof. Storey lines sit on a 4-block grid (absolute y),
// so the plinth follows the slope and every tier stands on the one below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_316742526.cells.json`, "utf8"));

const W = 66, D = 103, H = 36;

// footprint lookup: the cell object at (x, z), or null outside the footprint
const byXZ = new Map();
for (const [x, z, g, r] of cells) byXZ.set(z * W + x, { x, z, g, r });
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : byXZ.get(z * W + x) ?? null);
const list = [...byXZ.values()];

// lidar roof -> clean flat tiers: two passes of a 3x3 mean inside the footprint, then to the nearest 4-block line
let rs = new Map(list.map((c) => [c, c.r]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const c of list) {
    let s = 0, n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const o = at(c.x + dx, c.z + dz); if (o) { s += rs.get(o); n++; }
    }
    next.set(c, s / n);
  }
  rs = next;
}
for (const c of list) {
  c.F1 = 4 * Math.ceil((c.g + 1) / 4);                                            // first floor line: plinth of 1-4 blocks
  c.T = Math.min(24, Math.max(c.F1 + 4, 4 * Math.round(rs.get(c) / 4)));          // roof tier (at least one storey)
}
// exposure: a face to outside the footprint, or above a lower neighbour's roof, is wall (ring); else interior
const open = (o, c) => !o || o.T < c.T;
for (const c of list) {
  const w = at(c.x - 1, c.z), e = at(c.x + 1, c.z), n = at(c.x, c.z - 1), s = at(c.x, c.z + 1);
  c.exX = open(w, c) || open(e, c);
  c.exZ = open(n, c) || open(s, c);
  c.ring = c.exX || c.exZ;
  c.corner = c.exX && c.exZ;
}
// bays: on an x-facing wall the bays run along z, on a z-facing wall along x; corners are piers
const glazed = (c) => c.ring && !c.corner && (c.exX ? c.z % 4 !== 0 : c.x % 4 !== 0);

// main entrance: the lowest outward-facing cell (ties: most northerly), with its partner along the same face
const outward = (c) => (!at(c.x, c.z - 1) ? "north" : !at(c.x, c.z + 1) ? "south" : !at(c.x - 1, c.z) ? "west" : !at(c.x + 1, c.z) ? "east" : null);
const along = (c, dir) => (dir === 1 ? at(c.x + 1, c.z) : at(c.x - 1, c.z));
const faceCands = list.filter((c) => outward(c) && (outward(c) === "north" || outward(c) === "south"));
faceCands.sort((a, b) => a.g - b.g || a.z - b.z || a.x - b.x);
const e0 = faceCands[0];
const fac = outward(e0);
const partnerOf = (c) => {
  for (const dir of [1, -1]) { const p = along(c, dir); if (p && outward(p) === fac && p.g === c.g) return p; }
  return null;
};
const doors = [e0, partnerOf(e0)].filter(Boolean);
for (const d of doors) if (d.F1 - d.g < 3) throw new Error(`entrance at ${d.x},${d.z} has no room for a door`);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => vox.set(x, y, z, block, state);

// 1. ground, plinth, floors, walls, and the roof, cell by cell
for (const c of list) {
  const { x, z, g, F1, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                                       // foundation to ground
  for (let y = g; y < F1; y++) put(x, y, z, y === F1 - 1 ? "stone_bricks" : "polished_basalt");   // plinth, string course on top
  for (let F = F1; F < T; F += 4) {
    put(x, F, z, "smooth_stone");                                                                  // floor slab / storey line
    if (c.ring) {
      put(x, F + 3, z, "white_concrete");                                                          // spandrel
      for (const y of [F + 1, F + 2]) put(x, y, z, glazed(c) ? "light_blue_stained_glass" : "white_concrete");
    } else if (x % 6 === 3 && z % 6 === 3) {
      for (const y of [F + 1, F + 2, F + 3]) put(x, y, z, "light_gray_concrete");                  // structural column grid
    }
  }
  if (c.ring) {
    put(x, T, z, "stone_bricks");                                                                  // cornice
    put(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });                // parapet
  } else {
    const terrace = T <= 12 && (x + z) % 3 === 0;
    put(x, T, z, terrace ? "moss_block" : "light_gray_concrete");                                  // flat roof / green terrace
    if (T >= 20 && x % 9 >= 3 && x % 9 <= 4 && z % 9 >= 3 && z % 9 <= 4) {                         // roof plant: 2x2 boxes
      put(x, T + 1, z, "light_gray_concrete");
      if (x % 9 === 3 && z % 9 === 3) put(x, T + 2, z, "iron_block");
    }
  }
}

// 2. warm light behind some glazed bays: standing on the floor slab, inside the air gap
for (const c of list) {
  if (c.ring) continue;
  const hasGlass = [at(c.x - 1, c.z), at(c.x + 1, c.z), at(c.x, c.z - 1), at(c.x, c.z + 1)].some((o) => o && glazed(o));
  if (!hasGlass) continue;
  for (let F = c.F1; F < c.T; F += 4) {
    if (vox.val(c.x, F + 1, c.z) || (c.x * 5 + c.z * 3 + F) % 9 !== 0) continue;
    if (!(c.x % 6 === 3 && c.z % 6 === 3)) put(c.x, F + 1, c.z, (c.x + c.z) % 2 ? "lantern" : "glowstone", (c.x + c.z) % 2 ? { hanging: "false" } : undefined);
  }
}

// 3. entrance: two-wide iron doors at ground level in the outward face, under the plinth's string course
for (const d of doors) {
  for (const [half, y] of [["lower", d.g], ["upper", d.g + 1]]) {
    put(d.x, y, d.z, "iron_door", { facing: fac, half, hinge: d.x === e0.x ? "left" : "right", open: "false", powered: "false" });
  }
}

const out = `${DIR}/way_316742526.nbt`;
const stats = vox.save(out);
console.log(`saved ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries; entrance ${e0.x},${e0.z} facing ${fac}`);

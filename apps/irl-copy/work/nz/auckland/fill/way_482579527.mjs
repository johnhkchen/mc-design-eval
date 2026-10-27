// Quest on Hobson: a 2000s CBD apartment block, eleven storeys of glass curtain wall with precast spandrels on a
// volcanic basalt base, stepping down to a six-storey wing on its west side. The lidar roof (46-47 blocks, lower
// wing at 26-30) is smoothed by a 3x3 median over the footprint and snapped to three tiers at 27, 39 and 47 (storeys
// of 4 from a common datum at y 3, the highest ground), so every storey stands on the one below. The ring of cells
// that touch air (or a lower tier) is the facade; the rest is air behind the glass with a floor plate per storey.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_482579527.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_482579527.nbt";
const W = 40, D = 25, H = 60, DATUM = 3, STOREY = 4;

// materials: foundation under ground, basalt base course, precast spandrels and floor lines, tinted glass in gray mullions
const FOUND = "stone", BASE = "polished_basalt", FLOOR = "white_concrete", SPANDREL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass", MULLION = "gray_concrete", DECK = "gray_concrete", PARAPET = "smooth_stone";
const INTERIOR = "smooth_stone", LIGHT = "glowstone", EQUIP = "stone_bricks", PLANT = "oak_leaves";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const cell = Array.from({ length: W }, () => Array(D).fill(null));          // { ground, roof } per footprint cell
for (const [x, z, g, r] of cells) cell[x][z] = { ground: g, roof: r };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cell[x][z] !== null;

// tier: the 3x3 median of the lidar roof over the footprint, snapped to 27 / 39 / 47 (6, 9 and 11 storeys)
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const top = Array.from({ length: W }, () => Array(D).fill(0));
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!cell[x][z]) continue;
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(cell[x + dx][z + dz].roof);
  const s = median(v);
  top[x][z] = s >= 44 ? 47 : s >= 30 ? 39 : 27;
}
const storeys = (x, z) => (top[x][z] - DATUM) / STOREY;

// a cell's storey k is facade on a side that faces air or a lower tier (no storey k there)
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, k) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz) || storeys(x + dx, z + dz) <= k);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!cell[x][z]) continue;
  const ground = cell[x][z].ground, n = storeys(x, z), h = top[x][z];
  // foundation to the lidar ground, then the basalt base course up to the datum
  for (let y = 0; y < DATUM; y++) put(x, y, z, y < ground ? FOUND : BASE);

  for (let k = 0; k < n; k++) {
    const b = DATUM + STOREY * k;
    const ring = exposed(x, z, k);
    const onX = ring.some(([dx]) => dx !== 0);                            // which face: bays run along z on an x face
    const bay = onX ? z : x;
    put(x, b, z, k === 0 ? BASE : (ring.length ? FLOOR : INTERIOR));    // floor plate across the whole cell
    if (ring.length) {
      for (const y of [b + 1, b + 2]) {
        const mullion = bay % 3 === 0;
        put(x, y, z, mullion ? MULLION : GLASS);
      }
      put(x, b + 3, z, SPANDREL);
      // a warm light behind some panes, in the air gap one cell in
      const lit = (k * 3 + bay) % 5 === 2 && bay % 3 !== 0;
      if (lit) {
        const [dx, dz] = ring[0], ix = x - dx, iz = z - dz;                // one cell in from the pane
        if (inside(ix, iz) && !exposed(ix, iz, k).length) put(ix, b + 1, iz, LIGHT);
      }
    }
    // the air between floors: nothing, except the top storey's roof deck and parapet on its open edges
    if (k === n - 1) {
      if (!ring.length) put(x, b + 3, z, DECK);
      if (ring.length) put(x, h, z, PARAPET);
    }
  }
}

// the entrance: two cells wide on the west face at ground, iron doors, a lobby light
const doorFacing = "east";
for (const z of [12, 13]) {
  if (!inside(0, z)) continue;
  put(0, DATUM + 1, z, "iron_door", { facing: doorFacing, half: "lower", hinge: z === 12 ? "left" : "right", open: "false", powered: "false" });
  put(0, DATUM + 2, z, "iron_door", { facing: doorFacing, half: "upper", hinge: z === 12 ? "left" : "right", open: "false", powered: "false" });
  put(1, DATUM + 1, z, LIGHT);
}

// roof equipment: plant boxes on the terraces of the lower tiers, a lift overrun on the tower roof
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!cell[x][z]) continue;
  const h = top[x][z];
  if (h < 47 && exposed(x, z, storeys(x, z) - 1).length === 0 && (x * 7 + z * 3) % 11 === 0) put(x, h, z, EQUIP);
  if (h === 27 && exposed(x, z, storeys(x, z) - 1).length === 0 && (x * 5 + z) % 13 === 3) put(x, h, z, PLANT);
}
for (let x = 17; x <= 20; x++) for (let z = 10; z <= 13; z++) {
  if (!inside(x, z) || top[x][z] !== 47) continue;
  if (x === 17 || x === 20 || z === 10 || z === 13) continue;
  put(x, 47, z, EQUIP); put(x, 48, z, EQUIP);
}

const res = g.save(OUT);
console.log(`way_482579527: ${res.blocks} blocks, ${res.palette} palette entries`);

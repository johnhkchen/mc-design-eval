// Acrossia House: a late-1980s Auckland office tower on a concrete podium, tinted glass in quartz-framed bays, a
// stone base course and shopfront at street level, and a small lift-core crown. The lidar's roofs (68 to 81) are
// flattened into four setback tiers (68, 72, 76, 80), each a 4-block storey grid, with a solid core carrying the
// slabs. Floors sit on a y = 3 mod 4 grid so every tier top is a floor line; the glass is one block deep with air behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861496.cells.json`, "utf8"));   // [x, z, ground, roof]

const CONC = "light_gray_concrete", FRAME = "quartz_block", CORNICE = "smooth_quartz", ROOF = "gravel";
const FOUNDATION = "smooth_stone", BASE = "polished_andesite", GLASS = "light_blue_stained_glass";
const TINT = "cyan_stained_glass", GLOW = "glowstone";

const key = (x, z) => `${x},${z}`;
const tierOf = (r) => (r >= 78 ? 80 : r >= 74 ? 76 : r >= 70 ? 72 : 68);
const at = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, top: tierOf(roof) }]));
const cell = (x, z) => at.get(key(x, z));

// the sides of a cell that border the outside of the footprint
const open = (x, z) => ({
  N: !cell(x, z - 1), S: !cell(x, z + 1), E: !cell(x + 1, z), W: !cell(x - 1, z),
});
const isShell = (o) => o.N || o.S || o.E || o.W;
// a 3-bay rhythm along each face (a stepped corner takes the north-south face: a solid pier there reads as a dark wall)
const isMullion = (x, z, o) => (o.N || o.S ? x : z) % 3 === 0;

// the lift core: a solid concrete column through the middle, and a plant room on the 80 tier
const inCore = (x, z) => x >= 21 && x <= 27 && z >= 13 && z <= 19;
const inPlant = (x, z) => x >= 22 && x <= 26 && z >= 14 && z <= 18;

const X = 53, Y = 94, Z = 32;
const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the street entrance: two doors on the north face (z = 0) at x 9 and 10, lanterns flanking, a canopy above
const DOOR_X = [9, 10];
const CANOPY_X = [8, 9, 10, 11];

let glazed = 0, lights = 0;
for (const [x, z, ground, roof] of cells) {
  const { top } = cell(x, z);
  const o = open(x, z);
  const shell = isShell(o);
  const core = !shell && inCore(x, z);

  // the floor lines: the ground, then every 4th row (y = 3 mod 4) at least 3 above it
  const floors = new Set([ground]);
  for (let y = ground + 3; y < top; y++) if (y % 4 === 3) floors.add(y);
  const firstFloor = Math.min(...[...floors].filter((y) => y > ground));

  for (let y = 0; y < top; y++) {
    if (y < ground) { put(x, y, z, FOUNDATION); continue; }
    if (core) { put(x, y, z, CONC); continue; }
    const top_row = y === top - 1;
    if (floors.has(y)) {
      // a tier's top is its roof (gravel inside, a cornice on the outside); other floors are concrete slabs
      if (top_row) put(x, y, z, shell ? CORNICE : ROOF);
      else put(x, y, z, CONC);
      continue;
    }
    if (!shell) continue;                                  // air behind the glass
    if (isMullion(x, z, o)) { put(x, y, z, FRAME); continue; }

    if (y < firstFloor) {
      // shopfront: base course at the first row above the ground, glass to the first floor
      if (y === ground + 1) put(x, y, z, BASE);
      else { put(x, y, z, GLASS); glazed++; }
    } else if (y % 4 === 1) {
      put(x, y, z, FRAME);                                  // transom
    } else {
      const h = (x * 7919 + y * 104729 + z * 1299709) % 97;
      put(x, y, z, h % 6 === 0 ? TINT : GLASS); glazed++;
    }
  }

  // a parapet course on the outside of each tier
  if (shell && !core) put(x, top, z, CORNICE);
}

// the entrance: two iron doors (hinged left and right) with the lantern pair beside them
for (const x of DOOR_X) {
  const hinge = x === DOOR_X[0] ? "left" : "right";
  const base = { facing: "north", hinge, open: "false", powered: "false" };
  const gr = cell(x, 0).ground;
  put(x, gr + 1, 0, "iron_door", { ...base, half: "lower" });
  put(x, gr + 2, 0, "iron_door", { ...base, half: "upper" });
}
for (const x of CANOPY_X) {
  const gr = cell(x, 0).ground;
  put(x, gr + 3, 0, CORNICE);
  if (!DOOR_X.includes(x)) put(x, gr + 2, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// warm light: glowstone one block inside a few upper-floor windows (the air gap stays behind the rest)
for (const [x, z] of cells) {
  const { top, ground: gr } = cell(x, z);
  const o = open(x, z);
  if (!isShell(o) || inCore(x, z)) continue;
  const inward = o.N ? [x, z + 1] : o.S ? [x, z - 1] : o.E ? [x - 1, z] : [x + 1, z];
  if (!cell(...inward) || inCore(...inward)) continue;
  for (let y = gr + 4; y < top - 2; y++) {
    if (y % 4 !== 2) continue;                          // middle of each glass band
    const h = (x * 7919 + y * 104729 + z * 1299709) % 97;
    if (h % 23 !== 0) continue;
    put(inward[0], y, inward[1], GLOW); lights++;
  }
}

// the lift core crown on the 80 tier: a concrete ring, open inside, a roof slab on top
for (const [x, z] of cells) {
  if (!inPlant(x, z) || cell(x, z).top !== 80) continue;
  const ring = x === 22 || x === 26 || z === 14 || z === 18;
  for (let y = 80; y <= 82; y++) if (ring) put(x, y, z, CONC);
  put(x, 83, z, CORNICE);
}

const { blocks, palette } = g.save(`${DIR}/way_292861496.nbt`);
console.log(`way_292861496: ${blocks} blocks, palette ${palette}, glass ${glazed}, glow ${lights}`);

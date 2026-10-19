// DC74464: Wilbur J. Cohen Federal Building (Social Security Administration), 330 Independence Ave SW, as a 1.21.1 module.
// Read from the record as a 1930s stripped-classical federal office block: calcite (limestone-look) walls on a stone base,
// a smooth-stone floor band at every storey, punched window grids of dark glass between calcite piers, a recessed iron-door
// entrance under a lintel, and a parapet over flat roofs. Lidar roof heights are smoothed (3x3 median over the footprint) and
// snapped to 4-block storeys (3 + a floor course): 4, 8, 12 or 16 blocks above y 0. The shell is one cell thick around a hollow
// core with a floor slab per storey, so there are no interiors but an air gap behind the glass; warm glowstone sits behind some
// panes. Every column is solid at y 0, at each floor slab and at its roof deck, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74464.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74464.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];     // +x, -x, +z, -z (the z=0 edge is the street front)

// Storey tops: median of the 3x3 footprint neighbourhood (lidar noise and 0-1 gaps drop out), snapped to 4-block storeys.
const TOP = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  TOP.set(key(c.x, c.z), Math.max(4, Math.round(vals[vals.length >> 1] / 4) * 4));
}
const topAt = (x, z) => TOP.get(key(x, z)) ?? 0;     // 0 outside the footprint: the open air beyond the plan edge

// A side of the column at height y faces open air when the neighbour in that direction is not built that high.
const exposedDirs = (x, y, z) => DIRS.filter(([dx, dz]) => y >= topAt(x + dx, z + dz));

const g = new Voxels([70, 27, 44]);
const CALCITE = "calcite", BASE = "stone_bricks", BAND = "smooth_stone", GLASS = "gray_stained_glass";
const WARM = "glowstone";

// Pass 1: the shell, floor slabs, base and roof decks.
for (const c of F.values()) {
  const { x, z } = c;
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    const floor = y % 4 === 0, deck = y === T - 1;
    const exposed = exposedDirs(x, y, z);
    if (!(y === 0 || floor || deck || exposed.length)) continue;   // hollow core: air between floor slabs
    if (y === 0) { g.set(x, y, z, BASE); continue; }
    if (floor || deck) { g.set(x, y, z, BAND); continue; }        // floor course and roof-deck cornice
    // Facade: 2 glass rows between calcite piers on a 4-block rhythm (piers at 0 and 3, glass at 1 and 2).
    const [dx, dz] = exposed[0];
    const along = dz === 0 ? z : x;
    const windowRow = y % 4 === 1 || y % 4 === 2;
    if (windowRow && (along % 4 === 1 || along % 4 === 2)) {
      g.set(x, y, z, GLASS);
      // Some panes are lit: a glowstone on the floor slab just inside the glass (only at the sill row, so it stands).
      const lit = (x * 73 + y * 131 + z * 197) % 11 === 0;
      const ix = x - dx, iz = z - dz;
      if (lit && y % 4 === 1 && inF(ix, iz) && !exposedDirs(ix, y, iz).length && topAt(ix, iz) > y) g.set(ix, y, iz, WARM);
    } else {
      g.set(x, y, z, CALCITE);
    }
  }
}

// Pass 2: the plan-edge parapet over the roof deck of every edge cell.
for (const c of F.values()) {
  const { x, z } = c;
  if (DIRS.some(([dx, dz]) => !inF(x + dx, z + dz))) g.set(x, topAt(x, z), z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 3: the entrance, a recessed bay on the street front (z=0): calcite piers, two iron doors under a smooth-stone lintel.
for (let x = 31; x <= 34; x++) {
  if (x === 31 || x === 34) {
    g.set(x, 0, 0, BASE);
    g.set(x, 1, 0, CALCITE);
    g.set(x, 2, 0, CALCITE);
  } else {
    const ds = { facing: "north", hinge: x === 32 ? "left" : "right", open: "false", powered: "false" };
    g.set(x, 0, 0, "iron_door", { ...ds, half: "lower" });
    g.set(x, 1, 0, "iron_door", { ...ds, half: "upper" });
    g.set(x, 2, 0, BAND);
  }
}

// Pass 4: a mechanical penthouse on the main roof, where a 6 x 4 patch is one storey top (12).
{
  const x0 = 40, z0 = 16, w = 6, d = 4;
  let flat = true;
  for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) if (topAt(x, z) !== 12) flat = false;
  if (flat) {
    for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) {
      g.set(x, 12, z, CALCITE);                                                  // a solid floor for the box
      g.set(x, 13, z, CALCITE);                                                  // walls and a solid ceiling course: nothing spans air
      g.set(x, 14, z, BAND);                                                     // flat cap over the box
    }
  }
}

const info = g.save(OUT);
console.log(`DC74464: ${info.blocks} blocks, palette ${info.palette}; storey tops ${[...new Set(TOP.values())].sort((a, b) => a - b).join(",")}`);

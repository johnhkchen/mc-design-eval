// Way 827744429, Auckland (Mt Eden / Eden Terrace side of the CBD): no record, so it is a two-storey brick commercial block
// of about 1930s date, with a red-brick skin, a cream render string course and cornice, a stone base course, a dark-timber
// shopfront on the north (street) face, and a flat roof with a lift-motor room and two plant boxes. The massing comes from
// the lidar roof heights, smoothed over a 3x3 window into two clean tiers: a two-storey core (roof at 8) and a one-storey
// skirt (roof at 5) around it, the setback the lidar's 6-to-7 core against 5-to-6 edges asks for.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744429.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744429.nbt";
const SIZE = 20;

// Storey datum: floors at 1 (ground) and 5, the core roof at 8, the skirt roof at 5. Storey windows at y 2-3 and 6-7.
const CORE_TOP = 8, SKIRT_TOP = 5, CORE_MIN_ROOF = 6.5;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => x * 1000 + z;
const roof = new Map(), ground = new Map();
for (const [x, z, g, r] of cells) { roof.set(key(x, z), r); ground.set(key(x, z), g); }
const inFp = (x, z) => x >= 0 && z >= 0 && x < SIZE && z < SIZE && roof.has(key(x, z));

// Lidar roof, smoothed over the footprint's 3x3 neighbourhood: this removes the one-cell noise (roof 1-2 fragments on the edge)
// and gives each cell a tier, not a height.
const smooth = (x, z) => {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inFp(x + dx, z + dz)) { s += roof.get(key(x + dx, z + dz)); n++; }
  return s / n;
};
const top = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) top.set(key(x, z), smooth(x, z) >= CORE_MIN_ROOF ? CORE_TOP : SKIRT_TOP);
const topAt = (x, z) => top.get(key(x, z));

// Each cell's exposed sides: outside the footprint (an outer wall, full height), or next to a lower tier (the core's wall
// above the skirt roof). Facing names are the direction the door faces, i.e. the opposite of the outward side.
const SIDES = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const FACING = { n: "south", s: "north", w: "east", e: "west" };
const exposed = (x, z) => {
  const T = topAt(x, z), out = [], step = [];
  for (const [side, [dx, dz]] of Object.entries(SIDES)) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz)) out.push(side);
    else if (topAt(nx, nz) < T) step.push(side);
  }
  return { out, step };
};

// The street is the north face (outward -z). Its outer cells get the shopfront; the door sits at the middle of that run.
const northRun = cells.map((c) => [c[0], c[1]]).filter(([x, z]) => exposed(x, z).out.includes("n"));
northRun.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
const streetZ = northRun.length ? northRun[0][1] : 0;
const streetCells = northRun.filter(([, z]) => z === streetZ).sort((a, b) => a[0] - b[0]);
const doorCell = streetCells[Math.floor(streetCells.length / 2)];

// Pass 1: the desired block for every cell, keyed x,y,z, so panes can read their neighbours before the file is written.
const want = new Map();
const put = (x, y, z, block, state) => want.set(`${x},${y},${z}`, { block, state });
const isWindowLayer = (y) => y === 2 || y === 3 || y === 6 || y === 7;
const pierAt = (x, z, side) => {
  if (!side) return false;
  const u = side === "n" || side === "s" ? x : z;
  return u % 3 === 0;
};
const columnAt = (x, z) => x % 4 === 0 && z % 4 === 0;

for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const T = topAt(x, z), { out, step } = exposed(x, z);
  const corner = out.length >= 2;
  const outer = out.length > 0;
  // the face whose window pattern this cell follows: its first outer side, else its step side
  const face = out[0] ?? step[0];
  const onStreet = out.includes("n");
  const doorHere = doorCell && x === doorCell[0] && z === doorCell[1];
  for (let y = 0; y <= T; y++) {
    if (y === 0) { put(x, 0, z, outer ? "stone_bricks" : "smooth_stone"); continue; }
    if (y === 1) { put(x, 1, z, outer ? "stone_bricks" : "smooth_stone"); continue; }    // base course on the outer walls
    if (y === T) { put(x, y, z, outer || step.length ? "smooth_quartz" : "smooth_stone"); continue; }    // cornice / roof deck
    if (y === 5 && T === CORE_TOP) { put(x, y, z, outer ? "smooth_quartz" : "smooth_stone"); continue; }  // storey band / floor slab
    if (y === 4 && outer) { put(x, y, z, onStreet ? "dark_oak_planks" : "smooth_quartz"); continue; }  // string course / shop fascia
    // windows and piers: on outer walls, and above the skirt roof on a core cell's side (storey one there is open to the skirt)
    if (isWindowLayer(y) && (outer || (step.length && y >= 6))) {
      const storeyOneStreet = onStreet && y < 4;
      if (doorHere && (y === 2 || y === 3)) {
        put(x, y, z, "dark_oak_door", { facing: FACING.n, half: y === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (corner || pierAt(x, z, face)) { put(x, y, z, storeyOneStreet ? "dark_oak_planks" : "bricks"); continue; }
      put(x, y, z, "glass_pane");
      continue;
    }
    // any other storey layer: interior air (the floors at 1, 5 and the roof are the solid ones)
  }
  // Interior: floors at 1 and 5 are solid (above), and the grid columns carry them, so nothing spans on air alone
  if (!outer && !step.length && columnAt(x, z)) {
    for (const y of [2, 3, 4]) put(x, y, z, "smooth_quartz");
    if (T === CORE_TOP) for (const y of [6, 7]) put(x, y, z, "smooth_quartz");
  }
}

// The door: lantern hung from the band over it, in the place of the shopfront fascia.
if (doorCell) put(doorCell[0], 4, doorCell[1], "lantern", { hanging: "true", waterlogged: "false" });

// Lift-motor room on the core roof: a 3x3 box, bricks on a ring at y 9, a flat cap at y 10; two plant boxes beside it.
const coreInterior = cells.map((c) => [c[0], c[1]]).filter(([x, z]) => topAt(x, z) === CORE_TOP && !exposed(x, z).out.length && !exposed(x, z).step.length);
const plantCentre = coreInterior.sort((a, b) => Math.abs(a[0] - 10) + Math.abs(a[1] - 10) - (Math.abs(b[0] - 10) + Math.abs(b[1] - 10)))[0];
if (plantCentre) {
  const [cx, cz] = plantCentre;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!inFp(x, z) || topAt(x, z) !== CORE_TOP) continue;
    put(x, 9, z, dx || dz ? "bricks" : "smooth_stone");    // the centre is solid too, so the cap at 10 is carried
    put(x, 10, z, "smooth_stone");
  }
  const plantSpots = coreInterior.filter(([x, z]) => Math.abs(x - cx) > 3 || Math.abs(z - cz) > 3).slice(0, 2);
  for (const [x, z] of plantSpots) put(x, 9, z, "iron_block");
}

// Pass 2: warm light in the air behind some glass (one cell in, on the interior side; never through a column).
const glassCells = [...want.entries()].filter(([, v]) => v.block === "glass_pane").map(([k]) => k.split(",").map(Number));
for (const [x, y, z] of glassCells) {
  if (!((x * 31 + z * 17 + y * 7) % 4 === 0)) continue;
  const { out } = exposed(x, z);
  if (!out.length) continue;
  const side = out[0];
  const [dx, dz] = SIDES[side];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || exposed(ix, iz).out.length || columnAt(ix, iz)) continue;
  if (want.has(`${ix},${y},${iz}`)) continue;
  put(ix, y, iz, y < 4 ? "glowstone" : "shroomlight");
}

// Pass 3: pane connections, from the neighbours (a pane joins a pane or a solid wall on the same plane).
const SOLID = new Set(["glass_pane", "bricks", "smooth_quartz", "dark_oak_planks", "stone_bricks", "smooth_stone"]);
const at = (x, y, z) => want.get(`${x},${y},${z}`)?.block;
for (const [k, v] of want) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  v.state = {};
  for (const [side, [dx, dz]] of Object.entries(SIDES)) {
    const nb = at(x + dx, y, z + dz);
    v.state[side === "n" ? "north" : side === "s" ? "south" : side === "e" ? "east" : "west"] = nb && SOLID.has(nb) ? "true" : "false";
  }
}

// Write the volume. Air stays air: the interiors are open between the floor slabs.
const g = new Voxels([SIZE, 20, SIZE]);
for (const [k, v] of want) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const stats = g.save(OUT);
const tiers = { core: 0, skirt: 0 };
for (const [, t] of top) tiers[t === CORE_TOP ? "core" : "skirt"]++;
console.log(`way_827744429: ${stats.blocks} blocks, palette ${stats.palette}; ${tiers.core} core cells (roof ${CORE_TOP}), ${tiers.skirt} skirt cells (roof ${SKIRT_TOP}); door at x${doorCell?.[0]} z${doorCell?.[1]}`);

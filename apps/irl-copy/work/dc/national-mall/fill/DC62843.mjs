import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC62843 - 901 G St NW, Washington DC 20001-4531: Martin Luther King Jr. Memorial Library.
// Museum/Library/Gallery. A 1968-72 Miesian steel-and-glass civic box: a stone base course, a
// dark steel mullion grid with bronze-tinted glass, light spandrels at each floor line, and a
// lower glazed reading-room atrium between two taller bars. Lidar: wings and frontage roof at
// ~9 blocks, the two bars at ~11, the central link at ~9 (a glazed roof). Roof tiers are read
// from the 3x3 mean of the lidar roof (clean two-tier massing), not per-cell noise.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC62843";
const W = 46, D = 23, H = 13;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, g, r] of raw) cells.set(`${x},${z}`, { x, z, g, r });
const has = (x, z) => cells.has(`${x},${z}`);

// Roof tiers: 9 (wings, atrium roof) and 11 (the two bars), by the 3x3 mean of the lidar roof.
for (const c of cells.values()) {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const o = cells.get(`${c.x + dx},${c.z + dz}`);
    if (o) { s += o.r; n++; }
  }
  c.top = s / n >= 10 ? 11 : 9;
}

// The central atrium: a glazed roof (skylight) at 9 over its core, with a walled ring at the edge.
const inCore = (x, z) => x >= 12 && x <= 33 && z >= 9 && z <= 13;
const inAtriumZone = (x, z) => x >= 11 && x <= 34 && z >= 8 && z <= 14;
const nearCore = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inCore(x + dx, z + dz));
const edge = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const CORNICE = "stone_bricks";
const SPANDREL = "light_gray_concrete";
const FRAME = "black_concrete";
const GLASS = "gray_stained_glass";
const LAMP = "glowstone";
const SKY = "gray_stained_glass";

const WINDOW_ROWS = [3, 4, 6, 7, 9];
const SPANDREL_ROWS = [5, 8];

// Entrance: on the south face (z=0), centred on the frontage where the ground is raised to 2.
const ENTRANCE = { x0: 19, x1: 25, door: 22 };
const inEntrance = (x, z) => z === 0 && x >= ENTRANCE.x0 && x <= ENTRANCE.x1;

for (const c of cells.values()) {
  const { x, z, g: gr } = c;
  const top = inCore(x, z) ? 9 : c.top;
  const core = inCore(x, z);
  const env = !core && (edge(x, z) || nearCore(x, z) || (inAtriumZone(x, z) && !core));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);
  // Base course: solid up to the first floor line (y 2) so every tier above has a solid course under it.
  for (let y = gr; y < 2; y++) put(x, y, z, env ? BASE : FOUND);

  // Mullion grid: x-lines on the long faces, z-lines on the end faces, black corners.
  const mullion = (x === 0 || x === W - 1) ? z % 3 === 0 : x % 3 === 0;

  for (let y = 2; y < top; y++) {
    const isTop = y === top - 1;

    if (core) {
      if (y === 2) put(x, y, z, FLOOR);                          // atrium floor
      else if (isTop) put(x, y, z, x % 4 === 0 || z % 4 === 0 ? FRAME : SKY);   // glazed roof over the atrium
      continue;
    }

    if (env) {
      if (inEntrance(x, z) && y <= 4) continue;                  // the storefront and door are set below
      if (y === 2) { put(x, y, z, BASE); continue; }             // sill
      if (isTop) { put(x, y, z, CORNICE); continue; }             // cornice or parapet
      if (SPANDREL_ROWS.includes(y)) { put(x, y, z, SPANDREL); continue; }
      if (WINDOW_ROWS.includes(y)) { put(x, y, z, mullion ? FRAME : GLASS); continue; }
      continue;
    }

    // Interior: a floor slab per storey (y 2, 5, 8), the roof deck on top, air between.
    if (y === 2 || y === 5 || y === 8 && top === 11) { put(x, y, z, FLOOR); continue; }
    if (isTop) { put(x, y, z, FOUND); continue; }
    // A warm light behind the glass on the inner edge of the long faces.
    const innerLong = (z === 1 || z === D - 2) && x % 6 === 2;
    const innerEnd = (x === 1 || x === W - 2) && z % 6 === 2;
    if ((innerLong || innerEnd) && WINDOW_ROWS.includes(y) && y !== 9) put(x, y, z, LAMP);
  }

  // Roof of the atrium (y 8) is glazed over the core; no walls above the ring.
}

// Entrance: a storefront with a door at the centre, glass flanking it, and a canopy on the spandrel.
for (let x = ENTRANCE.x0; x <= ENTRANCE.x1; x++) {
  const z = 0;
  if (x === ENTRANCE.x0 || x === ENTRANCE.x1) {
    for (const y of [3, 4]) put(x, y, z, FRAME);
    continue;
  }
  if (x === ENTRANCE.door) {
    put(x, 2, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, 3, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, 4, z, GLASS);
    continue;
  }
  put(x, 2, z, BASE);
  put(x, 3, z, GLASS);
  put(x, 4, z, GLASS);
}
for (let x = ENTRANCE.x0; x <= ENTRANCE.x1; x++) {
  for (const z of [0, 1]) put(x, 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Roof plant: a penthouse on the lower wing (on its roof deck at y 8), two air handlers on the bars.
for (let x = 3; x <= 6; x++) for (let z = 9; z <= 12; z++) {
  const outer = x === 3 || x === 6 || z === 9 || z === 12;
  put(x, 9, z, outer ? SPANDREL : "air");
  put(x, 10, z, SPANDREL);
}
for (const [x, z] of [[13, 3], [14, 3], [30, 18], [31, 18]]) put(x, 11, z, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
console.log("saved", `${DIR}/${ID}.nbt`, "blocks", g.count(), "palette", g.palette.length);

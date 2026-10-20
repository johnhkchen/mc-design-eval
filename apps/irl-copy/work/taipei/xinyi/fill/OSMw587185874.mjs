import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587185874.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587185874.nbt";

const W = 34, H = 62, D = 19;
const TOP = 50;          // roof slab sits at y=50 (about ten storeys of 5 blocks)
const v = new Voxels([W, H, D]);

// ---- footprint -------------------------------------------------------------
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const cellG = new Map();
const clamp = (n) => Math.max(0, Math.min(TOP - 1, Math.round(n)));
for (const p of raw) {
  let x, z, gr;
  if (Array.isArray(p)) { [x, z, gr] = p; }
  else { x = p.x; z = p.z; gr = p.ground ?? p.y ?? 0; }
  cellG.set(`${x},${z}`, clamp(gr));
}
const inF = (x, z) => cellG.has(`${x},${z}`);
const gnd = (x, z) => cellG.get(`${x},${z}`);

// ---- materials -------------------------------------------------------------
const GLASS = "light_blue_stained_glass_pane";
const CONC = "white_concrete";
const QUARTZ = "smooth_quartz";
const SLAB = "light_gray_concrete";
const FOUND = "stone_bricks";
const LIGHT = "glowstone";

const glows = [];

// ---- per-cell massing ------------------------------------------------------
for (const [k, gr] of cellG) {
  const [x, z] = k.split(",").map(Number);
  const exX = !inF(x - 1, z) || !inF(x + 1, z);
  const exZ = !inF(x, z - 1) || !inF(x, z + 1);
  const perim = exX || exZ;
  const corner = exX && exZ;

  // foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) v.set(x, y, z, FOUND);

  // roof slab
  v.set(x, TOP, z, SLAB);

  // parapet and cap on the perimeter
  if (perim) {
    v.set(x, TOP + 1, z, CONC);
    v.set(x, TOP + 2, z, QUARTZ);
  }

  // inward direction for placing interior lights behind glass
  const dx = !inF(x - 1, z) ? 1 : (!inF(x + 1, z) ? -1 : 0);
  const dz = !inF(x, z - 1) ? 1 : (!inF(x, z + 1) ? -1 : 0);
  const canLight = perim && !corner && (dx !== 0 || dz !== 0) && inF(x + dx, z + dz);

  for (let y = gr; y < TOP; y++) {
    const r = y % 5;
    const storey = Math.floor(y / 5);

    if (!perim) {
      // interior: only floor slabs, no walls
      if (r === 0 || y === gr) v.set(x, y, z, SLAB);
      continue;
    }

    // perimeter facade
    if (y === gr) { v.set(x, y, z, QUARTZ); continue; }      // base course
    if (corner) { v.set(x, y, z, CONC); continue; }          // corner piers
    if (r === 0) { v.set(x, y, z, QUARTZ); continue; }       // storey line
    if (r === 4) { v.set(x, y, z, CONC); continue; }         // spandrel

    // rows 1..3: glazing with mullions every third cell
    const mullion = (x + z) % 3 === 0;
    if (mullion) { v.set(x, y, z, CONC); continue; }

    // entrance on the +z (front) face, ground storey only
    const front = !inF(x, z + 1);
    const entranceCol = x === Math.floor(W / 2) || x === Math.floor(W / 2) - 1;
    if (front && entranceCol && gr <= 2 && storey === 0 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      v.set(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    v.set(x, y, z, GLASS);

    // warm light behind some windows
    if (canLight && ((x * 5 + z * 3 + storey * 7) % 5 === 0) && r === 2) {
      glows.push([x + dx, y, z + dz]);
    }
  }
}

// lights go last so they sit cleanly behind the glass
for (const [x, y, z] of glows) v.set(x, y, z, LIGHT);

// ---- roof plant and mast ---------------------------------------------------
const PX0 = 9, PX1 = 24, PZ0 = 5, PZ1 = 13;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = TOP + 1; y <= TOP + 4; y++) {
      if (edge) {
        const louvre = (y === TOP + 2 || y === TOP + 3) && (x + z) % 2 === 0;
        v.set(x, y, z, louvre ? "iron_bars" : SLAB);
      }
    }
    v.set(x, TOP + 5, z, FOUND); // plant roof slab at y=55
  }
}
v.set(16, 56, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
for (let y = 57; y <= 59; y++) v.set(16, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

v.save(OUT);

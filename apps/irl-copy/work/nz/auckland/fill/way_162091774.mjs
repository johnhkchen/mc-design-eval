import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 162091774, Auckland. Read as an inter-war (1920s-30s) three-storey brick commercial block: a stone plinth
// and string courses in cream rendered brick-and-concrete, glazed bays between brick piers, dark timber shop
// fascias on the ground floor, a stone coping on every parapet, and a recessed entrance with a canopy and lanterns.
// The lidar roof (smoothed over its 3x3 neighbourhood, so noise does not make jagged steps) sets the massing in
// flat tiers: 3 storeys where the roof is 13+ (the core), 2 where it is 9-12 (the wings), 1 below that.
// Every column is solid from y 0 up to its own top, so each storey sits on the one below.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_162091774.cells.json`, "utf8"));

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const F = new Map();
for (const [x, z, ground, roof] of cells) F.set(`${x},${z}`, { x, z, ground, roof });
const at = (x, z) => F.get(`${x},${z}`);

// storeys per cell from the smoothed lidar roof; the top of a column is 2 + 4 * storeys (floors at 2, 6, 10)
const storeysOf = (r) => (r >= 13 ? 3 : r >= 9 ? 2 : 1);
for (const c of F.values()) {
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const m = at(c.x + dx, c.z + dz); if (m) { sum += m.roof; n++; } }
  c.n = storeysOf(sum / n);
  c.top = 2 + 4 * c.n;
}

// faces that look out: off the footprint, or onto a lower tier (a setback's exposed wall)
const faces = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const m = at(c.x + dx, c.z + dz); return !m || m.n < c.n; }).map(([d]) => d);
const alongOf = (c, face) => (face === "N" || face === "S" ? c.x : c.z);

const g = new Voxels([25, 27, 39]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

// the entrance: the northernmost street-face cell nearest the middle of its row
const northCells = [...F.values()].filter((c) => faces(c).includes("N"));
const minZ = Math.min(...northCells.map((c) => c.z));
const row = northCells.filter((c) => c.z === minZ);
const midX = row.reduce((a, c) => a + c.x, 0) / row.length;
const entrance = row.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best), row[0]);

const panes = new Map();   // "x,y,z" -> the face a pane looks out of, to set its connections after
const lamps = [];

for (const c of F.values()) {
  const { x, z, n, top: T } = c;
  const fs = faces(c);
  const perim = fs.length > 0;

  // foundation from y 0 to the floor at y 2 (the highest ground under the building), stone base course at y 1
  put(x, 0, z, "stone");
  put(x, 1, z, perim ? "stone_bricks" : "stone");

  for (let y = 2; y < T; y++) {
    const s = Math.floor((y - 2) / 4), r = (y - 2) % 4;       // storey index, row within the storey
    if (!perim) {
      if (r === 0 || y === T - 1) put(x, y, z, "light_gray_concrete");   // floor slabs and the roof deck; air between
      continue;
    }
    if (y === T - 1) { put(x, y, z, "stone_bricks"); continue; }          // stone coping on the parapet
    if (r === 0) { put(x, y, z, s === 0 ? "stone_bricks" : "smooth_quartz"); continue; }   // base course, string courses
    if (r === 3) { put(x, y, z, s === 0 ? "dark_oak_planks" : "smooth_quartz"); continue; } // shop fascia, then spandrel band

    // rows 1 and 2: piers at corners and every third bay, glazing between
    const pier = fs.length > 1 || alongOf(c, fs[0]) % 3 === 0;
    if (pier) { put(x, y, z, "bricks"); continue; }
    const face = fs[0];
    put(x, y, z, "glass_pane");
    panes.set(`${x},${y},${z}`, face);
  }

  // roof: the top storey's coping is above; on the interior the deck closes the column at T - 1 (set in the loop)
}

// the entrance: a dark oak door set in the glazing, a canopy fascia above, lanterns hanging either side
if (entrance && faces(entrance).includes("N")) {
  const { x, z } = entrance;
  panes.delete(`${x},3,${z}`); panes.delete(`${x},4,${z}`);
  put(x, 3, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    const side = at(x + dx, z);
    if (side && faces(side).includes("N")) {
      panes.delete(`${side.x},3,${side.z}`); panes.delete(`${side.x},4,${side.z}`);
      put(side.x, 4, side.z, "lantern", { hanging: "true", waterlogged: "false" });
      put(side.x, 3, side.z, "stone_bricks");
    }
  }
}

// glowstone set just inside some glazed bays, on the floor slab behind the glass
for (const [key, face] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const [dx, dz] = DIRS[face];
  const inner = at(x - dx, z - dz);
  if (inner && inner.top > y && !faces(inner).length && (x * 7 + y * 3 + z) % 5 === 0) lamps.push([inner.x, y, inner.z]);
}
for (const [x, y, z] of lamps) put(x, y, z, "glowstone");

// connections: a pane joins its neighbours in the same wall plane, so runs of glazing read as frames of glass
for (const [key, face] of panes) {
  const [x, y, z] = key.split(",").map(Number);
  const along = face === "N" || face === "S";
  const has = (dx, dz) => panes.get(`${x + dx},${y},${z + dz}`) === face;
  const state = along
    ? { east: String(has(1, 0)), west: String(has(-1, 0)), north: "false", south: "false", waterlogged: "false" }
    : { north: String(has(0, -1)), south: String(has(0, 1)), east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, "glass_pane", state);
}

// roof plant: a small enclosed plant room on the top core, over the interior near the middle of the tall tier
const core = [...F.values()].filter((c) => c.n === 3 && faces(c).length === 0);
if (core.length) {
  const cx = core.reduce((a, c) => a + c.x, 0) / core.length, cz = core.reduce((a, c) => a + c.z, 0) / core.length;
  const near = core.reduce((b, c) => (Math.hypot(c.x - cx, c.z - cz) < Math.hypot(b.x - cx, b.z - cz) ? c : b), core[0]);
  for (const c of core) if (Math.abs(c.x - near.x) <= 1 && Math.abs(c.z - near.z) <= 1) {
    put(c.x, 14, c.z, "light_gray_concrete");
    put(c.x, 15, c.z, "smooth_stone");
  }
}

const out = `${DIR}/way_162091774.nbt`;
const res = g.save(out);
const tiers = { 1: 0, 2: 0, 3: 0 };
for (const c of F.values()) tiers[c.n]++;
console.log(`way_162091774: ${res.blocks} blocks, ${res.palette} palette, tiers ${JSON.stringify(tiers)}, ${panes.size} panes, ${lamps.length} lamps -> ${out}`);

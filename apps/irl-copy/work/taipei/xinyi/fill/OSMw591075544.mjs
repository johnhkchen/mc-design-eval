import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office/retail block, c. 1990s: five storeys of white
// concrete piers and spandrels with tinted glass infill, a shopfront base,
// a quartz cornice, and a parapet with a central plant penthouse.
// Roof deck at y 25, parapet top at y 28, so the roof sits 29 blocks above
// the lowest ground (y 0).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075544";
const W = 9, H = 41, D = 13;
const TOP = 28;          // top block of parapet (building height 29)
const ROOF = 25;         // roof deck / cornice base
const FLOOR_MAX = 25;    // last interior floor slab

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Exterior faces of a footprint cell (a side with no neighbouring footprint cell).
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
}

// Entrance: the south-facing non-corner cell closest to the middle of the frontage.
let entry = null;
for (const [x, z] of cells) {
  const fs = faces(x, z);
  if (fs.length === 1 && fs[0] === "south") {
    if (!entry || Math.abs(x - 4) < Math.abs(entry[0] - 4)) entry = [x, z];
  }
}

function paneProps(face) {
  const alongX = face === "north" || face === "south";
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Pass 1: foundation, facades, interior floor slabs, roof and penthouse.
for (const [x, z, gy] of cells) {
  const fs = faces(x, z);
  const wall = fs.length >= 1;
  const corner = fs.length >= 2;
  const face = fs[0];
  const idx = face === "north" || face === "south" ? x : z;
  const isEntry = entry && entry[0] === x && entry[1] === z;
  const doorY = Math.max(1, gy);

  for (let y = 0; y <= TOP; y++) {
    if (y < gy) {
      g.set(x, y, z, "gray_concrete");
      continue;
    }
    if (!wall) {
      if (y % 5 === 0 && y <= FLOOR_MAX) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Wall cell
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === ROOF) { g.set(x, y, z, "quartz_block"); continue; }
    if (y === ROOF + 1 || y === ROOF + 2) { g.set(x, y, z, "white_concrete"); continue; }
    if (y === TOP) { g.set(x, y, z, "quartz_slab", { type: "top", waterlogged: "false" }); continue; }

    if (isEntry && gy <= 2 && (y === doorY || y === doorY + 1)) {
      g.set(x, y, z, "oak_door", {
        facing: face,
        half: y === doorY ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isEntry && gy <= 2 && y === doorY + 2) { g.set(x, y, z, "white_concrete"); continue; }

    const r = y % 5;
    if (corner || r === 0 || r === 4) { g.set(x, y, z, "white_concrete"); continue; }

    // Window rows (r 1..3), including the shopfront at y 1..3.
    if (idx % 3 === 0) { g.set(x, y, z, "white_concrete"); continue; }
    const pane = y <= 3 ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
    g.set(x, y, z, pane, paneProps(face));
  }
}

// Penthouse plant room on the roof, centred on the footprint.
for (const [x, z, gy] of cells) {
  if (x < 3 || x > 5 || z < 4 || z > 8) continue;
  if (faces(x, z).length) continue;
  if (gy > 26) continue;
  g.set(x, 26, z, "light_gray_concrete");
  const ring = x === 3 || x === 5 || z === 4 || z === 8;
  g.set(x, 27, z, ring ? "light_blue_stained_glass" : "light_gray_concrete");
}

// Pass 2: warm light behind some upper-storey windows (glowstone in the room behind the glass).
for (const [x, z, gy] of cells) {
  const fs = faces(x, z);
  if (fs.length !== 1) continue;
  const face = fs[0];
  const idx = face === "north" || face === "south" ? x : z;
  if (idx % 3 === 0) continue;
  const isEntry = entry && entry[0] === x && entry[1] === z;
  if (isEntry) continue;

  let ix = x, iz = z;
  if (face === "north") iz = z + 1;
  else if (face === "south") iz = z - 1;
  else if (face === "west") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || faces(ix, iz).length) continue;

  for (let y = 6; y <= 22; y += 5) {
    if (y + 2 > TOP) continue;
    if (y < gy || y < G(ix, iz)) continue;
    if ((idx + y) % 4 !== 0) continue;
    g.set(ix, y + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167413";
const W = 20, D = 24, H = 38;
const TOP = 25;      // roof deck / cornice level
const PARAPET = 26;  // parapet course on the perimeter

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const has = (x, z) => ground.has(`${x},${z}`);
const g = new Voxels([W, H, D]);

function set(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return; // build only on footprint cells
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

const pane = (block, axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// ---- Body: 1980s five-storey commercial block, pale tiled concrete frame,
// blue-grey glazing, stone base and cornice, roof with water tank and plant room.
for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  // Which outer faces does this cell sit on?
  const faces = [];
  if (!has(x, z - 1)) faces.push("N");
  if (!has(x, z + 1)) faces.push("S");
  if (!has(x - 1, z)) faces.push("W");
  if (!has(x + 1, z)) faces.push("E");
  const edge = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces[0];
  const alongX = face === "N" || face === "S";
  const u = alongX ? x : z;
  const L = alongX ? W : D;
  const pier = corner || u === 0 || u === L - 1 || u % 3 === 0;
  // Inward direction for placing lights behind the glass.
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];

  for (let y = gy; y <= TOP; y++) {
    if (!edge) {
      // Interior: floor slabs only, air elsewhere (no interiors).
      if (y === gy || y % 5 === 0 || y === TOP) set(x, y, z, "smooth_stone");
      continue;
    }

    const yb = y % 5;
    if (y === TOP) { set(x, y, z, "smooth_stone"); continue; } // cornice
    if (y === 0) { set(x, y, z, "stone_bricks"); continue; }   // base course
    if (yb === 0) { set(x, y, z, "light_gray_concrete"); continue; } // spandrel
    if (yb === 4) { set(x, y, z, "white_concrete"); continue; }      // lintel line

    // Window band rows yb = 1..3
    if (pier) { set(x, y, z, "white_concrete"); continue; }

    const ground_storey = y < 5;
    const southEntrance = face === "S" && (u === 9 || u === 10) && y <= 3;
    if (southEntrance) {
      set(x, y, z, "glass"); // entrance doors, glazed
      continue;
    }

    const block = ground_storey ? "cyan_stained_glass_pane" : "light_blue_stained_glass_pane";
    set(x, y, z, block, pane(block, alongX ? "x" : "z"));

    // Warm light behind some windows (glowstone one block inside the glass).
    if ((u + y) % 4 === 0) {
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz)) set(ix, y, iz, "glowstone");
    }
  }

  // Parapet course on the perimeter.
  if (edge) set(x, PARAPET, z, "light_gray_concrete");
}

// ---- Roof equipment ----
// Steel water tank on the roof deck (Taipei rooftop habit).
for (let x = 3; x <= 6; x++) {
  for (let z = 4; z <= 7; z++) {
    const ring = x === 3 || x === 6 || z === 4 || z === 7;
    if (ring) for (let y = PARAPET; y <= 29; y++) set(x, y, z, "iron_block");
    set(x, 30, z, "iron_block"); // tank lid
  }
}

// Plant room / mechanical penthouse, with a glazed lookout on its south face.
for (let x = 12; x <= 16; x++) {
  for (let z = 13; z <= 17; z++) {
    const wall = x === 12 || x === 16 || z === 13 || z === 17;
    for (let y = PARAPET; y <= 27; y++) {
      if (wall) set(x, y, z, "light_gray_concrete");
    }
    set(x, 28, z, "smooth_stone"); // penthouse roof
  }
}
// Plant room windows on the south wall.
set(13, 27, 17, "light_blue_stained_glass_pane", pane("light_blue_stained_glass_pane", "x"));
set(15, 27, 17, "light_blue_stained_glass_pane", pane("light_blue_stained_glass_pane", "x"));
set(14, 27, 17, "glowstone" ? "white_concrete" : "white_concrete");

// Condenser units and a vent stack.
set(8, PARAPET, 19, "iron_block");
set(9, PARAPET, 19, "iron_block");
set(10, PARAPET, 19, "iron_block");
set(17, PARAPET, 4, "iron_bars");
set(17, 27, 4, "iron_bars");
set(17, 28, 4, "iron_bars");

g.save(`${DIR}/${ID}.nbt`);

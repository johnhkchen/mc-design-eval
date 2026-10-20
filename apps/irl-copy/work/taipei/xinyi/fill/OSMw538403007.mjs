// OSMw538403007: unnamed low commercial block, Xinyi district, Taipei.
// Read from the lidar record: 11 blocks to roof from lowest ground, so 2 storeys
// of about 5 blocks. Era: mid-century Taipei street block, rebuilt as a
// white-concrete shophouse with a stone plinth, red terracotta bands, a glazed
// shopfront, and a flat parapet roof with rooftop units.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403007";
const W = 23, H = 23, D = 18;
const ROOF = 10;          // top wall/parapet block index: roof 11 blocks above lowest ground

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const minG = Math.min(...list.map((c) => c[2]));

// footprint: "x,z" -> ground (relative to lowest ground)
const ground = new Map();
for (const [x, z, gr] of list) ground.set(`${x},${z}`, gr - minG);

const inFp = (x, z) => ground.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

function outward(x, z) {
  return Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !inFp(x + dx, z + dz))
    .map(([n]) => n);
}

// Prefer north/south faces (street frontage), otherwise east/west.
function facadeFace(x, z) {
  const o = outward(x, z);
  return o.find((f) => f === "north" || f === "south") ?? o[0] ?? null;
}

// Storey rules, absolute y (0 = lowest ground):
// 0..3 ground floor shopfront, 4 red band (canopy line), 5 slab line,
// 6..8 upper storey, 9 red band, 10 parapet cap.
function facadeBlock(y, win) {
  if (y === 4 || y === 9) return "red_terracotta";
  if (y === 5 || y === 10) return "smooth_stone";
  if (y <= 3) return win ? "light_blue_stained_glass" : "stone_bricks";
  return win ? "light_blue_stained_glass" : "white_concrete";
}

const g = new Voxels([W, H, D]);

for (const [key, gr0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const gnd = Math.min(gr0, ROOF);
  const face = facadeFace(x, z);
  const edge = face !== null;
  const along = face === "north" || face === "south" ? x : z;
  const win = along % 3 !== 0; // piers every third bay

  for (let y = 0; y <= ROOF; y++) {
    if (y < gnd) { g.set(x, y, z, "stone_bricks"); continue; } // foundation

    if (!edge) {
      // interior: floor slabs only, air gap otherwise
      if (y === gnd || y === 5 || y === 10) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (y === gnd) g.set(x, y, z, "polished_andesite"); // base course
    else g.set(x, y, z, facadeBlock(y, win));
  }

  // rooftop units on interior cells, away from the parapet
  if (!edge && x % 6 === 3 && z % 6 === 3) {
    g.set(x, ROOF + 1, z, "iron_block");
  }
}

// Entrance: north-facing edge cell nearest the centre of the frontage.
let door = null;
for (const [key, gr0] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!inFp(x, z - 1)) {
    const d = Math.abs(x - (W - 1) / 2);
    if (!door || d < door.d) door = { x, z, d, gnd: Math.min(gr0, ROOF) };
  }
}
if (door) {
  g.set(door.x, door.gnd, door.z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(door.x, door.gnd + 1, door.z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Warm light in the air gap behind some lit-storey windows.
for (const [key, gr0] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = facadeFace(x, z);
  if (!face) continue;
  const along = face === "north" || face === "south" ? x : z;
  if (along % 3 === 0) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || outward(ix, iz).length) continue; // need a true interior cell
  const igr = Math.min(ground.get(`${ix},${iz}`), ROOF);
  for (const y of [1, 2, 6, 7]) {
    if (y < igr || y > 8) continue;
    if ((x + z + y) % 4 === 0) g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

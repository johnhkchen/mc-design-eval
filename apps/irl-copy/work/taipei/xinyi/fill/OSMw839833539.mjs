import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 15 x 11 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, flat-roofed Xinyi shophouse-style commercial block,
// c. 1980s-90s: white rendered walls, stone-brick base, red fascia sign band,
// shopfront glass on the ground floor, paired-pane upper windows with a stone
// sill and head, and a parapet with rooftop mechanical units.
const ID = "OSMw839833539";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 15, H = 23, D = 11;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gr);
}
const inSet = (x, z) => ground.has(`${x},${z}`);

// direction table: exposed-side test and facing name
const DIRS = [
  { name: "north", dx: 0, dz: -1, axis: "x" },
  { name: "south", dx: 0, dz: 1, axis: "x" },
  { name: "west", dx: -1, dz: 0, axis: "z" },
  { name: "east", dx: 1, dz: 0, axis: "z" },
];
const exposedDirs = (x, z) => DIRS.filter((d) => !inSet(x + d.dx, z + d.dz));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// ---- pass 1: envelope, floors, foundations ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const exp = exposedDirs(x, z);
  const perim = exp.length > 0;
  const corner = exp.length >= 2;

  // foundation from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // ground floor slab / base course
  put(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  // storey line between floors
  put(x, gr + 5, z, "light_gray_concrete");

  // roof slab; parapet and cap on the perimeter
  put(x, gr + 10, z, perim ? "white_concrete" : "light_gray_concrete");
  if (perim) put(x, gr + 11, z, "stone_brick_slab", { type: "bottom" });

  if (!perim) continue;

  // corner piers run the full height
  if (corner) {
    for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    }
    put(x, gr + 4, z, "red_concrete");
    continue;
  }

  // face cell: one exposed side
  const face = exp[0];
  const idx = face.axis === "x" ? x : z;
  const bay = idx % 2 === 1;
  const paneProps = face.axis === "x"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // storey 1 shopfront
  for (const y of [gr + 1, gr + 2, gr + 3]) {
    if (bay) put(x, y, z, "glass");
    else put(x, y, z, "white_concrete");
  }
  // red fascia sign band
  put(x, gr + 4, z, "red_concrete");

  // storey 2 windows: sill, paired panes, head
  put(x, gr + 6, z, bay ? "stone_bricks" : "white_concrete");
  for (const y of [gr + 7, gr + 8]) {
    if (bay) put(x, y, z, "glass_pane", paneProps);
    else put(x, y, z, "white_concrete");
  }
  put(x, gr + 9, z, bay ? "stone_bricks" : "white_concrete");
}

// ---- pass 2: entrance on the south face, nearest the middle ----
let door = null;
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (inSet(x, z + 1)) continue; // needs an exposed south face
  if (!door || Math.abs(x - 7) < Math.abs(door.x - 7)) door = { x, z, gr };
}
if (door) {
  const { x, z, gr } = door;
  put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 3, z, "smooth_stone"); // lintel over the door
  // stone threshold step just outside the door
  put(x, gr, z + 1, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
}

// ---- pass 3: interior lights behind glass, roof plant ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const exp = exposedDirs(x, z);
  if (exp.length !== 1) continue;
  const face = exp[0];
  const idx = face.axis === "x" ? x : z;
  if (idx % 2 !== 1) continue;
  // inward neighbour: interior cell behind the glass
  const ix = x - face.dx, iz = z - face.dz;
  if (!inSet(ix, iz) || exposedDirs(ix, iz).length > 0) continue;
  // storey 1 glowstone behind shopfront, storey 2 shroomlight behind windows
  if (idx % 4 === 1) put(ix, gr + 2, iz, "glowstone");
  else if (idx % 4 === 3) put(ix, gr + 7, iz, "shroomlight");
}

// rooftop air-conditioning units on interior roof cells
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (exposedDirs(x, z).length > 0) continue;
  if ((x + z) % 5 === 0) put(x, gr + 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

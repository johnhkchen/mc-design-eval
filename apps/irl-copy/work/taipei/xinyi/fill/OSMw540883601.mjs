import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey Xinyi shophouse-style mid-rise: 1970s-80s reinforced concrete frame,
// white tiled facade, pilaster bays, glazed shopfront at street level, red awning,
// flat roof with parapet and rooftop units. Roof parapet top at y = 11.
const ID = "OSMw540883601";
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const W = 7, H = 23, D = 17;
const ROOF = 10;      // roof deck
const PARAPET = 11;   // parapet / coping course

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gnd] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(6, Math.round(gnd))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of a footprint cell: { axis: "x"|"z", sign: -1|1 }
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ axis: "z", sign: -1 });
  if (!has(x, z + 1)) f.push({ axis: "z", sign: 1 });
  if (!has(x - 1, z)) f.push({ axis: "x", sign: -1 });
  if (!has(x + 1, z)) f.push({ axis: "x", sign: 1 });
  return f;
}

const PANE_Z = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_X = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

for (const [key, gnd] of ground) {
  const [x, z] = key.split(",").map(Number);
  const per = faces(x, z);
  const edge = per.length > 0;
  const corner = per.length >= 2;
  // Mid-level storey line: halfway between street slab and roof deck
  const m = Math.round((gnd + ROOF) / 2);

  // Solid foundation from y 0 up to this cell's ground
  for (let y = 0; y < gnd; y++) put(x, y, z, "polished_andesite");

  // Ground slab (base course on the perimeter)
  put(x, gnd, z, edge ? "polished_granite" : "smooth_stone");

  // Storey floor slab
  put(x, m, z, edge ? "light_gray_concrete" : "smooth_stone");

  // Roof deck
  put(x, ROOF, z, "gray_concrete");

  if (!edge) {
    // Rooftop AC units on a sparse pattern, interior only
    if ((x + z) % 5 === 0) put(x, PARAPET, z, "light_gray_concrete");
    continue;
  }

  // Perimeter wall (tiled white concrete) from above the ground slab to the deck
  for (let y = gnd + 1; y < ROOF; y++) put(x, y, z, "white_concrete");
  // Parapet coping
  put(x, PARAPET, z, "light_gray_concrete");

  if (corner) {
    // Corner columns
    for (let y = gnd + 1; y < ROOF; y++) put(x, y, z, "light_gray_concrete");
    continue;
  }

  const face = per[0];
  const i = face.axis === "z" ? x : z;     // position along the facade
  const paneProps = face.axis === "z" ? PANE_Z : PANE_X;
  // Inward neighbour (for warm lights behind the glass)
  const inX = face.axis === "x" ? x - face.sign : x;
  const inZ = face.axis === "z" ? z - face.sign : z;
  const interiorBehind = has(inX, inZ) && faces(inX, inZ).length === 0;

  if (i % 2 === 0) {
    // Pilaster bay
    for (let y = gnd + 1; y < ROOF; y++) put(x, y, z, "light_gray_concrete");
    continue;
  }

  // Ground storey: shopfront glazing with a tile lintel band
  for (let y = gnd + 1; y <= Math.min(gnd + 2, m - 1); y++) {
    put(x, y, z, "light_blue_stained_glass_pane", paneProps);
  }
  // Red sign band just under the storey line
  if (m - 1 > gnd + 3) put(x, m - 1, z, "red_terracotta");

  // Upper storey: sill band, two-high panes, top band stays white
  put(x, m + 1, z, "light_gray_concrete");
  put(x, m + 2, z, "light_blue_stained_glass_pane", paneProps);
  put(x, m + 3, z, "light_blue_stained_glass_pane", paneProps);

  // Warm light behind some upper windows
  if (interiorBehind && i % 4 === 1 && m + 2 < ROOF) {
    put(inX, m + 2, inZ, "shroomlight");
  }
}

// Entrance on the z = 0 street face: door at x = 3, glazing either side, red canopy above
const ent = 3;
const entGnd = ground.get(`${ent},0`);
if (entGnd !== undefined) {
  put(ent, entGnd + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ent, entGnd + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const x of [2, 4]) {
    if (!has(x, 0)) continue;
    put(x, entGnd + 1, 0, "light_blue_stained_glass_pane", PANE_Z);
    put(x, entGnd + 2, 0, "light_blue_stained_glass_pane", PANE_Z);
  }
  for (const x of [2, 3, 4]) {
    if (has(x, 0)) put(x, entGnd + 3, 0, "red_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1068807546";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 20 x 36, roof about 11 blocks above lowest ground.
// Reading: a two-storey, c.1980s Taipei commercial block: white tiled/concrete
// facade on a stone base, tinted glass bays, shopfront ground floor with a
// central entrance, flat roof with parapet and a set-back plant box.
const W = 20, H = 23, D = 36;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const put = (x, y, z, id, p) => (p ? g.set(x, y, z, id, p) : g.set(x, y, z, id));

const PANE = "light_blue_stained_glass_pane";
const WALL = "white_concrete";
const FRAME = "smooth_stone";
const ROOF = "gray_concrete";
const LIGHT_CAP = "light_gray_concrete";

// Storey levels (absolute y): ground storey gr+1..gr+4, slab 5,
// storey two 6..9, roof slab 10, parapet 11.
const FLOOR1 = 5, ROOF_Y = 10, PARAPET_Y = 11;

for (const [x, z, gr] of cells) {
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  const edge = faces.length > 0;
  const face = faces[0];

  // Foundation and base course
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");
  put(x, gr, z, edge ? "stone_bricks" : FRAME);

  // Floor slabs and roof slab over the whole footprint
  put(x, FLOOR1, z, FRAME);
  put(x, ROOF_Y, z, ROOF);

  if (!edge) continue;

  const along = face === "north" || face === "south" ? x : z;
  const pier = along % 3 === 0;
  const isDoor = face === "north" && x === 9 && z === 0;
  const alongX = face === "north" || face === "south";
  const pane = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // Ground storey
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (isDoor) {
      if (y === gr + 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 2) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else put(x, y, z, WALL);
    } else if (pier) {
      put(x, y, z, WALL);
    } else {
      put(x, y, z, PANE, pane);
    }
  }
  // Lintel / canopy over the entrance
  if (face === "north" && z === 0 && x >= 8 && x <= 10) put(x, gr + 4, z, "dark_oak_planks");
  else put(x, gr + 4, z, WALL);

  // Storey two
  put(x, 6, z, WALL);
  for (let y = 7; y <= 8; y++) put(x, y, z, pier ? WALL : PANE, pier ? undefined : pane);
  put(x, 9, z, WALL);

  // Parapet and cornice
  put(x, ROOF_Y, z, FRAME);
  put(x, PARAPET_Y, z, WALL);
}

// Warm light behind some glass: glowstone on the interior side of bays
for (const [x, z, gr] of cells) {
  if (!isEdge(x, z)) continue;
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  const face = faces[0];
  const along = face === "north" || face === "south" ? x : z;
  if (along % 3 === 0) continue;
  if (along % 6 !== 2) continue;
  let ix = x, iz = z;
  if (face === "north") iz = z + 1;
  else if (face === "south") iz = z - 1;
  else if (face === "west") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  put(ix, 7, iz, "glowstone");
  put(ix, gr + 2, iz, "glowstone");
}

// Set-back plant box on the roof
for (let x = 7; x <= 12; x++) {
  for (let z = 13; z <= 18; z++) {
    if (!has(x, z)) continue;
    put(x, 11, z, LIGHT_CAP);
    put(x, 12, z, LIGHT_CAP);
  }
}

g.save(`${DIR}/${ID}.nbt`);

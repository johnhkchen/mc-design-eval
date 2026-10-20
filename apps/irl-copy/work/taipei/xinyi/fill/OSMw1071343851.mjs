import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343851";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 14;
const ROOF = 11;      // roof slab level, about 11 blocks above lowest ground
const PARAPET = 12;   // parapet course sits on the roof slab

// Two-storey mid-rise commercial block, white tiled concrete with a glazed
// shopfront at ground level and a ribbon of windows above. South face (z = D-1)
// is the street frontage with a central entrance.
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inF = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

for (const [x, z, gr] of cells) {
  const edge = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Ground-floor slab / base course.
  g.set(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Second-floor slab at y 6 across the whole footprint.
  g.set(x, 6, z, "smooth_stone");

  // Roof slab at y 11 across the whole footprint.
  g.set(x, ROOF, z, "light_gray_concrete");

  if (!edge) continue;

  const onXFace = x === 0 || x === W - 1;
  const pier = isCorner(x, z) || (onXFace ? z % 3 === 0 : x % 3 === 0);
  const paneProps = onXFace
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  // Wall column from the base course up to the cornice.
  for (let y = gr + 1; y <= 10; y++) {
    g.set(x, y, z, "white_concrete");
  }

  // Ground storey: shopfront glass between piers, concrete lintel above.
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (pier) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, "glass");
  }
  for (let y = gr + 4; y <= gr + 5; y++) {
    g.set(x, y, z, pier ? "light_gray_concrete" : "white_concrete");
  }

  // Upper storey: window ribbon y 7..9 with spandrels at 6 and 10.
  g.set(x, 6, z, "white_concrete");
  g.set(x, 10, z, "white_concrete");
  for (let y = 7; y <= 9; y++) {
    if (pier) g.set(x, y, z, "light_gray_concrete");
    else g.set(x, y, z, "glass_pane", paneProps);
  }

  // Parapet and cornice.
  g.set(x, ROOF, z, "light_gray_concrete");
  g.set(x, PARAPET, z, "light_gray_concrete");
}

// Warm lights behind the glass, standing on the floor slabs in the air gap.
for (const [x, z] of cells) {
  const edge = !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
  if (edge) continue;
  if ((x + z) % 5 !== 0) continue;
  const gr = ground.get(`${x},${z}`);
  g.set(x, gr + 1, z, "glowstone");
  g.set(x, 7, z, "glowstone");
}

// Entrance: a double-height door on the street frontage, centred on the south face.
const gFront = ground.get(`9,${D - 1}`);
if (gFront !== undefined) {
  g.set(9, gFront + 1, D - 1, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(9, gFront + 2, D - 1, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// Roof plant: a small mechanical box in the middle of the roof.
for (let x = 5; x <= 8; x++) {
  for (let z = 5; z <= 8; z++) {
    if (!inF(x, z)) continue;
    g.set(x, ROOF + 1, z, "iron_block");
    g.set(x, ROOF + 2, z, "white_concrete");
  }
}

// Lanterns on the parapet corners for dusk readability.
for (const [x, z] of [[0, 0], [W - 1, 0], [0, D - 1], [W - 1, D - 1]]) {
  if (!inF(x, z)) continue;
  g.set(x, PARAPET + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

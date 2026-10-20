import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121685";
const W = 22, H = 23, D = 21;
const ROOF = 11;     // roof deck level, about 11 blocks above lowest ground
const PARAPET = 12;  // top of parapet cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.min(4, Math.max(0, gr)));
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const GLASS_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Exposed faces of a footprint cell: outward direction plus index along that face.
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ dir: "north", i: x });
  if (!has(x, z + 1)) f.push({ dir: "south", i: x });
  if (!has(x - 1, z)) f.push({ dir: "west", i: z });
  if (!has(x + 1, z)) f.push({ dir: "east", i: z });
  return f;
}

// Entrance: middle cell of the south (front, +z) face, falling back to any exposed face.
const southCells = [];
for (const [x, z] of ground.keys().toArray ? [] : []) {}
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!has(x, z + 1)) southCells.push(x);
}
southCells.sort((a, b) => a - b);
const entranceX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);

  if (faces.length === 0) {
    // Interior: solid core up to the roof deck, so nothing hangs.
    for (let y = 0; y < ROOF; y++) set(x, y, z, "light_gray_concrete");
    set(x, ROOF, z, "smooth_stone");
    // Rooftop plant on a sparse grid.
    if (x % 7 === 3 && z % 6 === 2) {
      set(x, PARAPET, z, "iron_block");
      set(x, PARAPET + 1, z, "iron_block");
    }
    continue;
  }

  // Foundation below the ground line.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const corner = faces.length >= 2;
  const f0 = faces[0];
  const i = f0.i;
  const isWindowCol = !corner && i % 3 === 1;
  const glassProps = (f0.dir === "north" || f0.dir === "south") ? GLASS_NS : GLASS_EW;

  for (let y = gr; y < ROOF; y++) {
    let id = "white_concrete";
    let props;

    if (y === gr) {
      id = "stone_bricks";                       // base course
    } else if (y <= 4) {
      // Ground storey: shopfront glazing.
      if (corner) id = "light_gray_concrete";
      else if (isWindowCol && y >= gr + 1 && y <= 3) { id = "glass_pane"; props = glassProps; }
      else id = "white_concrete";
    } else if (y === 5) {
      id = "smooth_stone";                       // storey line
    } else if (y <= 8) {
      // Upper storey window band.
      if (corner) id = "light_gray_concrete";
      else if (isWindowCol) {
        if (y === 7 && i % 9 === 4) { id = "shroomlight"; }   // warm lit window
        else { id = "glass_pane"; props = glassProps; }
      } else id = "white_concrete";
    } else if (y === 9) {
      id = isWindowCol ? "smooth_stone" : "white_concrete";   // lintel
    } else if (y === 10) {
      id = "smooth_stone";                       // cornice course
    }

    set(x, y, z, id, props);
  }

  // Parapet and cap on the roof edge.
  set(x, ROOF, z, "light_gray_concrete");
  set(x, PARAPET, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  // Entrance on the front face.
  if (entranceX !== null && x === entranceX && faces.some(f => f.dir === "south")) {
    const d = { facing: "south", hinge: "left", open: "false", powered: "false" };
    set(x, gr + 1, z, "dark_oak_door", { ...d, half: "lower" });
    set(x, gr + 2, z, "dark_oak_door", { ...d, half: "upper" });
    set(x, 4, z, "light_gray_concrete_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

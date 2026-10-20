import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535167423";
const W = 9, H = 38, D = 17;
const ROOF = 26;

// Each cell: [x, z, ground]
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 1, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Exposed faces of a footprint cell (neighbour outside the footprint)
function exposedFaces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Design: 1980s-90s Taipei mid-rise commercial block, five storeys.
// Ground storey is a glazed shopfront under a granite plinth; upper storeys
// are white tiled walls with a band of glass windows on odd columns, quartz
// floor bands at every storey line, a light spandrel under each window row,
// and a stone parapet with rooftop plant. Some windows are lit warm.

// 1) Foundations, body, floor bands, windows, and corners
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = exposedFaces(x, z);
  const ext = faces.length > 0;
  const corner = faces.length >= 2;
  const wallFace = faces[0];
  const t = wallFace === "N" || wallFace === "S" ? x : z;
  const isWindowCol = ext && !corner && t % 2 === 1;

  for (let y = 0; y < ROOF; y++) {
    // Foundation up to the cell's ground
    if (y < gr) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    const idx = Math.floor(y / 5); // storey index
    const r = y % 5;                // row within storey

    // Floor slab / storey line on every storey, interior included
    if (y > 0 && r === 0) {
      put(x, y, z, ext ? "smooth_quartz" : "smooth_stone");
      continue;
    }

    // Interior is an air gap behind the glass
    if (!ext) continue;

    // Granite base course at the first body row
    if (y === gr) {
      put(x, y, z, "polished_granite");
      continue;
    }

    // Corner piers run the full height
    if (corner) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // Spandrel row under each window band
    if (r === 4) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Ground storey: shopfront glazing
    if (idx === 0) {
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper storeys: window columns, with a warm lit pane now and then
    if (isWindowCol) {
      if (r === 2 && (t + idx) % 3 === 0) {
        put(x, y, z, "glowstone");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// 2) Roof deck, cornice slab and parapet
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ext = exposedFaces(x, z).length > 0;
  if (ext) {
    put(x, ROOF, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    put(x, ROOF + 1, z, "stone_bricks");
  } else {
    put(x, ROOF, z, "gray_concrete");
  }
}

// 3) Entrance on the south face (z = 16), centred on x = 4
const gd = ground.get("4,16");
if (gd !== undefined) {
  put(4, gd, 16, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(4, gd + 1, 16, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (gd + 2 < 5) put(4, gd + 2, 16, "light_blue_stained_glass");
}

// 4) Rooftop plant: water tank and a mechanical box
for (let x = 3; x <= 5; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF + 1, z, "light_gray_concrete");
    put(x, ROOF + 2, z, "light_gray_concrete");
    put(x, ROOF + 3, z, "light_gray_concrete");
    put(x, ROOF + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (let x = 6; x <= 7; x++) {
  for (let z = 2; z <= 3; z++) {
    if (!has(x, z)) continue;
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

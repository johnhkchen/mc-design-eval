import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034001";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Record: roof about 11 blocks above lowest ground, footprint 24 x 24.
// Read as a 1970s-80s Taipei low-rise commercial block: two storeys on a
// stone base, a shopfront ground floor with a light-grey lintel band, a
// second storey of glass-pane bays with gray concrete piers, a cornice,
// coping, a flat roof with a water tank.
const W = 24, H = 23, D = 24;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const inb = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;

// plain block write
const put = (x, y, z, id, props) => {
  if (!inb(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
// write only at or above this cell's ground
const up = (x, y, z, gr, id, props) => {
  if (y < gr) return;
  put(x, y, z, id, props);
};

const TANK = new Set();
for (let x = 10; x <= 13; x++) for (let z = 10; z <= 13; z++) if (has(x, z)) TANK.add(`${x},${z}`);

for (const [x, z, gr] of cells) {
  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const Wf = !has(x - 1, z);
  const E = !has(x + 1, z);
  const faces = [];
  if (N) faces.push("N");
  if (S) faces.push("S");
  if (Wf) faces.push("W");
  if (E) faces.push("E");
  const facade = faces.length > 0;
  const corner = faces.length >= 2;

  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // interior: floor slab at storey line y=5 and roof slab at y=10
  up(x, 5, z, gr, "light_gray_concrete");
  up(x, 10, z, gr, facade ? "gray_concrete" : "smooth_stone");

  if (!facade) {
    // roof water tank on the interior roof
    if (TANK.has(`${x},${z}`)) {
      for (let y = 11; y <= 13; y++) up(x, y, z, gr, "white_concrete");
      up(x, 14, z, gr, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
    continue;
  }

  // along-edge coordinate: x on N/S faces, z on E/W faces
  const horiz = N || S;
  const ab = horiz ? x : z;
  const pier = corner || ab % 3 === 0;
  const faceIdx = N ? 0 : S ? 1 : Wf ? 2 : 3;
  const lit = ((ab + faceIdx) % 4 === 0);
  const paneProps = horiz
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // entrance: south face, near x 11..12
  const isEntry = S && (x === 11 || x === 12) && gr <= 2;
  const canopy = S && x >= 10 && x <= 13;

  // ground storey: shopfront y gr..3
  for (let y = gr; y <= 3; y++) {
    if (pier) { up(x, y, z, gr, "gray_concrete"); continue; }
    if (isEntry && y === gr) { up(x, y, z, gr, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isEntry && y === gr + 1) { up(x, y, z, gr, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (canopy && y === 3) { up(x, y, z, gr, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    up(x, y, z, gr, "glass");
  }

  // band / lintel course at y=4
  up(x, 4, z, gr, "light_gray_concrete");

  // second storey y 6..9
  up(x, 6, z, gr, pier ? "gray_concrete" : "smooth_stone");
  if (pier) {
    for (let y = 7; y <= 8; y++) up(x, y, z, gr, "gray_concrete");
  } else {
    up(x, 7, z, gr, lit ? "shroomlight" : "glass_pane", lit ? undefined : paneProps);
    up(x, 8, z, gr, "glass_pane", paneProps);
  }
  up(x, 9, z, gr, pier ? "gray_concrete" : "light_gray_concrete");

  // cornice and coping
  up(x, 10, z, gr, "gray_concrete");
  up(x, 11, z, gr, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

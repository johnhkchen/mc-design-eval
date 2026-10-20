import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034031";
const W = 18, H = 23, D = 24;
// Two storeys of ~5 blocks: ground storey y g..4, storey line y5, upper storey y6..8,
// cornice y9, parapet y10 -> roof surface at y11, about 11 blocks above lowest ground.
const TOP = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  ground.set(`${x},${z}`, Math.min(4, Math.max(0, Math.round(gr))));
}

const inFp = (x, z) => ground.has(`${x},${z}`);
const faces = (x, z) => ({
  N: !inFp(x, z - 1),
  S: !inFp(x, z + 1),
  W: !inFp(x - 1, z),
  E: !inFp(x + 1, z),
});
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.N || f.S || f.W || f.E;
};
const onRoof = (x, z) => inFp(x, z) && !isEdge(x, z);

// Entrance: north-face cell closest to x = 8 (ties go west).
let entrance = null;
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (!faces(x, z).N) continue;
  if (!entrance) { entrance = [x, z]; continue; }
  const d = Math.abs(x - 8), de = Math.abs(entrance[0] - 8);
  if (d < de || (d === de && x < entrance[0])) entrance = [x, z];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

let winCount = 0;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const f = faces(x, z);

  // Interior: floor slab at storey line and roof deck; air elsewhere.
  if (!isEdge(x, z)) {
    put(x, 5, z, "smooth_stone");
    put(x, 9, z, "smooth_stone");
    continue;
  }

  // Facade (perimeter) cells.
  const ns = f.N || f.S;
  const corner = ns && (f.W || f.E);
  const t = ns ? x : z;
  const pier = corner || t % 3 === 0;
  const isEntrance = !!entrance && entrance[0] === x && entrance[1] === z;

  for (let y = gr; y <= TOP; y++) {
    let b;
    // Door on the entrance cell.
    if (isEntrance && gr <= 2 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (y === gr) b = "stone_bricks";                 // base course
    else if (y <= 3) b = pier ? "gray_concrete" : "glass"; // shopfront
    else if (y === 4) b = "light_gray_concrete";      // fascia / lintel band
    else if (y === 5) b = "smooth_quartz";            // storey line
    else if (y <= 8) {                                // upper storey
      if (pier) b = "white_concrete";
      else if (y === 6) b = "light_gray_concrete";    // sill
      else if (y === 7) b = "light_blue_stained_glass";
      else b = "light_gray_concrete";                 // head
    } else if (y === 9) b = "smooth_quartz";          // cornice
    else b = "white_concrete";                        // parapet

    put(x, y, z, b);
  }

  // Warm light behind every fourth upper-storey window.
  if (!pier) {
    winCount++;
    if (winCount % 4 === 1) {
      let ix = x, iz = z;
      if (ns) iz = f.N ? z + 1 : z - 1;
      else ix = f.W ? x + 1 : x - 1;
      if (inFp(ix, iz) && !isEdge(ix, iz)) put(ix, 7, iz, "glowstone");
    }
  }
}

// Hanging lantern just inside the entrance, under the fascia.
if (entrance) {
  const [ex, ez] = entrance;
  if (onRoof(ex, ez + 1)) put(ex, 4, ez + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant: two AC blocks with lanterns on top.
const units = [[4, 4], [12, 15]];
for (const [rx, rz] of units) {
  const cs = [[rx, rz], [rx + 1, rz], [rx, rz + 1], [rx + 1, rz + 1]];
  if (cs.every(([x, z]) => onRoof(x, z))) {
    for (const [x, z] of cs) put(x, 10, z, "iron_block");
    put(rx, 11, rz, "lantern", { hanging: "false", waterlogged: "false" });
    put(rx + 1, 11, rz + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Small stair/lift penthouse on the roof deck.
const ph = [[8, 12], [9, 12], [8, 13], [9, 13]];
if (ph.every(([x, z]) => onRoof(x, z))) {
  for (const [x, z] of ph) {
    put(x, 10, z, "light_gray_concrete");
    put(x, 11, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);

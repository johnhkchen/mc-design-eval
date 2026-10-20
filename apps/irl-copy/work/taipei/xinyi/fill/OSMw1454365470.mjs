import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1454365470";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 9, H = 23, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// Place a block inside the bounding box only
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const outwardOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const slabBottom = { type: "bottom", waterlogged: "false" };
const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

// Pick the door: edge cell on the north face, nearest the middle of the width
let doorKey = null;
let doorFacing = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    const out = outwardOf(x, z);
    if (out.length === 0) continue;
    const north = out.find((d) => d.name === "north");
    const pick = north ?? out[0];
    const score = Math.abs(x - (W - 1) / 2) + (north ? 0 : 100);
    if (score < best) {
      best = score;
      doorKey = `${x},${z}`;
      doorFacing = pick.name;
    }
  }
}

// Build each footprint column
for (const [x, z, gr] of cells) {
  const out = outwardOf(x, z);
  const edge = out.length > 0;
  const corner = out.length >= 2;
  const parityWindow = (x + z) % 2 === 1; // alternate pillar / window bays
  const isDoor = `${x},${z}` === doorKey;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey 1: shopfront (glass at gr+1..gr+3, lintel gr+4)
  if (edge) {
    if (isDoor) {
      put(x, gr + 1, z, "dark_oak_door", {
        facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 2, z, "dark_oak_door", {
        facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false",
      });
      put(x, gr + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // canopy lip
      put(x, gr + 4, z, "white_concrete");
    } else if (corner || !parityWindow) {
      for (let y = gr + 1; y <= gr + 4; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 1, z, "glass_pane", pane);
      put(x, gr + 2, z, "glass_pane", pane);
      put(x, gr + 3, z, "glass_pane", pane);
      put(x, gr + 4, z, "white_concrete");
    }
  }

  // Storey line between floors
  put(x, gr + 5, z, edge ? "gray_concrete" : "smooth_stone");

  // Storey 2: sills, glazing, lintels
  if (edge) {
    if (corner || !parityWindow) {
      for (let y = gr + 6; y <= gr + 9; y++) put(x, y, z, "white_concrete");
    } else {
      put(x, gr + 6, z, "smooth_stone");
      put(x, gr + 7, z, "glass_pane", pane);
      put(x, gr + 8, z, "glass_pane", pane);
      put(x, gr + 9, z, "white_concrete");

      // Warm light behind some upper windows (interior cell one step inward)
      if ((x + z) % 4 === 1 && out.length === 1) {
        const inX = x - out[0].dx;
        const inZ = z - out[0].dz;
        if (has(inX, inZ) && outwardOf(inX, inZ).length === 0) {
          put(inX, gr + 7, inZ, "glowstone");
        }
      }
    }
  }

  // Cornice and roof deck
  if (edge) {
    put(x, gr + 10, z, "smooth_stone_slab", slabBottom);
    put(x, gr + 11, z, "white_concrete"); // parapet
  } else {
    put(x, gr + 10, z, "smooth_stone"); // roof deck
  }
}

// Rooftop plant housing on the most central interior column
{
  let best = null;
  for (const [x, z, gr] of cells) {
    if (outwardOf(x, z).length > 0) continue;
    const score = Math.abs(x - 4) + Math.abs(z - 5);
    if (!best || score < best.score) best = { x, z, gr, score };
  }
  if (best) {
    put(best.x, best.gr + 11, best.z, "light_gray_concrete");
    put(best.x, best.gr + 12, best.z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);

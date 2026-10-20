import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397484";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Pick the entrance: boundary cell on the south face (outward +z) nearest x = 9
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!has(x, z + 1)) {
      const d = Math.abs(x - 9);
      if (d < best) { best = d; entrance = `${x},${z}`; }
    }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Interior floor slab at ground level and at the first-floor line
  put(x, gr, z, "smooth_stone");
  put(x, gr + 5, z, "smooth_stone");

  // Roof slab over the second floor (top of the enclosed volume)
  put(x, gr + 9, z, "light_gray_concrete");

  const E = !has(x + 1, z);
  const Wd = !has(x - 1, z);
  const N = !has(x, z - 1);
  const S = !has(x, z + 1);
  const boundary = E || Wd || N || S;

  if (!boundary) {
    // Interior: rooftop plant on a central block of the roof
    if (x >= 8 && x <= 10 && z >= 8 && z <= 10) {
      put(x, gr + 10, z, "light_gray_concrete");
    }
    continue;
  }

  // Primary face for the facade (order S, N, E, W)
  let face;
  if (S) face = "S";
  else if (N) face = "N";
  else if (E) face = "E";
  else face = "W";

  const alongX = face === "N" || face === "S";
  const i = alongX ? x : z;
  const isWindow = i % 3 !== 0;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  // Inward neighbour direction for glowstone behind glass
  const inward = { S: [0, -1], N: [0, 1], E: [-1, 0], W: [1, 0] }[face];
  const ix = x + inward[0], iz = z + inward[1];
  const inwardOpen = has(ix, iz);

  const isEntrance = `${x},${z}` === entrance && S;

  // r0: base course
  put(x, gr, z, "polished_andesite");

  // r1..r3: ground-floor shopfront
  if (isEntrance) {
    put(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "lantern", { hanging: "true" });
  } else {
    for (let r = 1; r <= 3; r++) {
      if (isWindow) put(x, gr + r, z, "glass_pane", paneProps);
      else put(x, gr + r, z, "white_concrete");
    }
  }

  // r4: shopfront lintel band
  put(x, gr + 4, z, "light_gray_concrete");

  // r5: floor line band
  put(x, gr + 5, z, "smooth_stone");

  // r6..r9: second floor
  put(x, gr + 6, z, "white_concrete");
  for (let r = 7; r <= 8; r++) {
    if (isWindow) put(x, gr + r, z, "glass_pane", paneProps);
    else put(x, gr + r, z, "white_concrete");
  }
  put(x, gr + 9, z, "white_concrete");

  // r10: parapet cap
  put(x, gr + 10, z, "smooth_stone");

  // Warm light behind some second-floor windows (inside the air gap)
  if (isWindow && inwardOpen && i % 4 === 2) {
    put(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

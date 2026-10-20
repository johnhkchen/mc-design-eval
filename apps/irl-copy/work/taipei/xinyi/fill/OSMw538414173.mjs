import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538414173";
const cells = JSON.parse(readFileSync(`${BASE}.cells.json`, "utf8"));

// 18 x 17 footprint, two-storey mid-century commercial block: white concrete frame,
// light-grey spandrel bands, glazed bays with piers, shopfront ground floor,
// flat roof with parapet and a small rooftop plant enclosure.
const W = 18, H = 23, D = 17;
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };

function outward(x, z) {
  for (const d of ["north", "south", "west", "east"]) {
    const [dx, dz] = DIRS[d];
    if (!has(x + dx, z + dz)) return d;
  }
  return null;
}

const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));

// Door: on the south face, nearest the middle of the frontage, low ground.
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z, gr] of cells) {
    if (outward(x, z) !== "south" || gr > 3) continue;
    const d = Math.abs(x - 8.5);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

const paneProps = (out) => {
  const alongX = out === "north" || out === "south";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
};

for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  const per = out !== null;

  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr >= 10) {
    // Ground too high for this building: just cap the column.
    put(x, gr, z, "smooth_stone");
    continue;
  }

  // Ground floor / plinth.
  put(x, gr, z, per ? "stone_bricks" : "smooth_stone");
  // Upper floor slab (interior) and roof slab across the whole footprint.
  if (gr < 5) put(x, 5, z, "smooth_stone");
  put(x, 10, z, "smooth_stone");

  if (!per) continue;

  const along = (out === "north" || out === "south") ? x - minX : z - minZ;
  const key = `${x},${z}`;

  // Walls from just above ground to the roof slab.
  for (let y = gr + 1; y <= 9; y++) {
    if (y === 4 || y === 5 || y === 9) {
      put(x, y, z, "light_gray_concrete");
      continue;
    }
    const isOpening = (y >= 1 && y <= 3) || (y >= 6 && y <= 8);
    if (!isOpening) {
      put(x, y, z, "white_concrete");
      continue;
    }
    // Door on the chosen south-face cell.
    if (key === doorKey && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: OPP[out],
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (along % 3 === 0) {
      put(x, y, z, "white_concrete"); // pier
    } else {
      put(x, y, z, "glass_pane", paneProps(out));
    }
  }

  // Parapet and cap.
  put(x, 11, z, "white_concrete");
  put(x, 12, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // Warm light behind selected glass.
  const [dx, dz] = DIRS[OPP[out]]; // inward offset
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz)) {
    const bay = Math.floor(along / 3);
    if (along % 3 === 2 && bay % 2 === 0) put(ix, 7, iz, "shroomlight");
    if (along % 3 === 2 && bay % 2 === 1 && gr < 2) put(ix, 2, iz, "glowstone");
  }
}

// Entrance light: hanging lantern just inside the door.
{
  const [dx0, dz0] = (() => { const c = doorKey.split(",").map(Number); return c; })();
  const [x, z] = [dx0, dz0];
  const gr = G.get(doorKey);
  if (gr <= 3 && has(x, z - 1)) put(x, 4, z - 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant enclosure in the middle of the roof.
for (const [x, z, gr] of cells) {
  if (gr > 10) continue;
  if (outward(x, z) !== null) continue;
  if (x >= 7 && x <= 10 && z >= 6 && z <= 9) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
  }
}

g.save(`${BASE}.nbt`);

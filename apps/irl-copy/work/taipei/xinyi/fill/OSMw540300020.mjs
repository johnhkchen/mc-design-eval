import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300020";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 26;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
}
const has = (x, z) => ground.has(`${x},${z}`);

// Roof surface sits 11 blocks above lowest ground.
// Storeys: ground floor r0..4, slab r5, upper storey r6..8, roof deck r9, parapet r10.
const TOP = minG + 11;

// Exposed face of a perimeter cell: outward normal and index along the face.
function face(x, z) {
  if (!has(x, z - 1)) return { n: [0, -1], i: x };
  if (!has(x, z + 1)) return { n: [0, 1], i: x };
  if (!has(x - 1, z)) return { n: [-1, 0], i: z };
  if (!has(x + 1, z)) return { n: [1, 0], i: z };
  return null;
}

// Pane connection props: glass runs along the face.
function paneProps(f) {
  const alongX = f.n[1] !== 0; // z-facing wall runs along x
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// Entrance: middle of the south-facing exposed cells.
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entI = southCells.length ? southCells[Math.floor(southCells.length / 2)] : -1;

const lights = [];

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = face(x, z);
  for (let k = gr; k < TOP; k++) {
    const r = k - minG;

    if (f === null) {
      // ---- Interior: air, with floor slab and roof deck, rooftop units
      if (r === 5 || r === 9) {
        g.set(x, k, z, "light_gray_concrete");
      } else if (r === 10 && gr <= minG + 9 && ((x * 7 + z * 3) % 11 === 0)) {
        g.set(x, k, z, "iron_block");
      }
      continue;
    }

    // ---- Perimeter facade
    const pier = f.i % 3 === 0;
    const isEntCell = f.n[1] === 1 && x === entI && z === cells.find(c => c[0] === x && !has(x, z + 1))?.[1];

    // Base course at the first wall block
    if (k === gr) {
      g.set(x, k, z, "smooth_stone");
      continue;
    }

    // Entrance door (two halves) and lintel canopy over the door
    if (f.n[1] === 1 && Math.abs(f.i - entI) <= 1 && r === 2) {
      g.set(x, k, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (f.n[1] === 1 && x === entI && (k === gr + 1 || k === gr + 2)) {
      // door lower half at gr+1, upper half at gr+2 is replaced by lintel above
      if (k === gr + 1) {
        g.set(x, k, z, "dark_oak_door", {
          facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
    }
    if (f.n[1] === 1 && x === entI && k === gr + 1) {
      continue;
    }
    if (f.n[1] === 1 && x === entI && k === gr) {
      g.set(x, k, z, "dark_oak_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (r >= 1 && r <= 3) {
      // Shopfront glass, piers between
      if (pier) g.set(x, k, z, "light_gray_concrete");
      else {
        g.set(x, k, z, "light_blue_stained_glass_pane", paneProps(f));
        if (r === 1 && f.i % 4 === 2) {
          const ix = x - f.n[0], iz = z - f.n[1];
          if (has(ix, iz)) lights.push(["lantern", ix, k, iz, { hanging: "false", waterlogged: "false" }]);
        }
      }
    } else if (r === 4 || r === 5 || r === 9) {
      g.set(x, k, z, "light_gray_concrete");
    } else if (r >= 6 && r <= 8) {
      // Upper storey: glass with white piers
      if (pier) g.set(x, k, z, "white_concrete");
      else {
        g.set(x, k, z, "light_blue_stained_glass_pane", paneProps(f));
        if (r === 6 && f.i % 6 === 1) {
          const ix = x - f.n[0], iz = z - f.n[1];
          if (has(ix, iz)) lights.push(["shroomlight", ix, k, iz, {}]);
        }
      }
    } else if (r === 10) {
      // Parapet
      g.set(x, k, z, "white_concrete");
    } else {
      g.set(x, k, z, "white_concrete");
    }
  }
}

// Warm lights behind glass, placed in the interior air gap
for (const [id, x, k, z, props] of lights) {
  g.set(x, k, z, id, props);
}

g.save(`${DIR}/${ID}.nbt`);

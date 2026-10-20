import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339888559";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 5, H = 19, D = 34;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const occ = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => occ.has(key(x, z));

// Row minimum x per z, used to find interior cells that sit behind the west facade
const minXAt = new Map();
for (const [x, z] of cells) {
  if (!minXAt.has(z) || x < minXAt.get(z)) minXAt.set(z, x);
}

const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Pick the street-door cell: middle of the west-facing column (not a pier)
const westCells = cells
  .filter(([x, z]) => !has(x - 1, z))
  .map(([x, z]) => z)
  .sort((a, b) => a - b);
let doorZ = westCells.length ? westCells[Math.floor(westCells.length / 2)] : null;
if (doorZ !== null && doorZ % 4 === 0) doorZ += 1;

for (const [xr, zr, gr] of cells) {
  const x = xr, z = zr;
  const G = Math.round(gr);
  const yb = (r) => G + r;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const wF = !has(x - 1, z);
  const eF = !has(x + 1, z);
  const nF = !has(x, z - 1);
  const sF = !has(x, z + 1);
  const edge = wF || eF || nF || sF;
  const ew = wF || eF;
  const along = ew ? z : x;
  const pier = along % 4 === 0;

  // Floor slabs and roof deck on every cell
  g.set(x, yb(0), z, edge ? "polished_andesite" : "smooth_stone");
  g.set(x, yb(3), z, "smooth_stone");
  g.set(x, yb(6), z, edge ? "smooth_stone" : "light_gray_concrete");

  if (!edge) {
    // Warm light just behind the west shopfront glass
    if (minXAt.get(z) === x - 1 && z % 6 === 3) {
      g.set(x, yb(2), z, "shroomlight");
    }
    continue;
  }

  const paneProps = ew ? PANE_EW : PANE_NS;

  // Shopfront (r1-r2), windows (r4), parapet band (r5)
  const isDoor = ew && wF && z === doorZ;
  if (isDoor) {
    g.set(x, yb(1), z, "dark_oak_door", {
      facing: "west", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, yb(2), z, "dark_oak_door", {
      facing: "west", half: "upper", hinge: "left", open: "false", powered: "false",
    });
  } else if (pier) {
    g.set(x, yb(1), z, "quartz_pillar", { axis: "y" });
    g.set(x, yb(2), z, "quartz_pillar", { axis: "y" });
  } else {
    g.set(x, yb(1), z, "glass_pane", paneProps);
    g.set(x, yb(2), z, "glass_pane", paneProps);
  }

  if (pier) {
    g.set(x, yb(4), z, "quartz_pillar", { axis: "y" });
  } else {
    g.set(x, yb(4), z, "glass_pane", paneProps);
  }

  g.set(x, yb(5), z, "white_concrete");
}

g.save(`${DIR}/${ID}.nbt`);

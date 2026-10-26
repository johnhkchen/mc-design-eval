// FR245184609: an Indifférencié block on the Île de la Cité's north bank of the cathedral precinct (lidar roof up to 23 above
// y 0, so five storeys at most). Limestone walls (calcite, Paris stone's pale cream), stone-brick base, smooth-stone storey
// bands, deep-slate roof behind a stone-brick parapet. Each footprint cell is one column of the envelope: perimeter cells are
// the wall (glass in the window rows, dark-oak doors on the ground floor), interior cells are air with a floor band under and
// a ceiling band over, so every storey stands on the one below. Some windows carry a hanging lantern in the room behind.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184609.cells.json", "utf8"));

const W = 27, D = 17, H = 39;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

// Lidar roof, smoothed by a 3x3 mean over the footprint, then quantised to whole storeys above the cell's own ground.
// Two passes: one 3x3 mean still leaves single-column spikes where a noisy lidar cell stands a storey above its neighbours.
const smooth = (src) => {
  const out = new Map();
  for (const [x, z] of cells) {
    let s = 0, n = 0;
    for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
      const v = src.get(key(x + dx, z + dz)); if (v !== undefined) { s += v; n++; }
    }
    out.set(key(x, z), s / n);
  }
  return out;
};
const lidar = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const mean = smooth(smooth(lidar));
const top = new Map();                                    // key -> roof y (the roof layer; walls run ground..top-1)
for (const [x, z, ground] of cells) {
  const storeys = Math.min(5, Math.max(1, Math.round((mean.get(key(x, z)) - ground) / 5)));
  top.set(key(x, z), { ground, roof: ground + 5 * storeys });
}

// Which sides of cell (x, z) at height y face the open air: a side with no footprint cell, or one whose roof is below y.
const open = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => {
  const n = top.get(key(x + dx, z + dz));
  return !n || y > n.roof;
}).map(([name]) => name);
const outside = (x, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !top.has(key(x + dx, z + dz))).map(([name]) => name);

const OPP = { north: "south", south: "north", west: "east", east: "west" };
const GLASS = (dir) => ({
  north: dir === "north" || dir === "south" ? "false" : "true",
  south: dir === "north" || dir === "south" ? "false" : "true",
  east: dir === "north" || dir === "south" ? "true" : "false",
  west: dir === "north" || dir === "south" ? "true" : "false",
  waterlogged: "false",
});

for (const [k, { ground: g0, roof }] of top) {
  const [x, z] = k.split(",").map(Number);

  // foundation under the cell's own ground (nothing under ground 0)
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  for (let y = g0; y < roof; y++) {
    const r = (y - g0) % 5;                               // 0 floor band, 1-3 window rows, 4 ceiling band
    const sides = open(x, z, y);
    const wall = sides.length > 0;

    if (r === 0) { g.set(x, y, z, y === g0 ? "stone_bricks" : "smooth_stone"); continue; }
    if (r === 4) { g.set(x, y, z, wall ? "calcite" : "smooth_stone"); continue; }
    if (!wall) continue;                                  // interior air

    // the wall face: the first open side in N, S, W, E order
    const dir = ["north", "south", "west", "east"].find((d) => sides.includes(d));
    const [dx, dz] = DIRS[dir];
    const u = dir === "north" || dir === "south" ? x : z; // position along the face
    const onStreet = outside(x, z).includes(dir);
    const storey = Math.floor((y - g0) / 5);

    // ground floor: a pair of dark-oak doors on the street face, two columns wide
    if (storey === 0 && onStreet && u % 8 === 5 && (r === 1 || r === 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: dir, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    // window bands: glass in pairs of columns with a calcite pier between them
    if (u % 4 === 1 || u % 4 === 2) {
      g.set(x, y, z, "glass_pane", GLASS(dir));
      // a warm lantern hangs in the room behind some windows
      const ix = x - dx, iz = z - dz;
      const inner = top.get(key(ix, iz));
      if (r === 3 && inner && u % 8 === 2 && !open(ix, iz, y).length) {
        g.set(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
    } else {
      g.set(x, y, z, "calcite");
    }
  }

  // deep-slate roof over every cell, parapet on the open edge
  g.set(x, roof, z, "deepslate_tiles");
  if (open(x, z, roof).length) g.set(x, roof + 1, z, "stone_brick_wall");
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184609.nbt");
console.log(JSON.stringify(stats));

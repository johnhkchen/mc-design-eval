import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001468.cells.json`, "utf8"));

const W = 9, H = 29, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFoot = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => inFoot.has(key(x, z));

// Per-cell ground and roof. Roof is quantized to 3-block tiers so the
// skyline reads as clean setbacks instead of lidar noise.
const info = new Map();
for (const [x, z, gr, r] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const rawRoof = Math.round(r);
  const tier = 3 * Math.round(rawRoof / 3);
  const roof = Math.min(H - 2, Math.max(ground + 9, tier));
  info.set(key(x, z), { gr: ground, R: roof });
}

// Exterior faces: [dx, dz, facing name]
const faces = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];

const glassProps = (dx) =>
  dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

// Pass 1: solid massing, foundation, ground floor base, storey lines, cornice band, parapet
for (const [x, z] of cells) {
  const { gr, R } = info.get(key(x, z));
  for (let y = 0; y < R; y++) {
    let id;
    if (y < gr) id = "stone_bricks";                                   // foundation
    else if (y < gr + 3) id = y === gr ? "stone_bricks" : "bricks";    // ground floor, plinth
    else if (y >= R - 2) id = y === R - 2 ? "stone_bricks" : "smooth_stone"; // cornice band and cap
    else id = (y - gr - 3) % 3 === 0 ? "smooth_stone" : "bricks";      // storey line
    g.set(x, y, z, id);
  }
}

// Entrance: a -z street-face cell on a pier bay, nearest to the middle
let doorCell = null;
for (const [x, z] of cells) {
  if (has(x, z - 1)) continue;
  if ([3, 4].includes(x % 4) || x === 4) {
    if (!doorCell || Math.abs(x - 4) < Math.abs(doorCell[0] - 4)) doorCell = [x, z];
  }
}

// Pass 2: window glass with air gaps behind, warm lights, and the door
for (const [x, z] of cells) {
  const { gr, R } = info.get(key(x, z));
  for (const [dx, dz] of faces) {
    if (has(x + dx, z + dz)) continue;
    const t = dx !== 0 ? z : x;
    const bay = [1, 2].includes(t % 4);
    const ix = x - dx, iz = z - dz;
    const interior =
      has(ix, iz) && has(ix + 1, iz) && has(ix - 1, iz) && has(ix, iz + 1) && has(ix, iz - 1);

    for (let y = gr; y < R - 2; y++) {
      const windowRow =
        (y > gr && y < gr + 3) || (y >= gr + 3 && (y - gr - 3) % 3 !== 0);
      if (!windowRow || !bay) continue;
      g.set(x, y, z, "glass_pane", glassProps(dx));
      if (interior) {
        const lit = (x * 7 + y * 3 + z * 5) % 5 === 0;
        g.set(ix, y, iz, lit ? "shroomlight" : "air");
      }
    }
  }
}

// Entrance: stone surround, door, and a dark canopy over it
if (doorCell) {
  const [dx0, dz0] = doorCell;
  const { gr } = info.get(key(dx0, dz0));
  // Stone surround on the ground-floor rows beside the door
  for (const xx of [dx0 - 1, dx0 + 1]) {
    if (!has(xx, dz0)) continue;
    for (const yy of [gr + 1, gr + 2]) g.set(xx, yy, dz0, "stone_bricks");
  }
  g.set(dx0, gr + 1, dz0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx0, gr + 2, dz0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Canopy: dark slabs across the bay above the door
  for (const xx of [dx0 - 1, dx0, dx0 + 1]) {
    if (!has(xx, dz0)) continue;
    g.set(xx, gr + 3, dz0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
  // Lantern under the canopy beside the door, on the wall
  if (has(dx0 + 1, dz0)) {
    g.set(dx0 + 1, gr + 2, dz0, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC3001468.nbt`);

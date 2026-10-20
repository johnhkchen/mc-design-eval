import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3426951";
const W = 15, H = 24, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.min(H - 6, Math.max(0, Math.round(gr)));
  const r = Math.round(rf);
  // Snap roof to two-block storeys, capped under the build limit.
  const top = Math.min(H - 2, Math.max(ground + 2, 2 * Math.round(r / 2)));
  map.set(key(x, z), { x, z, ground, top });
}

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
];
const exposedDirs = (x, z) => DIRS.filter((d) => !map.has(key(x + d.dx, z + d.dz)));

// Street entrance on the north (-z) face, near the middle of the frontage.
let doorCell = null;
{
  const northCells = [];
  for (const c of map.values()) {
    if (exposedDirs(c.x, c.z).some((d) => d.name === "north")) northCells.push(c);
  }
  if (northCells.length) {
    northCells.sort((a, b) => a.x - b.x);
    doorCell = northCells[Math.floor(northCells.length / 2)];
  }
}

const isPenthouse = (x, z) => x >= 5 && x <= 9 && z >= 6 && z <= 11;

// Facade reads by storey: plinth, storey belts, piers and glass with some lit offices.
function facadeBlock(t, y, ground) {
  const gb = ground - (ground % 2);
  const rel = y - gb;
  if (rel === 0) return "stone_bricks";
  if (rel % 2 === 0) return "smooth_stone";
  if (t % 3 === 0) return "stone_bricks";
  if ((t + y) % 7 === 0) return "glowstone";
  return "light_gray_stained_glass_pane";
}

for (const c of map.values()) {
  const { x, z, ground, top } = c;
  const exp = exposedDirs(x, z);
  const perimeter = exp.length > 0;
  const corner = exp.some((d) => d.dz !== 0) && exp.some((d) => d.dx !== 0);
  const hasZFace = exp.some((d) => d.dz !== 0);
  const t = hasZFace ? x : z;

  // Foundation.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Walls and storeys.
  for (let y = ground; y < top; y++) {
    let block;
    if (perimeter) {
      block = facadeBlock(t, y, ground);
      if (y === top - 1 && block !== "glowstone" && block !== "light_gray_stained_glass_pane") {
        block = "smooth_stone";
      }
    } else {
      block = y >= top - 1 ? "smooth_stone" : "bricks";
    }
    g.set(x, y, z, block);
  }

  // Parapet: slab coping on the perimeter; corners carry a stone pilaster one block higher.
  if (perimeter) {
    g.set(x, top, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    if (corner && top + 1 <= H - 1) g.set(x, top + 1, z, "stone_bricks");
  } else {
    g.set(x, top, z, "smooth_stone");
  }

  // Roof penthouse, only with headroom.
  if (isPenthouse(x, z) && top <= 20 && !perimeter) {
    const edge = x === 5 || x === 9 || z === 6 || z === 11;
    for (let y = top; y <= top + 1; y++) {
      g.set(x, y, z, edge ? "bricks" : "light_gray_stained_glass_pane");
    }
    g.set(x, top + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance: a recessed-looking door with a stone lintel and warm lanterns on either side.
if (doorCell) {
  const { x, z, ground, top } = doorCell;
  const props = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  g.set(x, ground, z, "dark_oak_door", props("lower"));
  if (ground + 1 < top) g.set(x, ground + 1, z, "dark_oak_door", props("upper"));
  // Stone lintel over the door in the storey belt.
  if (ground + 2 < top) g.set(x, ground + 2, z, "stone_bricks");
  // Stone piers flanking the door, with shroomlight lights in the shopfront.
  for (const dx of [-1, 1]) {
    const n = map.get(key(x + dx, z));
    if (n) {
      g.set(n.x, ground, n.z, "stone_bricks");
      g.set(n.x, ground + 1, n.z, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

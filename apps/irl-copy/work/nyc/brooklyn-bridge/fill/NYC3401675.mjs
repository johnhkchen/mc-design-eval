import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3401675.cells.json`, "utf8"));

const W = 27, H = 39, D = 35;
const g = new Voxels([W, H, D]);

// ---- footprint bookkeeping ----
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  const r = Math.round(roof);
  // Quantise lidar roof into whole storeys (2 blocks each), clamp to build height.
  const storeys = Math.max(2, Math.round((r - ground) / 2));
  const top = Math.min(ground + 2 * storeys, 37);
  map.set(key(x, z), { x, z, gr: ground, top });
}
const has = (x, z) => map.has(key(x, z));
const perim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

const inRange = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (inRange(x, y, z)) g.set(x, y, z, id, props);
};

// ---- entrance: lowest-z edge, nearest the middle of that edge ----
let minZ = Infinity;
for (const c of map.values()) minZ = Math.min(minZ, c.z);
const edgeCells = [...map.values()].filter((c) => c.z === minZ);
const midX = edgeCells.reduce((s, c) => s + c.x, 0) / edgeCells.length;
const doorCell = [...edgeCells].sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX))[0];

// ---- build each footprint cell ----
for (const { x, z, gr, top } of map.values()) {
  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const isPerim = perim(x, z);
  const isCorner = corner(x, z);

  if (isPerim) {
    for (let y = gr; y < top; y++) {
      const off = y - gr;
      let id = "brick";
      if (y === top - 1) {
        id = "stone_bricks"; // cornice / parapet
      } else if (off === 0) {
        id = "polished_granite"; // base course
      } else if (off % 2 === 0) {
        // storey line: light concrete spandrel, with a pier cap every third column
        id = (x + z) % 3 === 1 ? "white_concrete" : "light_gray_concrete";
      } else {
        // window row
        const glassCol = !isCorner && (x + z) % 3 === 1;
        const shopfront = off === 1 && !isCorner && (x + z) % 3 !== 0;
        if (glassCol || shopfront) {
          id = (x * 2 + z) % 4 === 0 ? "gray_stained_glass" : "light_blue_stained_glass";
        } else {
          id = "brick";
        }
      }
      put(x, y, z, id);
    }

    // Warm lights set in some lit windows, placed one block inside behind the glass.
    for (let off = 1; off < top - gr - 1; off += 2) {
      const y = gr + off;
      if (!((x + z) % 3 === 1 && !isCorner)) continue;
      if (((x * 7 + y * 3) % 13) !== 0) continue;
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, nz = z + dz;
        if (has(nx, nz) && !perim(nx, nz)) {
          put(nx, y, nz, "glowstone");
          break;
        }
      }
    }
  } else {
    // Interior: only floor slabs per storey and the roof slab, air gaps between.
    for (let y = gr; y < top; y++) {
      const off = y - gr;
      if (y === top - 1) put(x, y, z, "stone");
      else if (off % 2 === 0) put(x, y, z, "smooth_stone");
    }
  }

  // Grouped roof plant: 2x2 clusters on a sparse grid, only on interior roof cells.
  if (!isPerim && (Math.floor(x / 3) + Math.floor(z / 3)) % 4 === 0 && (x % 3) !== 2 && (z % 3) !== 2) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
  }
}

// ---- entrance door, flanked by a lit vestibule ----
if (doorCell) {
  const { x, z, gr } = doorCell;
  put(x, gr, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(x, gr + 1, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Lantern on the inside floor of the vestibule, and a lit light just above the door.
  put(x, gr + 1, z + 1, "lantern", { hanging: "false", waterlogged: "false" });
  put(x, gr + 2, z + 1, "glowstone");
}

g.save(`${DIR}/NYC3401675.nbt`);

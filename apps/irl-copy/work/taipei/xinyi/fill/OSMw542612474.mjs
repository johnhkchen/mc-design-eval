import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612474";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 23, D = 29;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup: "x,z" -> ground height
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const is = (x, z) => gmap.has(`${x},${z}`);
const isEdge = (x, z) => !is(x - 1, z) || !is(x + 1, z) || !is(x, z - 1) || !is(x, z + 1);

const minG = Math.min(...cells.map((c) => c[2]));
const minZ = Math.min(...cells.map((c) => c[1]));
// Flat roof about 11 blocks above lowest ground; top of parapet exclusive
const T = Math.min(minG + 11, H - 2);

// Two-storey low-rise commercial/civic block: grey plinth, white tiled body,
// light-grey bands, glazed shopfront, upper-floor ribbon windows, flat roof.
for (const [x, z, gr] of cells) {
  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  const f2 = Math.max(minG + 5, gr + 4); // second-floor line

  if (edge) {
    const alongX = !is(x, z - 1) || !is(x, z + 1);
    const u = alongX ? x : z;
    const pane = alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = gr; y <= T - 1; y++) {
      if (y === gr) {
        put(x, y, z, "polished_andesite");
      } else if (y === T - 1 || y === T - 2) {
        put(x, y, z, "light_gray_concrete"); // parapet cap and cornice
      } else if (y === f2 && f2 < T - 2) {
        put(x, y, z, "light_gray_concrete"); // floor band
      } else if (y < f2) {
        // Ground floor: shopfront glazing between piers
        if (u % 4 === 0) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass_pane", pane);
      } else {
        // Upper floor
        if (u % 4 === 0 || y === T - 3) {
          put(x, y, z, "white_concrete");
        } else if (y <= T - 4) {
          if ((u + y) % 9 === 0) put(x, y, z, "glowstone"); // warm lit room
          else put(x, y, z, "glass_pane", pane);
        } else {
          put(x, y, z, "white_concrete");
        }
      }
    }
  } else {
    // Interior: no interiors, just floor slabs
    if (gr < T - 1) {
      put(x, gr, z, "smooth_stone");
      if (f2 < T - 2 && f2 > gr) put(x, f2, z, "smooth_stone");
      put(x, T - 1, z, "smooth_stone"); // roof surface
    }
  }
}

// Rooftop plant: small light-grey service blocks on some interior roof cells
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x % 9 !== 4 || z % 9 !== 4) continue;
  if (gr >= T - 1 || T + 1 >= H) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block.every(([bx, bz]) => is(bx, bz) && !isEdge(bx, bz))) continue;
  for (const [bx, bz] of block) {
    put(bx, T, bz, "light_gray_concrete");
    put(bx, T + 1, bz, "light_gray_concrete");
  }
}

// Entrance on the minZ front: two-leaf glass-and-oak door under lit lanterns
const doorRow = minZ;
const g14 = gmap.get(`14,${doorRow}`);
const g15 = gmap.get(`15,${doorRow}`);
if (g14 !== undefined && g15 !== undefined) {
  const base = Math.min(g14, g15);
  const doorProps = (half, hinge) => ({
    facing: "north", half, hinge, open: "false", powered: "false",
  });
  put(14, g14 + 1, doorRow, "oak_door", doorProps("lower", "left"));
  put(14, g14 + 2, doorRow, "oak_door", doorProps("upper", "left"));
  put(15, g15 + 1, doorRow, "oak_door", doorProps("lower", "right"));
  put(15, g15 + 2, doorRow, "oak_door", doorProps("upper", "right"));
  if (is(13, doorRow)) {
    put(13, (gmap.get(`13,${doorRow}`)) + 3, doorRow, "lantern", { hanging: "true", waterlogged: "false" });
  }
  if (is(16, doorRow)) {
    put(16, (gmap.get(`16,${doorRow}`)) + 3, doorRow, "lantern", { hanging: "true", waterlogged: "false" });
  }
  void base;
}

g.save(`${DIR}/${ID}.nbt`);

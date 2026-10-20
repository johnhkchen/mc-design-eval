import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1024335985";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 25, H = 23, D = 7;
const g = new Voxels([W, H, D]);

// Footprint lookup: cell -> ground level (clamped so the roof (ground + 11) stays inside the world)
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(11, Math.round(gr))));
}
const has = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

// Exterior faces. Front = street side (z = 0), back = z = 6, ends = x = 0 / x = 24.
const faces = (x, z) => ({
  front: !has(x, z - 1),
  back: !has(x, z + 1),
  west: !has(x - 1, z),
  east: !has(x + 1, z),
});
const perimeterOf = (x, z) => {
  const f = faces(x, z);
  return f.front || f.back || f.west || f.east;
};
const cornerOf = (x, z) => {
  const f = faces(x, z);
  return (f.front || f.back) && (f.west || f.east);
};

const GLASS = "cyan_stained_glass_pane";
const WALL = "smooth_quartz";
const BASE = "stone_bricks";
const LIGHT = "glowstone";

for (const [x, z, gr] of cells) {
  const b = gnd(x, z);
  const f = faces(x, z);
  const perim = perimeterOf(x, z);
  const corner = cornerOf(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < b; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior cell: floor slabs, air between, deck and roof plant
    g.set(x, b, z, "smooth_stone");
    g.set(x, b + 5, z, "smooth_stone");
    g.set(x, b + 10, z, "gray_concrete");
    if (x >= 8 && x <= 10 && z >= 2 && z <= 4) {
      g.set(x, b + 11, z, "light_gray_concrete");
    }
    continue;
  }

  // Perimeter cell: the wall ring
  for (let rel = 0; rel <= 11; rel++) {
    const y = b + rel;
    let id = null;
    let props = null;

    if (rel === 0) {
      id = BASE;
    } else if (rel === 5) {
      id = WALL; // storey line
    } else if (rel === 10) {
      id = "stone_brick_slab";
      props = { type: "bottom", waterlogged: "false" }; // cornice band
    } else if (rel === 11) {
      id = WALL; // parapet
    } else {
      // Window bands: rel 1..4 (ground storey, shopfront) and rel 6..9 (upper storey)
      if (corner) {
        id = WALL;
      } else if (f.front || f.back) {
        const xi = x;
        if (xi % 4 === 0) {
          id = WALL; // structural pier
        } else if (f.front && xi === 12 && (rel === 1 || rel === 2)) {
          id = "dark_oak_door";
          props = {
            facing: "north",
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        } else {
          id = GLASS;
          props = { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" };
        }
      } else {
        // west / east ends
        const zi = z;
        if (zi % 2 === 0) {
          id = WALL;
        } else {
          id = GLASS;
          props = { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" };
        }
      }
    }

    if (id === null) continue;
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }

  // Parapet cap and cornice sit on the perimeter; the roof deck (rel 10) spans every cell
  g.set(x, b + 10, z, props10(x, z, b));
}

// Roof deck under the cornice for interior cells already handled; the perimeter deck is the cornice above.
function props10(x, z, b) {
  return "stone_brick_slab";
}

// Interior warm lights: glowstone set in the air gap just inside selected windows (rel 2 and 7).
for (const [x, z] of [...G.keys()].map((k) => k.split(",").map(Number))) {
  if (!perimeterOf(x, z)) continue;
  const b = gnd(x, z);
  const f = faces(x, z);
  if (cornerOf(x, z)) continue;

  let ix = x, iz = z;
  if (f.front) iz = z + 1;
  else if (f.back) iz = z - 1;
  else if (f.west) ix = x + 1;
  else if (f.east) ix = x - 1;

  if (!has(ix, iz) || perimeterOf(ix, iz)) continue;
  const lit = (f.front || f.back) ? x % 4 === 2 : z % 4 === 1;
  if (!lit) continue;

  for (const rel of [2, 7]) {
    const y = b + rel;
    if (y < H) g.set(ix, y, iz, LIGHT);
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei shophouse, two storeys over a shopfront, flat roof with parapet
// and rooftop water tank. White tile walls, red fascia over the street frontage,
// glass shopfronts, warm lights behind glass. Storey lines at local k = 0..7.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1341337623";
const W = 12, D = 19, H = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(key(x, z));

// Outward faces of a cell (neighbour missing from footprint).
const DIRS = [
  { dx: 0, dz: 1, name: "S" },
  { dx: 0, dz: -1, name: "N" },
  { dx: 1, dz: 0, name: "E" },
  { dx: -1, dz: 0, name: "W" },
];
const outsOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const DOOR_X = 5;      // entrance on the south (street) face
const FRONT_Z = D - 1; // z = 18

for (const [x0, z0] of cells) {
  const x = x0, z = z0;
  const gr = ground.get(key(x, z));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const outs = outsOf(x, z);
  const perim = outs.length > 0;
  const onStreet = outs.some((o) => o.name === "S");
  const primary = outs.find((o) => o.name === "S") ?? outs[0];
  const idx = primary ? (primary.dz !== 0 ? x : z) : 0;
  const pier = outs.length > 1 || idx % 3 === 0;
  const isDoor = onStreet && x === DOOR_X && z === FRONT_Z;

  // Inner neighbour (for lanterns and glowing shop lights).
  const inner = primary ? { x: x - primary.dx, z: z - primary.dz } : null;
  const innerIsInterior =
    inner && has(inner.x, inner.z) && outsOf(inner.x, inner.z).length === 0;

  const paneProps = (face) =>
    face.dz !== 0
      ? { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" }
      : { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" };

  // k0: plinth on the perimeter, floor slab across the footprint.
  g.set(x, gr + 0, z, perim ? "stone_bricks" : "stone_bricks");

  // k1-k2: ground floor shopfront.
  if (perim) {
    if (isDoor) {
      g.set(x, gr + 1, z, "oak_door", {
        facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 2, z, "oak_door", {
        facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
      });
    } else if (pier) {
      g.set(x, gr + 1, z, "white_concrete");
      g.set(x, gr + 2, z, "white_concrete");
    } else {
      g.set(x, gr + 1, z, "glass_pane", paneProps(primary));
      g.set(x, gr + 2, z, "glass_pane", paneProps(primary));
      // Warm shop light just inside the glass on some bays.
      if (innerIsInterior && idx % 6 === 1) {
        g.set(inner.x, gr + 1, inner.z, "glowstone");
      }
    }
  }

  // k3: floor slab between storeys; red fascia band on the street face.
  if (perim) {
    g.set(x, gr + 3, z, onStreet ? "red_concrete" : "light_gray_concrete");
  } else {
    g.set(x, gr + 3, z, "smooth_stone");
  }

  // k4-k5: upper storey windows with white piers.
  if (perim) {
    for (const k of [4, 5]) {
      if (pier) g.set(x, gr + k, z, "white_concrete");
      else g.set(x, gr + k, z, "glass_pane", paneProps(primary));
    }
    // Lantern in some upper rooms, behind the glass.
    if (!pier && innerIsInterior && (idx + 2 * (primary.dz !== 0 ? z : x)) % 5 === 0) {
      g.set(inner.x, gr + 4, inner.z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }

  // k6: roof deck; cornice on the perimeter.
  g.set(x, gr + 6, z, perim ? "light_gray_concrete" : "smooth_stone");

  // k7: parapet on the perimeter; rooftop equipment inside.
  if (perim) {
    g.set(x, gr + 7, z, "white_concrete");
  } else if (x === 2 && z === 3) {
    g.set(x, gr + 7, z, "barrel", { facing: "up", open: "false" });
  } else if (x === 8 && z === 9) {
    g.set(x, gr + 7, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

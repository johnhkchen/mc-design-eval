import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3326009";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 19, D = 8;
const g = new Voxels([W, H, D]);

// 1831 Brooklyn Heights rowhouse: brick body, stone plinth, stone string courses,
// stone cornice and parapet, dark wood door, punched glass windows.
const PLINTH = "stone_bricks";
const WALL = "bricks";
const STRING = "smooth_stone";
const FLOOR = "spruce_planks";
const ROOF = "stone_bricks";
const CORNICE = "stone_brick_slab";
const PARAPET = "stone_brick_wall";
const GLASS = "glass_pane";
const LAMP = "lantern";

const pane = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

const byKey = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, Math.round(c[2]));
  const roof = Math.max(gr + 4, Math.round(c[3]));
  byKey.set(`${x},${z}`, { gr, roof });
}

const isPerim = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;

// Pass 1: solid masonry shell (plinth, brick walls, cornice, parapet), per cell.
for (const [key, { gr, roof }] of byKey) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);

  for (let y = 0; y < gr; y++) g.set(x, y, z, PLINTH);

  const cornY = roof - 1;   // cornice slab row (top surface = roof)
  const parY = roof;        // parapet on the perimeter only

  if (perim) {
    for (let y = gr; y < cornY; y++) {
      const stringRow = y > gr && (y - gr) % 2 === 0;
      g.set(x, y, z, stringRow ? STRING : WALL);
    }
    g.set(x, cornY, z, CORNICE, { type: "bottom", waterlogged: "false" });
    g.set(x, parY, z, PARAPET, { up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false" });
  } else {
    // Interior: full-width roof slab, storey floors, air between (no interiors).
    for (let y = gr; y < cornY; y++) {
      if ((y - gr) % 2 === 0) g.set(x, y, z, FLOOR);
    }
    g.set(x, cornY, z, ROOF);
  }
}

// Pass 2: windows on exterior faces, with warm lights behind some panes.
for (const [key, { gr, roof }] of byKey) {
  const [x, z] = key.split(",").map(Number);
  if (!isPerim(x, z)) continue;
  const onFront = z === 0 || z === D - 1;
  const onSide = x === 0 || x === W - 1;
  if (onFront && onSide) continue; // corners stay solid pilasters

  const winHere = onFront ? (x >= 1 && x <= W - 2) : (z >= 2 && z <= D - 3);
  if (!winHere) continue;

  const bx = onSide ? (x === 0 ? 1 : W - 2) : x;
  const bz = onFront ? (z === 0 ? 1 : D - 2) : z;

  for (let k = 0; ; k++) {
    const wy = gr + 2 * k + 1;
    if (wy > roof - 3) break;
    if (z === 0 && x === 2 && k === 0) continue; // entrance bay

    g.set(x, wy, z, GLASS, pane);

    const lit =
      (z === 0 && (x === 1 || x === 4) && k === 1) ||
      (z === D - 1 && x === 3 && k === 2) ||
      (onSide && z === 3 && k === 1);
    if (lit) g.set(bx, wy, bz, LAMP, { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: entrance on the street front, centred in the bay, with a hood and lantern.
{
  const c = byKey.get("2,0");
  if (c) {
    const gr = c.gr;
    g.set(2, gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(2, gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Small stone hood over the door at the string-course row above it.
    g.set(2, gr + 2, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(1, gr + 2, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    g.set(3, gr + 2, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

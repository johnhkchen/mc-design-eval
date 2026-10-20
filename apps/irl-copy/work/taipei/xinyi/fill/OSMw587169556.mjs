import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169556";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 6 x 18 footprint, roof about 21 blocks above lowest ground: a four-storey
// reinforced-concrete shophouse with tiled (white terracotta) facades, a
// shopfront on the street (east, x = 5) and plain party walls on the other sides.
const W = 6, H = 33, D = 18;
const vox = new Voxels([W, H, D]);

const STOREY_LINES = [0, 5, 10, 15, 20]; // floor slabs (r = relative to cell ground)
const ROOF = 20;
const PARAPET = 21;

function put(x, y, z, id, props) {
  if (y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
}

const isFront = (x) => x === 5;
const isEdge = (x, z) => x === 0 || x === 5 || z === 0 || z === 17;

for (const [x, z, gz] of cells) {
  const base = gz;
  const Y = (r) => base + r;
  const edge = isEdge(x, z);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < base; y++) put(x, y, z, "stone");

  // Floor slabs, roof slab, base course.
  for (const r of STOREY_LINES) {
    let id = "light_gray_concrete";
    if (r === 0) id = "stone_bricks";
    else if (r === ROOF) id = "light_gray_concrete";
    put(x, Y(r), z, id);
  }

  // Walls on the footprint edge, rows 1..19 excluding slab rows.
  if (edge) {
    for (let r = 1; r <= 19; r++) {
      if (STOREY_LINES.includes(r)) continue;
      put(x, Y(r), z, "white_terracotta");
    }
    // Parapet / cornice on the roof edge.
    put(x, Y(PARAPET), z, "white_terracotta");
  }

  // Front (street) facade: shopfront and window grid.
  if (edge && isFront(x)) {
    const bay = z >= 1 && z <= 16;
    const mullion = z % 3 === 0;

    for (let r = 1; r <= 19; r++) {
      if (STOREY_LINES.includes(r) && r !== 0) {
        // storey string courses: light gray band
        if (bay) put(x, Y(r), z, "light_gray_concrete");
        continue;
      }
      if (!bay) continue;

      if (r <= 4) {
        // Ground floor shopfront.
        if (r === 4) {
          put(x, Y(r), z, "red_terracotta"); // shop sign band
        } else if (z === 8 && r <= 2) {
          const half = r === 1 ? "lower" : "upper";
          put(x, Y(r), z, "oak_door", {
            facing: "east", half, hinge: "left", open: "false", powered: "false",
          });
        } else if (mullion) {
          put(x, Y(r), z, "dark_oak_planks");
        } else {
          put(x, Y(r), z, "glass");
        }
      } else {
        // Upper storeys: frames at head/sill, glass between, pilasters at mullions.
        const frameRows = [6, 9, 11, 14, 16, 19];
        if (mullion || frameRows.includes(r)) {
          put(x, Y(r), z, "white_terracotta");
        } else {
          put(x, Y(r), z, "glass");
        }
      }
    }

    // Warm light behind glass (interior air cell at x = 4).
    if (bay) {
      if (z % 6 === 1) {
        put(4, Y(7), z, "shroomlight");
        put(4, Y(17), z, "shroomlight");
      }
      if (z % 6 === 4) {
        put(4, Y(12), z, "shroomlight");
      }
    }
  }

  // Simple plant box on the roof, away from the street.
  if (x >= 2 && x <= 3 && z >= 5 && z <= 6) {
    put(x, Y(PARAPET), z, "gray_concrete");
    if (x === 2 && z === 5) put(x, Y(PARAPET + 1), z, "iron_bars");
  }
}

vox.save(`${DIR}/${ID}.nbt`);

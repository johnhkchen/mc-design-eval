import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no record. Footprint 11 x 12, roof about 11 blocks above lowest ground.
// Read as a two-storey mid-century commercial block of the Xinyi type: stone-banded
// white concrete walls, glass shopfront at grade, a hard parapet with coping.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300017";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8")); // [x, z, ground]
const W = 11, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, b] of cells) ground.set(`${x},${z}`, b);
const has = (x, z) => ground.has(`${x},${z}`);
const L0 = Math.min(...cells.map((c) => c[2]));
const R = L0 + 9; // flat roof slab; parapet + coping bring the top to L0 + 11

const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Entrance: the cell on the highest-z (south) edge nearest the middle of the width.
const zMax = Math.max(...cells.map((c) => c[1]));
const doorCands = cells.filter(([x, z]) => z === zMax && perim(x, z));
doorCands.sort((a, b) => Math.abs(a[0] - 5) - Math.abs(b[0] - 5));
const [dx, dz] = doorCands[0] ?? [5, zMax];

// Mullions: on east/west faces (no x-neighbour) split by z parity; elsewhere by x parity.
const mullion = (x, z) => (!has(x - 1, z) || !has(x + 1, z)) ? (z % 2 === 0) : (x % 2 === 0);

function kindAt(x, z, y) {
  if (!has(x, z) || !perim(x, z)) return null;
  const B = ground.get(`${x},${z}`);
  if (B >= R - 2) return null;            // too close to roof: solid stone only
  if (y < B || y >= R) return null;
  const r = (y - B) % 5;
  if (r === 0) return "band";              // storey string course
  if (r === 4) return "spandrel";          // spandrel below next floor
  if (x === dx && z === dz && (y === B + 1 || y === B + 2)) return "door";
  if (mullion(x, z)) return "frame";
  return "glass";
}

const paneProps = (x, z, y) => {
  const c = (nx, nz) => (kindAt(nx, nz, y) === "glass" ? "true" : "false");
  return {
    north: c(x, z - 1), south: c(x, z + 1), east: c(x + 1, z), west: c(x - 1, z),
    waterlogged: "false",
  };
};

// Pass 1: structure, foundations, floors, roof.
for (const [x, z, B] of cells) {
  const top = B >= R - 2;
  const isP = perim(x, z);

  // Foundation (plinth) up to the floor, or solid to the roof for cells buried near the top.
  for (let y = 0; y < (top ? R : B); y++) g.set(x, y, z, "stone_bricks");

  if (!top) {
    // Floor slabs at every storey line across the footprint; quartz string course on the edge.
    for (let fb = B; fb < R; fb += 5) {
      if (isP) g.set(x, fb, z, "quartz_block");
      else g.set(x, fb, z, "smooth_stone");
    }
    // Walls on the perimeter.
    if (isP) {
      for (let y = B + 1; y < R; y++) {
        const k = kindAt(x, z, y);
        if (k === "band") g.set(x, y, z, "quartz_block");
        else if (k === "spandrel" || k === "frame") g.set(x, y, z, "white_concrete");
        else if (k === "door") {
          g.set(x, y, z, "dark_oak_door", {
            facing: "south",
            half: y === B + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (k === "glass") {
          g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(x, z, y));
        }
      }
    }
  }

  // Roof slab over everything.
  g.set(x, R, z, "smooth_stone");

  // Parapet and coping on the perimeter.
  if (isP) {
    g.set(x, R + 1, z, "white_concrete");
    g.set(x, R + 2, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 2: warm light behind some shopfront/office glass (glowstone in the interior air gap).
for (const [x, z, B] of cells) {
  if (!perim(x, z) || B >= R - 2) continue;
  for (let fb = B; fb < R; fb += 5) {
    const y = fb + 2;
    if (y >= R || y < B) continue;
    if (kindAt(x, z, y) !== "glass") continue;
    if ((x + z) % 3 !== 0) continue;
    const inward = [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]]
      .find(([nx, nz]) => has(nx, nz) && !perim(nx, nz));
    if (inward) g.set(inward[0], y, inward[1], "glowstone");
  }
}

// Rooftop plant: a small concrete housing on the centre of the roof, and a lantern-lit door hood
// is omitted to keep the entrance clear.
for (let x = 4; x <= 6; x++) {
  for (let z = 4; z <= 7; z++) {
    if (has(x, z) && !perim(x, z)) g.set(x, R + 1, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

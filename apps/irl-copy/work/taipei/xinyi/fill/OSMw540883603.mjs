import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540883603";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Record: 7 x 16 footprint, roof about 11 blocks above lowest ground.
// Read as a two-storey, flat-roofed 1970s-80s Taipei shophouse block:
// stone-base concrete frame, cream quartz-tile cladding, ground-floor shopfront,
// upper-floor window bands, a chiseled cornice, and a low parapet.
const W = 7, H = 23, D = 16;
const ROOF = 11;     // parapet top, absolute
const DECK = 10;     // roof deck / top of walls
const FLOOR2 = 5;    // second-floor line
const CORNICE = 9;   // cornice band
const UPPER_LO = 6, UPPER_HI = 8;

const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));

const inSet = (x, z) => ground.has(key(x, z));

const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minZ = Math.min(...zs);
const maxX = Math.max(...xs);
const maxZ = Math.max(...zs);

// Front = street side at the minimum-z edge; door at the median front cell.
const frontXs = cells.filter((c) => c[1] === minZ).map((c) => c[0]).sort((a, b) => a - b);
const doorX = frontXs[Math.floor(frontXs.length / 2)];

function faces(x, z) {
  return {
    N: !inSet(x, z - 1),
    S: !inSet(x, z + 1),
    W: !inSet(x - 1, z),
    E: !inSet(x + 1, z),
  };
}

// Window rhythm: piers at every third bay, window bays between.
const isWin = (idx, hi) => idx > 0 && idx < hi && idx % 3 !== 0;

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Foundation and body
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const f = faces(x, z);
  const perim = f.N || f.S || f.W || f.E;
  const onFront = f.N && z === minZ;
  // Walls along x (N/S faces) read windows by x index; E/W faces by z index.
  const alongX = f.N || f.S;
  const idx = alongX ? x : z;
  const hi = alongX ? maxX : maxZ;
  const win = isWin(idx, hi);
  const pane = alongX ? paneX : paneZ;

  for (let y = gr; y <= DECK; y++) {
    if (perim) {
      if (y === gr) {
        g.set(x, y, z, "polished_andesite");
      } else if (y < FLOOR2) {
        // Ground storey
        if (onFront) {
          if (y <= gr + 2) {
            if (x === doorX) {
              g.set(x, y, z, "oak_door", {
                facing: "north",
                half: y === gr + 1 ? "lower" : "upper",
                hinge: "left",
                open: "false",
                powered: "false",
              });
            } else if (x % 3 === 0 || x === 0 || x === maxX) {
              g.set(x, y, z, "smooth_quartz");
            } else {
              g.set(x, y, z, "glass");
            }
          } else {
            g.set(x, y, z, "dark_oak_planks"); // fascia
          }
        } else if (win) {
          g.set(x, y, z, "glass_pane", pane);
        } else {
          g.set(x, y, z, "smooth_quartz");
        }
      } else if (y === FLOOR2) {
        g.set(x, y, z, "chiseled_quartz_block"); // floor belt
      } else if (y >= UPPER_LO && y <= UPPER_HI) {
        if (win) g.set(x, y, z, "glass_pane", pane);
        else g.set(x, y, z, "smooth_quartz");
      } else if (y === CORNICE) {
        g.set(x, y, z, "chiseled_quartz_block");
      } else {
        g.set(x, y, z, "smooth_quartz"); // y 10 walls / parapet base
      }
    } else {
      // Interior: floor slabs and roof deck only; air behind glass.
      if (y === gr) g.set(x, y, z, "smooth_stone");
      else if (y === FLOOR2 && FLOOR2 > gr) g.set(x, y, z, "smooth_stone");
      else if (y === DECK) g.set(x, y, z, "light_gray_concrete");
    }
  }

  // Parapet ring on the perimeter, top at ROOF.
  if (perim) g.set(x, ROOF, z, "smooth_quartz");
  // Sparse rooftop mechanical units on interior cells.
  else if ((x + z) % 6 === 0) g.set(x, ROOF, z, "smooth_stone");
}

// Warm interior lights standing on floor slabs, behind some glass.
for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  if (f.N || f.S || f.W || f.E) continue;
  if (gr + 1 <= 4 && (x * 2 + z) % 7 === 0) g.set(x, gr + 1, z, "glowstone");
  if (6 > gr && (x * 3 + z) % 7 === 2) g.set(x, 6, z, "glowstone");
}

g.save(`${dir}/${id}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458737";
const W = 25, H = 23, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Levels (absolute y, y 0 = lowest ground). Roof deck top about 11 above lowest ground.
const FLOOR1 = 5;   // storey string course (storey 1 ends, storey 2 starts)
const FLOOR2 = 10;  // cornice / ceiling of storey 2
const ROOF = 11;    // parapet course and roof deck
const TOP = 12;     // coping and roof plant

const key = (x, z) => `${x},${z}`;
const gmap = new Map(cells.map(([x, z, gy]) => [key(x, z), gy]));
const has = (x, z) => gmap.has(key(x, z));

// Street side = z-minimum edge. Door sits on a non-corner front cell nearest the middle.
const frontOnly = cells.filter(([x, z]) => !has(x, z - 1) && has(x - 1, z) && has(x + 1, z)).map(c => c[0]);
const frontAll = cells.filter(([x, z]) => !has(x, z - 1)).map(c => c[0]);
const frontPool = frontOnly.length ? frontOnly : frontAll;
const midX = frontPool.length ? (Math.min(...frontPool) + Math.max(...frontPool)) / 2 : 0;
const doorX = frontPool.length
  ? frontPool.reduce((a, b) => (Math.abs(b - midX) < Math.abs(a - midX) ? b : a))
  : -1;

// Glass pane connections for the wall axis
const PANE_Z = { north: "false", east: "true", south: "false", west: "true", waterlogged: "false" };  // wall runs east-west
const PANE_X = { north: "true", east: "false", south: "true", west: "false", waterlogged: "false" };  // wall runs north-south

const g = new Voxels([W, H, D]);

for (const [x, z, gc] of cells) {
  const ex = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const nFaces = [ex.n, ex.s, ex.w, ex.e].filter(Boolean).length;
  const perim = nFaces > 0;
  const corner = nFaces >= 2;
  const isFront = ex.n;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: floor slabs per storey, air elsewhere, roof deck and plant
    g.set(x, gc, z, "smooth_stone");
    if (FLOOR1 > gc) g.set(x, FLOOR1, z, "smooth_stone");
    if (FLOOR2 > gc) g.set(x, FLOOR2, z, "smooth_stone");
    if (ROOF > gc) g.set(x, ROOF, z, "gray_concrete");
    if (x % 6 === 3 && z % 4 === 2) g.set(x, TOP, z, "iron_block");   // AC units
    // Warm light behind some windows
    if (z === 1 && x % 8 === 2) g.set(x, gc + 1, z, "glowstone");
    if (z === 1 && x % 8 === 6 && FLOOR1 + 1 > gc) g.set(x, FLOOR1 + 1, z, "shroomlight");
    continue;
  }

  // Perimeter: the facade
  const alongX = ex.n || ex.s;       // face normal along z, so the pattern runs along x
  const a = alongX ? x : z;
  const paneProps = alongX ? PANE_Z : PANE_X;

  for (let y = gc; y <= TOP; y++) {
    const lower = y > gc && y < FLOOR1;     // storey 1 body
    const upper = y > FLOOR1 && y < FLOOR2; // storey 2 body

    if (y === gc) {
      g.set(x, y, z, "polished_andesite");                     // base course
    } else if (y === FLOOR1 || y === FLOOR2) {
      g.set(x, y, z, "smooth_quartz");                         // string course / cornice
    } else if (y === ROOF) {
      g.set(x, y, z, "white_terracotta");                      // parapet
    } else if (y === TOP) {
      g.set(x, y, z, "smooth_quartz");                         // coping
    } else if (lower && y === FLOOR1 - 1) {
      // Lintel band; red awning over the shopfront
      g.set(x, y, z, isFront ? "red_concrete" : "white_terracotta");
    } else if (lower || upper) {
      const winRow = lower ? y < FLOOR1 - 1 : y < FLOOR2 - 1;

      if (corner) {
        g.set(x, y, z, "light_gray_concrete");                 // corner piers
      } else if (!winRow) {
        g.set(x, y, z, "white_terracotta");                    // spandrel
      } else if (lower && isFront) {
        if (x === doorX) {
          if (y <= gc + 2) {
            g.set(x, y, z, "oak_door", {
              facing: "north",
              half: y === gc + 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            });
          } else {
            g.set(x, y, z, "glass_pane", PANE_Z);              // door transom
          }
        } else if (x % 4 === 0) {
          g.set(x, y, z, "light_gray_concrete");               // shopfront piers
        } else {
          g.set(x, y, z, "glass_pane", PANE_Z);                // shopfront glazing
        }
      } else if (a % 3 === 1) {
        g.set(x, y, z, "glass_pane", paneProps);               // window
      } else {
        g.set(x, y, z, "light_gray_concrete");                 // pier / frame
      }
    } else {
      // Anything else on the wall (below first body row, if any)
      g.set(x, y, z, "white_terracotta");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise commercial block (roof ~11 blocks above lowest ground): a two-storey
// 1970s-80s Taipei shophouse-style block with a stone base, shopfront ground floor,
// tiled-concrete upper storey with punched windows, a cornice and a parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401863";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const SHOP = 4;   // top of ground-floor shopfront (y)
const BELT = 5;   // storey line / upper floor slab (y)
const CORN = 9;   // cornice course (y)
const TOP = 10;   // parapet cap; roof surface sits at y = 11

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// Exterior faces of a footprint cell: N = z-1, S = z+1, E = x+1, W = x-1
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x - 1, z)) f.push("W");
  return f;
}

// Coordinate running along a face (street facades run along x on N/S, along z on E/W)
const alongU = (face, x, z) => (face === "N" || face === "S" ? x : z);
const isWindowCol = (face, x, z) => alongU(face, x, z) % 3 === 1;

// Inward neighbour for a face (used for interior warm lights)
const inward = { N: [0, 1], S: [0, -1], E: [-1, 0], W: [1, 0] };

for (const [x, z, gr] of cells) {
  const f = faces(x, z);
  const wall = f.length > 0;

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (gr > TOP) continue;

  // Floor slab / base course at ground level
  g.set(x, gr, z, wall ? "stone_bricks" : "smooth_stone");

  if (wall) {
    const win = f.some((fc) => isWindowCol(fc, x, z));
    const winFace = f.find((fc) => isWindowCol(fc, x, z));
    const alongX = f.includes("N") || f.includes("S");
    const paneProps = alongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

    for (let y = gr + 1; y <= TOP; y++) {
      if (y === BELT || y === CORN || y === TOP) {
        g.set(x, y, z, "smooth_stone");
      } else if (y <= SHOP) {
        // Ground floor shopfront; entrance door on the north street facade
        const isDoor = x === 11 && z === 0 && f.includes("N") && (y === gr + 1 || y === gr + 2);
        if (isDoor && y <= SHOP) {
          g.set(x, y, z, "dark_oak_door", {
            facing: "north",
            half: y === gr + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (x === 11 && z === 0 && f.includes("N") && y === gr + 3) {
          // Canopy/transom above the entrance
          g.set(x, y, z, "polished_andesite");
        } else if (win) {
          g.set(x, y, z, "glass_pane", paneProps);
        } else {
          g.set(x, y, z, "polished_andesite");
        }
      } else {
        // Upper storey: punched windows in a white tiled-concrete wall
        if (win) g.set(x, y, z, "glass_pane", paneProps);
        else g.set(x, y, z, "white_concrete");
      }
    }

    // Warm light behind a few upper windows (interior air gap, one cell inside)
    if (winFace && alongU(winFace, x, z) % 6 === 1) {
      const [dx, dz] = inward[winFace];
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && faces(ix, iz).length === 0) {
        g.set(ix, 7, iz, "glowstone");
      }
    }
  } else {
    // Interior cell: air gap, storey floor slab, roof deck
    if (BELT > gr) g.set(x, BELT, z, "smooth_stone");
  }

  // Roof: parapet cap on the wall ring, deck with occasional roof units inside
  if (wall) {
    g.set(x, TOP, z, "smooth_stone");
  } else {
    g.set(x, TOP, z, "gray_concrete");
    if ((x + 2 * z) % 9 === 4 && TOP + 1 < H) g.set(x, TOP + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034020";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground height
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Roof sits about 11 blocks above the lowest ground; keep room for a stepped-down downhill side.
const maxG = Math.max(...ground.values());
const T = Math.max(11, maxG + 3); // roof deck layer (top of the wall body is T-1)

// Storey belts at absolute y=5 and y=10 (two 5-block storeys, then parapet).
const BELTS = [5, 10];

// Entrance: on the north (minimum z) edge, cell nearest the middle of the width.
const minZ = Math.min(...cells.map(c => c[1]));
const northCells = cells.filter(([x, z]) => z === minZ).map(([x]) => x);
const midX = (Math.min(...cells.map(c => c[0])) + Math.max(...cells.map(c => c[0]))) / 2;
const doorX = northCells.reduce((best, x) => (Math.abs(x - midX) < Math.abs(best - midX) ? x : best), northCells[0]);

const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const midZ = (minZ + Math.max(...cells.map(c => c[1]))) / 2;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  const edge = isEdge(x, z);
  // Vertical facades facing +/-x are the ones with a missing x-neighbour; along-index runs along z there.
  const facesX = !has(x - 1, z) || !has(x + 1, z);
  const along = facesX ? z : x;

  // Body from ground up to just below the roof deck.
  for (let y = gr; y < T && y < H; y++) {
    if (BELTS.includes(y)) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    if (!edge) continue; // interior: air, with belts forming floor slabs

    const s = y < 5 ? 0 : y < 10 ? 1 : 2;     // storey index
    const base = s * 5;
    const rel = s === 0 ? y - gr : y - base;  // position within storey
    const winBand = rel >= 1 && rel <= 3;
    const bay = along % 3 !== 0;              // two glazed bays out of three; third is a mullion

    if (s === 0) {
      // Ground floor shopfront: glass with stone mullions.
      if (winBand) {
        if (bay) {
          g.set(x, y, z, "glass");
        } else {
          g.set(x, y, z, "stone_bricks");
        }
      } else {
        g.set(x, y, z, "white_concrete");
      }
    } else {
      if (winBand) {
        if (bay) {
          const lit = s === 1 && along % 9 === 4;
          if (lit) {
            g.set(x, y, z, "glowstone");
          } else {
            g.set(x, y, z, "glass_pane", facesX
              ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
              : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
          }
        } else {
          g.set(x, y, z, "light_gray_concrete");
        }
      } else {
        g.set(x, y, z, "white_concrete"); // spandrels
      }
    }
  }

  // Roof deck across the whole footprint.
  if (T < H) g.set(x, T, z, "gray_concrete");

  // Parapet on the perimeter.
  if (edge && T + 1 < H) g.set(x, T + 1, z, "smooth_quartz");

  // Roof plant: a small mechanical block on the interior, near the middle.
  if (!edge && T + 2 < H && x >= 2 && x <= 5 && Math.abs(z - midZ) <= 3) {
    g.set(x, T + 1, z, "light_gray_concrete");
    g.set(x, T + 2, z, "light_gray_concrete");
  }
}

// Entrance door, placed last so it overrides the shopfront glass.
{
  const gr = ground.get(key(doorX, minZ));
  if (gr !== undefined && gr + 2 < H) {
    g.set(doorX, gr + 1, minZ, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false"
    });
    g.set(doorX, gr + 2, minZ, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false"
    });
  }
}

g.save(`${DIR}/${ID}.nbt`);

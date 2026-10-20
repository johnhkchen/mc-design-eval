import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831857626";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 23, D = 46;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);
const groundOf = (x, z) => cellMap.get(`${x},${z}`);

// Reference levels (absolute y). Lowest ground = minG.
// Floors at minG, minG+5, minG+10; roof slab at minG+10; parapet/top at minG+11.
const minG = Math.min(...cells.map(c => c[2]));
const ROOF = minG + 10;
const PARAPET = minG + 11;

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const exteriorOf = (x, z) => DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

// Row classification by height above minG
function rowKind(y) {
  const r = y - minG;
  if (r === 0 || r === 5 || r === 10) return "floor";
  if (r === 11) return "parapet";
  if ((r >= 1 && r <= 3) || (r >= 6 && r <= 8)) return "window";
  return "spandrel";
}

// Penthouse / plant box on the roof, inset from the perimeter
const PH = { x0: 3, x1: 14, z0: 10, z1: 35 };
const inPenthouse = (x, z) => x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1;
const penthouseRing = (x, z) => inPenthouse(x, z) && (x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1);

const PANE_GROUND = "light_blue_stained_glass_pane";
const PANE_UPPER = "light_blue_stained_glass_pane";
const WALL = "smooth_quartz";
const SPANDREL = "smooth_quartz";
const PILLAR = "white_concrete";
const FLOOR = "light_gray_concrete";
const FOUNDATION = "stone_bricks";

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);

  const ext = exteriorOf(x, z);
  const isEdge = ext.length > 0;
  const xFace = ext.some(([dx]) => dx !== 0);
  const zFace = ext.some(([, dz]) => dz !== 0);
  const isCorner = ext.length >= 2;
  const frontFace = ext.some(([, dz]) => dz === -1); // z = 0 side (street frontage)

  for (let y = gr; y <= PARAPET; y++) {
    const kind = rowKind(y);
    const r = y - minG;

    // Penthouse on the roof
    if (y >= PARAPET && inPenthouse(x, z)) {
      if (y === PARAPET + 2) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (penthouseRing(x, z)) {
        if (y === PARAPET + 1 && !isCorner) {
          g.set(x, y, z, PANE_UPPER, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
        } else {
          g.set(x, y, z, FLOOR);
        }
      }
      continue;
    }

    if (!isEdge) {
      // Interior: only floor slabs and the cell's own floor level; the rest is air
      if (kind === "floor" || y === gr) g.set(x, y, z, FLOOR);
      continue;
    }

    // Edge (facade) cells
    if (kind === "parapet") {
      g.set(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (kind === "floor") {
      g.set(x, y, z, FLOOR);
      continue;
    }

    if (kind === "window") {
      const along = xFace && !zFace ? z : x;
      const isPillar = isCorner || along % 3 === 0;

      // Entrance: door at x = 8 on the front face, ground storey only
      if (frontFace && x === 8 && (r === 1 || r === 2) && gr <= minG + 1) {
        const half = r === 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false"
        });
        continue;
      }

      if (isPillar) {
        g.set(x, y, z, PILLAR);
      } else {
        const pane = r <= 3 ? PANE_GROUND : PANE_UPPER;
        const conn = xFace && !zFace
          ? { north: "true", south: "true", east: "false", west: "false" }
          : { north: "false", south: "false", east: "true", west: "true" };
        g.set(x, y, z, pane, { ...conn, waterlogged: "false" });

        // Warm light behind the glass (in the air gap, inside the shell)
        if (!isCorner && ext.length === 1 && (r === 2 || r === 7)) {
          const [dx, dz] = ext[0];
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && y >= groundOf(ix, iz) && along % 6 === 1) {
            g.set(ix, y, iz, "shroomlight");
          }
        }
      }
      continue;
    }

    // Spandrel rows on the facade
    if (frontFace && r === 4 && x >= 6 && x <= 10 && !isCorner) {
      // Canopy band over the entrance and shopfront
      g.set(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (isCorner || (xFace && !zFace ? z : x) % 3 === 0) {
      g.set(x, y, z, PILLAR);
    } else {
      g.set(x, y, z, SPANDREL);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

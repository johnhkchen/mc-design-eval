import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi 2002 mid-rise: two storeys of ~3 blocks, a shopfront base course,
// white-tiled piers, tinted glazing, a quartz storey line and cornice, and a
// flat roof carrying a small plant room. Roof sits 7 blocks above the lowest ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/TPE91-0301-1F.cells.json`, "utf8"));
const W = 29, H = 19, D = 51;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GR = new Map();
for (const [x, z, gr] of cells) GR.set(key(x, z), gr);
const has = (x, z) => GR.has(key(x, z));
const gr = (x, z) => GR.get(key(x, z));
const minG = Math.min(...GR.values());
const R = minG + 6;                       // top layer of the roof cornice (7 blocks tall)
const topOf = (x, z) => Math.max(R, gr(x, z) + 2);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exteriorFaces = (x, z) =>
  Object.keys(DIRS).filter((f) => {
    const [dx, dz] = DIRS[f];
    return !has(x + dx, z + dz);
  });

function S(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Entrance: the south-facing wall cell nearest the middle of that face.
const southCells = cells.filter(([x, z]) => exteriorFaces(x, z).includes("south"));
let entX = null;
if (southCells.length) {
  const avg = southCells.reduce((s, c) => s + c[0], 0) / southCells.length;
  entX = southCells.reduce((best, c) => (Math.abs(c[0] - avg) < Math.abs(best - avg) ? c[0] : best), southCells[0][0]);
}

const lights = [];

// Pass 1: foundations, walls, storey lines, interior floor slabs, cornice, roof deck.
for (const [x, z] of cells) {
  const gc = gr(x, z);
  const T = topOf(x, z);
  const faces = exteriorFaces(x, z);

  for (let y = 0; y < gc; y++) S(x, y, z, "stone_bricks");

  if (!faces.length) {
    // Interior: floor slabs per storey and a roof deck; air otherwise (no interiors).
    S(x, gc, z, "smooth_stone");
    if (gc + 3 <= T) S(x, gc + 3, z, "smooth_stone");
    S(x, T, z, "light_gray_concrete");
    continue;
  }

  // Wall cell: pick the first exterior face for articulation.
  const f = faces[0];
  const [dx, dz] = DIRS[f];
  const along = f === "north" || f === "south" ? x : z;
  const corner = faces.length > 1;
  const pier = corner || along % 4 === 0;
  const isEntrance = f === "south" && x === entX && !corner;
  const paneProps =
    f === "north" || f === "south"
      ? { north: "false", south: "false", east: "true", west: "true" }
      : { north: "true", south: "true", east: "false", west: "false" };

  for (let y = gc; y <= T; y++) {
    if (y === T) {
      S(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      continue;
    }
    if (y === gc) {
      S(x, y, z, "stone_bricks");                       // base course
      continue;
    }
    if (y === gc + 3) {
      S(x, y, z, "smooth_quartz");                       // storey line
      continue;
    }
    if (y <= gc + 2) {
      // Ground floor: shopfront glass, piers, entrance door.
      if (isEntrance && (y === gc + 1 || y === gc + 2)) {
        const half = y === gc + 1 ? "lower" : "upper";
        S(x, y, z, "dark_oak_door", {
          facing: "south", half, hinge: "left", open: "false", powered: "false",
        });
      } else if (pier) {
        S(x, y, z, "white_concrete");
      } else {
        S(x, y, z, "glass");
      }
    } else {
      // Upper floor: tinted glazing in white-concrete frames.
      if (pier) {
        S(x, y, z, "white_concrete");
      } else {
        S(x, y, z, "light_gray_stained_glass_pane", paneProps);
        // Warm light behind some upper windows, placed in the interior cell after pass 1.
        if (along % 8 === 2 && y === gc + 4 && !corner) {
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz) && exteriorFaces(ix, iz).length === 0) lights.push([ix, y, iz]);
        }
      }
    }
  }
}

// Pass 2: warm lights behind glass.
for (const [x, y, z] of lights) S(x, y, z, "glowstone");

// Pass 3: roof plant room on the flat roof, centred on the footprint.
for (const [x, z] of cells) {
  if (x < 8 || x > 20 || z < 18 || z > 32) continue;
  if (exteriorFaces(x, z).length) continue;
  const T = topOf(x, z);
  S(x, T + 1, z, "light_gray_concrete");
}

g.save(`${DIR}/TPE91-0301-1F.nbt`);

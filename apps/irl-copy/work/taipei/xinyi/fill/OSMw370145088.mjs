import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial/residential block: two storeys of white tiled
// concrete over a stone base, light-grey spandrels, window bays with glass panes,
// a shopfront ground storey, a stone-surrounded entrance with canopy on the south
// face, flat roof with cornice, parapet and a rooftop water tank. Storey lines sit
// at absolute y = 5 and y = 10 so the roof lands at y = 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145088";
const W = 17, H = 23, D = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const footprint = [];
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
  footprint.push([x, z]);
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const NORMALS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };
function normal(x, z) {
  for (const [dx, dz] of NORMALS) if (!has(x + dx, z + dz)) return [dx, dz];
  return null;
}

// Entrance: south-facing edge cell nearest the facade centre (fallback: any edge).
const CX = Math.floor(W / 2);
let entKey = null, entN = null;
{
  let best = Infinity;
  for (const [x, z] of footprint) {
    const n = normal(x, z);
    if (!n || n[0] !== 0 || n[1] !== 1) continue;
    const d = Math.abs(x - CX);
    if (d < best) { best = d; entKey = `${x},${z}`; entN = n; }
  }
  if (!entKey) {
    best = Infinity;
    for (const [x, z] of footprint) {
      const n = normal(x, z);
      if (!n) continue;
      const d = Math.abs(x - CX);
      if (d < best) { best = d; entKey = `${x},${z}`; entN = n; }
    }
  }
}
const [entX, entZ] = entKey ? entKey.split(",").map(Number) : [-99, -99];
const entAlong = entN && entN[0] !== 0 ? entZ : entX; // coordinate along the entrance face
const onEntFace = (x, z, n) => n && entN && n[0] === entN[0] && n[1] === entN[1];

const lights = [];

const windowPane = (nx, nz) =>
  nz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z] of footprint) {
  const gr = G(x, z);
  const top = Math.max(10, gr);

  // Foundation / plinth below the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const n = normal(x, z);

  if (!n) {
    // Interior: floor slabs only, air between (no interiors).
    put(x, gr, z, "smooth_stone");
    if (gr <= 5) put(x, 5, z, "light_gray_concrete");
    if (gr <= 10) put(x, 10, z, "smooth_stone");
    continue;
  }

  const [nx, nz] = n;
  const along = nz !== 0 ? x : z;
  const facing = FACING[`${nx},${nz}`];
  const isEnt = `${x},${z}` === entKey;
  const entFace = onEntFace(x, z, n);
  const entFlank = entFace && Math.abs(along - entAlong) === 1;

  for (let y = gr; y < top; y++) {
    let id = null, p = null;

    if (y >= 10) {
      id = "light_gray_concrete"; // cornice
    } else if (y < 5) {
      if (y === gr) id = "stone_bricks";                  // base course
      else if (y === 4) id = "light_gray_concrete";       // storey-1 spandrel
    } else {
      if (y === 5 || y === 9) id = "light_gray_concrete"; // storey spandrels
    }

    // Entrance bay: door, stone surround, canopy band.
    if (entFace && (isEnt || entFlank)) {
      if (isEnt && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "oak_door", {
          facing,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === gr + 1 || y === gr + 2) {
        // Stone surround either side of the door.
        put(x, y, z, "stone_bricks");
        continue;
      }
      if (y === gr + 3 && gr + 3 < 5) {
        // Canopy band across the entrance bay.
        put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });
        continue;
      }
    }

    if (id === null) {
      // Window band. Ground storey: shopfront with wider glazing (piers every 6).
      // Upper storey: piers every 4, glass panes between.
      const groundStorey = y < 5;
      const pierEvery = groundStorey ? 6 : 4;
      if (along % pierEvery === 0) {
        id = "white_concrete";
      } else {
        id = "glass_pane";
        p = windowPane(nx, nz);
      }
    }

    put(x, y, z, id, p);
  }

  // Parapet on the roof edge.
  put(x, 11, z, "white_concrete");

  // Interior lights standing on the floor, behind selected windows.
  if (along % 8 === 2) {
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && !normal(ix, iz)) {
      const lowRow1 = gr + 1;
      if (lowRow1 < 5) lights.push([ix, lowRow1, iz]);
      lights.push([ix, 6, iz]);
    }
  }
}

// Interior glow, drawn after the air pass.
for (const [x, y, z] of lights) {
  const gr = G(x, z);
  if (y === gr + 1 || y === 6) put(x, y, z, "glowstone");
}

// Rooftop water tank: 2x2 steel drum on the roof slab, centred.
{
  let cx = null, cz = null, bestD = Infinity;
  for (const [x, z] of footprint) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) => {
      const tx = x + dx, tz = z + dz;
      return has(tx, tz) && !normal(tx, tz) && G(tx, tz) <= 10;
    });
    if (!ok) continue;
    const d = Math.hypot(x + 0.5 - W / 2, z + 0.5 - D / 2);
    if (d < bestD) { bestD = d; cx = x; cz = z; }
  }
  if (cx !== null) {
    for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      put(cx + dx, 11, cz + dz, "iron_block");
      put(cx + dx, 12, cz + dz, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

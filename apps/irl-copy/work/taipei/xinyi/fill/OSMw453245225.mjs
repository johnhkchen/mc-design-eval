import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// OSMw453245225: unrecorded mid-rise commercial/office block, c. 1990s Taipei.
// Eight storeys of 5 blocks (roof top at y=40), tiled white facade with
// tinted glass bands, stone-clad shopfront at street level, parapet cornice,
// rooftop plant and a central mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453245225";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 34, H = 52, D = 16;
const ROOF = 40;     // roof slab level (absolute y), 8 storeys x 5
const STOREY = 5;

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellGround = new Map();
for (const [x, z, gr] of cells) cellGround.set(`${x},${z}`, gr);
const has = (x, z) => cellGround.has(`${x},${z}`);

// Outward faces of a footprint cell (cell with a missing neighbour).
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push({ name: "north", dx: 0, dz: -1 });
  if (!has(x, z + 1)) f.push({ name: "south", dx: 0, dz: 1 });
  if (!has(x - 1, z)) f.push({ name: "west", dx: -1, dz: 0 });
  if (!has(x + 1, z)) f.push({ name: "east", dx: 1, dz: 0 });
  return f;
};

// Front entrance: middle cell of the lowest-z (north) row.
let minZ = Infinity;
for (const [, z] of cells) minZ = Math.min(minZ, z);
const frontXs = cells.filter(([, z]) => z === minZ).map(([x]) => x);
const doorX = frontXs.length
  ? Math.floor((Math.min(...frontXs) + Math.max(...frontXs)) / 2)
  : -1;
const doorKey = has(doorX, minZ) ? `${doorX},${minZ}` : null;

// Mast cell: interior cell nearest the footprint centre.
const cx = cells.reduce((a, [x]) => a + x, 0) / cells.length;
const cz = cells.reduce((a, [, z]) => a + z, 0) / cells.length;
let mastKey = null, best = Infinity;
for (const [x, z] of cells) {
  if (faces(x, z).length) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < best) { best = d; mastKey = `${x},${z}`; }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  const perim = fs.length > 0;
  const corner = fs.length >= 2;
  const pf = fs[0];                         // primary facade face
  const alongX = pf ? (pf.name === "north" || pf.name === "south") : false;
  const u = alongX ? x : z;                 // coordinate along the facade
  const mullion = perim && (corner || u % 3 === 0);
  const isDoor = perim && `${x},${z}` === doorKey;
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };

  // Walls and floors, from the cell's ground up to the roof.
  for (let y = gr; y < ROOF; y++) {
    const s = Math.floor(y / STOREY);
    const o = y % STOREY;

    if (!perim) {
      // Interior: floor slabs only, air elsewhere (no interiors).
      if (y === gr || o === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_andesite"); continue; }   // plinth course
    if (o === 0) { put(x, y, z, "smooth_stone"); continue; }         // storey belt

    if (s === 0) {
      // Shopfront storey.
      if (o === 4) { put(x, y, z, "stone_bricks"); continue; }       // header
      if (isDoor && y < 5 && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (mullion) { put(x, y, z, "stone_bricks"); continue; }
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    // Upper storeys: tiled white piers, tinted glass bands, white headers.
    if (o === 4) { put(x, y, z, "white_concrete"); continue; }
    if (mullion) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", paneProps);

    // Warm light behind some windows: glowstone in the interior cell inward.
    if (o === 2 && (u + s) % 4 === 1 && pf) {
      const ix = x - pf.dx, iz = z - pf.dz;
      if (has(ix, iz) && faces(ix, iz).length === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Lantern under the entrance canopy-line (header is at y=4).
  if (isDoor && gr + 1 < 5 && gr + 3 < 5) {
    put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Roof: parapet and cornice on the edge, roof deck inside.
  if (perim) {
    put(x, ROOF, z, "smooth_stone");
    put(x, ROOF + 1, z, "white_concrete");
  } else {
    put(x, ROOF, z, "light_gray_concrete");
  }
}

// Rooftop plant: grey HVAC boxes and a central mast.
for (const [x, z] of cells) {
  if (faces(x, z).length) continue;
  if (x % 7 === 3 && (z === 5 || z === 10)) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}
if (mastKey) {
  const [mx, mz] = mastKey.split(",").map(Number);
  for (let y = ROOF + 1; y <= ROOF + 5; y++) put(mx, y, mz, "iron_bars");
  put(mx, ROOF + 6, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

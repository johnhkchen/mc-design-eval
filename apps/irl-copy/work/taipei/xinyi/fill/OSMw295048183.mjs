import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 馨園大廈 — 12-storey residential/mixed tower, c. 1990s Xinyi:
// white tiled wall with light-grey aluminium-frame glazing, quartz storey bands,
// granite plinth, shopfront on the street (north) face, penthouse with a lightning rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw295048183";
const W = 45, H = 71, D = 41;
const ROOF = 58;      // roof slab level (≈59 blocks above lowest ground)
const PARAPET = 59;   // parapet course on perimeter
const PH_TOP = 62;    // penthouse cap

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);

const inF = (x, z) => ground.has(`${x},${z}`);

// Outward facing of a perimeter cell (first missing neighbour), or null if interior.
function outward(x, z) {
  if (!inF(x, z - 1)) return "north";
  if (!inF(x, z + 1)) return "south";
  if (!inF(x + 1, z)) return "east";
  if (!inF(x - 1, z)) return "west";
  return null;
}
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const DXZ = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };

// True if every cell within Chebyshev radius r is in the footprint.
function deep(x, z, r) {
  for (let dx = -r; dx <= r; dx++)
    for (let dz = -r; dz <= r; dz++)
      if (!inF(x + dx, z + dz)) return false;
  return true;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// Street (north) entrance: a three-cell bay centred on the north face, door in the middle.
const northXs = cells
  .filter(([x, z]) => outward(x, z) === "north")
  .map(([x]) => x)
  .sort((a, b) => a - b);
const midX = northXs[Math.floor(northXs.length / 2)];
const isEntranceRow = (x, z) => outward(x, z) === "north" && Math.abs(x - midX) <= 1;
const isDoor = (x, z) => outward(x, z) === "north" && x === midX;

// ---- Main envelope -------------------------------------------------------
for (const [x, z, gy] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gy; y++) put(x, y, z, "light_gray_concrete");

  const out = outward(x, z);

  for (let y = gy; y < ROOF; y++) {
    if (out === null) {
      // Interior: floor slabs only, air elsewhere (no interiors).
      if (y === gy || y % 5 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const t = y - gy;
    const along = out === "north" || out === "south" ? x : z;
    const mull = along % 3 === 0;

    if (t < 4) {
      // Ground zone: granite plinth, shopfront glazing, fascia, entrance.
      if (isEntranceRow(x, z)) {
        if (t === 3) {
          // Light quartz canopy over the whole entrance bay.
          put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
          continue;
        }
        if (isDoor(x, z)) {
          if (t === 0) put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          else if (t === 1) put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          else put(x, y, z, "light_blue_stained_glass"); // transom
          continue;
        }
        // Flanking bays: glazed shopfront, with lanterns at the canopy edge for warmth.
        if (t === 0) put(x, y, z, "polished_granite");
        else if (t === 2 && (x - midX) === 1 || (t === 2 && (x - midX) === -1)) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
        else put(x, y, z, "light_blue_stained_glass");
        continue;
      }
      if (t === 0) put(x, y, z, "polished_granite");
      else if (t === 3) put(x, y, z, "smooth_quartz");
      else put(x, y, z, mull ? "light_gray_concrete" : "light_blue_stained_glass");
      continue;
    }

    // Upper storeys on a 5-block module keyed to absolute y.
    const off = y % 5;
    const storey = Math.floor(y / 5);
    const bay = Math.floor(along / 3);

    if (off === 0) {
      put(x, y, z, "smooth_quartz");                  // storey line
    } else if (off === 4) {
      put(x, y, z, "white_concrete");                 // spandrel wall
    } else {
      if (mull) {
        put(x, y, z, "light_gray_concrete");          // aluminium mullion
      } else if (off === 1 && bay % 4 === 1 && storey % 2 === 1) {
        put(x, y, z, "iron_bars");                    // balcony railing
      } else {
        put(x, y, z, "light_blue_stained_glass");     // window glass
        // Warm light: glowstone one block inside the glass, in an interior cell.
        if (bay % 5 === 2 && off === 2 && storey % 2 === 0) {
          const [dx, dz] = DXZ[OPP[out]];
          const ix = x + dx, iz = z + dz;
          if (inF(ix, iz) && outward(ix, iz) === null) put(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Roof level and parapet.
  if (gy <= ROOF) {
    if (out === null) put(x, ROOF, z, "light_gray_concrete");
    else {
      put(x, ROOF, z, "smooth_quartz");                 // cornice
      put(x, PARAPET, z, "white_concrete");              // parapet
    }
  }
}

// ---- Penthouse / roof equipment -----------------------------------------
const ph = cells.filter(([x, z]) => deep(x, z, 6)).map(([x, z]) => [x, z]);
const phSet = new Set(ph.map(([x, z]) => `${x},${z}`));
const isPH = (x, z) => phSet.has(`${x},${z}`);
const isPHEdge = (x, z) =>
  isPH(x, z) && (!isPH(x + 1, z) || !isPH(x - 1, z) || !isPH(x, z + 1) || !isPH(x, z - 1));

for (const [x, z] of ph) {
  for (let y = PARAPET; y <= PH_TOP - 1; y++) {
    if (isPHEdge(x, z) && y === 60) {
      const along = x % 3 === 0 || z % 3 === 0;
      put(x, y, z, along ? "light_gray_concrete" : "light_blue_stained_glass");
    } else {
      put(x, y, z, "white_concrete");
    }
  }
  put(x, PH_TOP, z, "light_gray_concrete");
}

if (ph.length) {
  const cx = Math.round(ph.reduce((s, [x]) => s + x, 0) / ph.length);
  const cz = Math.round(ph.reduce((s, [, z]) => s + z, 0) / ph.length);
  if (isPH(cx, cz)) {
    for (let y = PH_TOP + 1; y <= PH_TOP + 4; y++) {
      put(cx, y, cz, "iron_bars");
    }
    put(cx, PH_TOP + 5, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

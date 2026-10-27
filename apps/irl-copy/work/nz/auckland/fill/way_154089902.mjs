// Achilles House, Auckland (OSM way 154089902). A 1970s-80s CBD office: a seven-storey concrete podium with shopfronts
// at street level, a ten-storey wing and a fourteen-storey setback, and a twenty-storey tower (81 rows, lidar roof)
// on the diagonal strip, in a grey-tinted curtain wall with pale concrete spandrels and quoins. Hollow: a floor slab per
// storey, an air gap behind the glass, and warm lights set just inside some windows.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089902.cells.json", "utf8"));

const X = 40, Z = 41, Y = 93;
const g = new Voxels([X, Y, Z]);

// lidar roof heights -> four flat tiers, in rows (blocks above y 0): podium 28, wing 40, setback 56, tower 81
const tier = (r) => (r < 35 ? 28 : r < 50 ? 40 : r < 68 ? 56 : 81);
const top = new Array(X * Z).fill(0);            // 0 = outside the footprint
const hAt = (x, z) => (x >= 0 && z >= 0 && x < X && z < Z ? top[z * X + x] : 0);
for (const [x, z, , roof] of cells) top[z * X + x] = tier(roof);

// the four faces, with the neighbour step and the facing name (north = -z)
const FACES = [["north", 0, -1], ["east", 1, 0], ["south", 0, 1], ["west", -1, 0]];
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };
// a face is open at row y when the neighbour column has no block there (or lies outside the footprint)
const openFaces = (x, z, y) => FACES.filter(([, dx, dz]) => y >= hAt(x + dx, z + dz));

const M = {
  base: "polished_granite", fascia: "smooth_stone", shopfront: "gray_stained_glass", mullionGround: "polished_andesite",
  band: "light_gray_concrete", spandrel: "white_concrete", glass: "gray_stained_glass", fin: "light_gray_concrete",
  quoin: "white_concrete", roof: "light_gray_concrete", slab: "light_gray_concrete", plant: "gray_concrete", lamp: "glowstone",
};

// the skin of one edge cell at row y, by its storey pattern: granite base, shopfront, then band / glass / spandrel
function skin(x, z, y, faces) {
  if (faces.length >= 2) return y === 0 ? M.base : M.quoin;   // corners: full-height quoins
  const [, dx] = faces[0]; const along = dx !== 0 ? z : x;   // the coordinate running along the face
  if (y === 0) return M.base;
  if (y < 4) {                                                // ground storey: shopfront glass between fascia rows
    if (y === 3) return M.fascia;
    return along % 3 === 0 ? M.mullionGround : M.shopfront;
  }
  const r = y % 4;
  if (r === 0) return M.band;                                  // slab edge
  if (r === 3) return M.spandrel;                              // spandrel under each storey's glass
  return along % 3 === 0 ? M.fin : M.glass;                    // glass with a fin every third bay
}

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const Ht = top[z * X + x]; if (!Ht) continue;
  for (let y = 0; y < Ht; y++) {
    const faces = openFaces(x, z, y);
    if (y === Ht - 1) {                                        // the top row: cornice on an open edge, roof cap inside
      g.set(x, y, z, faces.length ? M.spandrel : M.roof);
      continue;
    }
    if (!faces.length) { if (y % 4 === 0) g.set(x, y, z, M.slab); continue; }   // interior: a floor slab per storey, else air
    g.set(x, y, z, skin(x, z, y, faces));
  }
}

// warm lights: a glowstone just inside some first-row windows (only where the cell inside is open air)
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const Ht = top[z * X + x]; if (!Ht) continue;
  for (let y = 1; y < Ht - 1; y += 4) {
    const faces = openFaces(x, z, y);
    if (faces.length !== 1) continue;
    const [, dx, dz] = faces[0]; const along = dx !== 0 ? z : x;
    if (y < 4 || along % 3 === 0 || (along + Math.floor(y / 4) * 2) % 4 !== 1) continue;
    const ix = x - dx, iz = z - dz;
    if (hAt(ix, iz) <= y || openFaces(ix, iz, y).length) continue;
    g.set(ix, y, iz, M.lamp);
  }
}

// the street door: on the podium's south face, the bay nearest the middle of the plan
{
  let best = null;
  for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
    if (hAt(x, z) !== 28 || !openFaces(x, z, 1).some(([n]) => n === "south")) continue;
    if (!best || Math.abs(x - 18) < Math.abs(best[0] - 18)) best = [x, z];
  }
  if (best) {
    const [x, z] = best;
    const door = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
    g.set(x, 1, z, "dark_oak_door", door("lower", "left"));
    g.set(x, 2, z, "dark_oak_door", door("upper", "left"));
    g.set(x, 3, z, M.fascia);
  }
}

// roof plant: a 2x2 solid plant room on the tower's top where it is clear of edges, and a small terrace box on the podium
const roofPlant = (test, rows, block) => {
  for (let z = 1; z < Z - 1; z++) for (let x = 1; x < X - 1; x++) {
    if (![[0, 0], [1, 0], [0, 1], [1, 1]].every(([a, b]) => test(x + a, z + b))) continue;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let y = rows[0]; y <= rows[1]; y++) g.set(x + a, y, z + b, block);
    return;
  }
};
roofPlant((x, z) => hAt(x, z) === 81 && hAt(x - 1, z) === 81 && hAt(x + 1, z) === 81 && hAt(x, z - 1) === 81 && hAt(x, z + 1) === 81, [81, 82], M.plant);
roofPlant((x, z) => hAt(x, z) === 28 && hAt(x - 1, z) === 28 && hAt(x + 1, z) === 28 && hAt(x, z - 1) === 28 && hAt(x, z + 1) === 28, [28, 29], M.plant);

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_154089902.nbt");
console.log(`Achilles House: ${cells.length} cells, ${r.blocks} blocks, ${r.palette} palette entries`);

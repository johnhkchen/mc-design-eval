// Way 332241823, Eden Terrace side of Maungawhau: a five-storey reinforced-concrete office and apartment block of the
// 1960s (rendered concrete, ribbon windows in aluminium frames, a stone plinth, a flat roof with a parapet and one
// lift-plant room). The lidar roof is 23 blocks over y 0 on almost every cell; the 18 and 2-6 cells are edge noise and
// the 24 cells are the plant. The massing is one flat tier, as the lidar says, not invented setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_332241823.cells.json`, "utf8"));

const X = 26, Z = 31, Y = 37;
const ROOF = 23;                                   // the lidar's flat roof: the top solid layer is ROOF - 1
const SLABS = [2, 6, 10, 14, 18, 22];              // floor slabs: ground floor at 2, then every 4 blocks; 22 is the roof deck
const BANDS = [2, 6, 10, 14, 18];                  // a window band sits above each slab (3 blocks: slab+1 .. slab+3)
const COMMERCIAL = (face) => face === "W" || face === "S";  // the shopfront faces the street on the low side

const foot = new Map();
for (const [x, z, g, r] of cells) foot.set(`${x},${z}`, { g, r });
const inF = (x, z) => foot.has(`${x},${z}`);
const faces = (x, z) => {                          // exposed faces of a footprint cell
  const f = [];
  if (!inF(x - 1, z)) f.push("W");
  if (!inF(x + 1, z)) f.push("E");
  if (!inF(x, z - 1)) f.push("N");
  if (!inF(x, z + 1)) f.push("S");
  return f;
};
const isRing = (x, z) => faces(x, z).length > 0;
// a pane runs along the wall: a W/E face runs north-south, a N/S face east-west
const pane = (face) => (face === "W" || face === "E"
  ? { north: "true", south: "true", east: "false", west: "false" }
  : { north: "false", south: "false", east: "true", west: "true" });
const inward = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };
const along = (face, x, z) => (face === "W" || face === "E" ? z : x);

const g = new Voxels([X, Y, Z]);
const cellsList = [...foot.keys()].map((k) => k.split(",").map(Number));

// 1. foundation: solid from y 0 to the lidar ground, and the plinth to the datum (y 2) on the low side
for (const [x, z] of cellsList) for (let y = 0; y < 2; y++) g.set(x, y, z, "stone_bricks");

// 2. floor slabs, one per storey, across the whole footprint (no interiors: air sits between them)
for (const [x, z] of cellsList) for (const y of SLABS) g.set(x, y, z, "smooth_stone");

// 3. the walls: piers and ribbon glazing in every band, storey lines on the ring, no empty course under a tier
const LIT = (x, y, z) => (x * 7 + z * 13 + y * 5) % 11 === 0;   // about one window in eleven shows a warm light
// the entrance: the low-side (west) ring cell nearest the middle of the facade, on the datum
let door = null;
for (const [x, z] of cellsList) {
  if (!faces(x, z).includes("W") || foot.get(`${x},${z}`).g > 2) continue;
  if (faces(x, z).length > 1) continue;            // not a corner
  if (!door || Math.abs(z - 17) < Math.abs(door.z - 17)) door = { x, z };
}

for (const [x, z] of cellsList) {
  const fs = faces(x, z);
  if (fs.length === 0) continue;                   // interior: slabs and foundation only
  const corner = fs.length > 1;
  for (let y = 2; y < ROOF; y++) {
    const band = BANDS.find((b) => y > b && y <= b + 3);
    if (SLABS.includes(y)) {
      // storey line: base course at the datum, spandrels above, cornice at the roof
      g.set(x, y, z, y === 2 ? "stone_bricks" : y === 22 ? "polished_andesite" : "polished_andesite");
      continue;
    }
    if (band === undefined) continue;
    const face = fs[0];
    const pier = corner || along(face, x, z) % 3 === 0;
    if (door && door.x === x && door.z === z && (y === 3 || y === 4)) {
      g.set(x, y, z, "oak_door", { facing: "west", half: y === 3 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y === 5 && y < 6 && COMMERCIAL(face)) { g.set(x, y, z, "polished_andesite"); continue; }  // shopfront fascia
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }
    g.set(x, y, z, "light_blue_stained_glass_pane", pane(face));
    // warm light behind the glass: the cell just inside is air (no interior), so glowstone stands on the slab below
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (inF(ix, iz) && !isRing(ix, iz) && LIT(x, y, z)) g.set(ix, y, iz, "glowstone");
  }
  // the parapet on the ring above the roof deck; the roof deck over the core (smooth stone)
  g.set(x, 22, z, "polished_andesite");
  g.set(x, ROOF, z, "light_gray_concrete");
}

// 4. the roof: the deck over the core, and the plant room where the lidar is 24 (one block above the flat tier)
for (const [x, z, , r] of cells) {
  if (!isRing(x, z)) g.set(x, 22, z, "smooth_stone");
  if (r >= 24 && !isRing(x, z)) g.set(x, ROOF, z, "light_gray_concrete");
}

const out = `${DIR}/way_332241823.nbt`;
const info = g.save(out);
console.log(`wrote ${out}: ${info.blocks} blocks, ${info.palette} palette entries; door at x=${door?.x} z=${door?.z}`);

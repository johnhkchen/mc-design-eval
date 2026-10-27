// The Statesman, Auckland (way 401588411): a 1970s-80s concrete-frame office tower, thirteen storeys of 4 blocks over a
// basalt plinth. The lidar roof is flat at 60 across the footprint (edge noise below 40 is ignored), with a plant room
// 3 blocks higher on the west cells that read 61-63, so the massing is one prism with a parapet and a plant box, not
// setbacks (the record shows none). Floors sit on a common datum at y 6 (the highest cell ground); the plinth is solid
// from y 0 under every cell. The facade is a 3-block bay rhythm: white-concrete spandrel at each floor line, light-grey
// piers, blue glass between, dark grey glass on the crown storey, a dark-oak door in a stone surround with a fascia
// canopy, glowstone behind some panes. Interiors are air with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588411.cells.json", "utf8"));
const FLOOR = 6, STOREY = 4, STOREYS = 13, ROOF = FLOOR + STOREY * STOREYS;   // slabs at 6, 10 .. 58; roof membrane row 58
const PARAPET = ROOF + 1;                                                     // row 59: coping, surface at 60 (lidar)
const g = new Voxels([66, 76, 42]);

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const roofAt = (x, z) => F.get(`${x},${z}`).roof;
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));    // faces that look out of the footprint
const perim = (x, z) => inF(x, z) && outward(x, z).length > 0;

const GLASS = "light_blue_stained_glass", CROWN = "gray_stained_glass", PIER = "light_gray_concrete", BAND = "white_concrete";
const PLINTH = "polished_andesite", CORE = "stone", SLAB = "light_gray_concrete", ROOFM = "gray_concrete", CAP = "smooth_stone";

// 1. foundation: solid from y 0 up to the datum under every footprint cell (the cell's ground is at most 6)
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < FLOOR; y++) g.set(x, y, z, perim(x, z) ? PLINTH : CORE);
}

// 2. floor slabs and the roof: a full slab per storey line; the outer ring is a white band with light-grey piers
for (let s = 0; s <= STOREYS; s++) {
  const y = FLOOR + STOREY * s;
  for (const k of F.keys()) {
    const [x, z] = k.split(",").map(Number);
    const pier = perim(x, z) && isPier(x, z);
    if (perim(x, z)) g.set(x, y, z, pier ? PIER : BAND);
    else g.set(x, y, z, s === STOREYS ? ROOFM : SLAB);
  }
}

// a pier sits on each corner and every third cell along a face; the rest of a face is glazing between
function isPier(x, z) {
  const out = outward(x, z);
  const alongZ = out.some(([dx]) => dx !== 0), alongX = out.some(([, dz]) => dz !== 0);
  if (alongZ && alongX) return x % 3 === 0 || z % 3 === 0;   // corner or stepped diagonal: bays on both axes, not a blank wall
  const coord = alongZ ? z : x;                       // a face along x has its bays in z; along z, in x
  return coord % 3 === 0;
}

// 3. storeys: window rows (two tall, the ground floor three), a spandrel line, air between the slabs
for (let s = 0; s < STOREYS; s++) {
  const base = FLOOR + STOREY * s;
  const glass = s === STOREYS - 1 ? CROWN : GLASS;
  for (const k of F.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!perim(x, z)) continue;
    const pier = isPier(x, z);
    for (let r = base + 1; r <= base + 3; r++) {
      if (pier) g.set(x, r, z, PIER);
      else if (r === base + 3 && s > 0) g.set(x, r, z, BAND);
      else g.set(x, r, z, glass);
    }
  }
}

// 4. the parapet coping, and the plant box on the cells the lidar reads 61-63 (surface 63): rows 59-62 with louvres
for (const k of F.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (perim(x, z)) g.set(x, PARAPET, z, CAP);
  if (roofAt(x, z) >= 61) {
    for (let y = PARAPET; y <= PARAPET + 3; y++) {
      const louvre = (y === PARAPET + 1 || y === PARAPET + 2) && (x + z) % 2 === 0;
      g.set(x, y, z, louvre ? "iron_bars" : SLAB);
    }
  }
}

// 5. the entrance: on the south face, nearest the middle of that face; a stone surround, a fascia canopy, the door
const south = [...F.keys()].map((k) => k.split(",").map(Number)).filter(([x, z]) => perim(x, z) && outward(x, z).some(([, dz]) => dz === 1));
const mid = south.map(([x]) => x).sort((a, b) => a - b)[Math.floor(south.length / 2)];
const [dx0, dz0] = south.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
for (const x of [dx0 - 1, dx0 + 1]) if (perim(x, dz0)) for (let y = FLOOR + 1; y <= FLOOR + 3; y++) g.set(x, y, dz0, PLINTH);
for (const x of [dx0 - 1, dx0, dx0 + 1]) if (perim(x, dz0)) g.set(x, FLOOR + 4, dz0, PLINTH);   // fascia over the door
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(dx0, FLOOR + 1, dz0, "dark_oak_door", { ...door, half: "lower" });
g.set(dx0, FLOOR + 2, dz0, "dark_oak_door", { ...door, half: "upper" });
g.set(dx0, FLOOR + 3, dz0, GLASS);

// 6. warm light: glowstone on the floor just inside some panes (air behind the glass, so the lamp sits in the gap)
let lamps = 0;
for (let s = 0; s < STOREYS; s++) {
  for (const k of F.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!perim(x, z) || isPier(x, z) || (x === dx0 && z === dz0)) continue;
    if ((x * 7 + z * 3 + s * 5) % 9 !== 0) continue;
    const out = outward(x, z);
    if (out.length !== 1) continue;
    const [ox, oz] = out[0];
    const ix = x - ox, iz = z - oz;
    if (!inF(ix, iz) || perim(ix, iz)) continue;
    g.set(ix, FLOOR + STOREY * s + 1, iz, "glowstone"); lamps++;
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_401588411.nbt");
console.log(`way_401588411: ${g.count()} blocks, ${lamps} lamps, roof ${PARAPET + 1}, plant cells ${cells.filter(([, , , r]) => r >= 61).length}`);

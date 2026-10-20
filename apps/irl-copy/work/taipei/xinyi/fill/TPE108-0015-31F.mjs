import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE108-0015-31F: 2019 mixed-use office tower, Xinyi district, Taipei.
// Five storeys of 5 blocks (roof surface at y=25), white-frame glass curtain wall
// on a light-grey concrete base, a three-cell glazed entrance with canopy on the
// south face, and a central mechanical penthouse with a lightning mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE108-0015-31F";
const W = 43, H = 37, D = 51;
const ROOF_Y = 24;      // top course of storey 5 (roof surface at y=25)
const PARAPET_Y = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inFp = (x, z) => ground.has(`${x},${z}`);

// Outward faces: [name, dx, dz]
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const exposures = (x, z) => FACES.filter(([, dx, dz]) => !inFp(x + dx, z + dz));
const southExposed = (x, z) => exposures(x, z).some(([n]) => n === "S");

// Facade block for an exposed wall cell. a = position along the facade, y = height.
function facadeBlock(a, y) {
  const r = y % 5;
  if (r === 0) return "light_gray_concrete";          // floor line spandrel
  if (r === 4) return "white_concrete";               // sill/lintel course
  if (a % 3 === 0) return "smooth_quartz";            // mullion / pier
  return "light_blue_stained_glass";                  // glazing
}

// Entrance: south-facing edge cell nearest the centre line, prefer the southern row.
let entrance = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    if (!southExposed(x, z)) continue;
    const score = Math.abs(x - 21) * 100 - z;
    if (score < best) { best = score; entrance = [x, z]; }
  }
}
// Three-cell entrance bay: the entrance cell and its south-exposed neighbours on the same row.
const isEntranceBay = (x, z) =>
  entrance && z === entrance[1] && Math.abs(x - entrance[0]) <= 1 && southExposed(x, z);

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(ROOF_Y, gr0));

  // Foundation from y 0 up to this cell's ground (light stone so the base reads as plinth).
  for (let y = 0; y < gr; y++) g.set(x, y, z, "smooth_stone");

  const ex = exposures(x, z);

  if (ex.length === 0) {
    // Interior cell: floor slabs at each storey line, roof slab, no walls.
    g.set(x, gr, z, "light_gray_concrete");
    for (const L of [5, 10, 15, 20]) if (L > gr) g.set(x, L, z, "light_gray_concrete");
    g.set(x, ROOF_Y, z, "light_gray_concrete");
    continue;
  }

  // Edge cell: facade column from its ground up to the cornice.
  const [name, dx, dz] = ex[0];
  const a = (name === "N" || name === "S") ? x : z;
  const bay = isEntranceBay(x, z);

  if (bay) {
    // Glazed entrance: tinted glass doors, dark frame lintel, canopy slab above.
    g.set(x, gr, z, "tinted_glass");
    g.set(x, gr + 1, z, "tinted_glass");
    g.set(x, gr + 2, z, "dark_oak_planks");
    g.set(x, gr + 3, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }

  for (let y = gr; y <= ROOF_Y; y++) {
    if (bay && y <= gr + 3) continue;
    let id;
    if (y === gr) id = "light_gray_concrete";           // base course / plinth
    else if (y === ROOF_Y) id = "white_concrete";        // cornice
    else id = facadeBlock(a, y);
    g.set(x, y, z, id);
  }

  // Parapet on the roof edge.
  g.set(x, PARAPET_Y, z, "white_concrete");

  // Warm lights in the interior cell behind some windows (on the floor slab, y%5==1).
  const ix = x - dx, iz = z - dz;
  if (inFp(ix, iz) && exposures(ix, iz).length === 0 && a % 4 === 1) {
    for (let y = gr + 1; y <= ROOF_Y; y++) {
      if (y % 5 === 1) g.set(ix, y, iz, "glowstone");
    }
  }
}

// Mechanical penthouse, centred, standing on the roof slab.
{
  const x0 = 13, x1 = 29, z0 = 16, z1 = 34;
  const ok = (x, z) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && inFp(x, z);
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!ok(x, z)) continue;
      const ring = x === x0 || x === x1 || z === z0 || z === z1;
      g.set(x, 28, z, "smooth_quartz");                   // cap
      if (ring) {
        const corner = (x === x0 || x === x1) && (z === z0 || z === z1);
        g.set(x, 25, z, "light_gray_concrete");           // plinth
        for (let y = 26; y <= 27; y++) {
          g.set(x, y, z, corner || (x + z) % 3 === 0 ? "smooth_quartz" : "light_blue_stained_glass");
        }
      }
    }
  }
  // Mast on the centre of the penthouse cap.
  const cx = 21, cz = 25;
  if (inFp(cx, cz)) {
    for (let y = 29; y <= 31; y++) g.set(cx, y, cz, "iron_bars");
    g.set(cx, 32, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

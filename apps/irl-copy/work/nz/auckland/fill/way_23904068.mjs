// ANZ Centre, Auckland: a 1990s-era corporate tower (glass curtain wall, pale concrete spandrels, volcanic andesite base)
// on a lower podium, with stepped setbacks to a core crown. Lidar roof heights are smoothed into four flat tiers; storeys
// are 4 blocks, floors and spandrels sit on the absolute 4 k lines so every slab lines up across the sloping site.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23904068.cells.json", "utf8"));
const W = 48, D = 45, H = 184;
const GLASS = "light_blue_stained_glass_pane", TRIM = "light_gray_concrete", SPANDREL = "white_concrete", BASE = "polished_andesite";
const ROOF = "gray_concrete", PARAPET = "white_concrete", PLANT = "gray_concrete";

const key = (x, z) => `${x},${z}`;
// Lidar roof -> flat tier top (absolute y): podium 156, body 164, setbacks 168 and 170, core crown 172.
const tier = (R) => (R >= 171 ? 172 : R >= 169 ? 170 : R >= 166 ? 168 : R >= 157 ? 164 : 156);
const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(key(x, z), { g, T: tier(R) });
const cell = (x, z) => fp.get(key(x, z));
const DIRS = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const warm = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 11;

// A side at height y is exposed when the cell beside it is outside the footprint or stands lower than y (open sky).
const exposed = (x, z, y) => Object.values(DIRS).some(([dx, dz]) => {
  const nb = cell(x + dx, z + dz);
  return !nb || y >= nb.T;
});

// Entrance: the three lowest-ground bays on the east face, centred on the middle of the lowest run.
const eastRow = (z) => { let ex = -1; for (let x = 0; x < W; x++) if (cell(x, z)) ex = x; return ex; };
const eastFace = [];
for (let z = 0; z < D; z++) { const x = eastRow(z); if (x >= 0) eastFace.push({ x, z, g: cell(x, z).g }); }
const lowG = Math.min(...eastFace.map((c) => c.g));
const low = eastFace.filter((c) => c.g === lowG);
const mid = low[Math.floor(low.length / 2)].z;
const bay = new Map();
for (const dz of [-1, 0, 1]) { const x = eastRow(mid + dz); if (x >= 0) bay.set(key(x, mid + dz), { centre: dz === 0 }); }

const g = new Voxels([W, H, D]);

// Pass 1: foundation, tiers, floors, facade, entrance.
for (const [k, { g: gr, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);                     // foundation: solid up to this cell's ground
  const ent = bay.get(k);
  for (let y = gr; y < T; y++) {
    const ext = exposed(x, z, y);
    if (y === T - 1) { g.set(x, y, z, ROOF); continue; }                 // flat roof on every tier
    if (ent) {
      if (y === gr && ent.centre) g.set(x, y, z, "iron_door", { facing: "east", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 1 && ent.centre) g.set(x, y, z, "iron_door", { facing: "east", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === gr + 3) { g.set(x, y, z, BASE); if (cell(x - 1, z)) g.set(x - 1, y, z, BASE); }   // canopy, one bay deep
      else if (y === gr) g.set(x, y, z, BASE);
      else g.set(x, y, z, GLASS);                                         // shopfront glass and transom above the door
      continue;
    }
    if (y === gr && ext) { g.set(x, y, z, BASE); continue; }             // base course on the street
    if (y % 4 === 0) { g.set(x, y, z, ext ? SPANDREL : TRIM); continue; } // floor slab per storey (interior too)
    if (!ext) continue;                                                  // hollow behind the glass
    if (y % 4 === 3) g.set(x, y, z, SPANDREL);                           // white storey line above each window band
    else if ((x + z) % 3 === 0) g.set(x, y, z, TRIM);                    // grey mullions
    else g.set(x, y, z, GLASS);
  }
  if (exposed(x, z, T - 1)) g.set(x, T, z, PARAPET);                     // cornice on every tier's outer edge
}

// Pass 2: pane connections, warm lights behind some windows, a crown with lamps, a mast, and roof plant.
const at = (x, y, z) => g.get(x, y, z)?.block;
for (const [k, { g: gr, T }] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = gr; y < T - 1; y++) {
    if (at(x, y, z) !== GLASS) continue;
    const st = {};
    for (const [name, [dx, dz]] of Object.entries(DIRS)) { const b = at(x + dx, y, z + dz); st[name] = b === GLASS || b === TRIM ? "true" : "false"; }
    g.set(x, y, z, GLASS, st);
    if (y >= 4 && warm(x, y, z) === 0) {
      for (const [dx, dz] of Object.values(DIRS)) {
        if (cell(x + dx, z + dz) && y < cell(x + dx, z + dz).T) continue;   // only the side that faces out
        const ix = x - dx, iz = z - dz;
        if (cell(ix, iz) && !at(ix, y, iz)) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// Crown: the core's roof rim gets shroomlights, a lightning-rod mast on its centre.
const core = [...fp].filter(([, v]) => v.T === 172).map(([k]) => k.split(",").map(Number));
const cx = Math.round(core.reduce((s, c) => s + c[0], 0) / core.length), cz = Math.round(core.reduce((s, c) => s + c[1], 0) / core.length);
for (const [x, z] of core) if (exposed(x, z, 171) && warm(x, 172, z) % 3 === 0) g.set(x, 172, z, "shroomlight");
for (let y = 172; y < 177; y++) g.set(cx, y, cz, "lightning_rod", { facing: "up", powered: "false" });

// Roof plant: two 5 x 3 gray boxes on the body's roof, inside the body where every neighbour is body too.
const body = (x, z) => cell(x, z)?.T === 164;
const plant = [];
const fits = (x0, z0) => { for (let x = x0 - 1; x <= x0 + 5; x++) for (let z = z0 - 1; z <= z0 + 3; z++) if (!body(x, z)) return false; return true; };
for (let z0 = 6; z0 < D && plant.length < 2; z0++) for (let x0 = 4; x0 < W && plant.length < 2; x0++) {
  if (!fits(x0, z0)) continue;
  if (plant.some(([px, pz]) => Math.abs(px - x0) < 8 && Math.abs(pz - z0) < 6)) continue;
  plant.push([x0, z0]);
}
for (const [x0, z0] of plant) for (let x = x0; x < x0 + 5; x++) for (let z = z0; z < z0 + 3; z++) for (let y = 164; y < 167; y++) g.set(x, y, z, PLANT);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23904068.nbt";
const { blocks, palette } = g.save(out);
console.log(`ANZ Centre: ${blocks} blocks, ${palette} palette entries, ${plant.length} roof plant boxes, entrance on the east face at z ${mid}`);

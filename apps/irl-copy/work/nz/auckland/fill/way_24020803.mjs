// Viaduct House, Viaduct Harbour, Auckland: a four-storey waterfront mixed-use block (2000s, the America's Cup
// precinct rebuild). Deepslate base, white plaster walls with quartz piers, glazed shopfronts, a black fascia, light
// grey floor bands, a smooth quartz cornice, a plant core on the 18-block tier, and a planted light court at the heart.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_24020803.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 35, D = 47, H = 31;
const g = new Voxels([W, H, D]);

// Palette
const BASE = "polished_deepslate", PLATE = "white_concrete", PIER = "smooth_quartz", GLASS = "light_blue_stained_glass";
const FLOOR = "light_gray_concrete", FASCIA = "black_concrete", CORNICE = "smooth_quartz", COURT = "stone_bricks";

// Lidar roof heights smoothed to two flat tiers: the four storeys (top 16) and the plant core (top 18).
const TOP_STD = 16, TOP_CORE = 18;
const grid = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { x, z, ground: gr, roof: r }]));
const isBody = (x, z) => { const c = grid.get(`${x},${z}`); return !!c && c.roof >= 2; };
const topOf = (c) => (c.roof >= 18 ? TOP_CORE : TOP_STD);

// Exposed faces: a body cell with a neighbour that is outside the footprint or in the open court.
// Each face: outward normal, the along-face axis (u), and the direction pointing inward.
const FACES = [
  { name: "N", dx: 0, dz: -1, u: (c) => c.x },   // front (street side, low z)
  { name: "S", dx: 0, dz: 1, u: (c) => c.x },
  { name: "W", dx: -1, dz: 0, u: (c) => c.z },
  { name: "E", dx: 1, dz: 0, u: (c) => c.z },
];
const exposed = (c) => FACES.filter((f) => !isBody(c.x + f.dx, c.z + f.dz));

// Ground floor entrance: the middle of the street-facing (N) run, on a shell cell.
const northCells = cells.map(([x, z]) => ({ x, z })).filter((c) => isBody(c.x, c.z) && !isBody(c.x, c.z - 1));
const midX = northCells.reduce((s, c) => s + c.x, 0) / northCells.length;
const door = northCells.reduce((best, c) => (Math.abs(c.x - midX) < Math.abs(best.x - midX) ? c : best));

// A small deterministic hash so the lit windows scatter without looking random.
const hash = (a, b, c) => Math.abs((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) % 7;

// Court cells: paved open ground, no building above.
for (const c of grid.values()) {
  if (c.roof <= 1) { g.set(c.x, 0, c.z, COURT); }
}

for (const c of grid.values()) {
  if (c.roof < 2) continue;
  const top = topOf(c);
  const faces = exposed(c);
  const shell = faces.length > 0;
  const face = faces[0];                                  // a corner keeps its first face for the pattern
  const u = face ? face.u(c) : 0;
  const pier = !face || faces.length > 1 || u % 4 === 0;  // corners and every fourth bay are piers
  const inward = face ? { x: c.x - face.dx, z: c.z - face.dz } : null;

  for (let y = 0; y < top; y++) {
    let b = null;
    if (y < c.ground) b = BASE;                           // foundation: solid from y 0 up to the cell's ground
    else if (y === 0) b = shell ? BASE : FLOOR;           // base course / ground slab
    else if (y === 3) b = shell ? FASCIA : null;          // ground fascia
    else if (y === 4 || y === 8 || y === 12) b = shell ? FLOOR : FLOOR;   // storey floor slabs (solid across)
    else if (y === 15) b = shell ? PLATE : FLOOR;         // roof slab under the cornice
    else if (y === 16) {
      if (top === TOP_CORE) b = FLOOR;                    // plant room floor on the 18-block core
      else b = shell ? CORNICE : null;                    // parapet cornice on the 16-block tiers
    } else if (y === 17) {
      if (top === TOP_CORE && shell) b = u % 4 === 0 ? PLATE : "glass";   // louvred plant screen
    } else if (y <= 2 || (y >= 5 && y <= 14)) {           // window bands: storey 0 shopfront, storeys 1-3 windows
      if (!shell) b = null;
      else if (y <= 2) b = pier ? PIER : GLASS;
      else b = pier ? PLATE : GLASS;
    } else b = null;

    // Storey headers and cornice bands over the windows (layers 7 and 11) carry the plate colour on shell cells.
    if ((y === 7 || y === 11) && shell) b = PLATE;
    if ((y === 7 || y === 11) && !shell) b = null;

    if (b) g.set(c.x, y, c.z, b);
  }
  // Floor slabs run through the interior at the storey lines (not left open to the air).
  if (!shell) {
    for (const y of [4, 8, 12]) g.set(c.x, y, c.z, FLOOR);
    g.set(c.x, 15, c.z, FLOOR);
  }
}

// Entrance: a pair of oak doors in the street shell, flanked by quartz piers, under the black fascia.
{
  const { x, z } = door;
  g.set(x, 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) if (isBody(x + dx, z)) { g.set(x + dx, 1, z, PIER); g.set(x + dx, 2, z, PIER); }
}

// Warm light: glowstone and shroomlight in some upper windows, lanterns on the shop floors behind the glass.
for (const c of grid.values()) {
  if (c.roof < 2) continue;
  const faces = exposed(c);
  if (!faces.length || faces.length > 1) continue;      // one window face per shell cell
  const f = faces[0];
  const ix = c.x - f.dx, iz = c.z - f.dz;               // the interior cell behind this window
  if (!isBody(ix, iz) || exposed({ x: ix, z: iz }).length) continue;
  for (const y of [1, 2, 5, 6, 9, 10, 13, 14]) {
    const k = hash(c.x, c.z, y);
    if (y <= 2 && k === 0) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    else if (y > 2 && k === 1) g.set(ix, y, iz, y < 9 ? "glowstone" : "shroomlight");
  }
}

const info = g.save(`${HERE}/way_24020803.nbt`);
console.log(JSON.stringify({ footprint: cells.length, door: { x: door.x, z: door.z }, ...info }));

// 601 Massachusetts Ave NW (Commercial-Office-Large), built from the lidar record in DC77426.cells.json.
// Massing: lidar roof 1-3 over most of the footprint = one-storey lower wings; the 28-32 diagonal spine at
// the east side becomes a 10-storey tower on a 3-storey podium with setbacks; the 34-35 spike at the north
// edge is a narrow corner tower. Storeys are 3 blocks: a spandrel band, then two rows of glass.
// Walls are one block thick with an air gap behind the glass and a slab per storey. Every column is solid
// from y 0 up to its own ground, then its storeys, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77426.cells.json`, "utf8"));

const X = 51, Z = 26, Y = 47;
const cell = new Map();                                    // "x,z" -> { g, r } (ground, lidar roof)
for (const [x, z, g, r] of cells) cell.set(`${x},${z}`, { g, r });
const inFp = (x, z) => cell.has(`${x},${z}`);

// Target roof heights by rectangle (x0,x1,z0,z1, inclusive). Later rules override earlier ones.
const TIERS = [
  [[0, 50, 0, 25], 3],       // lower wings: one storey on the lidar's 1-3
  [[34, 50, 6, 18], 9],      // east podium, three storeys
  [[38, 49, 8, 16], 21],     // tower core, setback from the podium
  [[41, 47, 9, 14], 30],     // crown of the spine (lidar 28-32)
  [[43, 46, 10, 12], 33],    // lift and plant core
  [[6, 14, 0, 5], 6],        // north-west podium
  [[8, 12, 0, 3], 21],       // north-west shaft
  [[9, 11, 0, 1], 33],       // north-west corner tower (lidar 34-35 at the north edge)
];
const target = (x, z) => {
  let t = 3;
  for (const [[x0, x1, z0, z1], h] of TIERS) if (x >= x0 && x <= x1 && z >= z0 && z <= z1) t = h;
  return t;
};
// Storeys stand on the ground: top = g + 3n, n >= 1, n = whole storeys below the target.
const info = new Map();
for (const [key, { g, r }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const n = Math.max(1, Math.floor((target(x, z) - g) / 3));
  info.set(key, { x, z, g, n, top: g + 3 * n });
}
const topAt = (x, z) => info.get(`${x},${z}`).top;
const DIRS = { E: [1, 0], W: [-1, 0], S: [0, 1], N: [0, -1] };
// a side is exposed (wall) when the neighbour is outside the footprint or stands lower
const exposed = (x, z) => Object.fromEntries(Object.entries(DIRS).map(([d, [dx, dz]]) => {
  const nx = x + dx, nz = z + dz;
  return [d, !inFp(nx, nz) || topAt(nx, nz) < topAt(x, z)];
}));

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, b, s) => g.set(x, y, z, b, s);
const PANE = (ew) => ({ north: String(!ew), south: String(!ew), east: String(ew), west: String(ew), waterlogged: "false" });

// palette
const FOUND = "stone_bricks", BASE = "polished_andesite", WALL = "white_concrete", BAND = "light_gray_concrete";
const PIER = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "stone", CORNICE = "smooth_quartz";
const GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane", HVAC = "iron_block";

for (const { x, z, g: gr, n, top } of info.values()) {
  const ex = exposed(x, z);
  const wall = ex.N || ex.S || ex.E || ex.W;
  const exZ = ex.N || ex.S, exX = ex.E || ex.W;

  for (let y = 0; y < gr; y++) set(x, y, z, FOUND);                 // foundation up to this cell's ground
  for (let k = 0; k <= n; k++) {                                     // storey slabs, base course, cornice / roof
    const y = gr + 3 * k;
    if (!wall) set(x, y, z, FLOOR);
    else if (k === 0) set(x, y, z, BASE);
    else if (k === n) set(x, y, z, CORNICE);
    else set(x, y, z, BAND);
  }
  if (!wall) set(x, top, z, ROOF);
  if (wall) set(x, top + 1, z, CORNICE);                             // parapet on the wall line

  if (!wall) continue;
  for (let k = 0; k < n; k++) {
    for (const dy of [1, 2]) {
      const y = gr + 3 * k + dy;
      if (exX && exZ) { set(x, y, z, PIER); continue; }             // corner pier
      const idx = exZ ? x : z;                                       // along the street face
      const ground = k === 0;
      // main entrance: two double doors in the north face, middle of the front
      if (ex.N && z === 0 && (x === 24 || x === 25) && ground) {
        set(x, y, z, "dark_oak_door", {
          facing: "north", half: dy === 1 ? "lower" : "upper", hinge: x === 24 ? "left" : "right",
          open: "false", powered: "false",
        });
        continue;
      }
      if (idx % 3 === 0) { set(x, y, z, PIER); continue; }           // mullion / pier every third cell
      set(x, y, z, ground ? SHOP : GLASS, PANE(exZ));
      // warm light behind some panes: the inward cell is air, so it reads through the glass
      if (dy === 1 && !ground && (idx + k) % 5 === 2) {
        const [ix, iz] = ex.N ? [x, z + 1] : ex.S ? [x, z - 1] : ex.E ? [x - 1, z] : [x + 1, z];
        const iex = inFp(ix, iz) ? exposed(ix, iz) : null;
        if (iex && !Object.values(iex).some(Boolean)) {
          set(ix, gr + 3 * k + 1, iz, (idx + k) % 10 === 2 ? "shroomlight" : "glowstone");
        }
      }
    }
  }
  // ground-floor lanterns just inside the entrance
  if (z === 1 && (x === 23 || x === 26)) set(x, info.get(`${x},${z}`).g + 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  // roof plant on a loose grid, kept off the parapet line
  if (!wall && (x * 7 + z * 3) % 23 === 0 && x > 2 && x < 48) set(x, top + 1, z, HVAC);
}
const summary = g.save(`${DIR}/DC77426.nbt`);
console.log(JSON.stringify(summary));

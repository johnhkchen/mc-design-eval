import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const raw = JSON.parse(readFileSync(`${DIR}/NYC1090791.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 18, H = 68, D = 40;
const g = new Voxels([W, H, D]);

// ---- footprint --------------------------------------------------------------
const FP = new Map();
const kxz = (x, z) => `${x},${z}`;
for (const [x, z, gr, roof] of list) {
  FP.set(kxz(x, z), { x, z, gr: Math.round(gr), roofRaw: roof });
}
const inFP = (x, z) => FP.has(kxz(x, z));
const cellsArr = [...FP.values()];

// north = -z (low-z street face), south = +z, east = +x, west = -x
const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
];

// Building-wide storey grid: window rows and spandrel rows share one parity
const grounds = cellsArr.map(c => c.gr).sort((a, b) => a - b);
const B = grounds[Math.floor(grounds.length / 2)] + 1;

// ---- smooth lidar roof into clean even tiers --------------------------------
for (const c of cellsArr) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = FP.get(kxz(c.x + dx, c.z + dz));
    if (o) { s += o.roofRaw; n++; }
  }
  const avg = s / n;
  c.top = Math.min(H - 8, Math.max(c.gr + 6, Math.round(avg / 2) * 2));
}

// ---- deferred writes (so entrance and details can override) -----------------
const vox = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  vox.set((x * H + y) * D + z, [x, y, z, id, props]);
};

const isWindowRow = (y) => (((y - B) % 2) + 2) % 2 === 0;
const litHash = (x, y, z) => (x * 7 + y * 13 + z * 31) % 3 === 0;
const isFacadeCell = (x, z) => DIRS.some(d => !inFP(x + d.dx, z + d.dz));

// ---- main massing -----------------------------------------------------------
for (const c of cellsArr) {
  const { x, z, gr, top } = c;
  const outward = DIRS.filter(d => !inFP(x + d.dx, z + d.dz));
  const isFac = outward.length > 0;
  const corner = outward.length >= 2;

  // foundation fill from y0 up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  // base course: rough limestone plinth on the street
  put(x, gr, z, isFac ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y < top; y++) {
    if (y === top - 1) {
      // roof parapet coping (limestone) / roof deck
      put(x, y, z, isFac ? "smooth_stone" : "gray_concrete");
      continue;
    }
    if (!isWindowRow(y)) {
      // precast spandrel / floor slab: smooth pale band, carries the storey above
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (!isFac) continue; // interior air behind glass

    // facade window row
    const d0 = outward[0];
    const col = d0.dz !== 0 ? x : z; // along-facade index
    const pier = corner || col % 3 === 0;
    // piers: stone_bricks (reads as stone mullions); glass: light blue aluminium-framed tint
    put(x, y, z, pier ? "stone_bricks" : "light_blue_stained_glass");

    // warm light in lit apartments, just behind the glass
    if (!pier && litHash(x, y, z)) {
      const ix = x - d0.dx, iz = z - d0.dz;
      if (inFP(ix, iz)) {
        const inner = FP.get(kxz(ix, iz));
        if (inner && !isFacadeCell(ix, iz) && y < inner.top - 1) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// ---- rooftop mechanical bulkhead on the core --------------------------------
for (const c of cellsArr) {
  const { x, z, top } = c;
  const core = x >= 5 && x <= W - 6 && z >= 6 && z <= D - 7;
  if (!core) continue;
  for (let y = top; y <= top + 3; y++) put(x, y, z, "bricks");
  put(x, top + 4, z, "smooth_stone");
  if (x % 3 === 0 && z % 4 === 0) put(x, top + 1, z, "iron_bars");
}

// ---- entrance on the low-z (north) street face ------------------------------
const zMin = Math.min(...cellsArr.map(c => c.z));
const frontCells = cellsArr.filter(c => c.z === zMin).sort((a, b) => a.x - b.x);
if (frontCells.length) {
  const cx = frontCells[Math.floor(frontCells.length / 2)].x;
  const door = FP.get(kxz(cx, zMin));
  const grc = door.gr;

  // three-bay entrance: iron door centre, glass flanks, hanging lanterns
  put(cx, grc + 1, zMin, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(cx, grc + 2, zMin, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 1]) {
    const f = FP.get(kxz(cx + dx, zMin));
    if (!f) continue;
    put(cx + dx, f.gr + 1, zMin, "light_blue_stained_glass");
    put(cx + dx, f.gr + 2, zMin, "light_blue_stained_glass");
  }
  // canopy: dark slab band across the entrance bay, one row above the door head
  for (const dx of [-2, -1, 0, 1, 2]) {
    const f = FP.get(kxz(cx + dx, zMin));
    if (!f) continue;
    put(cx + dx, f.gr + 3, zMin, "black_concrete");
  }
  // hanging lanterns from the canopy edge (lit entrance at dusk)
  for (const dx of [-2, 2]) {
    const f = FP.get(kxz(cx + dx, zMin));
    if (!f) continue;
    put(cx + dx, f.gr + 2, zMin, "lantern", { hanging: "true", waterlogged: "false" });
  }
  // lobby light behind the door
  if (inFP(cx, zMin + 1)) {
    put(cx, grc + 1, zMin + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- write -----------------------------------------------------------------
for (const [x, y, z, id, props] of vox.values()) {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

g.save(`${DIR}/NYC1090791.nbt`);

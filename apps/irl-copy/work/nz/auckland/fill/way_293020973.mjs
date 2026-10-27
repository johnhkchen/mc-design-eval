// Way 293020973: a 1930s brick-and-render commercial block (Art Deco cornice, cream render, shopfronts at street level),
// stepped from the lidar roof heights into three tiers: a 2-storey wing, a 3-storey block, and a 4-storey tower
// with a penthouse. Walls run from each cell's ground to the tier's cornice, so the low side shows its extra storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020973.cells.json`, "utf8"));

const [W, H, D] = [35, 30, 39];
const g = new Voxels([W, H, D]);

// Materials
const FOUNDATION = "stone_bricks", CORNICE = "stone_bricks", BASE = "stone_bricks";
const WALL = "smooth_quartz", STRING = "smooth_stone", ROOF = "gray_concrete";
const GLASS = "light_blue_stained_glass";
const PIER = { axis: "y" };             // quartz_pillar

// Storey lines (absolute y: the floor slab's row); a band runs from one line to the next, 4 blocks each
const FLOORS = [6, 10, 14];
// Tier tops (cornice row = tier - 1): 2, 3 and 4 storeys, the lidar roof snapped to them
const tierOf = (roof) => (roof <= 11 ? 10 : roof <= 15 ? 14 : 17);

const cell = new Map();
for (const [x, z, gr, roof] of cells) cell.set(`${x},${z}`, { x, z, gr, tier: tierOf(roof) });
const at = (x, z) => cell.get(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OPP = { N: "S", S: "N", W: "E", E: "W" };
const FACE = { N: "north", S: "south", W: "west", E: "east" };

// The faces a cell shows: the outside, or a lower tier (the wall of a setback)
const exposure = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = at(c.x + dx, c.z + dz); return !n || n.tier < c.tier; }).map(([d]) => d);

// The door: the street front (north, the lowest z edge) nearest the middle, on a cell whose ground floor is clear of the foundation
const doorCands = [...cell.values()].filter((c) => c.gr <= 3 && exposure(c).includes("N"));
const door = doorCands.sort((a, b) => Math.abs(a.x - 17) - Math.abs(b.x - 17))[0];
const doorU = door.x;

// Tower penthouse: distance from the tower's edge, cells 3 or more in
const dist = new Map();
let frontier = [...cell.values()].filter((c) => c.tier === 17 && exposure(c).length);
for (const c of frontier) dist.set(`${c.x},${c.z}`, 1);
while (frontier.length) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of Object.values(DIRS)) {
    const n = at(c.x + dx, c.z + dz); const k = `${c.x + dx},${c.z + dz}`;
    if (n && n.tier === 17 && !dist.has(k)) { dist.set(k, dist.get(`${c.x},${c.z}`) + 1); next.push(n); }
  }
  frontier = next;
}
const penthouse = (c) => c.tier === 17 && (dist.get(`${c.x},${c.z}`) ?? 0) >= 3;

// Warm light candidates: a window's interior neighbour (the air behind the glass)
const windows = [];

for (const c of cell.values()) {
  const { x, z, gr, tier: T } = c;
  // foundation: solid from y 0 to the cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUNDATION);
  const ex = exposure(c);

  if (!ex.length) {
    // interior: a floor slab at the ground and at each storey line, air between, the roof closing the top
    g.set(x, gr, z, WALL);
    for (const L of FLOORS) if (L > gr && L < T - 1) g.set(x, L, z, WALL);
    g.set(x, T - 1, z, ROOF);
    if (T === 10 && (x * 3 + z) % 7 === 0) g.set(x, T, z, "iron_block");   // roof plant on the wing
    // the penthouse's walls, one cell in from its edge, glazed on the middle row, its cornice on top
    if (penthouse(c) && dist.get(`${x},${z}`) === 3) {
      for (let y = T; y <= 19; y++) g.set(x, y, z, y === 18 && x % 3 !== 0 ? GLASS : WALL);
      g.set(x, 20, z, CORNICE);
    }
    continue;
  }

  // shell: the wall, one cell thick, from the ground to the cornice
  const ns = ex.includes("N") || ex.includes("S");
  const ew = ex.includes("W") || ex.includes("E");
  const corner = ns && ew;
  const u = ns ? x : z;                    // position along the face
  const pier = corner || u % 3 === 0;
  const isDoor = c === door;
  const outward = ex.find((d) => d === "N" || d === "S" || d === "W" || d === "E");
  const inward = ex.length === 1 ? OPP[outward] : null;

  for (let y = gr; y < T; y++) {
    if (y === T - 1) { g.set(x, y, z, CORNICE); continue; }                 // cornice
    if (FLOORS.includes(y)) { g.set(x, y, z, STRING); continue; }          // string course
    if (y === gr) { g.set(x, y, z, BASE); continue; }                      // base course
    const bandBase = [gr, ...FLOORS].filter((b) => b <= y).pop();
    const r = y - bandBase;
    const shopfront = bandBase === gr && gr < 6;
    const glassRow = shopfront ? r >= 1 && r <= 3 : r >= 1 && r <= 2;

    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      g.set(x, y, z, "dark_oak_door", { facing: FACE[outward], half: y === gr + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoor && y === gr + 3) { g.set(x, y, z, "dark_oak_slab", { type: "bottom" }); continue; }   // canopy band
    if (ex.length === 1 && ns && !isDoor && Math.abs(u - doorU) <= 1 && door && outward === "N" && y === gr + 3) {
      g.set(x, y, z, "dark_oak_slab", { type: "bottom" }); continue;
    }
    if (pier) { g.set(x, y, z, "quartz_pillar", PIER); continue; }
    if (glassRow) {
      g.set(x, y, z, GLASS);
      if (inward) windows.push({ x, y, z, inward, shop: shopfront });
      continue;
    }
    g.set(x, y, z, WALL);
  }
  // the door's lantern just inside
  if (isDoor) g.set(x + DIRS[inward ?? "S"][0], gr + 1, z + DIRS[inward ?? "S"][1], "lantern");

}

// Penthouse: a roof slab over the cells inside its wall
for (const c of cell.values()) if (penthouse(c)) {
  const { x, z } = c;
  if (dist.get(`${x},${z}`) > 3) g.set(x, 20, z, ROOF);
}

// Warm light: a few windows lit from inside (glowstone or shroomlight behind the glass)
for (const w of windows) {
  const [dx, dz] = DIRS[w.inward];
  const n = at(w.x + dx, w.z + dz);
  if (!n || exposure(n).length) continue;          // only the interior cell behind the glass
  if (FLOORS.includes(w.y)) continue;
  const h = (w.x * 3 + w.z * 5 + w.y) % 11;
  if (h === 0 || h === 5) g.set(n.x, w.y, n.z, "glowstone");
  else if (h === 8 && !w.shop) g.set(n.x, w.y, n.z, "shroomlight");
}

g.save(`${DIR}/way_293020973.nbt`);

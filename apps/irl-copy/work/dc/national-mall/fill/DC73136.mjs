import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1100 O St NW: a 1920s-style masonry office block. A 3-storey red-brick main block (roof 7) with an
// L-set 2-storey wing (roof 5), limestone bands and cornice, brick piers in glass bays, and a set-back
// penthouse (roof 10) with a copper plant unit.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC73136.cells.json`, "utf8"));

const g = new Voxels([18, 19, 22]);

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, gr, roof]) => [key(x, z), { x, z, g: gr, r: roof }]));
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const TOP_PEN = 9;

// Penthouse: the roof-7 part at least 4 cells in from the footprint edge (a setback tier on the roof).
const dist = new Map(), queue = [];
for (const { x, z } of cell.values()) {
  if (Object.values(DIRS).some(([dx, dz]) => !cell.has(key(x + dx, z + dz)))) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of Object.values(DIRS)) {
    const k = key(x + dx, z + dz);
    if (cell.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const PEN = new Set([...cell.values()].filter((c) => c.r === 7 && dist.get(key(c.x, c.z)) >= 4).map((c) => key(c.x, c.z)));
const isPen = (x, z) => PEN.has(key(x, z));

// The building's solid envelope: every column from y 0 to its roof (foundation included), plus the penthouse.
const solid = (x, z, y) => {
  const c = cell.get(key(x, z));
  if (!c) return false;
  if (y <= c.r - 1) return true;
  return y >= 7 && y <= TOP_PEN && isPen(x, z);
};
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => { const [dx, dz] = DIRS[d]; return !solid(x + dx, z + dz, y); });

const isRoofLevel = (c, y) => y === c.r - 1 || (isPen(c.x, c.z) && y === TOP_PEN);
const isFloorLevel = (c, y) => (isPen(c.x, c.z) ? y === 7 : y > 0 && y < c.r - 1 && y % 2 === 0);

const paneState = (exp) => {
  const alongX = exp.includes("N") || exp.includes("S");   // a wall running east-west: the pane joins east and west
  return alongX
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };
};

// ---- main pass: foundation, base, floors, bands, cornice, brick piers and glass bays ----
const MAX_Y = 10;
for (const c of cell.values()) {
  const { x, z, g: gr } = c;
  for (let y = 0; y <= MAX_Y; y++) {
    if (!solid(x, z, y)) continue;
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                        // foundation under the ground
    const exp = exposed(x, z, y), shell = exp.length > 0;
    const corner = exp.some((d) => d === "E" || d === "W") && exp.some((d) => d === "N" || d === "S");
    if (isRoofLevel(c, y)) { g.set(x, y, z, shell ? "calcite" : "stone"); continue; }  // cornice / roof deck
    if (y === gr && !isPen(x, z)) { g.set(x, y, z, shell ? "polished_granite" : "smooth_stone"); continue; } // base course / ground floor slab
    if (isFloorLevel(c, y)) { g.set(x, y, z, shell ? "bricks" : "smooth_stone"); continue; }                // brick spandrel / floor slab
    if (!shell) continue;                                                             // interior: air gap
    if (corner) { g.set(x, y, z, "calcite"); continue; }                              // quoin
    const t = exp.includes("N") || exp.includes("S") ? x : z;                          // position along the wall
    if (t % 3 === 0) { g.set(x, y, z, "calcite"); continue; }                          // limestone pier
    g.set(x, y, z, "light_blue_stained_glass_pane", paneState(exp));                  // glass in its bay
    // a warm light a step inside, in some windows
    if ((t + y) % 6 === 1) {
      const [dx, dz] = (exp.includes("N") ? DIRS.S : exp.includes("S") ? DIRS.N : exp.includes("W") ? DIRS.E : DIRS.W);
      const ix = x + dx, iz = z + dz;
      if (cell.has(key(ix, iz)) && exposed(ix, iz, y).length === 0 && y !== (isPen(ix, iz) ? 7 : gr)) g.set(ix, y, iz, "glowstone");
    }
  }
}

// ---- entrance on the north face: a glass-and-iron door, two lanterns hung under the cornice band ----
const northFace = [...cell.values()].filter((c) => c.g === 0 && c.r === 7 && !cell.has(key(c.x, c.z - 1)) && cell.has(key(c.x - 1, c.z)) && cell.has(key(c.x + 1, c.z)));
const mid = northFace.reduce((s, c) => s + c.x, 0) / northFace.length;
const door = northFace.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
const { x: dX, z: dZ } = door;
g.set(dX, 0, dZ, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dX, 1, dZ, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const dx of [-1, 1]) g.set(dX + dx, 1, dZ, "lantern", { hanging: "true", waterlogged: "false" });

// ---- penthouse plant: copper units on the penthouse roof, standing on its cap ----
for (const c of cell.values()) {
  if (!isPen(c.x, c.z) || exposed(c.x, c.z, TOP_PEN).length > 0) continue;
  if (c.x % 5 <= 1 && c.z % 6 <= 1 && c.x % 5 >= 0) g.set(c.x, TOP_PEN + 1, c.z, "copper_block");
}

const counts = g.save(`${DIR}/DC73136.nbt`);
console.log(`built DC73136: penthouse ${PEN.size} cells, door at x ${dX} z ${dZ}; ${counts.blocks} blocks, ${counts.palette} palette entries`);

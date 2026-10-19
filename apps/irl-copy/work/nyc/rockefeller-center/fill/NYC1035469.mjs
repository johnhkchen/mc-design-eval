// 11 East 51st Street, Bank of Venezuela, 1906 commercial and office building (NYC individual landmark): a Beaux-Arts
// office block of about nine storeys on an L-shaped plot. Footprint 8 x 28 (x across, low z = north = the street front).
// The lidar's tall mass (roof 28) is read as a tower on a podium: its outer ring is a 12-block podium and the tower
// rises to 28 inside it, so the tower steps in from the edges. A one-storey banking hall (roof 1-3, lidar at grade)
// fills the north half, and the open ground (roof 0 or at grade) stays paved courts. The north and east faces are
// Indiana-style limestone (calcite, polished granite base, cream string courses and a cornice); the south and west
// faces are red brick on a stone base. Glass sits one block out from a solid core, with an air pocket behind it and a
// solid floor slab at every storey line (no interiors). Some panes have warm glowstone behind them. The entrance is a
// bronze-style iron door in the banking hall's north front, under a stone lintel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035469.cells.json`, "utf8"));
const X = 8, Z = 28, Y = 32;

const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFoot = (x, z) => cell.has(key(x, z));
const cols = cells.map(([x, z]) => [x, z]);
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// 1. Tall mass: lidar roof 20 or more, with at least two tall neighbours (drops single noisy spikes such as (2, 6)).
const tallRaw = (x, z) => inFoot(x, z) && cell.get(key(x, z)).roof >= 20;
const tall = new Set();
for (const [x, z] of cols) if (tallRaw(x, z) && N8.filter(([dx, dz]) => tallRaw(x + dx, z + dz)).length >= 2) tall.add(key(x, z));
// A tall run must be at least two cells wide: a single-cell spike (the east strip, the lone cell at (2, 7)) is dropped,
// and so is the run it hangs from, until none is left.
for (let cut = true; cut; ) {
  cut = false;
  for (const k of [...tall]) {
    const [x, z] = k.split(",").map(Number);
    if ([[0, -1], [0, 1], [-1, 0], [1, 0]].filter(([dx, dz]) => tall.has(key(x + dx, z + dz))).length < 2) { tall.delete(k); cut = true; }
  }
}

// Distance in from the tall mass's edge: 1 on the edge, 2 and more inside it.
const ring = new Map();
let frontier = [];
for (const k of tall) {
  const [x, z] = k.split(",").map(Number);
  if (N8.some(([dx, dz]) => !tall.has(key(x + dx, z + dz)))) { ring.set(k, 1); frontier.push([x, z]); }
}
for (let r = 1; frontier.length; r++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of N8) {
    const k = key(x + dx, z + dz);
    if (tall.has(k) && !ring.has(k)) { ring.set(k, r + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// 2. Tops (block height above y 0). Podium 12 on the edge, tower 28 inside it. Lidar above grade on ground 0 or 1 is the
// one-storey banking hall (ground + 3); anything else in the footprint is a paved court.
const topOf = (x, z) => {
  const k = key(x, z);
  if (tall.has(k)) return ring.get(k) === 1 ? 12 : 28;   // the edge of the tall mass is a podium; the rest rises
  const { ground, roof } = cell.get(k);
  if (ground <= 1 && roof >= 1) return ground + 3;
  return ground;                                   // court: no building, paving at ground - 1
};
const top = new Map(cols.map(([x, z]) => [key(x, z), topOf(x, z)]));
const groundOf = (x, z) => cell.get(key(x, z)).ground;
const topAt = (x, z) => (inFoot(x, z) ? top.get(key(x, z)) : 0);
const solid = (x, y, z) => y >= 0 && y < topAt(x, z);            // foundations and buildings
const isBuilding = (x, z) => inFoot(x, z) && topAt(x, z) > groundOf(x, z);
// Which outward faces of a voxel show to the air (not solid next door). Only above the foundation.
const facesOf = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([d]) => d);

const g = new Voxels([X, Y, Z]);
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm panes

// 3. Solid mass: foundation from y 0 to each cell's ground, the building core, a roof covering (or a cornice cap where
// the top is exposed), and paving on the courts.
for (const [x, z] of cols) {
  const t = top.get(key(x, z)), gr = groundOf(x, z);
  for (let y = 0; y < t; y++) g.set(x, y, z, "stone_bricks");
  if (!isBuilding(x, z)) { if (t > 0) g.set(x, t - 1, z, "smooth_stone"); continue; }
  const exposed = facesOf(x, t - 1, z).length > 0;
  g.set(x, t - 1, z, exposed ? "smooth_quartz" : "gray_concrete");   // cornice cap or flat roof covering
}

// 4. Facades. Street faces (N, E) are limestone; the rear and side walls (S, W) are brick. Storey lines are solid
// string courses at every absolute y divisible by 3; the base (first three blocks above ground) has a granite plinth
// and shopfront glass where the piers allow. Piers are one block in every three; the rest is glass.
const glassState = (d) => (d === "N" || d === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const windows = [];
for (const [x, z] of cols) {
  if (!isBuilding(x, z)) continue;
  const t = top.get(key(x, z)), gr = groundOf(x, z);
  for (let y = gr; y < t - 1; y++) {
    for (const d of facesOf(x, y, z)) {
      const street = d === "N" || d === "E";
      const rel = y - gr;
      const u = d === "N" || d === "S" ? x : z;
      const pier = street ? "calcite" : "bricks";
      if (y % 3 === 0 && rel > 0) { g.set(x, y, z, street ? "smooth_quartz" : "smooth_stone"); continue; }
      if (rel < 3) {
        if (street && rel >= 1 && u % 3 !== 0) { windows.push([x, y, z, d, true]); g.set(x, y, z, "glass_pane", glassState(d)); continue; }
        g.set(x, y, z, street ? "polished_granite" : "stone_bricks");
        continue;
      }
      if (u % 3 === 0) { g.set(x, y, z, pier); continue; }
      windows.push([x, y, z, d, false]);
      g.set(x, y, z, "glass_pane", glassState(d));
    }
  }
}

// 5. Air pockets behind the glass (one block in, not on a storey line, so the slabs stay), with warm glowstone in some.
for (const [x, y, z, d, shop] of windows) {
  const [dx, dz] = DIRS[d];
  const ix = x - dx, iz = z - dz;
  if (!isBuilding(ix, iz) || y >= topAt(ix, iz) - 1) continue;
  const u = d === "N" || d === "S" ? x : z;
  if (lit(u, y, shop ? 1 : 2)) g.set(ix, y, iz, "glowstone");
  else g.set(ix, y, iz, "air");
}

// 6. Entrance: an iron door in the banking hall's north front (lower and upper halves), with polished granite jambs.
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
const dx0 = 4, dz0 = 2;
const hallG = groundOf(dx0, dz0);
g.set(dx0 - 1, hallG, dz0, "polished_granite");
g.set(dx0 + 1, hallG, dz0, "polished_granite");
g.set(dx0, hallG, dz0, "iron_door", { ...door, half: "lower" });
g.set(dx0, hallG + 1, dz0, "iron_door", { ...door, half: "upper" });

// 7. Roof equipment: a small two-storey penthouse on the core, capped with a cornice.
for (const [x, z] of [[2, 17], [3, 17], [2, 18], [3, 18]]) {
  if (!inFoot(x, z) || topAt(x, z) !== 28) continue;
  g.set(x, 28, z, "calcite");
  g.set(x, 29, z, "calcite");
  g.set(x, 30, z, "smooth_quartz");
}

const info = g.save(`${DIR}/NYC1035469.nbt`);
console.log(`NYC1035469: ${info.blocks} blocks, ${info.palette} palette entries`);

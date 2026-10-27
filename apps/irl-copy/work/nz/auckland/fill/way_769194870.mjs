// Way 769194870: a two-storey brick commercial block (Stripped Classical, 1920s-30s Auckland) on a slope.
// Footprint from the cells file; each cell is solid foundation up to its ground, then floors every 4 blocks,
// with the roof tier (lidar roof, median-smoothed) as the top. Shopfront on the frontage, sash-style windows
// above, corner quoins, string courses, a cornice, a parapet where a storey ends short of the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_769194870.cells.json`, "utf8"));   // [x, z, ground, roof]

const W = 24, D = 18, H = 20;
const g = new Voxels([W, H, D]);

const at = new Map();                         // "x,z" -> { gr, r }
for (const [x, z, gr, r] of cells) at.set(`${x},${z}`, { gr, r });
const inFp = (x, z) => at.has(`${x},${z}`);
const N = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };   // outward normals; north = -z
const faces = (x, z) => Object.keys(N).filter((d) => !inFp(x + N[d][0], z + N[d][1]));
const keyXZ = (k) => k.split(",").map(Number);

// Smooth the lidar roof: each cell takes the most common roof height in its 3x3 neighbourhood, then tiers 6..8.
const top = new Map();
for (const [key, { r }] of at) {
  const [x, z] = keyXZ(key);
  const votes = new Map();
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = at.get(`${x + dx},${z + dz}`); if (n) votes.set(n.r, (votes.get(n.r) || 0) + 1);
  }
  let best = r, bc = votes.get(r) || 0;
  for (const [v, c] of votes) if (c > bc) { best = v; bc = c; }
  top.set(key, Math.min(8, Math.max(6, best)));
}

// Frontage: the face with the most exposed cells. Door: the middle window bay on it; lantern beside the door.
const count = Object.fromEntries(Object.keys(N).map((d) => [d, 0]));
for (const key of at.keys()) { const [x, z] = keyXZ(key); for (const d of faces(x, z)) count[d]++; }
const front = Object.keys(count).reduce((a, b) => (count[b] > count[a] ? b : a));
const alongOf = (d, x, z) => (d === "north" || d === "south" ? x : z);
const bayOf = (a) => ((a % 3) + 3) % 3;
const frontCells = [...at.keys()].map(keyXZ).filter(([x, z]) => { const f = faces(x, z); return f.length === 1 && f[0] === front; });
const midA = frontCells.map(([x, z]) => alongOf(front, x, z)).sort((a, b) => a - b)[Math.floor(frontCells.length / 2)];
const winCells = frontCells.filter(([x, z]) => bayOf(alongOf(front, x, z)) !== 0);
const doorCell = winCells.slice().sort((p, q) => Math.abs(alongOf(front, ...p) - midA) - Math.abs(alongOf(front, ...q) - midA))[0];
const doorA = alongOf(front, ...doorCell);
const lanternCell = winCells.filter((c) => c !== doorCell && Math.abs(alongOf(front, ...c) - doorA) <= 3)
  .sort((p, q) => Math.abs(alongOf(front, ...p) - doorA) - Math.abs(alongOf(front, ...q) - doorA))[0];
const isAt = (c, x, z) => !!c && c[0] === x && c[1] === z;

const pane = (d) => {
  const ns = d === "north" || d === "south";     // a window on a north/south wall joins east-west
  return { east: String(ns), west: String(ns), north: String(!ns), south: String(!ns), waterlogged: "false" };
};
const isColumn = (x, z) => x % 4 === 0 && z % 4 === 0;

// Pass 1: the envelope, floors, columns and roof for every footprint cell.
for (const [key, { gr: gc }] of at) {
  const [x, z] = keyXZ(key);
  const Tt = top.get(key), k = Math.floor((Tt - gc) / 4);   // storeys that fit under the tier's roof
  const fc = faces(x, z), perim = fc.length >= 1, corner = fc.length >= 2;
  const fd = fc.length === 1 ? fc[0] : null;
  const m = bayOf(alongOf(fd ?? "north", x, z));

  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");              // foundation to the ground
  for (let y = gc; y < Tt; y++) {
    const rel = y - gc, j = Math.floor(rel / 4), r = rel % 4;
    if (!perim) {
      if (isColumn(x, z)) g.set(x, y, z, "stone_bricks");                    // structural posts carry each floor
      else if (y === Tt - 1) g.set(x, y, z, "stone");                       // roof membrane
      else if (r === 0 && j < k) g.set(x, y, z, "smooth_stone");           // floor slab per storey
      continue;
    }
    if (y === Tt - 1) { g.set(x, y, z, "smooth_stone"); continue; }         // cornice
    if (corner) { g.set(x, y, z, y % 2 ? "bricks" : "smooth_stone"); continue; }   // quoins, laid in courses
    if (j >= k) { g.set(x, y, z, "bricks"); continue; }                     // parapet above the last storey
    if (r === 0) { g.set(x, y, z, "smooth_stone"); continue; }              // string course
    if (fd === front && j === 0) {                                           // shopfront
      if (isAt(doorCell, x, z) && (r === 1 || r === 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: fd, half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (r === 3) g.set(x, y, z, "smooth_stone");                  // fascia over the shops
      else if (m === 0) g.set(x, y, z, "stone_bricks");                     // pilasters
      else if (isAt(lanternCell, x, z) && r === 2) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else g.set(x, y, z, "glass_pane", pane(fd));
      continue;
    }
    if (m === 0) g.set(x, y, z, "bricks");                                   // brick piers between bays
    else if (r === 1) g.set(x, y, z, "smooth_stone");                        // sill
    else g.set(x, y, z, "glass_pane", pane(fd));                             // sash glass
  }
}

// Pass 2: warm light behind some upper windows, and roof plant on the top tier.
let glows = 0, plant = 0;
for (const [key, { gr: gc }] of at) {
  const [x, z] = keyXZ(key);
  const fc = faces(x, z);
  if (fc.length !== 1) continue;
  const d = fc[0], Tt = top.get(key);
  const [ox, oz] = N[d];
  const ix = x - ox, iz = z - oz;                                            // the cell just inside the wall
  if (!inFp(ix, iz) || faces(ix, iz).length || isColumn(ix, iz)) continue;
  for (let y = gc; y < Tt - 1; y++) {
    const r = (y - gc) % 4;
    if (r !== 2) continue;                                                  // the lower sash row
    if (g.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
    if ((x + z + y) % 3 !== 0) continue;
    g.set(ix, y, iz, "glowstone"); glows++;
  }
}
for (const [key, { gr: gc }] of at) {
  const [x, z] = keyXZ(key), Tt = top.get(key);
  if (Tt !== 8 || faces(x, z).length || isColumn(x, z)) continue;
  if (x % 5 === 2 && z % 5 === 2) { g.set(x, Tt, z, "iron_block"); plant++; }
}

// Check: every block above y 0 stands on a block below it or is held by a neighbour in its own row.
const solid = (x, y, z) => !!g.get(x, y, z);
let floating = [];
for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!solid(x, y, z)) continue;
  const held = solid(x, y - 1, z) || solid(x + 1, y, z) || solid(x - 1, y, z) || solid(x, y, z + 1) || solid(x, y, z - 1);
  if (!held) floating.push([x, y, z]);
}

const res = g.save(`${DIR}/way_769194870.nbt`);
console.log(JSON.stringify({ front, door: doorCell, lantern: lanternCell ?? null, glows, plant, floating: floating.length, ...res }));

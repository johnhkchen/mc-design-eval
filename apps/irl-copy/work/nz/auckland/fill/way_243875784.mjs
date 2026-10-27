// ITC House, Auckland: a 1970s concrete-and-tinted-glass office block on a stone plinth. Seven storeys of 4 blocks on
// a 2-block lower storey (the downhill side), a stepped-up core to 33 with a 34 parapet, lidar roof 30 on the rest.
// Storey lines every 4 blocks from y 2 (lines at 2, 6, 10 ...), two-block glass bands, white concrete piers and spandrels.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875784.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_243875784.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const C = new Map();
for (const [x, z, g, r] of cells) C.set(`${x},${z}`, { x, z, g, r: r >= 32 ? 33 : 30 });   // lidar noise into two tiers: main roof 30, core 33
const cell = (x, z) => C.get(`${x},${z}`);
const key = (x, y, z) => `${x},${y},${z}`;
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// sides open at height y: outside the footprint, or against a neighbour whose roof is below y
function exposed(x, z, y) {
  const out = [];
  for (const [d, [dx, dz]] of Object.entries(DIRS)) { const n = cell(x + dx, z + dz); if (!n || n.r < y) out.push(d); }
  return out;
}

// the entrance: a north-facing wall cell near the middle of the footprint (its door sits on the storey line at y 10)
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
let door = null;
for (const c of C.values()) {
  if (!exposed(c.x, c.z, 11).includes("N")) continue;
  if (!door || Math.abs(c.x - cx) < Math.abs(door.x - cx)) door = c;
}
const DOOR_Y = [11, 12];
const CANOPY_Y = 13;

// the wall above the shell: which block a facade or interior cell holds at y (null = not the shell)
function shell(c, y) {
  const { x, z, r: R } = c;
  if (y === R + 1) return exposed(x, z, y).length ? { b: "white_concrete" } : null;          // parapet on the open edge
  if (y > R + 1) return null;
  const dirs = exposed(x, z, y);
  if (!dirs.length) return { b: y === R ? "light_gray_concrete" : "white_concrete" };          // interior: roof membrane / solid floors
  if (y === R) return { b: "smooth_stone" };                                                  // cornice
  const d = dirs[0], along = d === "N" || d === "S" ? x : z;
  const pier = along % 3 === 0;
  if (y < 2) return { b: "stone_bricks" };                                                    // base course
  const rel = (((y - 2) % 4) + 4) % 4;                                                         // 0 storey line, 1-2 glass, 3 spandrel
  if (rel === 0) return { b: pier ? "white_concrete" : "light_gray_concrete" };
  if (rel === 3 || pier) return { b: "white_concrete" };
  const ns = d === "N" || d === "S";                                                           // panes join along the wall
  return { b: "light_blue_stained_glass_pane", glass: true, rel, d,
    st: { north: String(!ns), south: String(!ns), east: String(ns), west: String(ns), waterlogged: "false" } };
}

// the air gap behind each window: the room side of the glass, from the storey line to the spandrel (the next line
// caps it, so nothing hangs), with a warm glowstone on the sill of some windows
const air = new Set(), glow = new Set();
const pocket = (ix, iz, y) => {
  const inner = cell(ix, iz);
  if (!inner || y <= inner.g || y > inner.r) return;
  air.add(key(ix, y, iz));
};
for (const c of C.values()) {
  for (let y = c.g + 1; y <= c.r; y++) {
    const s = shell(c, y);
    if (!s?.glass) continue;
    const [dx, dz] = DIRS[s.d], ix = c.x - dx, iz = c.z - dz;
    const rows = s.rel === 1 ? [y, y + 1, y + 2] : [y, y + 1];
    for (const yy of rows) pocket(ix, iz, yy);
    if (s.rel === 1 && (c.x * 5 + c.z * 3 + y) % 7 === 0) glow.add(key(ix, y, iz));
  }
}
// the entrance hall behind the door: air to the canopy line, with a standing lantern on the floor
const [ddx, ddz] = DIRS.N;
const hallX = door.x - ddx, hallZ = door.z - ddz;
for (const y of [11, 12, 13]) air.add(key(hallX, y, hallZ));

const g = new Voxels([30, 46, 32]);
for (const c of C.values()) {
  // the plinth: solid from y 0 up to the ground under the cell
  for (let y = 0; y <= c.g; y++) g.set(c.x, y, c.z, "stone");
  // the walls, floors and roof, with the air gaps left out
  for (let y = c.g + 1; y <= c.r + 1; y++) {
    if (air.has(key(c.x, y, c.z))) continue;
    const s = shell(c, y);
    if (!s) continue;
    let block = s.b, state = s.st;
    if (door && c === door && DOOR_Y.includes(y)) {
      block = "oak_door";
      state = { facing: FACING[door.d ?? "N"], hinge: "left", open: "false", powered: "false", half: y === 11 ? "lower" : "upper" };
    } else if (door && y === CANOPY_Y && Math.abs(c.x - door.x) <= 1 && c.z === door.z) {
      block = "oak_planks"; state = undefined;                                              // flush canopy over the entrance
    } else if (glow.has(key(c.x, y, c.z))) {
      block = "glowstone"; state = undefined;
    }
    g.set(c.x, y, c.z, block, state);
  }
}
// the entrance's hanging lantern and a few roof plant boxes on the main roof
g.set(hallX, 11, hallZ, "lantern", { hanging: "false", waterlogged: "false" });
const roofSpots = [];
for (const c of C.values()) {
  if (c.r !== 30 || roofSpots.length >= 3) continue;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => cell(c.x + i, c.z + j));
  if (block.some((n) => !n || n.r !== 30 || exposed(n.x, n.z, 31).length)) continue;
  if (roofSpots.some(([sx, sz]) => Math.abs(sx - c.x) < 7 && Math.abs(sz - c.z) < 7)) continue;
  roofSpots.push([c.x, c.z]);
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) g.set(c.x + i, 31, c.z + j, "iron_block");
}

// a check that nothing floats: every block must join the ground through a chain of touching blocks
const [X, Y, Z] = g.size, seen = new Uint8Array(X * Y * Z), queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (g.val(x, 0, z)) { seen[g.at(x, 0, z)] = 1; queue.push([x, 0, z]); }
for (let q = 0; q < queue.length; q++) {
  const [x, y, z] = queue[q];
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const i = g.at(x + dx, y + dy, z + dz);
    if (i < 0 || seen[i] || !g.cellAt(i)) continue;
    seen[i] = 1; queue.push([x + dx, y + dy, z + dz]);
  }
}
const floating = g.count() - queue.length;
const stats = g.save(OUT);
console.log(`ITC House: ${cells.length} footprint cells, ${stats.blocks} blocks, ${stats.palette} block states, floating: ${floating}, entrance at x ${door.x} z ${door.z}, glowstone ${glow.size}`);

// Auckland, way 269467366: a 1960s reinforced-concrete office block. White concrete piers on a grey plinth, three-block
// ribbon windows of blue glass with light-grey spandrels at each floor line, a shopfront with a door on the north
// street face, a two-storey body with plant on the roof, and a four-storey stair tower on the north-west edge, the lidar's
// raised spine, stepped down through a setback ring. Solid massing: each window has an air gap behind it, and the lit
// windows show glowstone in that gap. Every column runs solid from the foundation to its own roof row, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467366.cells.json", "utf8"));
const W = 31, D = 34, H = 29;
const key = (x, z) => z * W + x;
const at = new Map();                                       // footprint cell -> { gr: ground, roof: lidar roof height }
for (const [x, z, gr, roof] of cells) at.set(key(x, z), { gr, roof });
const ok = (x, z) => x >= 0 && x < W && z >= 0 && z < D && at.has(key(x, z));
const NB = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const edge = (x, z) => NB.filter(([dx, dz]) => !ok(x + dx, z + dz));   // outward faces of a footprint cell
const perim = (x, z) => ok(x, z) && edge(x, z).length > 0;
const along = (x, z, f) => (f[0] === 0 ? x : z);                         // index along the face it sits on

// ---- massing tiers from the lidar: a raw 12+ spine is the tower (4 storeys), a ring around it steps down, the rest is
// the 2-storey body, with a 1-block plant deck where the smoothed roof reads higher ----
const smooth = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (ok(x + dx, z + dz)) { s += at.get(key(x + dx, z + dz)).roof; n++; }
  return s / n;
};
const N8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const hiRaw = new Set([...at.entries()].filter(([, v]) => v.roof >= 12).map(([k]) => k));
const tower = new Set(), seen = new Set();
for (const k of hiRaw) {
  if (seen.has(k)) continue;
  const comp = [], q = [k]; seen.add(k);
  while (q.length) {
    const c = q.pop(); comp.push(c); const x = c % W, z = Math.floor(c / W);
    for (const [dx, dz] of N8) { const n = key(x + dx, z + dz); if (ok(x + dx, z + dz) && hiRaw.has(n) && !seen.has(n)) { seen.add(n); q.push(n); } }
  }
  if (comp.length >= 5) comp.forEach((c) => tower.add(c));     // single noisy spikes are not a tower
}
for (const c of [...tower]) {                                   // the spine is 1-2 cells wide in the lidar: grow it to a shaft
  const x = c % W, z = Math.floor(c / W);
  for (const [dx, dz] of N8) if (ok(x + dx, z + dz)) tower.add(key(x + dx, z + dz));
}
const ring = new Map(); tower.forEach((k) => ring.set(k, 0));
let frontier = [...tower];
for (let d = 1; d <= 2; d++) {
  const next = [];
  for (const c of frontier) {
    const x = c % W, z = Math.floor(c / W);
    for (const [dx, dz] of N8) { const n = key(x + dx, z + dz); if (ok(x + dx, z + dz) && !ring.has(n)) { ring.set(n, d); next.push(n); } }
  }
  frontier = next;
}
const topOf = (x, z) => {                                       // the tier's top: the roof's face height
  const k = key(x, z);
  if (tower.has(k)) return 16;
  const d = ring.get(k); if (d === 1 || d === 2) return 12;
  return smooth(x, z) >= 9.5 ? 10 : 9;
};
const roofRow = (x, z) => topOf(x, z) - 1;

// ---- window grid: 3-block storeys (spandrels on each floor line), piers every third cell, no pier-free runs ----
const noGap = new Set();                                        // perimeter cells with no room behind their glass: solid piers
for (const k of at.keys()) {
  const x = k % W, z = Math.floor(k / W); if (!perim(x, z)) continue;
  const f = edge(x, z)[0], bx = x - f[0], bz = z - f[1];
  if (!ok(bx, bz) || perim(bx, bz)) noGap.add(k);
}
const winRow = (x, z, y) => y > at.get(key(x, z)).gr && y < roofRow(x, z) && y % 4 !== 0;
const winCell = (x, z, y) => {
  if (!perim(x, z) || !winRow(x, z, y)) return false;
  const f = edge(x, z)[0];
  return along(x, z, f) % 3 !== 0 && !noGap.has(key(x, z));
};

// air gap behind each window, the lit ones get glowstone in it
const air = new Set(), lit = [];
for (const k of at.keys()) {
  const x = k % W, z = Math.floor(k / W);
  if (!perim(x, z)) continue;
  const f = edge(x, z)[0];
  for (let y = 0; y < H; y++) {
    if (!winCell(x, z, y)) continue;
    const bx = x - f[0], bz = z - f[1];
    air.add(`${bx},${y},${bz}`);
    if ((y === 6 || y === 10) && along(x, z, f) % 9 === 4) lit.push([bx, y, bz]);
  }
}
// the entrance on the north street face: a door in the piers' bay, a glazed vestibule behind it, a canopy over it
const DOOR = [21, 0];
air.add(`${DOOR[0]},5,${DOOR[1] + 1}`); air.add(`${DOOR[0]},6,${DOOR[1] + 1}`);

const g = new Voxels([W, H, D]);
for (const k of at.keys()) {
  const x = k % W, z = Math.floor(k / W);
  const { gr } = at.get(k), R = roofRow(x, z), pm = perim(x, z);
  for (let y = 0; y <= R; y++) {
    if (air.has(`${x},${y},${z}`)) continue;
    if (y < gr) { g.set(x, y, z, "stone_bricks"); continue; }                 // foundation from y 0 to the cell's ground
    if (y === R) { g.set(x, y, z, pm ? "smooth_stone" : "light_gray_concrete"); continue; }   // parapet cap / roof membrane
    if (!pm) { g.set(x, y, z, "white_concrete"); continue; }                  // structure behind the glass
    if (y === gr) { g.set(x, y, z, "gray_concrete"); continue; }              // base course
    if (y % 4 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }     // spandrel at each floor line
    if (!winCell(x, z, y)) { g.set(x, y, z, "white_concrete"); continue; }    // pier
    const f = edge(x, z)[0];
    if (f[1] === -1 && y < 8) { g.set(x, y, z, "light_blue_stained_glass"); continue; }   // shopfront on the north street
    const pane = f[0] === 0                                                   // connect along the face
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", pane);
  }
}
// the door and canopy
g.set(DOOR[0], 5, DOOR[1], "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR[0], 6, DOOR[1], "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const x of [DOOR[0] - 1, DOOR[0], DOOR[0] + 1]) g.set(x, 7, DOOR[1], "light_gray_concrete");
// warm light behind some glass
for (const [x, y, z] of lit) g.set(x, y, z, "glowstone");
// roof plant on the body and a stair-core overrun on the tower
for (const k of at.keys()) {
  const x = k % W, z = Math.floor(k / W);
  if (perim(x, z) || topOf(x, z) !== 9) continue;
  if ((x >= 9 && x <= 12 && z >= 14 && z <= 15) || (x >= 22 && x <= 24 && z >= 18 && z <= 19)) g.set(x, roofRow(x, z) + 1, z, "light_gray_concrete");
}
for (const k of tower) {
  const x = k % W, z = Math.floor(k / W);
  if (x === 18 && z >= 3 && z <= 5) { g.set(x, 16, z, "stone_bricks"); g.set(x, 17, z, "stone_bricks"); }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269467366.nbt");
console.log(`way_269467366: ${stats.blocks} blocks, ${stats.palette} block states; tower ${tower.size} cells, setback ring ${[...ring.values()].filter((d) => d > 0).length}, lit windows ${lit.length}`);

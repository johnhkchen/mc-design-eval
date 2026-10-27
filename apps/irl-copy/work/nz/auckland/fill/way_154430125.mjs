// Way 154430125: a five-storey concrete office block of the 1970s on the Newton side of the CBD, with a shopfront
// ground floor on the south frontage, tinted glass ribbons in grey concrete frames, a parapet, and a centred plant
// penthouse set back from the edge. Footprint 33 x 28; the lidar roof is a flat slab at about 25-27 above y 0, with a
// few stair or lift overruns to 31. Lidar noise (roof below 20 at the edge) is smoothed to the main roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_154430125.cells.json`, "utf8"));

const W = 33, D = 28, H = 44;
const FLOOR = 4;      // ground-floor slab: the datum, a block above the highest ground under the footprint
const ROOF_DECK = 24; // top storey's slab, roof surface at 25; parapet rows 25-26

// ---- footprint ------------------------------------------------------------------------------------------------------
const cell = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, ground, roof] of cells) cell[z][x] = { ground, roof };
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && cell[z][x] !== null;
const list = cells.map(([x, z]) => [x, z]);

// outward faces of a cell: the side whose neighbour is outside the footprint, and the cell's position along that side
const faces = (x, z) => {
  const f = [];
  if (!inside(x - 1, z)) f.push({ side: "W", t: z });
  if (!inside(x + 1, z)) f.push({ side: "E", t: z });
  if (!inside(x, z - 1)) f.push({ side: "N", t: x });
  if (!inside(x, z + 1)) f.push({ side: "S", t: x });
  return f;
};
const edge = (x, z) => faces(x, z).length > 0;

// distance in cells from the outside edge: the setback for the plant penthouse
const dist = Array.from({ length: D }, () => Array(W).fill(-1));
const queue = [];
for (const [x, z] of list) if (edge(x, z)) { dist[z][x] = 0; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [nx, nz] of [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]])
    if (inside(nx, nz) && dist[nz][nx] < 0) { dist[nz][nx] = dist[z][x] + 1; queue.push([nx, nz]); }
}

// a stair or lift overrun is a tall cell with a tall neighbour; the lone tall cells are lidar noise on the parapet line
const overrun = (x, z) => cell[z][x].roof >= 30 &&
  [[x - 1, z], [x + 1, z], [x, z - 1], [x, z + 1]].filter(([nx, nz]) => inside(nx, nz) && cell[nz][nx].roof >= 30).length >= 1;

// the main frontage: the south side, entered through the cell nearest the middle of it
const southCells = list.filter(([x, z]) => faces(x, z).some((f) => f.side === "S"));
const sortedT = southCells.map(([x]) => x).sort((a, b) => a - b);
const midT = sortedT[Math.floor(sortedT.length / 2)];
const [doorX, doorZ] = southCells.reduce((best, c) => (Math.abs(c[0] - midT) < Math.abs(best[0] - midT) ? c : best));

// ---- blocks (written into a map, then flushed, so the panes can see their neighbours) --------------------------------
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const PANE = "light_blue_stained_glass_pane";
const FRAME = "gray_concrete";
const PIER = "light_gray_concrete";
const SILL = "light_gray_concrete";
const SLAB_EDGE = "white_concrete";
const SLAB = "light_gray_concrete";

for (const [x, z] of list) {
  const fc = faces(x, z), outside = fc.length > 0, corner = fc.length > 1, c = cell[z][x];
  const t = outside ? fc[0].t : 0;

  // foundation to the datum: solid under every cell, so each slab stands on something
  for (let y = 0; y < FLOOR; y++) put(x, y, z, outside ? (y === FLOOR - 1 ? "smooth_stone" : "stone_bricks") : "stone");

  // floor slabs: one per storey, six lines (the top one is the roof deck)
  for (let k = 0; k <= 5; k++) put(x, FLOOR + 4 * k, z, outside ? SLAB_EDGE : SLAB);

  // the core behind the glass: solid from slab to slab, with a one-cell air gap at the glass (dist 1) so every floor
  // has something under it; the glass and the gap are the only hollow
  if (!outside && dist[z][x] >= 2) {
    for (let k = 0; k < 5; k++) for (let y = FLOOR + 4 * k + 1; y <= FLOOR + 4 * k + 3; y++) put(x, y, z, "stone");
  }

  // storeys 1-5: a sill row and two rows of glass, the ground storey a kickplate and a shopfront
  if (outside) {
    for (let k = 0; k < 5; k++) {
      const F = FLOOR + 4 * k;
      put(x, F + 1, z, k === 0 ? "smooth_stone" : SILL);
      for (const y of [F + 2, F + 3]) {
        const mullion = corner || t % 3 === 0;
        put(x, y, z, corner ? PIER : mullion ? FRAME : PANE, corner || mullion ? undefined : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      }
    }
    // entrance on the south frontage: a door, a lintel canopy over the bay, the sill left as the kickplate
    if (fc.some((f) => f.side === "S") && Math.abs(x - doorX) <= 1 && z === doorZ) put(x, FLOOR + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    if (x === doorX && z === doorZ) {
      put(x, FLOOR + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, FLOOR + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  }

  // roof: parapet on the edge, a setback plant room well inside, and stair or lift overruns on the tallest cells
  if (outside) { put(x, ROOF_DECK + 1, z, PIER); put(x, ROOF_DECK + 2, z, "smooth_stone"); }
  if (overrun(x, z)) {
    for (let y = ROOF_DECK + 1; y < c.roof; y++) {
      const top = y === c.roof - 1, win = outside && (y === ROOF_DECK + 2 || y === ROOF_DECK + 3);
      put(x, y, z, top ? "smooth_stone" : win ? PANE : SLAB, win ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : undefined);
    }
  } else if (!outside && dist[z][x] >= 2 && c.roof >= 27) {
    for (let y = ROOF_DECK + 1; y <= ROOF_DECK + 3; y++) put(x, y, z, y === ROOF_DECK + 3 ? "smooth_stone" : SLAB);
  }
}

// warm lights: lanterns hanging from the storey slab above, just inside the glass in every sixth bay
for (const [x, z] of list) {
  const fc = faces(x, z);
  if (!fc.length || fc.length > 1 || fc[0].t % 6 !== 3) continue;
  const side = fc[0].side;
  const [ix, iz] = side === "W" ? [x + 1, z] : side === "E" ? [x - 1, z] : side === "N" ? [x, z + 1] : [x, z - 1];
  if (!inside(ix, iz) || edge(ix, iz)) continue;
  for (let k = 0; k < 5; k++) {
    const y = FLOOR + 4 * k + 3;
    if (!B.has(`${x},${y},${z}`)) continue;
    put(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// glass panes join their neighbours: a pane connects toward a pane or a solid block beside it
const JOIN = new Set([PANE, FRAME, PIER, SILL, SLAB, SLAB_EDGE, "stone_bricks", "smooth_stone", "stone"].map((b) => `minecraft:${b}`));
const hasJoin = (x, y, z) => { const e = B.get(`${x},${y},${z}`); return !!e && JOIN.has(`minecraft:${e.block}`); };
for (const [k, v] of B) {
  if (v.block !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const s = { north: hasJoin(x, y, z - 1), south: hasJoin(x, y, z + 1), east: hasJoin(x + 1, y, z), west: hasJoin(x - 1, y, z) };
  B.set(k, { block: PANE, state: { north: String(s.north), south: String(s.south), east: String(s.east), west: String(s.west), waterlogged: "false" } });
}

// every block above y 0 stands on a block (a lantern hangs from one). The only exception is a floor slab over the
// one-cell air gap behind the glass, which is carried by the glass ring and the solid core beside it: counted apart
let floating = 0, gapSpans = 0;
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0 || v.block === "lantern" || B.has(`${x},${y - 1},${z}`)) continue;
  if (dist[z][x] === 1) gapSpans++; else floating++;
}

const g = new Voxels([W, H, D]);
for (const [k, v] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
g.save(`${HERE}/way_154430125.nbt`);
console.log(`cells ${list.length}, blocks ${B.size}, palette ${g.palette.length}, unsupported ${floating}, gap spans ${gapSpans}, door at ${doorX},${doorZ}`);

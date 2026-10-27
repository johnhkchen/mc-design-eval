// Gamma Hotel (way 401588420): a 1930s-style reinforced-concrete hotel, cream plaster over concrete, with stone
// bands, a stone-base plinth and a centred street entrance. Lidar roofs (17-19 above y0, a few lower bits) snap to
// two clean tiers, 19 (the core) and 17 (the wings), so the north-east core stands up over the lower wings. Storey
// lines run 4 blocks down from each tier's roof (2 rows of glass, 2 rows of stone band), so every floor sits on the one
// below. Each column is solid from y0 up to its ground (foundation), then the envelope; windows are glass with an air
// gap behind (some with a light in it) and the floor slabs are the bands. No interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_401588420.cells.json`, "utf8"));
const W = 44, D = 35, H = 31;

// lidar roof heights snap to the nearest tier (ties go up)
const TIERS = [9, 13, 17, 19];
const snapTier = (r) => TIERS.reduce((best, t) => (Math.abs(t - r) <= Math.abs(best - r) ? t : best), TIERS[0]);

const col = new Map();
for (const [x, z, g, r] of cells) col.set(`${x},${z}`, { x, z, g, R: snapTier(r) });
const at = (x, z) => col.get(`${x},${z}`);

// outward normals: name, dx, dz
const DIRS = [
  { n: "north", dx: 0, dz: -1 }, { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 }, { n: "east", dx: 1, dz: 0 },
];
const opposite = { north: "south", south: "north", east: "west", west: "east" };

// a body cell's exposed faces at height y: the neighbour is outside the footprint, or stands lower than y
function exposed(c, y) {
  const out = [];
  for (const d of DIRS) {
    const n = at(c.x + d.dx, c.z + d.dz);
    if (!n || y >= n.R) out.push(d);
  }
  return out;
}

// the street front: the longest straight run of outward faces (ties: lower ground)
function streetRun() {
  let best = null;
  for (const d of DIRS) {
    const lines = new Map();
    for (const c of col.values()) {
      if (at(c.x + d.dx, c.z + d.dz)) continue;
      const key = d.dz !== 0 ? c.z : c.x, along = d.dz !== 0 ? c.x : c.z;
      if (!lines.has(key)) lines.set(key, []);
      lines.get(key).push({ c, along });
    }
    for (const list of lines.values()) {
      list.sort((a, b) => a.along - b.along);
      let run = [];
      const flush = () => {
        if (run.length >= 3) {
          const score = run.length * 10 - run.reduce((s, r) => s + r.c.g, 0) / run.length;
          if (!best || score > best.score) best = { d, cells: run.map((r) => r.c), score };
        }
      };
      for (const e of list) {
        if (run.length && e.along !== run[run.length - 1].along + 1) { flush(); run = []; }
        run.push(e);
      }
      flush();
    }
  }
  return best;
}

const run = streetRun();
const doorCell = run.cells[Math.floor(run.cells.length / 2)];

const V = new Voxels([W, H, D]);
const put = (x, y, z, block, state) => V.set(x, y, z, block, state);
const glass = (d) => ({
  north: d.dz !== 0 ? "false" : "true", south: d.dz !== 0 ? "false" : "true",
  east: d.dz !== 0 ? "true" : "false", west: d.dz !== 0 ? "true" : "false", waterlogged: "false",
});
// what an exterior body cell is at height y: parapet, plinth, stone band, pier between windows, or glass
function kindAt(c, y, d) {
  const t = c.R - y;
  if (t === 1) return "parapet";
  if (y === c.g) return "plinth";
  const isGround = y - c.g <= 3;
  if (isGround ? y - c.g === 3 : t % 4 === 0 || t % 4 === 1) return "band";
  return (d.dz !== 0 ? c.x : c.z) % 3 === 0 ? "pier" : "glass";
}
const hash = (x, y, z) => (x * 7 + y * 13 + z * 31) % 11;

// pass 1: the solid massing and the envelope
for (const c of col.values()) {
  const { x, z, g, R } = c;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");              // foundation, down to y0
  for (let y = g; y < R; y++) {
    const ext = exposed(c, y);
    if (!ext.length) { put(x, y, z, y === R - 1 ? "stone" : "white_concrete"); continue; }   // interior; roof surface on top
    const d = ext[0];
    const kind = kindAt(c, y, d);
    if (kind === "parapet" || kind === "pier") put(x, y, z, "white_concrete");
    else if (kind === "plinth") put(x, y, z, "stone_bricks");
    else if (kind === "band") put(x, y, z, "smooth_stone");
    else put(x, y, z, "glass_pane", glass(d));
  }
}

// pass 2: the windows' air gap behind the glass, lights in some windows, the street entrance
const lightsBehind = [];
for (const c of col.values()) {
  const { x, z, g, R } = c;
  for (let y = g + 1; y < R - 1; y++) {
    const ext = exposed(c, y);
    if (!ext.length) continue;
    const d = ext[0];
    if (kindAt(c, y, d) !== "glass") continue;
    const ix = x - d.dx, iz = z - d.dz;                                  // the cell just inside the glass
    const inner = at(ix, iz);
    if (!inner || y < inner.g || y >= inner.R) continue;
    const onStreet = run.cells.some((r) => r.x === x && r.z === z);
    if (onStreet && y - g === 1 && hash(x, y, z) % 2 === 0) lightsBehind.push([ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" }]);
    else if (hash(x, y, z) % 23 === 0) lightsBehind.push([ix, y, iz, "glowstone"]);
    else lightsBehind.push([ix, y, iz, null]);
  }
}
// carve the air gap; the lights go in it
for (const [x, y, z, block, state] of lightsBehind) {
  if (block) put(x, y, z, block, state);
  else V.set(x, y, z, "air");
}

// entrance: door, step, flat hood over the run
const dd = doorCell;
const facing = opposite[run.d.n];                                        // a door faces inside, toward the one entering
// the threshold step on the door cell, facing outward
put(dd.x, dd.g, dd.z, "stone_brick_stairs", { facing: run.d.n, half: "bottom", shape: "straight", waterlogged: "false" });
const dState = { facing, hinge: "left", open: "false", powered: "false" };
put(dd.x, dd.g + 1, dd.z, "oak_door", { ...dState, half: "lower" });
put(dd.x, dd.g + 2, dd.z, "oak_door", { ...dState, half: "upper" });
const ix = dd.x - run.d.dx, iz = dd.z - run.d.dz;
V.set(ix, dd.g + 1, iz, "air"); V.set(ix, dd.g + 2, iz, "air");
for (const c of run.cells) {
  if (c === dd) continue;
  // the hood: a top slab over the fascia of every bay of the run
  put(c.x, c.g + 4, c.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

// the roof: coping on the parapet, and a stair-tower plant room on the 19 core
for (const c of col.values()) {
  const { x, z, R } = c;
  if (exposed(c, R - 1).length) put(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}
let plant = null;
for (let z = 0; z + 3 <= D && !plant; z++) for (let x = 0; x + 4 <= W && !plant; x++) {
  let ok = true;
  for (let dz = 0; dz < 3 && ok; dz++) for (let dx = 0; dx < 4 && ok; dx++) {
    const c = at(x + dx, z + dz);
    if (!c || c.R !== 19 || exposed(c, 18).length) ok = false;
  }
  if (ok) plant = { x, z };
}
if (plant) {
  for (let y = 19; y < 22; y++) for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++)
    put(plant.x + dx, y, plant.z + dz, "stone_bricks");
  for (let dz = 0; dz < 3; dz++) for (let dx = 0; dx < 4; dx++)
    put(plant.x + dx, 22, plant.z + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = V.save(`${HERE}/way_401588420.nbt`);
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, run: { face: run.d.n, len: run.cells.length }, door: [dd.x, dd.g, dd.z], plant, lights: lightsBehind.length }));

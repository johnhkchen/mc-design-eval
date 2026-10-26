import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86622";
const W = 14, D = 13, H = 28;
const MAIN_TOP = 16;   // lidar roof height for the main body (from the record)
const CORE_TOP = 19;   // roof of the central penthouse block
const MAX_TOP = 26;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const m = new Map();
for (const c of cells) m.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => m.has(`${x},${z}`);

const hash = (x, z, k) => ((x * 73856093) ^ (z * 19349663) ^ (k * 83492791)) >>> 0;

function edgeInfo(x, z) {
  const ed = { n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) };
  const edge = ed.n || ed.s || ed.w || ed.e;
  const corner = (ed.w || ed.e) && (ed.n || ed.s);
  return { ed, edge, corner };
}

// Massing: main body at the lidar roof height; lower wings only where lidar is clearly lower;
// a central penthouse core two cells in from the facade.
const info = cells.map(([x, z, g0, r0]) => {
  const ground = Math.max(0, Math.round(g0));
  const lidar = Math.round(r0);
  let top = lidar < MAIN_TOP - 4 ? lidar : MAIN_TOP;
  top = Math.min(MAX_TOP, Math.max(ground + 4, top));
  let core = true;
  for (let dx = -2; dx <= 2 && core; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) { core = false; break; }
  return { x, z, ground, top, core, ...edgeInfo(x, z) };
});

// Entrance: north face (z-min) nearest the centre line
let entrance = null;
{
  const cand = info.filter(c => c.edge);
  const northCand = cand.filter(c => c.ed.n);
  const pool = northCand.length ? northCand : cand;
  let best = Infinity;
  for (const c of pool) {
    const score = Math.abs(c.x - (W - 1) / 2);
    if (score < best) { best = score; entrance = c; }
  }
}
const entFace = entrance
  ? (entrance.ed.n ? "n" : entrance.ed.s ? "s" : entrance.ed.w ? "w" : "e")
  : null;
const FACING = { n: "north", s: "south", w: "west", e: "east" };

// Foundations, floors, facade
for (const c of info) {
  const { x, z, ground, edge, corner, ed, core } = c;
  let { top } = c;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Central penthouse: solid stone drum above the main roof
    if (core && top === MAIN_TOP) {
      for (let y = top; y < CORE_TOP; y++) g.set(x, y, z, "stone_bricks");
      g.set(x, CORE_TOP, z, "smooth_stone");
    }
    // Interior floor slabs per storey, roof deck, air between
    for (let y = ground; y < top; y++) {
      const f = y - ground;
      if (f % 2 === 0 || y === top - 1) g.set(x, y, z, "smooth_stone");
    }
    continue;
  }

  // Facade: piers vs glazed bays
  const pierHere = corner || (ed.n || ed.s ? x % 3 === 0 : z % 3 === 0);

  for (let y = ground; y < top; y++) {
    const f = y - ground;
    if (y === top - 1 && top - 1 > ground) {
      g.set(x, y, z, "stone_brick_wall");           // parapet
    } else if (f === 0) {
      g.set(x, y, z, "polished_andesite");          // base course
    } else if (f % 2 === 0) {
      g.set(x, y, z, "stone_bricks");               // storey line
    } else if (pierHere) {
      g.set(x, y, z, "stone_bricks");               // pier
    } else {
      g.set(x, y, z, "glass_pane");
      if (hash(x, z, y) % 9 === 0) {                // a few warm windows
        let dx = 0, dz = 0;
        if (ed.w) dx = 1; else if (ed.e) dx = -1;
        if (ed.n) dz = 1; else if (ed.s) dz = -1;
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !edgeInfo(ix, iz).edge) g.set(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Entrance: double-height door and a canopy row over it and its neighbours
if (entrance && entFace) {
  const { x, z, ground, top } = entrance;
  const facing = FACING[entFace];
  if (ground + 2 < top) {
    g.set(x, ground + 1, z, "dark_oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, ground + 2, z, "dark_oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  const along = entFace === "n" || entFace === "s" ? [1, 0] : [0, 1];
  for (const k of [-1, 0, 1]) {
    const cx = x + along[0] * k, cz = z + along[1] * k;
    const cell = info.find(c => c.x === cx && c.z === cz);
    if (cell && ground + 3 < cell.top - 1) {
      g.set(cx, ground + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

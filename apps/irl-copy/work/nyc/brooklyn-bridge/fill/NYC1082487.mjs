import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1082487";
const W = 6, H = 21, D = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and massing from lidar ----
const raw = new Map();
for (const [x, z, ground, roof] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) raw.set(`${x},${z}`, { x, z, ground, roof });
}
const has = (x, z) => raw.has(`${x},${z}`);

const roofs = [...raw.values()].map((c) => c.roof).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];

const info = new Map();
for (const [key, c] of raw) {
  const g0 = Math.max(0, Math.min(H - 6, Math.round(c.ground)));
  let r = c.roof;
  // one common parapet tier: snap anything within 2 blocks of the median
  if (Math.abs(r - medRoof) <= 2) r = medRoof;
  let T = 2 * Math.round(r / 2);            // storeys of 2 blocks
  T = Math.min(T, H);
  T = Math.max(T, g0 + 4);
  info.set(key, { x: c.x, z: c.z, g0, T });
}

// ---- helpers ----
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const FACE_ORDER = ["n", "s", "e", "w"];
function facade(x, z) {
  for (const f of FACE_ORDER) {
    const [dx, dz] = DIRS[f];
    if (!has(x + dx, z + dz)) return f;
  }
  return null;
}
const put = (x, y, z, id, props) => (props ? g.set(x, y, z, id, props) : g.set(x, y, z, id));

// ---- entrance: north (street) face, nearest the middle ----
let door = null;
{
  const cands = [];
  for (const c of info.values()) {
    if (facade(c.x, c.z) === "n") cands.push(c);
  }
  cands.sort((a, b) => Math.abs(a.x - 2.5) - Math.abs(b.x - 2.5));
  if (cands.length) door = { x: cands[0].x, z: cands[0].z, g0: cands[0].g0 };
}

// ---- build ----
for (const c of info.values()) {
  const { x, z, g0, T } = c;

  // foundation
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  const f = facade(x, z);

  if (f) {
    // ---- exposed shell cell: facade ----
    const p = (f === "n" || f === "s") ? x : z;
    const win = p % 2 === 1;

    for (let y = g0; y < T; y++) {
      const o = y - g0;
      if (y === T - 1) {
        // parapet: alternating cap stones and slabs for a crenellated cornice line
        if (p % 2 === 0) put(x, y, z, "stone_bricks");
        else put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        continue;
      }
      if (y === T - 2) { put(x, y, z, "chiseled_stone_bricks"); continue; }
      if (o === 0) { put(x, y, z, "polished_andesite"); continue; }
      if (o % 2 === 0) { put(x, y, z, "smooth_stone"); continue; }
      // window row
      if (o === 1) { put(x, y, z, "glass"); continue; }   // ground floor shopfront glazing
      put(x, y, z, win ? "glass" : "bricks");
    }

    // entrance on the north face
    if (door && x === door.x && z === door.z && f === "n") {
      const dy = door.g0;
      put(x, dy, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, dy + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // warm light behind some windows, inside the interior cell
    const [odx, odz] = DIRS[f];
    const ix = x - odx, iz = z - odz;
    if (has(ix, iz) && facade(ix, iz) === null) {
      const ic = info.get(`${ix},${iz}`);
      for (let y = g0; y < T - 2; y++) {
        const o = y - g0;
        if (o % 2 !== 1) continue;
        const k = Math.floor(o / 2);
        const pw = (f === "n" || f === "s") ? x : z;
        if (pw % 2 !== 1) continue;
        if ((x + z + k) % 3 === 0 && y < ic.T - 1) put(ix, y, iz, "glowstone");
      }
    }
  } else {
    // ---- interior cell: floor slabs and roof only, air otherwise ----
    for (let y = g0; y < T; y++) {
      const o = y - g0;
      if (y === T - 1) { put(x, y, z, "stone"); continue; }
      if (o % 2 === 0) put(x, y, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

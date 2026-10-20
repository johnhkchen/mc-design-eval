import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833580";
const W = 23, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint lookup: (x,z) -> ground
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of gmap.keys().toArray ? [] : []) { /* placeholder for old engines */ }
for (const k of gmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;

// which sides of a cell face outside the footprint
const missing = (x, z) => ({
  w: !has(x - 1, z), e: !has(x + 1, z),
  n: !has(x, z - 1), s: !has(x, z + 1),
});
const isPerim = (x, z) => { const m = missing(x, z); return m.w || m.e || m.n || m.s; };
const isCorner = (x, z) => { const m = missing(x, z); return (m.w || m.e) && (m.n || m.s); };

// penthouse: inset rectangle of solid plant room on the roof
const pmin = { x: minX + 6, z: minZ + 6 };
const pmax = { x: maxX - 6, z: maxZ - 6 };
const inPH = (x, z) =>
  pmin.x <= pmax.x && pmin.z <= pmax.z &&
  x >= pmin.x && x <= pmax.x && z >= pmin.z && z <= pmax.z &&
  has(x, z) && !isPerim(x, z);

// entrance: perimeter non-corner cell on the +z (south) face nearest centre
let ent = null;
const pickEntrance = (pred) => {
  let best = null, bestD = Infinity;
  for (const k of gmap.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (!isPerim(x, z) || isCorner(x, z) || !pred(missing(x, z))) continue;
    const d = Math.abs(x - cx);
    if (d < bestD) { bestD = d; best = { x, z }; }
  }
  return best;
};
ent = pickEntrance((m) => m.s) || pickEntrance((m) => m.n) ||
      pickEntrance((m) => m.e || m.w);
let entFacing = "south";
if (ent) {
  const m = missing(ent.x, ent.z);
  entFacing = m.s ? "south" : m.n ? "north" : m.e ? "east" : "west";
}

const paneProps = (m) => {
  // panes run along the facade: along z on east/west faces, along x on north/south faces
  if (m.w || m.e) return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
};

// Pass 1: foundations, interiors, facades, roof
for (const k of gmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gr0 = groundAt(x, z);
  const m = missing(x, z);
  const per = isPerim(x, z);
  const corner = isCorner(x, z);
  const pos = (m.w || m.e) ? z : x; // index along the facade
  const pane = paneProps(m);
  const isEnt = ent && ent.x === x && ent.z === z;

  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr0 && y < H; y++) put(x, y, z, "polished_granite");

  for (let dy = 0; dy <= 12; dy++) {
    const y = gr0 + dy;
    if (y >= H) break;

    if (!per) {
      if (dy === 0) put(x, y, z, "polished_granite");           // ground floor slab
      else if (dy === 5) put(x, y, z, "smooth_stone");          // storey 2 floor
      else if (dy === 10) put(x, y, z, "smooth_stone");         // roof deck
      else if (dy === 11 && inPH(x, z)) put(x, y, z, "gray_concrete");   // plant room
      else if (dy === 12 && inPH(x, z)) put(x, y, z, "stone_bricks");    // plant room cap
      continue; // interior air otherwise
    }

    // perimeter facade
    if (dy === 0) { put(x, y, z, "polished_granite"); continue; }   // base course
    if (dy === 5) { put(x, y, z, "polished_granite"); continue; }   // belt course
    if (dy === 10) { put(x, y, z, "polished_andesite"); continue; } // cornice
    if (dy === 11) { put(x, y, z, "smooth_quartz"); continue; }     // parapet
    if (dy === 12) continue;

    const lower = dy >= 1 && dy <= 4;
    const upper = dy >= 6 && dy <= 9;
    if (!lower && !upper) continue;
    const rel = lower ? dy : dy - 5; // 1..4 storey 1, 1..4 storey 2

    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    if (lower && isEnt) {
      if (rel === 1 || rel === 2) {
        put(x, y, z, "dark_oak_door", {
          facing: entFacing, half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (rel === 3) {
        put(x, y, z, "light_blue_stained_glass_pane", pane);
      } else {
        put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    const winCol = pos % 3 === 1;
    if (winCol && rel >= 1 && rel <= 3) {
      put(x, y, z, "light_blue_stained_glass_pane", pane);
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// Pass 2: warm lights just inside some windows and the entrance
const inward = (m) => {
  if (m.w) return [1, 0];
  if (m.e) return [-1, 0];
  if (m.n) return [0, 1];
  return [0, -1];
};

for (const k of gmap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerim(x, z) || isCorner(x, z)) continue;
  const m = missing(x, z);
  const pos = (m.w || m.e) ? z : x;
  const [dx, dz] = inward(m);
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  const ig = groundAt(ix, iz);
  const isEnt = ent && ent.x === x && ent.z === z;

  if (isEnt) {
    put(ix, ig + 1, iz, "glowstone");
  } else if (pos % 6 === 1) {
    put(ix, ig + 1, iz, "glowstone");
  } else if (pos % 6 === 4) {
    put(ix, ig + 6, iz, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);

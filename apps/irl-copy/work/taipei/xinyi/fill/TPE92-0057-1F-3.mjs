import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0057-1F-3.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE92-0057-1F-3.nbt";

const W = 19, H = 33, D = 13;
const ROOF_Y = 20;   // roof top about 21 blocks above lowest ground (y 0..20)
const STOREY = 5;

const g = new Voxels([W, H, D]);

// ---- footprint ----
const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const map = new Map();   // "x,z" -> ground y
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  map.set(`${x},${z}`, Math.max(0, Math.min(H - 1, Math.round(gr))));
}
const has = (x, z) => map.has(`${x},${z}`);

const NORMALS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

let minX = Infinity, minZ = Infinity;
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
}

function outwards(x, z) {
  return NORMALS.filter(([dx, dz]) => !has(x + dx, z + dz));
}

// ---- entrance: middle of the south facade, fallbacks north/east/west ----
let entrance = null;
for (const [ndx, ndz, facing] of [[0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"]]) {
  const cands = [];
  for (const k of map.keys()) {
    const [x, z] = k.split(",").map(Number);
    const ns = outwards(x, z);
    if (ns.length === 1 && ns[0][0] === ndx && ns[0][1] === ndz) cands.push([x, z]);
  }
  if (cands.length >= 3) {
    cands.sort((a, b) => (ndx === 0 ? a[0] - b[0] : a[1] - b[1]));
    const [x, z] = cands[Math.floor(cands.length / 2)];
    entrance = { x, z, facing, dx: ndx, dz: ndz };
    break;
  }
}
const entKey = entrance ? `${entrance.x},${entrance.z}` : null;

// facade position index along the wall the cell sits on
function facadeIndex(x, z, n) {
  return n[0] === 0 ? (x - minX) : (z - minZ);
}

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- main build ----
const glowSpots = [];

for (const [key, gr] of map) {
  const [x, z] = key.split(",").map(Number);
  const ns = outwards(x, z);
  const edge = ns.length > 0;
  const corner = ns.length >= 2;

  // foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const outN = ns[0] || null;
  let pier = corner;
  let t = 0;
  if (edge && !corner) {
    t = facadeIndex(x, z, outN);
    pier = (t % 3 === 0);
  }

  // entrance bay: door cell plus the two cells either side act as framing piers
  let entranceBay = false;
  if (entrance && edge && !corner && outN[0] === entrance.dx && outN[1] === entrance.dz) {
    const et = facadeIndex(entrance.x, entrance.z, outN);
    if (Math.abs(t - et) <= 1) entranceBay = true;
  }

  for (let y = gr; y <= ROOF_Y; y++) {
    const r = y - gr;

    if (edge) {
      // parapet and cornice
      if (y === 19) { put(x, y, z, "white_concrete"); continue; }
      if (y === 20) { put(x, y, z, "smooth_quartz"); continue; }

      // base course
      if (r === 0) { put(x, y, z, "polished_granite"); continue; }

      // entrance bay
      if (entranceBay) {
        const isDoorCell = key === entKey;
        if (isDoorCell) {
          if (r === 1) { put(x, y, z, "iron_door", { facing: entrance.facing, half: "lower", hinge: "left", open: "false" }); continue; }
          if (r === 2) { put(x, y, z, "iron_door", { facing: entrance.facing, half: "upper", hinge: "left", open: "false" }); continue; }
          if (r === 3) { put(x, y, z, "stone_brick_slab", { type: "bottom" }); continue; }   // lintel band over the door
        } else if (r >= 1 && r <= 3) {
          put(x, y, z, "smooth_quartz");   // flanking pilasters
          continue;
        }
      }

      // storey line and spandrel
      if (r % STOREY === 0) { put(x, y, z, "smooth_quartz"); continue; }
      if (r % STOREY === 4) { put(x, y, z, "white_concrete"); continue; }

      // piers in smooth quartz so the bays read as a rhythm
      if (pier) { put(x, y, z, "smooth_quartz"); continue; }

      // shopfront at street level in cyan glass, upper storeys in blue
      const ground = Math.floor(r / STOREY) === 0;
      put(x, y, z, ground ? "cyan_stained_glass" : "light_blue_stained_glass");

      // warm light behind some windows, dusk visibility
      if (r % STOREY === 2 && !corner) {
        if ((t + Math.floor(r / STOREY)) % 2 === 0) {
          const ix = x - outN[0], iz = z - outN[1];
          if (has(ix, iz) && outwards(ix, iz).length === 0) glowSpots.push([ix, y, iz]);
        }
      }
    } else {
      // interior: floor slabs and roof only, air gap otherwise
      if (y === ROOF_Y) { put(x, y, z, "gray_concrete"); continue; }
      if (r % STOREY === 0) put(x, y, z, "light_gray_concrete");
    }
  }
}

for (const [x, y, z] of glowSpots) put(x, y, z, "glowstone");

// ---- rooftop mechanical penthouse, centred ----
const pen = new Set();
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (x >= 6 && x <= 12 && z >= 4 && z <= 8) pen.add(k);
}
for (const k of pen) {
  const [x, z] = k.split(",").map(Number);
  const penEdge = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dz]) => !pen.has(`${x + dx},${z + dz}`));
  put(x, 21, z, penEdge ? "light_blue_stained_glass" : "light_gray_concrete");
  put(x, 22, z, "smooth_quartz");
}

g.save(OUT);

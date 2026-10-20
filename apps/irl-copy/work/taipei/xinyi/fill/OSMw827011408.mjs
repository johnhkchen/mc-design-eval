import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011408";
const W = 21, H = 38, D = 22;
const ROOF_DECK = 25;   // top of the fifth storey, roof slab
const PARAPET = 26;     // cap course of the parapet (roof about 26 blocks above lowest ground)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const inside = (x, z) => ground.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const normalsOf = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
// u = position along the facade the cell belongs to
const uOf = (x, z, n) => (n[0] !== 0 ? z : x);

// deterministic pseudo-random for lit windows
const hash = (a, b, c) => {
  let v = (Math.imul(a, 374761393) + Math.imul(b, 668265263) + Math.imul(c, 2246822519)) >>> 0;
  v = Math.imul(v ^ (v >>> 13), 1274126177) >>> 0;
  return v ^ (v >>> 16);
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const paneAt = (x, y, z, wallAlongX) =>
  put(x, y, z, "light_blue_stained_glass_pane", {
    north: wallAlongX ? "false" : "true",
    south: wallAlongX ? "false" : "true",
    east: wallAlongX ? "true" : "false",
    west: wallAlongX ? "true" : "false",
    waterlogged: "false",
  });
const facingOf = ([nx, nz]) => {
  if (nz === 1) return "north";
  if (nz === -1) return "south";
  if (nx === 1) return "west";
  return "east";
};

// ---- choose the front entrance: middle of the outward +z face (fallbacks below)
const facesWith = (dz) =>
  cells
    .filter(([x, z]) => {
      const n = normalsOf(x, z);
      return n.length === 1 && n[0][0] === 0 && n[0][1] === dz;
    })
    .sort((a, b) => a[0] - b[0]);
let cands = facesWith(1);
if (!cands.length) cands = facesWith(-1);
if (!cands.length)
  cands = cells.filter(([x, z]) => normalsOf(x, z).length === 1).sort((a, b) => a[0] - b[0]);

let doorKey = null, doorNormal = null;
if (cands.length) {
  const idx = Math.floor(cands.length / 2);
  let pickIdx = idx;
  const n0 = normalsOf(cands[idx][0], cands[idx][1])[0];
  if (uOf(cands[idx][0], cands[idx][1], n0) % 4 === 0) {
    if (idx + 1 < cands.length) pickIdx = idx + 1;
    else if (idx - 1 >= 0) pickIdx = idx - 1;
  }
  const [dx, dz] = cands[pickIdx];
  doorKey = `${dx},${dz}`;
  doorNormal = normalsOf(dx, dz)[0];
}

// ---- footprint: foundation, floors, facades
for (const [x, z, gr] of cells) {
  const nrm = normalsOf(x, z);

  // foundation under every footprint cell
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (nrm.length === 0) {
    // interior: floor slabs only, air between them (no interiors)
    for (let y = gr; y <= ROOF_DECK; y++) {
      if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  const corner = nrm.length >= 2;
  const n = nrm[0];
  const u = uOf(x, z, n);
  const isDoor = doorKey === `${x},${z}`;

  for (let y = gr; y <= PARAPET; y++) {
    // roof deck edge and parapet
    if (y === ROOF_DECK) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === PARAPET) { put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }

    const r = y % 5;

    if (corner) {
      if (y === gr) put(x, y, z, "polished_granite");
      else if (r === 0) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "white_concrete");
      continue;
    }

    if (isDoor && (y === gr + 1 || y === gr + 2)) {
      const props = {
        facing: facingOf(doorNormal),
        hinge: "left",
        open: "false",
        powered: "false",
        half: y === gr + 1 ? "lower" : "upper",
      };
      put(x, y, z, "oak_door", props);
      continue;
    }

    if (y === gr) { put(x, y, z, "polished_granite"); continue; }          // base course
    if (r === 0) { put(x, y, z, "smooth_quartz"); continue; }              // spandrel
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }             // lintel band
    if (u % 4 === 0) { put(x, y, z, "white_concrete"); continue; }         // pier

    // window: glass pane in the wall cell
    const wallAlongX = n[1] !== 0;
    paneAt(x, y, z, wallAlongX);

    // warm light behind some glass, on the interior side of the air gap
    if (r === 2 && hash(x, y, z) % 5 === 0) {
      const ix = x - n[0], iz = z - n[1];
      if (inside(ix, iz) && normalsOf(ix, iz).length === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// ---- rooftop penthouse, centred, only if its whole footprint is on the building
const PX0 = 7, PX1 = 13, PZ0 = 8, PZ1 = 13;
let penthouseOk = true;
for (let x = PX0; x <= PX1; x++)
  for (let z = PZ0; z <= PZ1; z++)
    if (!inside(x, z)) penthouseOk = false;

if (penthouseOk) {
  for (let x = PX0; x <= PX1; x++) {
    for (let z = PZ0; z <= PZ1; z++) {
      const xEdge = x === PX0 || x === PX1;
      const zEdge = z === PZ0 || z === PZ1;
      const edge = xEdge || zEdge;
      for (let y = PARAPET; y <= 28; y++) {
        if (!edge) continue; // interior air
        if (y === 27 && xEdge !== zEdge) {
          paneAt(x, y, z, zEdge); // glass band on the single-axis edges
        } else {
          put(x, y, z, "light_gray_concrete");
        }
      }
      put(x, 29, z, "light_gray_concrete"); // penthouse roof, supported by the edge walls
    }
  }
  put(10, 30, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

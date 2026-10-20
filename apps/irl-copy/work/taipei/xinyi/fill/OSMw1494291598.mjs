import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise commercial block, c. 1980s Xinyi: two storeys over a
// plinth, smooth-quartz walls, light-grey concrete belt courses, a glazed
// shopfront with dark oak mullions, a centre entrance, and a flat roof parapet
// with plant boxes. Roof sits ROOF blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1494291598";
const W = 43, H = 23, D = 44;
const STOREY = 5;
const ROOF = 11;          // walls occupy relative rows 0..10
const TOP_PLANT = 12;     // plant boxes may reach row 12

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rawList = Array.isArray(raw) ? raw : (raw.cells ?? []);
const list = rawList.map(e => (Array.isArray(e) ? e : [e.x, e.z, e.ground]));

const minG = Math.min(...list.map(c => c[2]));
const fp = new Map();
const cells = [];
for (const [x, z, gr] of list) {
  const g0 = gr - minG;
  fp.set(`${x},${z}`, g0);
  cells.push({ x, z, g0 });
}

const has = (x, z) => fp.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const OUT = { N: "north", S: "south", W: "west", E: "east" };
const exposed = (x, z) => Object.keys(DIRS).filter(f => !has(x + DIRS[f][0], z + DIRS[f][1]));
const uOf = (f, x, z) => (f === "N" || f === "S" ? x : z);

// Entrance: the exposed face with the most cells, centred on its median cell.
const faceCount = { N: [], S: [], W: [], E: [] };
for (const c of cells) for (const f of exposed(c.x, c.z)) faceCount[f].push(c);
let doorFace = "S";
for (const f of ["N", "S", "W", "E"]) {
  if (faceCount[f].length > faceCount[doorFace].length) doorFace = f;
}
let doorKey = null;
if (faceCount[doorFace].length) {
  const sorted = faceCount[doorFace].slice().sort((a, b) => uOf(doorFace, a.x, a.z) - uOf(doorFace, b.x, b.z));
  const mid = sorted[Math.floor(sorted.length / 2)];
  doorKey = `${mid.x},${mid.z}`;
}

const g = new Voxels([W, H, D]);

// Glazing with connection states that match the wall direction.
function paneProps(face) {
  return (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function wallBlock(face, x, z, y, r) {
  const u = uOf(face, x, z);
  const bay = u % 4;
  if (r <= 3) {
    // ground floor shopfront: glass with dark oak mullions
    if (bay === 0) return ["dark_oak_log", { axis: "y" }];
    return ["glass_pane", paneProps(face)];
  }
  if (r === 4 || r === 5 || r === 9) return ["light_gray_concrete"];
  if (r >= 6 && r <= 8) {
    if (bay === 1 || bay === 2) return ["glass_pane", paneProps(face)];
    return ["smooth_quartz"];
  }
  if (r === 10) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];
  return ["smooth_quartz"];
}

for (const c of cells) {
  const { x, z, g0 } = c;
  const key = `${x},${z}`;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");

  if (g0 > ROOF - 1) continue; // ground above the roof line: foundation only

  const faces = exposed(x, z);
  const isEdge = faces.length > 0;

  if (isEdge) {
    const face = faces[0];
    for (let y = g0; y <= ROOF - 1; y++) {
      const r = y;
      // door occupies two rows at the centre of the entrance face
      if (key === doorKey && face === doorFace && (y === g0 + 1 || y === g0 + 2)) {
        const upper = y === g0 + 2;
        g.set(x, y, z, "dark_oak_door", {
          facing: OUT[face],
          half: upper ? "upper" : "lower",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === g0) {
        g.set(x, y, z, "stone_bricks"); // base course
        continue;
      }
      const [name, props] = wallBlock(face, x, z, y, r);
      if (props) g.set(x, y, z, name, props);
      else g.set(x, y, z, name);
    }
  } else {
    // interior: floor slabs and roof deck only, the rest is air
    g.set(x, g0, z, "smooth_quartz");
    if (5 >= g0) g.set(x, 5, z, "smooth_quartz");
    g.set(x, ROOF - 1, z, "gray_concrete");
    if (x % 10 === 5 && z % 10 === 5) {
      for (let y = ROOF; y < TOP_PLANT; y++) g.set(x, y, z, "smooth_stone");
    }
  }
}

// Warm light behind some glazing: glowstone on the interior floor, one block in
// from the window, at sparse bays.
for (const c of cells) {
  const { x, z, g0 } = c;
  if (g0 > ROOF - 1) continue;
  const faces = exposed(x, z);
  if (!faces.length) continue;
  const face = faces[0];
  const key = `${x},${z}`;
  if (key === doorKey && face === doorFace) continue;
  const u = uOf(face, x, z);
  const bay = u % 4;
  if (bay !== 1 && bay !== 2) continue;
  const ix = x - DIRS[face][0];
  const iz = z - DIRS[face][1];
  if (!has(ix, iz)) continue;
  if (exposed(ix, iz).length) continue;
  const ig0 = fp.get(`${ix},${iz}`);
  // ground floor, every third bay
  if (((u >> 2) % 3 === 0) && ig0 + 1 <= STOREY - 1) {
    g.set(ix, ig0 + 1, iz, "glowstone");
  }
  // upper floor, every third bay
  if (((u >> 2) % 3 === 1) && ig0 <= STOREY) {
    g.set(ix, STOREY + 1, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

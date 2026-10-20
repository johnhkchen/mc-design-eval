import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541986974";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 23, D = 22;
const ROOF = 11;          // parapet cap; roof sits ~11 blocks above lowest ground
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

// outward normals per cell: N=-z, S=+z, W=-x, E=+x
const DV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", E: "east", W: "west" };
const normalsOf = (x, z) =>
  Object.keys(DV).filter(d => !has(x + DV[d][0], z + DV[d][1]));

const info = cells.map(([x, z, gr]) => ({ x, z, gr, nrm: normalsOf(x, z) }));
const ring = new Set(info.filter(c => c.nrm.length > 0).map(c => `${c.x},${c.z}`));

// position along the face: x for N/S faces, z for E/W faces
const idxAlong = (c, d) => (d === "N" || d === "S" ? c.x : c.z);

// longest face carries the entrance, centred on that face
const faceCount = { N: [], S: [], E: [], W: [] };
for (const c of info) if (c.nrm.length === 1) faceCount[c.nrm[0]].push(c);
let mainFace = "S", best = -1;
for (const d of Object.keys(faceCount)) if (faceCount[d].length > best) { best = faceCount[d].length; mainFace = d; }
const face = faceCount[mainFace];
let entrance = null;
if (face.length) {
  const ids = face.map(c => idxAlong(c, mainFace));
  const mid = (Math.min(...ids) + Math.max(...ids)) / 2;
  entrance = face.reduce((a, b) =>
    Math.abs(idxAlong(b, mainFace) - mid) < Math.abs(idxAlong(a, mainFace) - mid) ? b : a);
}
const entKey = entrance ? `${entrance.x},${entrance.z}` : null;

// interior cells that sit directly behind a storey-2 window get a warm glow
const lit = new Set();
for (const c of info) {
  if (c.nrm.length !== 1) continue;
  const d = c.nrm[0];
  if (idxAlong(c, d) % 4 !== 1) continue;
  const ix = c.x - DV[d][0], iz = c.z - DV[d][1];
  const k = `${ix},${iz}`;
  if (has(ix, iz) && !ring.has(k)) lit.add(k);
}

for (const c of info) {
  const { x, z, gr, nrm } = c;
  const key = `${x},${z}`;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (nrm.length === 0) {
    // interior: air behind the glass, floor slabs per storey, roof slab
    if (gr <= 5) g.set(x, 5, z, "smooth_stone");
    if (gr <= 10) g.set(x, 10, z, "smooth_stone");
    if (lit.has(key) && gr <= 7) g.set(x, 7, z, "glowstone");
    if (gr <= 10 && (x === 3 || x === 4) && z % 7 === 3) g.set(x, 11, z, "iron_block");
    continue;
  }

  const corner = nrm.length >= 2;
  const d = nrm[0];
  const idx = corner ? 0 : idxAlong(c, d);

  for (let y = gr; y <= ROOF; y++) {
    let b;
    if (y === gr) b = "polished_andesite";                      // base course
    else if (y === 11) b = "light_gray_concrete";               // parapet
    else if (y === 10) b = "smooth_stone";                      // cornice
    else if (y === 4 || y === 5) b = "smooth_stone";            // storey lines
    else if (y >= 1 && y <= 3) {                                // shopfront
      b = corner || idx % 3 === 0 ? "light_gray_concrete" : "glass";
    } else if (y >= 6 && y <= 9) {                              // upper floor
      b = corner || idx % 3 === 0 ? "light_gray_concrete" : (idx % 2 === 1 ? "glass" : "smooth_quartz");
    } else b = "smooth_quartz";
    g.set(x, y, z, b);
  }

  if (key === entKey) {
    const door = { facing: FACING[d], hinge: "left", open: "false", powered: "false" };
    g.set(x, gr, z, "dark_oak_door", { ...door, half: "lower" });
    g.set(x, gr + 1, z, "dark_oak_door", { ...door, half: "upper" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

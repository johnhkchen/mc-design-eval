// Mt Eden / Eden Terrace: a 1930s three-storey plastered commercial block (Art Deco stringcourses, flat roof, shopfront
// on the west face), with a two-storey lower corner and the top storey set back one cell from the street shell.
// Lidar: ground 0..3 (foundation under it), roof 10..12 (main mass 12 = three storeys of 4; roof 10 = low wing).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_270735264.cells.json`, "utf8"));   // [x, z, ground, roof]
const SIZE = [13, 25, 18];

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => F.has(`${x},${z}`);
const NB = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const FACE = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };   // the outward direction of each face
const outFaces = (x, z) => Object.keys(FACE).filter((f) => !inF(x + FACE[f][0], z + FACE[f][1]));

// depth in from the outside: 1 = the street shell, 2 = the ring inside it, and so on
const depth = new Map();
let frontier = [];
for (const [k] of F) {
  const [x, z] = k.split(",").map(Number);
  if (outFaces(x, z).length) { depth.set(k, 1); frontier.push([x, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, z] of frontier) for (const [dx, dz] of NB) {
    const k = `${x + dx},${z + dz}`;
    if (inF(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); next.push([x + dx, z + dz]); }
  }
  frontier = next;
}

// Every block, keyed "x,y,z"; anything not put is air
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => B.has(`${x},${y},${z}`);

for (const [k, { ground: G, roof }] of F) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k), ring = d === 1, main = roof >= 11;   // roof 11 and 12 are one tier, 10 the low wing
  // foundation from y 0 up to the ground, then the ground-floor slab, then the storey floors at y 4 and 8
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");
  put(x, G, z, "smooth_stone");
  put(x, 4, z, "smooth_stone");
  put(x, 8, z, "smooth_stone");
  if (ring) {
    // street shell: two storeys and a parapet at y 9, a coping slab on top, terracotta storey lines at y 4 and 8
    for (let y = G + 1; y <= 9; y++) put(x, y, z, "white_concrete");
    put(x, 10, z, "stone_brick_slab", { type: "bottom" });
    put(x, 4, z, "orange_terracotta");
    put(x, 8, z, "orange_terracotta");
  } else if (main) {
    // third storey set back one cell from the street shell: its own walls at y 9-10, flat roof at y 11
    if (d === 2) { put(x, 9, z, "white_concrete"); put(x, 10, z, "white_concrete"); }
    put(x, 11, z, "gray_concrete");
  } else {
    put(x, 9, z, "gray_concrete");   // low wing roof
  }
}

// Street shell glazing: bays of three on each face (a pier, then two glazed bays); corners stay solid.
// Ground floor: shopfront glass with stone piers. Storey two: window pairs over a terracotta sill.
for (const [k, { ground: G }] of F) {
  if (depth.get(k) !== 1) continue;
  const [x, z] = k.split(",").map(Number);
  const faces = outFaces(x, z);
  if (faces.length !== 1) continue;
  const i = faces[0] === "W" || faces[0] === "E" ? z : x;
  const pier = i % 3 === 0;
  for (let y = G + 1; y <= 3; y++) put(x, y, z, pier ? "stone_bricks" : "glass_pane");
  for (const y of [5, 6]) if (!pier) put(x, y, z, "glass_pane");
}

// Front door in the middle of the west (shopfront) face, with a glazed transom
const westZ = [...F.keys()].filter((k) => k.startsWith("0,")).map((k) => +k.split(",")[1]).sort((a, b) => a - b);
const doorZ = westZ[Math.floor(westZ.length / 2)] + (westZ[Math.floor(westZ.length / 2)] % 3 === 0 ? 1 : 0);
const doorG = F.get(`0,${doorZ}`).ground;
const doorState = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
put(0, doorG + 1, doorZ, "dark_oak_door", doorState("lower"));
put(0, doorG + 2, doorZ, "dark_oak_door", doorState("upper"));
put(0, doorG + 3, doorZ, "glass_pane");
// a lit shop interior behind the door's neighbouring windows
put(1, doorG + 1, doorZ, "glowstone");

// Warm light behind some storey-two windows: a glowstone on the floor of the room behind the glass
for (const [k] of F) {
  if (depth.get(k) !== 1) continue;
  const [x, z] = k.split(",").map(Number);
  const faces = outFaces(x, z);
  if (faces.length !== 1 || !has(x, 5, z) || B.get(`${x},5,${z}`).block !== "glass_pane") continue;
  const f = faces[0];
  const i = f === "W" || f === "E" ? z : x;
  const [ix, iz] = [x - FACE[f][0], z - FACE[f][1]];
  if (i % 6 === 2 && inF(ix, iz) && depth.get(`${ix},${iz}`) >= 2) put(ix, 5, iz, "glowstone");
}

// Roof plant: a lift house and a small box on the main roof, standing on its flat cap
for (const [x, z] of [[5, 6], [6, 6], [5, 7], [6, 7]]) {
  const k = `${x},${z}`;
  if (inF(x, z) && F.get(k).roof >= 11 && depth.get(k) >= 2) {
    put(x, 12, z, "white_concrete");
    put(x, 13, z, "white_concrete");
  }
}

// Write it out: panes join their neighbours in the wall plane (glass, piers, walls)
const g = new Voxels(SIZE);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  if (block === "glass_pane") {
    const f = outFaces(x, z)[0] ?? (x === 0 ? "W" : "N");
    const sides = f === "W" || f === "E" ? ["north", "south"] : ["east", "west"];
    const neighbours = f === "W" || f === "E" ? [[x, y, z - 1], [x, y, z + 1]] : [[x - 1, y, z], [x + 1, y, z]];
    const s = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    neighbours.forEach(([a, b, c], n) => { if (has(a, b, c)) s[sides[n]] = "true"; });
    g.set(x, y, z, block, s);
  } else {
    g.set(x, y, z, block, state);
  }
}
const out = g.save(`${DIR}/way_270735264.nbt`);
console.log(`way_270735264: ${out.blocks} blocks, ${out.palette} palette entries`);

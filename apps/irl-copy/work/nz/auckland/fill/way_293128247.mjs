// Way 293128247: a five-storey flat-roofed concrete commercial block (1960s), on a basalt plinth with a glazed
// shopfront. The lidar roof reads 22 over 2189 of 2216 cells (the rest are edge noise), so it is one flat tier; the
// ground under it is 0-3 and is median-smoothed to a clean foundation line. The shell is two blocks deep: the outer
// layer carries the fins, spandrels and recessed window slots, the inner layer the glass with an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(HERE + "way_293128247.cells.json", "utf8"));
const SIZE = [94, 35, 53];
const SLABS = [4, 8, 12, 16, 20];                       // floor slabs = the storey lines (4 blocks apart)
const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];        // north, east, south, west
const FACE = { "0,-1": "north", "1,0": "east", "0,1": "south", "-1,0": "west" };
const PANE = "light_blue_stained_glass_pane";
const NON_FULL = new Set(["lantern", "dark_oak_door"]); // blocks a pane does not connect to

const key2 = (x, z) => `${x},${z}`;
const key3 = (x, y, z) => `${x},${y},${z}`;
const B = new Map();                                    // "x,y,z" -> { block, state }: everything placed
const put = (x, y, z, block, state) => B.set(key3(x, y, z), { block, state });
const med = (v) => v.sort((p, q) => p - q)[v.length >> 1];

// footprint cells: the outline, depth from the outside (1 = outer layer), and the facade each shell cell faces
const FP = new Map();
for (const [x, z, g] of cells) FP.set(key2(x, z), { x, z, g, d: undefined, outs: [], n: null, a: 0, fin: false, corner: false });
const cellAt = (x, z) => FP.get(key2(x, z));
for (const c of FP.values()) {
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const n = cellAt(c.x + dx, c.z + dz); if (n) near.push(n.g); }
  c.R = Math.max(1, med(near));                         // foundation top / ground-floor row, smoothed
  c.outs = DIRS.filter(([dx, dz]) => !cellAt(c.x + dx, c.z + dz));
  if (c.outs.length) c.d = 1;
}
let front = [...FP.values()].filter((c) => c.d === 1);
for (let d = 1; front.length; d++) {
  const next = [];
  for (const c of front) for (const [dx, dz] of DIRS) { const n = cellAt(c.x + dx, c.z + dz); if (n && n.d === undefined) { n.d = d + 1; next.push(n); } }
  front = next;
}
for (const c of FP.values()) if (c.d === undefined) c.d = 99;
// an outer cell faces the outward side its wall runs along. On a diagonal staircase a step cell has two outward
// sides and takes the one its neighbours share; a cell that shares neither is a corner
const tangents = (o) => (o[0] !== 0 ? [[0, 1], [0, -1]] : [[1, 0], [-1, 0]]);
const facesOut = (nb, o) => !!nb && nb.d === 1 && nb.outs.some(([ox, oz]) => ox === o[0] && oz === o[1]);
for (const c of FP.values()) {
  if (c.d !== 1) continue;
  let best = null, bestS = 0;
  for (const o of c.outs) {
    const s = tangents(o).filter(([tx, tz]) => facesOut(cellAt(c.x + tx, c.z + tz), o)).length;
    if (s > bestS) { best = o; bestS = s; }
  }
  if (best) c.n = best; else c.corner = true;
}
// an inner shell cell sits behind the outer cell in its direction (preferring the one whose facade it shares)
for (const c of FP.values()) {
  if (c.d !== 2) continue;
  const ins = DIRS.filter(([dx, dz]) => { const nb = cellAt(c.x + dx, c.z + dz); return nb && nb.d === 1; });
  const pick = ins.find(([dx, dz]) => { const nb = cellAt(c.x + dx, c.z + dz); return nb.n && nb.n[0] === dx && nb.n[1] === dz; }) || ins[0];
  if (pick) c.n = pick; else c.corner = true;
}
for (const c of FP.values()) {
  if (c.n) { c.a = c.n[0] !== 0 ? c.z : c.x; c.fin = c.a % 4 === 0; }   // a = the coordinate along the face
  if (c.corner) c.fin = true;
}

// the storey rows: 1 sill, 2-3 glazing, 4 head (4 = the shop fascia on the ground floor); 20 cornice, 21 parapet
function roleOf(y, R) {
  if (y < R) return "base";
  if (y === R) return "riser";
  if (y > 21) return "none";
  if (y === 21) return "parapet";
  if (y === 20) return "cornice";
  if (y === 4) return "fascia";
  const local = ((y - 1) % 4) + 1;
  if (local === 1) return "sill";
  if (local === 4) return "head";
  return "win";
}
const SHELL = {
  base: "polished_andesite", riser: "polished_andesite", parapet: "stone_bricks", cornice: "white_concrete",
  fascia: "dark_oak_planks", sill: "light_gray_concrete", head: "light_gray_concrete",
};

for (const c of FP.values()) {
  for (let y = 0; y <= 21; y++) {
    if (c.d > 2) {                                      // interior: foundation, a floor slab per storey, the roof membrane
      if (y < c.R) put(c.x, y, c.z, "polished_andesite");
      else if (y === 21) put(c.x, y, c.z, "gray_concrete");
      else if (SLABS.includes(y)) put(c.x, y, c.z, "light_gray_concrete");
      continue;
    }
    const role = roleOf(y, c.R);
    if (SHELL[role]) put(c.x, y, c.z, SHELL[role]);
    else if (role === "win") {
      if (c.fin) put(c.x, y, c.z, "white_concrete");   // pilaster between bays
      else if (c.d === 2) put(c.x, y, c.z, PANE);     // glass sits back, inside the recess
      // d = 1 window: left as air, the recessed slot
    }
  }
}

// the entrance: the middle bay of the longest ground-floor face, a dark oak door with a lintel over it
const faceCount = new Map();
for (const c of FP.values()) if (c.d === 1 && c.n && !c.fin) faceCount.set(c.n.join(), (faceCount.get(c.n.join()) || 0) + 1);
const bestFace = [...faceCount.entries()].sort((p, q) => q[1] - p[1])[0][0];
const faceCells = [...FP.values()].filter((c) => c.d === 1 && c.n && c.n.join() === bestFace && !c.fin && c.R <= 2).sort((p, q) => p.a - q.a);
const door = faceCells[faceCells.length >> 1];
const [dnx, dnz] = door.n;
const facing = FACE[door.n.join()];
const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
put(door.x, door.R, door.z, "dark_oak_door", doorState("lower"));
put(door.x, door.R + 1, door.z, "dark_oak_door", doorState("upper"));
B.delete(key3(door.x - dnx, door.R, door.z - dnz));       // the opening behind the door
B.delete(key3(door.x - dnx, door.R + 1, door.z - dnz));
for (const c of faceCells) {                              // lintel over the entrance bay, outer and inner layers
  if (Math.abs(c.a - door.a) > 1) continue;
  put(c.x, door.R + 2, c.z, "dark_oak_planks");
  put(c.x - dnx, door.R + 2, c.z - dnz, "dark_oak_planks");
}

// warm light behind the glazing: hanging lanterns in the upper bays, glowstone on the shop floor
for (const c of FP.values()) {
  if (c.d !== 2 || !c.n || c.fin) continue;
  const [nx, nz] = c.n;
  const inner = cellAt(c.x - nx, c.z - nz);              // the interior cell behind this glass
  if (!inner || inner.d < 3) continue;
  for (let y = 1; y <= 19; y++) {
    if (B.get(key3(c.x, y, c.z))?.block !== PANE) continue;
    const k = Math.floor((y - 1) / 4) + 1;
    if (y === ((k - 1) * 4) + 3 && ((k % 2 === 1 && c.a % 8 === 2) || (k % 2 === 0 && c.a % 8 === 6))) {
      if (!B.has(key3(inner.x, y, inner.z))) put(inner.x, y, inner.z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    if (y === 2 && c.R <= 2 && c.a % 8 === 6 && !B.has(key3(inner.x, c.R, inner.z))) put(inner.x, c.R, inner.z, "glowstone");
  }
}

// glass panes connect to the solid faces and panes beside them, as in the game
for (const [kk, v] of B) {
  if (v.block !== PANE) continue;
  const [x, y, z] = kk.split(",").map(Number);
  const st = {};
  for (const [name, dx, dz] of [["north", 0, -1], ["east", 1, 0], ["south", 0, 1], ["west", -1, 0]]) {
    const nb = B.get(key3(x + dx, y, z + dz));
    st[name] = nb && (nb.block === PANE || !NON_FULL.has(nb.block)) ? "true" : "false";
  }
  st.waterlogged = "false";
  v.state = st;
}

// roof plant: up to three solid plant boxes, two blocks high, kept well in from the parapet
const ok = (x0, z0) => {
  for (let dx = 0; dx < 7; dx++) for (let dz = 0; dz < 4; dz++) { const c = cellAt(x0 + dx, z0 + dz); if (!c || c.d < 5) return false; }
  return true;
};
const taken = new Set();
const boxes = [];
const starts = [...FP.values()].sort((p, q) => Math.hypot(p.x - 47, p.z - 26) - Math.hypot(q.x - 47, q.z - 26));
for (const c of starts) {
  if (boxes.length >= 3) break;
  if (!ok(c.x, c.z)) continue;
  let clash = false;
  for (let dx = -2; dx < 9 && !clash; dx++) for (let dz = -2; dz < 6; dz++) if (taken.has(key2(c.x + dx, c.z + dz))) { clash = true; break; }
  if (clash) continue;
  boxes.push([c.x, c.z]);
  for (let dx = 0; dx < 7; dx++) for (let dz = 0; dz < 4; dz++) taken.add(key2(c.x + dx, c.z + dz));
}
for (const [x0, z0] of boxes) for (let dx = 0; dx < 7; dx++) for (let dz = 0; dz < 4; dz++) {
  put(x0 + dx, 22, z0 + dz, "light_gray_concrete");
  put(x0 + dx, 23, z0 + dz, "stone_bricks");
}

const g = new Voxels(SIZE);
for (const [kk, v] of B) { const [x, y, z] = kk.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
const out = g.save(HERE + "way_293128247.nbt");
console.log(`way_293128247: ${cells.length} cells, ${boxes.length} roof plant boxes, door on the ${FACE[bestFace]} face; ${out.blocks} blocks, ${out.palette} palette`);

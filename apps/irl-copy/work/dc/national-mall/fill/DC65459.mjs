// 1133 Connecticut Ave NW: a 1960s-70s speculative office block, a 19-block tower on a 17-block wing,
// precast concrete frame with tinted glass in a 3-bay grid, a setback tower and a shopfront wing on the street side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65459.cells.json`, "utf8"));
const W = 23, D = 13;
const g = new Voxels([W, 31, D]);

// ---- footprint: roof snapped to the two flat tiers (17 wing, 19 tower); ground per cell ----
const H = new Map(), GROUND = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, ground, roof] of cells) { H.set(key(x, z), roof >= 18 ? 19 : 17); GROUND.set(key(x, z), ground); }
const inF = (x, z) => H.has(key(x, z));
const hOf = (x, z) => H.get(key(x, z));

// depth from the outside edge: 1 = facade ring, 2 = the air gap behind it, 3+ = the core
const depth = new Map(), queue = [];
const NB = [[0, -1], [0, 1], [-1, 0], [1, 0]];
for (const k of H.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !inF(x + dx, z + dz))) { depth.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i].split(",").map(Number), d = depth.get(queue[i]);
  for (const [dx, dz] of NB) { const k = key(x + dx, z + dz); if (inF(x + dx, z + dz) && !depth.has(k)) { depth.set(k, d + 1); queue.push(k); } }
}
const dOf = (x, z) => depth.get(key(x, z));

// setbacks: the 19-block tower keeps its full plan to y 12, loses its outer ring above (terrace at y 12),
// and loses the next ring above y 16 (terrace at y 16); the wing stops at 17
function included(x, z, y) {
  const h = hOf(x, z); if (h === undefined || y >= h) return false;
  if (h === 19) { if (y >= 17) return dOf(x, z) >= 3; if (y >= 13) return dOf(x, z) >= 2; }
  return true;
}
const capAt = (h, y) => (h === 19 ? [12, 16, 18] : [16]).includes(y);
const paneRow = (y) => y <= 2 || (y >= 4 && y <= 17 && (y % 2 === 0 || y === 17));
const slabRow = (y) => y === 0 || [3, 5, 7, 9, 11, 13, 15, 17].includes(y);

const GLASS = "light_blue_stained_glass_pane", FRAME = "white_concrete", SPANDREL = "light_gray_concrete";
const facades = new Map();   // "x,y,z" -> { face: "north"|"south"|"east"|"west", type: "glass"|"mullion"|"solid" }
const FACE_VEC = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// ---- pass 1: foundation, interiors (air gaps and floor slabs), facades ----
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z)) continue;
  const ground = GROUND.get(key(x, z));
  for (let y = 0; y < ground; y++) g.set(x, y, z, "smooth_stone");          // foundation up to this cell's ground
  for (let y = 0; y < hOf(x, z); y++) {
    if (!included(x, z, y)) continue;
    const exposed = NB.map(([dx, dz], i) => [["north", "south", "west", "east"][i], !included(x + dx, z + dz, y)]).filter(([, e]) => e).map(([f]) => f);
    if (!exposed.length) {                                                   // interior: floor slabs and the air gap
      if (slabRow(y) || capAt(hOf(x, z), y)) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // facade: a N/S exposure takes the face along x, otherwise along z (corners read as the street front)
    const face = exposed.includes("south") ? "south" : exposed.includes("north") ? "north" : exposed.includes("west") ? "west" : "east";
    const along = face === "north" || face === "south" ? x : z;
    const h = hOf(x, z);
    const k3 = `${x},${y},${z}`;
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (capAt(h, y)) { g.set(x, y, z, "smooth_quartz"); facades.set(k3, { face, type: "solid" }); continue; }
    if (face === "south" && z === D - 1 && along === 11 && y <= 2) {         // lobby door, lower and upper halves
      g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      facades.set(k3, { face, type: "solid" }); continue;
    }
    if (y === 3) {                                                            // lintel band; canopy over the lobby
      if (face === "south" && z === D - 1 && along >= 10 && along <= 12) g.set(x, y, z, "polished_blackstone");
      else g.set(x, y, z, "smooth_stone");
      facades.set(k3, { face, type: "solid" }); continue;
    }
    if (paneRow(y)) {
      if (along % 3 === 0) { g.set(x, y, z, FRAME); facades.set(k3, { face, type: "mullion" }); }
      else { g.set(x, y, z, GLASS); facades.set(k3, { face, type: "glass" }); }
      continue;
    }
    g.set(x, y, z, SPANDREL); facades.set(k3, { face, type: "solid" });
  }
}

// ---- pass 2: glass pane connections along each facade; warm lights in some bays behind the glass ----
for (const [k3, f] of facades) {
  const [x, y, z] = k3.split(",").map(Number);
  if (f.type !== "glass") continue;
  const alongX = f.face === "north" || f.face === "south";
  const nbrs = alongX ? [[x - 1, z], [x + 1, z]] : [[x, z - 1], [x, z + 1]];
  const conn = nbrs.map(([nx, nz]) => { const n = facades.get(`${nx},${y},${nz}`); return n && n.face === f.face && n.type !== "solid" ? "true" : "false"; });
  const state = alongX
    ? { north: "false", south: "false", east: conn[1], west: conn[0], waterlogged: "false" }
    : { east: "false", west: "false", north: conn[0], south: conn[1], waterlogged: "false" };
  g.set(x, y, z, GLASS, state);
}
for (const [k3, f] of facades) {
  const [x, y, z] = k3.split(",").map(Number);
  if (f.type !== "glass" || y < 4 || y > 14 || (x * 7 + y * 5 + z * 3) % 13 !== 0) continue;
  const [dx, dz] = inward[f.face];
  if (!included(x + dx, z + dz, y) || facades.has(`${x + dx},${y},${z + dz}`)) continue;
  g.set(x + dx, y, z + dz, (x + y) % 2 ? "glowstone" : "shroomlight");
}
// the lobby's hanging lantern, a warm light just inside the door
g.set(11, 2, D - 2, "lantern", { hanging: "true", waterlogged: "false" });

// ---- terrace railings on the stepped-back edges (iron bars standing on the terrace decks) ----
const railing = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inF(x, z) || hOf(x, z) !== 19) continue;
  if (dOf(x, z) === 1 && !included(x, 13, z) && included(x, 12, z)) railing.push([x, 13, z]);
  if (dOf(x, z) === 2 && !included(x, 17, z) && included(x, 16, z)) railing.push([x, 17, z]);
}
const railSet = new Set(railing.map((p) => p.join(",")));
for (const [x, y, z] of railing) {
  const c = (dx, dz) => (railSet.has(`${x + dx},${y},${z + dz}`) ? "true" : "false");
  g.set(x, y, z, "iron_bars", { north: c(0, -1), south: c(0, 1), west: c(-1, 0), east: c(1, 0), waterlogged: "false" });
}

const info = g.save(`${DIR}/DC65459.nbt`);
console.log(JSON.stringify({ footprint: cells.length, ...info }));

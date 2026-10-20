import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw588116128";
const W = 26, D = 104, H = 36;

// Record: roof ~24 blocks above lowest ground. No era record, so: a Xinyi-era
// (late 1990s to 2000s) mid-rise office block. Pale white concrete body with
// light-grey spandrels and tinted glazing, stone-brick plinth, shopfront base,
// cornice, parapet, and a rooftop mechanical penthouse.
const ROOF_ABOVE_LOWEST = 24;
const TOP_LIMIT = 32; // leaves room for penthouse cap (top+3) and parapet inside 0..35

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gy] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.round(gy));
}
if (ground.size === 0) throw new Error("no footprint cells");

const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const minG = Math.min(...ground.values());
const rel = (x, z) => ground.get(`${x},${z}`) - minG;
const rels = cellList.map(([x, z]) => rel(x, z));
const F = Math.max(...rels); // flat floor datum: highest ground under the footprint

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const edgeFaces = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  return f;
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Storeys: roof target ~24 above lowest ground, measured from the flat floor datum.
const target = Math.min(ROOF_ABOVE_LOWEST, TOP_LIMIT);
const avail = Math.max(10, target - F);
let storeys = clamp(Math.round(avail / 5), 2, 6);
let h = clamp(Math.round(avail / storeys), 4, 6);
while (F + storeys * h > TOP_LIMIT && storeys > 2) {
  storeys--;
  h = clamp(Math.round(avail / storeys), 4, 6);
}
const top = F + storeys * h; // roof slab level

// Facade bookkeeping
const faceT = {};
const faceCount = { W: 0, E: 0, N: 0, S: 0 };
for (const [x, z] of cellList) {
  if (!isEdge(x, z)) continue;
  for (const f of edgeFaces(x, z)) {
    const t = f === "W" || f === "E" ? z : x;
    faceCount[f]++;
    if (!faceT[f]) faceT[f] = [t, t];
    faceT[f][0] = Math.min(faceT[f][0], t);
    faceT[f][1] = Math.max(faceT[f][1], t);
  }
}
// Main (entrance) face: the long 104-block side with the most exposed cells.
const mainFace = Object.keys(faceCount).sort((a, b) => faceCount[b] - faceCount[a])[0];
const isPierT = (f, t) => {
  const [t0, t1] = faceT[f];
  return t === t0 || t === t1 || (t - t0) % 4 === 0;
};
// Door: a non-pier, single-face cell on the main face nearest its middle.
const [mt0, mt1] = faceT[mainFace];
const midT = (mt0 + mt1) / 2;
let doorCell = null;
for (const [x, z] of cellList) {
  if (!isEdge(x, z)) continue;
  const fs = edgeFaces(x, z);
  if (fs.length !== 1 || fs[0] !== mainFace) continue;
  const t = mainFace === "W" || mainFace === "E" ? z : x;
  if (isPierT(mainFace, t)) continue;
  if (!doorCell || Math.abs(t - midT) < Math.abs(doorCell.t - midT)) doorCell = { x, z, t };
}
const doorT = doorCell ? doorCell.t : Math.round(midT);

const FACING = { W: "west", E: "east", N: "north", S: "south" };
const P_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const P_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

function wallCell(x, z, y, fs, s, k) {
  const primary = fs.includes(mainFace) ? mainFace : fs[0];
  const isWE = primary === "W" || primary === "E";
  const t = isWE ? z : x;
  const corner = fs.length > 1;

  // Piers and corners: solid white columns, every fourth bay.
  if (corner || isPierT(primary, t)) {
    put(x, y, z, "white_concrete");
    return;
  }
  // Entrance: double door on the main face, with a small canopy band above.
  if (s === 0 && primary === mainFace && t === doorT && k <= 2) {
    const props = { facing: FACING[primary], hinge: "left", open: "false", powered: "false" };
    put(x, y, z, "oak_door", { ...props, half: k === 1 ? "lower" : "upper" });
    return;
  }
  if (s === 0 && primary === mainFace && Math.abs(t - doorT) <= 1 && k === 3) {
    put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    return;
  }
  if (k === h - 1) { put(x, y, z, "light_gray_concrete"); return; }      // header
  if (s === 0 && k === 1) { put(x, y, z, "stone_bricks"); return; }       // base course
  if (k === 1) { put(x, y, z, "light_gray_concrete"); return; }           // spandrel
  // Glazing with frames.
  put(x, y, z, "light_blue_stained_glass_pane", isWE ? P_EW : P_NS);
  // Warm lamp standing on the floor just behind some windows.
  if (s >= 1 && k === 2 && (t + s * 3) % 5 === 0) {
    const ix = x + (primary === "W" ? 1 : primary === "E" ? -1 : 0);
    const iz = z + (primary === "N" ? 1 : primary === "S" ? -1 : 0);
    if (has(ix, iz) && !isEdge(ix, iz)) put(ix, F + s * h + 1, iz, "glowstone");
  }
}

// 1. Foundations: solid from y 0 up to the flat floor under every footprint cell.
for (const [x, z] of cellList) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys, floor slabs, facades, roof.
for (const [x, z] of cellList) {
  const edge = isEdge(x, z);
  const fs = edge ? edgeFaces(x, z) : [];
  for (let y = F; y < top; y++) {
    const yr = y - F;
    const s = Math.floor(yr / h);
    const k = yr - s * h;
    if (k === 0) {
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete"); // storey line / floor slab
      continue;
    }
    if (!edge) continue; // interior: air behind the glass
    wallCell(x, z, y, fs, s, k);
  }
  put(x, top, z, edge ? "white_concrete" : "light_gray_concrete"); // roof slab
  if (edge) {
    put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice
    put(x, top + 2, z, "white_concrete"); // parapet
  }
}

// 3. Rooftop: mechanical penthouse (solid, no interior) with a stone cap.
const pz0 = Math.floor(D * 0.32), pz1 = Math.floor(D * 0.48);
const px0 = 5, px1 = W - 6;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "light_gray_concrete");
    put(x, top + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 4. Warm lanterns on the roof at the inner corners.
for (const [x, z] of [[1, 1], [W - 2, 1], [1, D - 2], [W - 2, D - 2]]) {
  if (has(x, z) && !isEdge(x, z)) put(x, top + 1, z, "lantern");
}

g.save(`${DIR}/${ID}.nbt`);

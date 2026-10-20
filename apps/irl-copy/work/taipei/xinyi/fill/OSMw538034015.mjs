import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538034015";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 23, D = 24;
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground (foundation top)
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(`${x},${z}`, Math.round(gr));
const inFP = (x, z) => GROUND.has(`${x},${z}`);
const groundAt = (x, z) => GROUND.get(`${x},${z}`);
const minG = Math.min(...GROUND.values());

// Storey datum (relative to lowest ground):
// rel 0 base course, rel 1-3 ground storey glazing, rel 4 lintel, rel 5 floor line,
// rel 6 lintel, rel 7-9 upper glazing, rel 10 sill, rel 11 roof slab, rel 12 parapet cap.
const R_OFF = 11;
const P_OFF = 12;
const R = minG + R_OFF; // roof slab level
const P = minG + P_OFF; // parapet cap level

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!inFP(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which outward faces a cell is on (missing neighbour = exposed face)
function faces(x, z) {
  const f = [];
  if (!inFP(x - 1, z)) f.push("W");
  if (!inFP(x + 1, z)) f.push("E");
  if (!inFP(x, z - 1)) f.push("N");
  if (!inFP(x, z + 1)) f.push("S");
  return f;
}

const INWARD = { W: [1, 0], E: [-1, 0], N: [0, 1], S: [0, -1] };

function paneProps(face) {
  return face === "W" || face === "E"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

// Returns [id, props?] for a facade block at storey-relative height
function facade(face, x, z, i, y, gr) {
  const rel = y - minG;
  const along = face === "W" || face === "E";
  const pier =
    i % 3 === 0 ||
    (along ? (!inFP(x, z - 1) || !inFP(x, z + 1)) : (!inFP(x - 1, z) || !inFP(x + 1, z)));

  if (y === gr) return ["stone_bricks"];               // base course at grade
  if (rel === 5 || rel === R_OFF) return ["light_gray_concrete"]; // floor lines / roof line
  if (rel === 4) {
    // lintel row; awning over the street entrance
    return face === "W" && i >= 9 && i <= 13 ? ["red_terracotta"] : ["white_concrete"];
  }
  if (rel === 0 || rel === 6 || rel === 10) return ["white_concrete"];

  const isGround = rel >= 1 && rel <= 3;
  const isUpper = rel >= 7 && rel <= 9;
  if (!isGround && !isUpper) return ["white_concrete"];
  if (pier) return ["light_gray_concrete"];

  // Street (west) entrance: double-height door bay at z = 11
  if (face === "W" && isGround && i === 11) {
    if (rel === 1) return ["dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (rel === 2) return ["dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }];
  }
  return ["glass_pane", paneProps(face)];
}

// ---- Pass 1: foundations, interiors, shell walls ----
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = faces(x, z);
  if (f.length === 0) {
    // Interior: ground floor slab, storey slabs, roof slab; air between
    put(x, gr, z, "smooth_stone");
    for (const L of [minG + 5, minG + R_OFF]) {
      if (L >= gr) put(x, L, z, "smooth_stone");
    }
    continue;
  }

  // Edge cell: choose the street face first, then any exposed face
  const face = f.includes("W") ? "W" : f.includes("E") ? "E" : f[0];
  const i = face === "W" || face === "E" ? z : x;

  for (let y = gr; y <= P && y < H; y++) {
    if (y <= R) {
      const [id, props] = facade(face, x, z, i, y, gr);
      put(x, y, z, id, props);
    } else if (y === P) {
      put(x, y, z, "red_terracotta");
    }
  }
}

// ---- Pass 2: lights behind glass, entrance lantern ----
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);
  const f = faces(x, z);
  if (f.length === 0) continue;
  const face = f.includes("W") ? "W" : f.includes("E") ? "E" : f[0];
  const i = face === "W" || face === "E" ? z : x;
  const [dx, dz] = INWARD[face];
  for (let y = gr; y <= R && y < H; y++) {
    const rel = y - minG;
    if (rel < 1 || rel > 9 || (rel > 3 && rel < 7)) continue;
    const [id] = facade(face, x, z, i, y, gr);
    if (id === "glass_pane" && (i + rel) % 4 === 0) {
      const ix = x + dx, iz = z + dz;
      if (inFP(ix, iz) && faces(ix, iz).length === 0) put(ix, y, iz, "glowstone");
    }
  }
}

// Hanging lantern inside the entrance bay
if (inFP(1, 11) && faces(1, 11).length === 0) {
  put(1, minG + 4, 11, "lantern", { hanging: "true", waterlogged: "false" });
}

// ---- Pass 3: rooftop stair/lift penthouse on the interior, 2x2 ----
for (let x = 3; x <= 4; x++) {
  for (let z = 9; z <= 10; z++) {
    if (!inFP(x, z) || faces(x, z).length !== 0) continue;
    for (let y = P; y <= P + 2; y++) put(x, y, z, "light_gray_concrete");
    put(x, P + 3, z, "red_terracotta");
  }
}

g.save(`${DIR}/${ID}.nbt`);

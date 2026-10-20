import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw629249620";
const W = 25, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and ground ------------------------------------------------
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(key(x, z), Math.max(0, Math.min(H - 13, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));

// Lowest ground under the footprint (y 0 by rule, but compute for safety).
const L = Math.min(...ground.values());
// Storey plan (absolute y):
//   L            base course (stone bricks)
//   L+1..L+4     ground-floor shopfront: glass with light-concrete piers, transom at L+4
//   F = L+5      floor slab between storeys (smooth stone)
//   F+1..R-1     second storey: white-concrete spandrels, glass with piers
//   R = L+10     roof deck / cornice course
//   TOP = L+11   parapet (the roof is 11 blocks above the lowest ground)
const F = L + 5;
const R = L + 10;
const TOP = L + 11;

// Outward face of a perimeter cell: first neighbour missing from footprint.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  return null;
}
// Direction from the wall cell into the building (for placing lights behind glass).
const inward = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

const paneProps = (face) =>
  face === "n" || face === "s"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const faces = new Map();
for (const [x, z] of cellList) faces.set(key(x, z), faceOf(x, z));

// ---- pass 1: foundations to the ground under each cell -------------------
for (const [x, z] of cellList) {
  const ground0 = gr(x, z);
  for (let y = 0; y < ground0; y++) set(x, y, z, "gray_concrete");
}

// ---- pass 2: floor slabs and roof deck over the whole footprint ----------
for (const [x, z] of cellList) {
  const ground0 = gr(x, z);
  if (F >= ground0) set(x, F, z, "smooth_stone");
  if (R >= ground0) set(x, R, z, "light_gray_concrete");
}

// ---- pass 3: perimeter walls ---------------------------------------------
const entranceX = Math.floor(W / 2);
for (const [x, z] of cellList) {
  const face = faces.get(key(x, z));
  if (!face) continue; // interior cell: no wall
  const i = face === "n" || face === "s" ? x : z; // position along the facade
  const ground0 = gr(x, z);

  for (let y = ground0; y < R; y++) {
    let id = "white_concrete";
    let props;
    if (y <= L) {
      id = "stone_bricks"; // base course
    } else if (y < F) {
      // ground-floor shopfront
      if (y === F - 1) id = "light_gray_concrete"; // transom
      else if (i % 3 === 0) id = "light_gray_concrete"; // pier
      else { id = "glass_pane"; props = paneProps(face); }
    } else if (y === F) {
      id = "smooth_stone"; // storey line
    } else {
      // second storey
      if (y === F + 1 || y === R - 1) id = "white_concrete"; // spandrels
      else if (i % 3 === 0) id = "white_concrete"; // pier
      else { id = "glass_pane"; props = paneProps(face); }
    }
    set(x, y, z, id, props);
  }

  // cornice course just under the roof deck line, parapet above it
  if (ground0 <= R) {
    set(x, R, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  set(x, TOP, z, "stone_bricks");
  set(x, TOP + 0, z, "stone_bricks");
}

// ---- pass 4: entrance on the south face, glass doors and a light -------
for (const [x, z] of cellList) {
  if (faces.get(key(x, z)) !== "s") continue;
  if (x !== entranceX - 1 && x !== entranceX) continue;
  const ground0 = gr(x, z);
  for (let y = Math.max(L + 1, ground0); y < L + 4; y++) {
    set(x, y, z, "glass", undefined);
  }
  set(x, L + 4, z, "light_gray_concrete");
}

// ---- pass 5: warm lights behind some windows -----------------------------
for (const [x, z] of cellList) {
  const face = faces.get(key(x, z));
  if (!face) continue;
  const i = face === "n" || face === "s" ? x : z;
  if (i % 6 !== 1 || i % 3 === 0) continue;
  const [dx, dz] = inward[face];
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz)) continue;
  for (const y of [L + 2, F + 3]) {
    if (y >= gr(ix, iz)) set(ix, y, iz, "glowstone");
  }
}

// ---- pass 6: rooftop plant on the roof deck ------------------------------
for (const [x, z] of cellList) {
  if (faces.get(key(x, z))) continue; // keep the parapet clear
  if (x % 8 === 4 && z % 6 === 3 && gr(x, z) <= R) {
    set(x, TOP, z, "iron_block");
    set(x, TOP + 0, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);

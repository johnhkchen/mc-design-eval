import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001654";
const W = 13, H = 24, D = 7;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// ---- footprint record [x, z, ground, roof] ----
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { x, z, gr: Math.max(0, Math.round(gr)), rf: Math.round(rf) });
}
const cell = (x, z) => map.get(`${x},${z}`);
const exp = (x, z) => ({
  n: !cell(x, z - 1), s: !cell(x, z + 1),
  w: !cell(x - 1, z), e: !cell(x + 1, z),
});
const perim = (x, z) => { const e = exp(x, z); return e.n || e.s || e.w || e.e; };

// ---- smooth the lidar roof: 3x3 mean, then flatten onto one tier ----
for (const c of map.values()) {
  let sum = 0, cnt = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = cell(c.x + dx, c.z + dz);
    if (n) { sum += n.rf; cnt++; }
  }
  c.rs = Math.round(sum / cnt);
}
const sorted = [...map.values()].map(c => c.rs).sort((a, b) => a - b);
const Rref = sorted[Math.floor(sorted.length / 2)];
const B = Math.min(...[...map.values()].map(c => c.gr));   // global storey datum
for (const c of map.values()) {
  c.R = Math.abs(c.rs - Rref) <= 1 ? Rref : c.rs;
  c.R = Math.min(H - 4, Math.max(c.gr + 6, c.R));
}

// storeys: two full storeys of 4 blocks, then an attic zone above them
const S = 4;
const N = Math.max(1, Math.floor((Rref - B - 1) / S));

// row type on the global datum: band | glass | header | bricks
const rowType = (y) => {
  const rel = y - B;
  const k = Math.floor(rel / S);
  if (k < N) {
    const r = rel - k * S;
    if (r === 0) return "band";
    if (r <= S - 2) return "glass";
    return "header";
  }
  const r = rel - N * S;
  if (r === 0) return "band";
  if (r === 1) return "glass";
  return "bricks";
};

// ---- 1. foundation, walls, floors, roof ----
for (const c of map.values()) {
  const { x, z, gr, R } = c;
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (perim(x, z)) {
    for (let y = gr; y <= R - 2; y++) {
      let id = "bricks";
      if (y === gr || y === R - 2) id = "stone_bricks";     // base course and cornice bracket
      else {
        const t = rowType(y);
        if (t === "band" || t === "header") id = "stone_bricks";
      }
      put(x, y, z, id);
    }
    put(x, R - 1, z, "smooth_stone");                       // cornice cap
  } else {
    for (let k = 1; k < N; k++) {
      const fy = B + k * S;
      if (fy > gr && fy < R - 1) put(x, fy, z, "spruce_planks"); // storey slabs
    }
    put(x, R - 1, z, "smooth_stone");                       // flat roof
  }
}

// ---- 2. windows: glass panes between stone piers ----
const glassProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// entrance on the street-facing high-z side
const zMax = Math.max(...[...map.values()].map(c => c.z));
const doorCands = [...map.values()].filter(c => c.z === zMax && !cell(c.x, c.z + 1));
let doorCell = null;
if (doorCands.length) {
  const meanX = doorCands.reduce((a, c) => a + c.x, 0) / doorCands.length;
  doorCell = doorCands.reduce((a, c) => (Math.abs(c.x - meanX) < Math.abs(a.x - meanX) ? c : a));
}

for (const c of map.values()) {
  const { x, z, gr, R } = c;
  if (!perim(x, z)) continue;
  const e = exp(x, z);
  const faces = [];
  if (e.n) faces.push({ t: x, len: W, alongX: true, dx: 0, dz: 1, face: "n" });
  if (e.s) faces.push({ t: x, len: W, alongX: true, dx: 0, dz: -1, face: "s" });
  if (e.w) faces.push({ t: z, len: D, alongX: false, dx: 1, dz: 0, face: "w" });
  if (e.e) faces.push({ t: z, len: D, alongX: false, dx: -1, dz: 0, face: "e" });

  for (const f of faces) {
    if (!(f.t % 2 === 1 && f.t >= 1 && f.t <= f.len - 2)) continue; // bays, piers at corners
    if (doorCell && c.x === doorCell.x && c.z === doorCell.z && f.face === "s") continue;
    for (let y = gr; y <= R - 3; y++) {
      if (rowType(y) !== "glass") continue;
      put(x, y, z, "glass_pane", glassProps(f.alongX));
      const ix = x + f.dx, iz = z + f.dz;
      const ic = cell(ix, iz);
      const r = (y - B) - Math.floor((y - B) / S) * S;
      if (ic && !perim(ix, iz) && r === 1 && f.t % 4 === 1) {
        put(ix, y, iz, "glowstone");                        // warm light behind some panes
      }
    }
  }
}

// ---- 3. entrance: door, transom and lantern inside ----
if (doorCell) {
  const { x: dx, z: dz, gr } = doorCell;
  put(dx, gr, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 1, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(dx, gr + 2, dz, "glass_pane", glassProps(true));
  const ic = cell(dx, dz - 1);
  if (ic && !perim(dx, dz - 1)) {
    put(dx, gr + 1, dz - 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- 4. brick chimney on the interior roof ----
let chim = null;
for (const c of map.values()) {
  if (perim(c.x, c.z)) continue;
  if (!chim || c.R > chim.R || (c.R === chim.R && c.x === 3)) chim = c;
}
if (chim && chim.R + 2 < H) {
  put(chim.x, chim.R, chim.z, "bricks");
  put(chim.x, chim.R + 1, chim.z, "bricks");
  put(chim.x, chim.R + 2, chim.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

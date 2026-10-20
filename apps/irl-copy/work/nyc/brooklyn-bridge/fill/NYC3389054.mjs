import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3389054";
const W = 22, H = 40, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gnd = Math.max(0, Math.round(c[2]));
  const roof = Math.round(c[3]);
  let rq = 2 * Math.round(roof / 2);
  rq = Math.min(38, Math.max(rq, gnd + 4));
  cellMap.set(key(x, z), { x, z, gnd, rq, top: rq, d: 0 });
}
const inSet = (x, z) => cellMap.has(key(x, z));

// missing positions, including ring just outside the grid
const missing = [];
for (let a = -1; a <= W; a++) for (let b = -1; b <= D; b++) if (!inSet(a, b)) missing.push([a, b]);
const distTo = (x, z) => {
  let d = Infinity;
  for (const [a, b] of missing) {
    const m = Math.abs(x - a) + Math.abs(z - b);
    if (m < d) d = m;
  }
  return d;
};

// tiers: outer ring steps down on tall towers, core rises to the lidar roof
for (const c of cellMap.values()) {
  c.d = distTo(c.x, c.z);
  let top = c.rq;
  if (c.d === 1 && c.rq >= 20) top = c.rq - 6;
  if (top <= c.gnd + 2) top = c.gnd + 2;
  c.top = top;
}

const dirs = [
  ["west", -1, 0], ["east", 1, 0], ["north", 0, -1], ["south", 0, 1],
];

// faces of column (x,z) at height y that are open to air
const exposedFaces = (c, y) => {
  const out = [];
  for (const [name, dx, dz] of dirs) {
    const n = cellMap.get(key(c.x + dx, c.z + dz));
    if (!n) { out.push(name); continue; }
    if (y >= n.gnd && y >= n.top) out.push(name);
  }
  return out;
};

// lobby: north-face cell nearest the centre
const northCells = [...cellMap.values()].filter(c => c.d === 1 && !inSet(c.x, c.z - 1));
const cx = (W - 1) / 2;
northCells.sort((a, b) => Math.abs(a.x - cx) - Math.abs(b.x - cx));
const doorCell = northCells[0] || null;

for (const c of cellMap.values()) {
  const { x, z, gnd, top, rq, d } = c;

  // foundation from y0 up to ground
  for (let y = 0; y < gnd; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gnd; y < top; y++) {
    const f = y - gnd;
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; } // cornice / roof cap
    const faces = exposedFaces(c, y);
    if (faces.length === 0) { g.set(x, y, z, "bricks"); continue; }
    const face = faces[0];
    const s = (face === "west" || face === "east") ? z : x;
    let b;
    if (f === 0) {
      b = "stone_bricks"; // base course
    } else if (f < 4) {
      // commercial shopfront band
      if (f === 3) b = "smooth_stone";
      else if (s % 3 === 0) b = "stone_bricks";
      else b = ((s + x + z) % 5 === 0 && f === 1) ? "glowstone" : "light_blue_stained_glass";
    } else {
      // residential storeys on a 2-block rhythm, pilasters every third bay
      if (f % 2 === 0) b = "smooth_stone";
      else if (s % 3 === 1) b = ((s * 3 + y) % 9 === 0) ? "glowstone" : "gray_stained_glass";
      else if (s % 3 === 0) b = "stone_bricks";
      else b = "bricks";
    }
    g.set(x, y, z, b);
  }

  // roof plant: lighter enclosed boxes on the core
  if (d >= 3 && (x * 3 + z * 5) % 7 === 0 && rq + 2 <= 39) {
    g.set(x, rq, z, "light_gray_concrete");
    g.set(x, rq + 1, z, "smooth_stone");
  }
}

// lobby door and black canopy over the entrance bay
if (doorCell) {
  const { x, z, gnd } = doorCell;
  g.set(x, gnd, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gnd + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const dx of [-1, 0, 1]) {
    const n = cellMap.get(key(x + dx, z));
    if (n && !inSet(x + dx, z - 1)) g.set(x + dx, gnd + 3, z, "black_concrete");
  }
  // lit transom over the door
  g.set(x, gnd + 2, z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);

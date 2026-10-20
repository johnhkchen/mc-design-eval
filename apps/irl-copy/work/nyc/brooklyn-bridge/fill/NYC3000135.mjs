import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3000135.cells.json`, "utf8"));

// 126 Front Street, DUMBO: c.1888 red brick commercial/residential block.
// Limestone base and cornice, brick piers, glazed bays, a shopfront with a central door.
const W = 10, H = 29, D = 7;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { g: gr, roof });
const has = (x, z) => raw.has(key(x, z));

// Smooth the lidar roof: median of the 3x3 neighbourhood, then snap to 3-block courses.
const map = new Map();
for (const [x, z, gr] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = raw.get(key(x + dx, z + dz));
    if (c) vals.push(c.roof);
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let r = 3 * Math.round(med / 3);
  r = Math.min(r, H - 4);
  if (r <= gr + 3) r = gr + 3;
  map.set(key(x, z), { g: gr, r });
}

const FACES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function faces(x, z) {
  return Object.keys(FACES).filter((f) => {
    const [dx, dz] = FACES[f];
    return !has(x + dx, z + dz);
  });
}
// Windows on odd positions along each face; piers at even positions and corners.
function windowOn(x, z, f) {
  if (f === "N" || f === "S") return x % 2 === 1 && x > 0 && x < W - 1;
  return z % 2 === 1 && z > 0 && z < D - 1;
}
function isInterior(x, z) {
  return has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);
}

// Entrance on the lowest-z exterior face, nearest the middle, preferring a window column.
let door = null;
{
  let best = Infinity;
  const minZ = Math.min(...cells.map((c) => c[1]));
  for (const [x, z] of cells) {
    if (z !== minZ || has(x, z - 1)) continue;
    const score = Math.abs(x - 4.5) + (x % 2 === 0 ? 0.1 : 0);
    if (score < best) { best = score; door = { x, z }; }
  }
}
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });

const windows = [];

for (const [x, z] of cells) {
  const { g: gr, r } = map.get(key(x, z));

  // Foundation from y 0 up to ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const fs = faces(x, z);
  if (fs.length > 0) {
    const isWin = fs.some((f) => windowOn(x, z, f));
    for (let y = gr; y < r; y++) {
      const k = y - gr;
      let mat;
      if (y >= r - 2) mat = "stone_bricks";              // cornice and parapet
      else if (k % 3 === 0) mat = "smooth_stone";        // string course
      else if (isWin) {
        // sill below the lower pane, lintel above the upper pane: stone frame around the glass
        if (k % 3 === 1) mat = "glass";
        else mat = "glass";
      }
      else mat = k < 3 ? "stone_bricks" : "bricks";      // limestone piers at ground, brick above
      g.set(x, y, z, mat);
    }
    // Stone sill under each window bay and stone lintel over it.
    if (isWin) {
      for (let y = gr; y < r - 2; y++) {
        const k = y - gr;
        if (k % 3 === 1 && fs.some((f) => windowOn(x, z, f))) {
          g.set(x, y, z, "glass");
        }
      }
      windows.push({ x, z, fs, gr, r });
    }
    // Entrance: door in the ground-floor bay, lintel above.
    if (door && x === door.x && z === door.z) {
      g.set(x, gr, z, "dark_oak_door", DOOR("lower"));
      g.set(x, gr + 1, z, "dark_oak_door", DOOR("upper"));
      g.set(x, gr + 2, z, "stone_bricks");
    }
  } else {
    // Interior: open air with floor slabs per storey and a flat roof deck.
    for (let y = gr; y < r; y++) {
      const k = y - gr;
      if (y >= r - 1) g.set(x, y, z, "smooth_stone");
      else if (k % 3 === 0) g.set(x, y, z, "smooth_stone");
    }
    // Brick chimney stack on one interior roof.
    if (x === 3 && z === 3 && r + 1 <= H - 1) {
      g.set(x, r, z, "bricks");
      g.set(x, r + 1, z, "bricks");
    }
  }
}

// Warm lights behind some windows: shroomlight in the air gap just inside the glass.
for (const w of windows) {
  for (const f of w.fs) {
    if (!windowOn(w.x, w.z, f)) continue;
    const [dx, dz] = FACES[f];
    const ix = w.x - dx, iz = w.z - dz;
    if (!isInterior(ix, iz)) continue;
    const inner = map.get(key(ix, iz));
    for (let y = w.gr + 1; y < w.r - 2; y++) {
      const k = y - w.gr;
      if (k % 3 !== 1) continue;
      if ((w.x + w.z + y) % 4 !== 0) continue;
      const ki = y - inner.g;
      if (ki < 1 || ki % 3 !== 1 || y >= inner.r - 1) continue;
      g.set(ix, y, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/NYC3000135.nbt`);

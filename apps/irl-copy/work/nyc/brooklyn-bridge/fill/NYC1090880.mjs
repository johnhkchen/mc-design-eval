import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1090880.cells.json`, "utf8"));

const W = 3, H = 26, D = 18;
const g = new Voxels([W, H, D]);

// Raw per-cell data
const raw = new Map();
for (const [x, z, ground, roof] of cells) {
  raw.set(`${x},${z}`, {
    x, z,
    gr: Math.min(H - 6, Math.max(0, Math.round(ground))),
    h: Math.max(0, roof - ground),          // height above this cell's own ground
  });
}

// Smooth the height above ground over a 3x3 neighbourhood so lidar noise
// becomes clean tiers instead of spikes.
const plan = new Map();
for (const [key, c] of raw) {
  let sum = 0, cnt = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = raw.get(`${c.x + dx},${c.z + dz}`);
    if (n) { sum += n.h; cnt++; }
  }
  const avgH = sum / cnt;
  // storeys of 2 blocks plus a 1-block roof cap: top above ground = 2n + 1
  let n = Math.round((avgH - 1) / 2);
  n = Math.min(6, Math.max(2, n));
  // setback: the two ends of the frontage step down one storey
  if ((c.z <= 1 || c.z >= D - 2) && n > 3) n -= 1;
  // keep inside the box
  n = Math.min(n, Math.floor((H - c.gr - 1) / 2));
  plan.set(key, { x: c.x, z: c.z, gr: c.gr, n, top: c.gr + 2 * n + 1 });
}

for (const [, p] of plan) {
  const { x, z, gr, n, top } = p;
  const facade = x !== 1;

  // Foundation from y 0 up to this cell's own ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let k = 0; k < 2 * n; k++) {
    const y = gr + k;
    const s = Math.floor(k / 2);
    const row = k % 2;

    if (row === 0) {
      // floor slab / spandrel / belt course
      if (!facade) {
        g.set(x, y, z, "smooth_stone");
      } else if (s === 0) {
        g.set(x, y, z, "stone_bricks");        // base course
      } else if (s % 2 === 1) {
        g.set(x, y, z, "smooth_stone");        // storey belt course
      } else {
        g.set(x, y, z, "bricks");              // brick spandrel
      }
    } else {
      // window / shopfront row
      if (facade) {
        if (s === 0) {
          g.set(x, y, z, z % 3 === 0 ? "black_concrete" : "glass");
        } else {
          g.set(x, y, z, z % 3 === 0 ? "smooth_stone" : "glass");
        }
      }
      // warm light behind glass in some bays (interior air column x=1)
      const lit = (s === 0) ? (z % 5 === 2) : ((z + s) % 4 === 0);
      if (lit) g.set(1, y, z, "glowstone");
    }
  }

  // Roof slab over the top storey's interior column
  g.set(1, gr + 2 * n - 1, z, "smooth_stone");

  // Cornice-line cap and parapet across the full cell
  g.set(x, top - 1, z, "smooth_stone");
}

// Entrance on the x=0 face, nearest the middle of the frontage
let doorZ = null;
for (const [, p] of plan) {
  if (p.x === 0 && (doorZ === null || Math.abs(p.z - 8) < Math.abs(doorZ - 8))) doorZ = p.z;
}
if (doorZ !== null) {
  const { gr, n } = plan.get(`0,${doorZ}`);
  g.set(0, gr + 1, doorZ, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  if (n >= 2) {
    g.set(0, gr + 2, doorZ, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(0, gr + 3, doorZ, "smooth_stone");   // lintel over the door
  }
}

g.save(`${DIR}/NYC1090880.nbt`);

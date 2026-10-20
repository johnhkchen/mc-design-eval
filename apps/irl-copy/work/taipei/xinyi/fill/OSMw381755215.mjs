import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw381755215";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 102, H = 33, D = 161;
const ROOF = 21;          // roof slab at y=20, parapet 21-22
const RING_TOP = 15;      // setback: lower ring roof at y=15, upper tier from y=16
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
let minZ = Infinity, minX = Infinity, maxX = -Infinity, maxG = -Infinity;
for (const [x, z, gr] of cells) {
  map.set(key(x, z), gr);
  if (z < minZ) minZ = z;
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (gr > maxG) maxG = gr;
}
const cx = Math.round((minX + maxX) / 2);
const setback = maxG <= 13;   // only step the massing where the ground allows it

const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];
const isEdge = (x, z) => nbrs(x, z).some(([a, b]) => !map.has(key(a, b)));

// Distance in cells from the outer edge of the footprint (0 = facade cell).
const dist = new Map();
const queue = [];
for (const [x, z] of [...map.keys()].map(k => k.split(",").map(Number))) {
  if (isEdge(x, z)) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [a, b] of nbrs(x, z)) {
    const k = key(a, b);
    if (map.has(k) && !dist.has(k)) { dist.set(k, d + 1); queue.push([a, b]); }
  }
}

const isPillar = (x, z) => (x + z) % 4 === 0;

for (const [x, z, gr0] of cells) {
  const gr = Math.min(gr0, ROOF - 2);
  const d = dist.get(key(x, z));
  const ring = setback && d <= 2;
  const facade = (y) => (setback && y >= RING_TOP + 1) ? d === 3 : d === 0;
  const street = d === 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= 20; y++) {
    // Lower ring: its roof is at y=15, nothing above it except the upper tier.
    if (ring && y > RING_TOP) continue;
    if (ring && y === RING_TOP) { g.set(x, y, z, "light_gray_concrete"); continue; }

    if (y === 20) { g.set(x, y, z, "light_gray_concrete"); continue; }

    const edge = facade(y);

    if (street && y <= gr + 4) {
      const isEntrance = z <= minZ + 1 && Math.abs(x - cx) <= 2 && gr + 4 <= 20;
      if (isEntrance && y >= gr + 1 && y <= gr + 3) {
        // Doorway opening; lanterns mark its jambs.
        if (y === gr + 3 && Math.abs(x - cx) === 2) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        }
        continue;
      }
      if (isEntrance && y === gr + 4) { g.set(x, y, z, "smooth_quartz"); continue; }
      if (y === gr) { g.set(x, y, z, "black_concrete"); continue; }
      if (y >= gr + 1 && y <= gr + 3) {
        g.set(x, y, z, isPillar(x, z) ? "smooth_quartz" : "light_blue_stained_glass");
        continue;
      }
    }

    if (edge) {
      if (y % 5 === 0) { g.set(x, y, z, "smooth_quartz"); continue; }      // storey line
      if (y % 5 === 4) { g.set(x, y, z, "white_concrete"); continue; }     // spandrel
      g.set(x, y, z, isPillar(x, z) ? "smooth_quartz" : "cyan_stained_glass");
    } else if (y === gr || y % 5 === 0) {
      g.set(x, y, z, "smooth_quartz");                                     // floor slab
    } else if (y % 5 === 2 && x % 6 === 3 && (x + z) % 7 === 0) {
      g.set(x, y, z, "glowstone");                                         // lit room behind glass
    }
  }

  // Parapets: ring edge gets a short parapet on its roof.
  if (ring && street) {
    g.set(x, RING_TOP + 1, z, "smooth_quartz");
    g.set(x, RING_TOP + 2, z, "smooth_quartz");
  }
  // Upper tier parapet at roof height.
  if (facade(20)) {
    g.set(x, ROOF, z, "smooth_quartz");
    g.set(x, ROOF + 1, z, "smooth_quartz");
  }
}

// Roof plant on the upper roof.
for (const [x, z] of cells) {
  const d = dist.get(key(x, z));
  if (setback && d <= 4) continue;
  if (d < 2) continue;
  if (x % 20 >= 5 && x % 20 <= 9 && z % 30 >= 8 && z % 30 <= 12) {
    for (let y = ROOF; y <= ROOF + 2; y++) g.set(x, y, z, "gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);

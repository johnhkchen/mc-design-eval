import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC87519: 701 Madison Pl NW. Commercial-Office-Large, 22 x 53 footprint, roof ~21 above lowest ground.
// Read as a 1920s-30s Neoclassical limestone office block: rusticated plinth, pale calcite piers,
// quartz floor lines, blue-glass window bays, a stepped crown with a terrace and parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const W = 22, H = 33, D = 53;
const S = 3;               // storey height in blocks (floor line, glass, spandrel)
const TOP_MAX = 27;        // keeps parapet and roof kit inside the box

const raw = JSON.parse(readFileSync(`${DIR}/DC87519.cells.json`, "utf8"));
const K = (x, z) => x + "," + z;
const cells = new Map();
for (const [x, z, gr, rf] of raw) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  cells.set(K(x, z), {
    x, z,
    g: Math.max(0, Math.round(gr)),
    R: Math.round(rf),
  });
}
const has = (x, z) => cells.has(K(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// distance from the outer edge of the footprint (1 = exterior wall ring)
const dist = new Map();
let frontier = [];
for (const c of cells.values()) {
  if (NB.some(([dx, dz]) => !has(c.x + dx, c.z + dz))) {
    dist.set(K(c.x, c.z), 1);
    frontier.push(c);
  }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const c of frontier) {
    for (const [dx, dz] of NB) {
      const k = K(c.x + dx, c.z + dz);
      if (cells.has(k) && !dist.has(k)) {
        dist.set(k, d + 1);
        next.push(cells.get(k));
      }
    }
  }
  frontier = next;
}

// tiers: lidar roof quantised to storey lines; outer ring steps down one storey
for (const c of cells.values()) {
  const d = dist.get(K(c.x, c.z)) || 9;
  let top = Math.min(TOP_MAX, Math.max(c.g + S, Math.round(c.R / S) * S));
  if (d === 1 && top - S >= c.g + S) top -= S;
  c.top = top;
  c.d = d;
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const GLASS = "light_blue_stained_glass_pane";

for (const c of cells.values()) {
  const { x, z, g: gr, top, d } = c;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (d === 1) {
    // exterior wall ring
    const out = NB.filter(([dx, dz]) => !has(x + dx, z + dz));
    const [odx, odz] = out[0];
    const idx = odx !== 0 ? z : x;         // position along the facade
    const windowCol = idx % 3 !== 0;       // every third column is a pier

    for (let y = gr; y < top; y++) {
      const rel = y % S;
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }   // plinth course
      if (rel === 0) { put(x, y, z, "smooth_quartz"); continue; } // floor line
      if (rel === 1 && windowCol) {
        const along = odx !== 0
          ? { north: "true", south: "true", east: "false", west: "false" }
          : { north: "false", south: "false", east: "true", west: "true" };
        put(x, y, z, GLASS, { ...along, waterlogged: "false" });
        // warm light set behind some panes
        if ((x * 7 + z * 13 + y * 5) % 9 === 0) {
          const ix = x - odx, iz = z - odz;
          const inner = cells.get(K(ix, iz));
          if (inner && dist.get(K(ix, iz)) >= 2 && y > inner.g && y < inner.top) {
            put(ix, y, iz, "glowstone");
          }
        }
        continue;
      }
      put(x, y, z, "calcite");                // pier or spandrel
    }

    // cornice and plain calcite parapet
    put(x, top, z, "smooth_quartz");
    put(x, top + 1, z, "calcite");
  } else {
    // interior / setback cells: air between floor slabs, open to roof cap
    put(x, gr, z, "smooth_quartz");
    for (let y = gr + 1; y < top; y++) {
      if (y % S === 0) put(x, y, z, "smooth_quartz");
    }
    // setback face where this ring rises above a lower exterior ring
    if (d === 2) {
      let lowest = Infinity;
      for (const [dx, dz] of NB) {
        const n = cells.get(K(x + dx, z + dz));
        if (n && n.d === 1 && n.top < top) lowest = Math.min(lowest, n.top);
      }
      if (lowest < Infinity) {
        for (let y = lowest; y < top; y++) put(x, y, z, "calcite");
        put(x, top + 1, z, "calcite");       // low terrace kerb
      }
    }
  }

  // roof cap
  put(x, top, z, d === 1 ? "smooth_quartz" : "stone");

  // plant boxes on the crown, sparse
  if (d >= 3 && top >= 21 && x % 8 === 4 && z % 10 === 5) {
    put(x, top + 1, z, "stone_bricks");
    put(x, top + 2, z, "stone_bricks");
  }
}

// entrance on the street (min-z) face, at the middle of that run
{
  const front = [...cells.values()]
    .filter(c => c.d === 1 && !has(c.x, c.z - 1))
    .sort((a, b) => a.x - b.x);
  if (front.length) {
    const c = front[Math.floor(front.length / 2)];
    const { x, z, g: gr } = c;
    put(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "smooth_quartz");   // lintel over the door
    // canopy hood: upside-down quartz stairs, facing outward
    put(x, gr + 2, z, "smooth_quartz_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" });
    // flanking pilasters of smooth quartz
    for (const dx of [-1, 1]) {
      const n = cells.get(K(x + dx, z));
      if (n && n.d === 1) {
        for (let y = gr; y <= gr + 2; y++) put(x + dx, y, z, "smooth_quartz");
      }
    }
  }
}

g.save(`${DIR}/DC87519.nbt`);

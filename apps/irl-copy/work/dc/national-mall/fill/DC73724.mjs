import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC73724.cells.json`, "utf8"));

const W = 44, H = 31, D = 20;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Clean per-cell record: ground (foundation top) and roof height (smoothed, clamped).
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  let roof = Math.round(rf);
  roof = Math.max(roof, ground + 8);
  roof = Math.min(roof, H - 5);
  cm.set(key(x, z), { x, z, gr: ground, r: roof });
}

// Distance from the exterior: 0 = facade shell, 1 = air gap behind glass, 2+ = solid core.
const dist = new Map();
const queue = [];
for (const c of cm.values()) {
  const exposed = NB.some(([dx, dz]) => !cm.has(key(c.x + dx, c.z + dz)));
  if (exposed) {
    dist.set(key(c.x, c.z), 0);
    queue.push(c);
  }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of NB) {
    const nk = key(c.x + dx, c.z + dz);
    if (cm.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push(cm.get(nk));
    }
  }
}

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Is a facade cell a corner (exposed on two sides)?
function isCorner(x, z) {
  const out = NB.filter(([dx, dz]) => !cm.has(key(x + dx, z + dz))).length;
  return out >= 2;
}

// Is there a glazed window at this exterior position?
function glassAt(x, z, y) {
  const c = cm.get(key(x, z));
  if (!c || dist.get(key(x, z)) !== 0) return false;
  const yr = y - c.gr;
  if (yr < 0 || yr >= c.r - 1) return false;
  const k = Math.floor(yr / 4), w = yr % 4;
  if (k < 1 || !(w === 1 || w === 2)) return false;
  if (isCorner(x, z)) return false;
  return (x + z) % 3 !== 0;
}

for (const c of cm.values()) {
  const { x, z, gr, r } = c;
  const d = dist.get(key(x, z)) ?? 99;
  const top = r; // roof surface (first free y above the roof deck)
  const corner = d === 0 && isCorner(x, z);

  // Foundation: rusticated base course, darker at the plinth
  for (let y = 0; y < gr; y++) {
    put(x, y, z, y === gr - 1 ? "polished_andesite" : "stone_bricks");
  }

  for (let y = gr; y < top; y++) {
    const yr = y - gr;
    const k = Math.floor(yr / 4);
    const w = yr % 4;

    if (y === top - 1) {
      // Top course of the wall / roof deck
      put(x, y, z, d === 0 ? "chiseled_stone_bricks" : "smooth_stone");
      continue;
    }

    if (d === 0) {
      if (corner) {
        // Heavy corner quoin, stacked stone
        put(x, y, z, w === 0 ? "polished_andesite" : "stone_bricks");
      } else if (k === 0 && yr === 0) {
        // Shopfront plinth
        put(x, y, z, "black_concrete");
      } else if (w === 0) {
        // String course / sill line
        put(x, y, z, "polished_andesite");
      } else if (w === 3) {
        // Lintel / spandrel, chiseled above windows for rhythm
        put(x, y, z, k === 0 ? "polished_andesite" : "chiseled_stone_bricks");
      } else {
        const pier = (x + z) % 3 === 0;
        if (pier) {
          put(x, y, z, "stone_bricks");
        } else if (k === 0) {
          put(x, y, z, "glass");
        } else {
          put(x, y, z, "glass_pane");
        }
      }
    } else if (d === 1) {
      if (w === 0) {
        put(x, y, z, "smooth_stone"); // floor slab per storey
      } else if (w === 1 && k >= 1) {
        // warm light in the air gap behind some windows
        const lit = NB.some(([dx, dz]) => glassAt(x + dx, z + dz, y)) && (x * 7 + z * 5 + y) % 6 === 0;
        if (lit) put(x, y, z, "glowstone");
      }
    } else {
      put(x, y, z, "smooth_stone"); // solid core
    }
  }

  // Cornice: a stepped cap over the facade, then a parapet course
  if (d === 0) {
    put(x, top, z, "polished_andesite");
  }

  // Roof plant: units with a rail-like parapet, on interior cells
  if (d >= 3 && (x * 3 + z * 5) % 17 === 0 && top + 2 < H) {
    put(x, top, z, "iron_block");
    put(x, top + 1, z, "iron_block");
  }
  if (d >= 3 && (x * 5 + z * 7) % 23 === 0 && top + 1 < H) {
    put(x, top, z, "light_gray_concrete");
  }
}

// Street entrance on the z=0 facade, centred on the 44-block front
const dk = key(21, 0);
if (cm.has(dk) && dist.get(dk) === 0) {
  const gy = cm.get(dk).gr;
  // Recessed stone portal: pilasters, lintel, and a pediment cap
  for (const xx of [20, 22]) {
    put(xx, gy, 0, "polished_andesite");
    put(xx, gy + 1, 0, "stone_bricks");
    put(xx, gy + 2, 0, "stone_bricks");
    put(xx, gy + 3, 0, "chiseled_stone_bricks");
  }
  put(21, gy, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(21, gy + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(21, gy + 2, 0, "chiseled_stone_bricks");
  put(21, gy + 3, 0, "polished_andesite");
  // Warm light in the portal
  put(21, gy + 2, 0, "chiseled_stone_bricks");
}

g.save(`${dir}/DC73724.nbt`);

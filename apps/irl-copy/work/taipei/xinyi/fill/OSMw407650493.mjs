// OSMw407650493: no record of the building, so it is read from the lidar roof
// height (about 11 blocks above the lowest ground, two storeys of about 5 blocks).
// Era and materials: a late-20th-century Xinyi commercial block. A ground-storey
// ring of white concrete with blue glass bays and a stone plinth, a stepped-back
// upper tier on the inner cells, a terrace and parapet on the ring roof, a
// dark-oak entrance with a canopy strip, a stone cap, and a few lit windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650493";
const W = 86, H = 23, D = 62;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const minGround = Math.min(...cells.map((c) => c[2]));
const ROOF = minGround + 11; // lidar roof height above lowest ground

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Ring distance from the exterior: 0 = outer ring, 1 = second ring, ...
const dist = new Map();
const queue = [];
for (const [x, z] of cells) {
  const ext =
    !inside.has(key(x, z - 1)) || !inside.has(key(x, z + 1)) ||
    !inside.has(key(x - 1, z)) || !inside.has(key(x + 1, z));
  if (ext) { dist.set(key(x, z), 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(x + dx, z + dz);
    if (inside.has(k) && !dist.has(k)) {
      dist.set(k, d + 1);
      queue.push([x + dx, z + dz]);
    }
  }
}
const distOf = (x, z) => dist.get(key(x, z)) ?? 0;

// Pass 1: foundations, ground ring, setback upper tier, roof.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const h = Math.max(3, ROOF - gr);
  const roofT = h - 1;               // top block index, relative to gr
  const s = Math.floor(roofT / 2);   // ground-storey ceiling / terrace level
  const d = distOf(x, z);

  // Mullions run on the axis of the facade the cell faces.
  const outer = (k) => (d === 0 ? !inside.has(k) : dist.get(k) === 0);
  const axisX = outer(key(x, z - 1)) || outer(key(x, z + 1));
  const idx = axisX ? x : z;

  if (d === 0) {
    // Ground-storey ring wall.
    for (let t = 0; t < s; t++) {
      let block = "white_concrete";
      let props;
      if (t === 0) {
        block = "polished_andesite";                 // plinth
      } else if (t === 1) {
        block = "white_concrete";                    // kickplate
      } else if (t === s - 1) {
        block = "light_gray_concrete";               // lintel
      } else if (idx % 3 === 0) {
        block = "white_concrete";                    // mullion
      } else if (t === 2 && (x * 2 + z) % 11 === 0) {
        block = "glowstone";                         // lit window
      } else {
        block = "light_blue_stained_glass_pane";
      }
      put(x, gr + t, z, block, props);
    }
    // Terrace paving over the ring, then a low parapet.
    put(x, gr + s, z, "smooth_stone");
    put(x, gr + s + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Inner cells: floor slab at grade and at the terrace level.
    put(x, gr, z, "smooth_stone");
    put(x, gr + s, z, "smooth_stone");

    if (d === 1) {
      // Upper tier facade stepped back from the ring.
      const lo = s + 1, hi = roofT - 1;
      for (let t = lo; t <= roofT; t++) {
        let block = "white_concrete";
        let props;
        if (t === roofT) {
          block = "stone_brick_slab";                // cornice cap
          props = { type: "bottom", waterlogged: "false" };
        } else if (t === lo) {
          block = "white_concrete";                  // kickplate
        } else if (t === hi) {
          block = "light_gray_concrete";             // lintel
        } else if (idx % 3 === 0) {
          block = "white_concrete";                  // mullion
        } else if (t === lo + 1 && (x + 2 * z) % 13 === 0) {
          block = "glowstone";                       // lit window
        } else {
          block = "cyan_stained_glass_pane";
        }
        put(x, gr + t, z, block, props);
      }
    } else {
      // Deep interior: roof slab, sparse plant boxes, air between slabs.
      put(x, gr + roofT, z, "gray_concrete");
      if ((x * 5 + z * 7) % 37 === 0) {
        put(x, gr + roofT + 1, z, "light_gray_concrete");
        if ((x + z) % 2 === 0) put(x, gr + roofT + 2, z, "light_gray_concrete");
      }
    }
  }
}

// Pass 2: entrance on the outer ring, with a canopy strip over it.
const ring = cells.filter(([x, z]) => distOf(x, z) === 0);
const frontCands = (dir) => ring.filter(([x, z]) => {
  if (dir === "S") return !inside.has(key(x, z + 1));
  return !inside.has(key(x, z - 1));
}).sort((a, b) => a[0] - b[0]);

let front = frontCands("S");
let facing = "south";
if (front.length === 0) { front = frontCands("N"); facing = "north"; }
if (front.length === 0) { front = ring.slice().sort((a, b) => a[0] - b[0]); facing = "south"; }

if (front.length > 0) {
  const [mx, mz, mg] = front[Math.floor(front.length / 2)];
  put(mx, mg + 1, mz, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(mx, mg + 2, mz, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  for (const [x, z, gr] of front) {
    if (Math.abs(x - mx) <= 2 && Math.abs(z - mz) <= 0) {
      put(x, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

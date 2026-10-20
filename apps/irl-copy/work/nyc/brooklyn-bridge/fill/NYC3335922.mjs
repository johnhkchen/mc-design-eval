import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3335922.cells.json`, "utf8"));

const W = 32, H = 40, D = 70;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  map.set(key(c[0], c[1]), {
    x: c[0],
    z: c[1],
    gr: Math.max(0, Math.floor(c[2])),
    roof: Number(c[3]),
  });
}

// Smooth lidar roof heights: median of self + neighbours, snapped to even blocks (2-block storeys).
function smoothRoof(x, z, fallback) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const c = map.get(key(x + dx, z + dz));
      if (c && Number.isFinite(c.roof)) vals.push(c.roof);
    }
  }
  if (vals.length === 0) return fallback;
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  return 2 * Math.round(med / 2);
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Pass 1: clean roof per cell.
const roofOf = new Map();
for (const c of map.values()) {
  let r = smoothRoof(c.x, c.z, c.roof);
  r = Math.min(H - 6, Math.max(c.gr + 4, r));
  roofOf.set(key(c.x, c.z), r);
}

// Entrance: north-facing boundary cell nearest x = 16.
let doorCell = null;
for (const c of map.values()) {
  if (!map.has(key(c.x, c.z - 1)) && (!doorCell || Math.abs(c.x - 16) < Math.abs(doorCell.x - 16))) {
    doorCell = c;
  }
}

// Pass 2: build each cell.
for (const c of map.values()) {
  const { x, z, gr } = c;
  const roof = roofOf.get(key(x, z));

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const ext = {
    n: !map.has(key(x, z - 1)),
    s: !map.has(key(x, z + 1)),
    w: !map.has(key(x - 1, z)),
    e: !map.has(key(x + 1, z)),
  };
  const boundary = ext.n || ext.s || ext.w || ext.e;
  // Bay rhythm along the wall: z on long east/west faces, x on the ends.
  const along = (ext.w || ext.e) ? z : x;
  const pier = along % 4 === 0;

  // Body: ground to roof-1.
  for (let y = gr; y < roof; y++) {
    const k = y - gr;
    let id = "bricks";
    if (boundary) {
      if (k < 3) {
        // Ground storey: shopfront glass between stone piers, dark frame at the sill.
        id = pier ? "stone_bricks" : (k === 0 ? "dark_oak_planks" : "glass");
      } else if (k % 2 === 0) {
        // Limestone floor line at each storey.
        id = "smooth_stone";
      } else {
        // Steel-sash window band; brick piers between bays.
        id = pier ? "bricks" : "light_gray_stained_glass";
        // Sparse warm light behind the glass.
        if (id === "light_gray_stained_glass" && (along * 3 + k) % 13 === 0) id = "glowstone";
      }
    }
    put(x, y, z, id);
  }

  // Parapet lip on the perimeter.
  if (boundary) {
    put(x, roof, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Central roof penthouse, stepped in from the perimeter.
  if (x >= 9 && x <= 22 && z >= 18 && z <= 51) {
    const edge = x === 9 || x === 22 || z === 18 || z === 51;
    for (let y = roof; y < roof + 3; y++) {
      let id = "bricks";
      if (edge && y === roof + 1 && along % 4 !== 0) id = "light_gray_stained_glass";
      put(x, y, z, id);
    }
    put(x, roof + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Entrance: recessed door, lanterns and a canopy over the north face.
if (doorCell) {
  const { x, z, gr } = doorCell;
  put(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Canopy: a slab row across the door bay on the face, at storey-one height.
  for (const dx of [-1, 0, 1]) {
    if (map.has(key(x + dx, z))) {
      put(x + dx, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
  // Hanging lanterns flanking the door.
  for (const dx of [-1, 1]) {
    if (map.has(key(x + dx, z))) {
      put(x + dx, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/NYC3335922.nbt`);

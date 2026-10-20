import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Exchange Square2, Xinyi, Taipei: a 1990s-2000s commercial block with a
// stone-based ground course, white concrete walls, glass bays and a
// two-storey upper band under a stone cornice and a light parapet.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMr18371588";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 112, H = 19, D = 86;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.round(gr)));
const inside = (x, z) => ground.has(key(x, z));

function put(x, y, z, block, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// Outward faces of a footprint cell (a neighbour outside the footprint).
function faces(x, z) {
  return {
    north: !inside(x, z - 1), // outward -z
    south: !inside(x, z + 1), // outward +z
    west: !inside(x - 1, z),  // outward -x
    east: !inside(x + 1, z),  // outward +x
  };
}

const perimeter = new Set();
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (f.north || f.south || f.west || f.east) perimeter.add(key(x, z));
}

// Pass 1: foundation, floor slabs, walls and roof for each cell.
for (const [x, z] of cells) {
  const gr = ground.get(key(x, z));
  const f = faces(x, z);
  const isEdge = perimeter.has(key(x, z));

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab.
  put(x, gr, z, "smooth_stone");

  // First-floor (ground storey) interior is air; upper floor slab at gr+4.
  put(x, gr + 4, z, "smooth_stone");

  // Roof deck at gr+7 across the whole footprint.
  put(x, gr + 7, z, "light_gray_concrete");

  if (!isEdge) continue;

  // Base course at ground level.
  put(x, gr, z, "smooth_stone");
  put(x, gr + 1, z, "stone_bricks");

  // Walls: ground storey gr+1..gr+3, storey line gr+4, upper storey gr+5..gr+6.
  for (let y = gr + 1; y <= gr + 6; y++) put(x, y, z, "white_concrete");
  put(x, gr + 4, z, "light_gray_concrete"); // storey line band

  // Cornice at gr+7 and parapet at gr+8.
  put(x, gr + 7, z, "smooth_stone");
  put(x, gr + 8, z, "white_concrete");

  // Along-face coordinate and inward direction for articulation.
  const outward = [];
  if (f.north) outward.push({ axis: "x", along: x, dx: 0, dz: 1 });
  if (f.south) outward.push({ axis: "x", along: x, dx: 0, dz: -1 });
  if (f.west) outward.push({ axis: "z", along: z, dx: 1, dz: 0 });
  if (f.east) outward.push({ axis: "z", along: z, dx: -1, dz: 0 });

  for (const face of outward) {
    const a = face.along;
    const m = a % 4;
    const entrance = a % 24 === 12;

    // Ground storey: shopfront glass with piers; entrances as clear glass bays.
    if (entrance) {
      put(x, gr + 1, z, "glass");
      put(x, gr + 2, z, "glass");
    } else if (m === 1 || m === 2) {
      put(x, gr + 1, z, "light_blue_stained_glass");
      put(x, gr + 2, z, "light_blue_stained_glass");
    }
    // Ground-storey lintel band.
    put(x, gr + 3, z, "gray_concrete");

    // Upper storey windows with frames.
    if (m === 1 || m === 2) {
      put(x, gr + 5, z, "gray_stained_glass");
      put(x, gr + 6, z, "gray_stained_glass");
    }
  }

  // Warm lights behind some upper windows (inside the footprint, not on the edge).
  for (const face of outward) {
    const a = face.along;
    const m = a % 4;
    if ((m === 1 || m === 2) && (a * 7) % 5 === 0) {
      const ix = x + face.dx * 1;
      const iz = z + face.dz * 1;
      if (inside(ix, iz) && !perimeter.has(key(ix, iz))) {
        put(ix, gr + 5, iz, "glowstone");
      }
    }
  }
}

// Pass 2: rooftop equipment, a few cooling boxes and a skylight on the roof.
for (const [x, z] of cells) {
  if (perimeter.has(key(x, z))) continue;
  const gr = ground.get(key(x, z));
  if (x % 20 >= 8 && x % 20 <= 10 && z % 20 >= 8 && z % 20 <= 10) {
    put(x, gr + 8, z, "gray_concrete");
    put(x, gr + 9, z, "iron_block");
  }
  if (x % 30 === 15 && z % 30 === 15) {
    put(x, gr + 8, z, "light_blue_stained_glass");
  }
}

g.save(`${dir}/${id}.nbt`);

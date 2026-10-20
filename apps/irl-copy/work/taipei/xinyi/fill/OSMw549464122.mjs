import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549464122";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 38, D = 18;
const g = new Voxels([W, H, D]);

// Record: 5 storeys of 5 blocks, parapet at relative height 26 above lowest ground.
const key = (x, z) => `${x},${z}`;
const cellGround = new Map();
for (const [x, z, gr] of cells) cellGround.set(key(x, z), gr);
const inside = (x, z) => cellGround.has(key(x, z));
const m = Math.min(...cells.map((c) => c[2]));
const TOP = m + 26;            // parapet cap row
const SLAB_R = new Set([0, 5, 10, 15, 20, 25]); // floor slabs; 25 = roof slab

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward normals for the four faces.
const DIRS = {
  west:  { dx: -1, dz: 0, facing: "west",  axis: "z" },
  east:  { dx: 1,  dz: 0, facing: "east",  axis: "z" },
  north: { dx: 0,  dz: -1, facing: "north", axis: "x" },
  south: { dx: 0,  dz: 1, facing: "south", axis: "x" },
};

// Exposed faces for each cell.
function exposedFaces(x, z) {
  const out = [];
  for (const [name, d] of Object.entries(DIRS)) {
    if (!inside(x + d.dx, z + d.dz)) out.push(name);
  }
  return out;
}

// Facade index and length along the wall, for pillar/window rhythm.
function facadeIndex(x, z, name) {
  const d = DIRS[name];
  if (d.axis === "z") return { idx: z, len: D };
  return { idx: x, len: W };
}

function isPillar(x, z, name) {
  const { idx, len } = facadeIndex(x, z, name);
  return idx % 3 === 0 || idx === 0 || idx === len - 1;
}

// Pick the entrance: median non-pillar exposed cell on the longest street face (west, else east).
function pickEntrance() {
  for (const side of ["west", "east"]) {
    const list = [];
    for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
      if (!exposedFaces(x, z).includes(side)) continue;
      if (isPillar(x, z, side)) continue;
      list.push([x, z]);
    }
    if (list.length) {
      list.sort((a, b) => a[1] - b[1]);
      const [ex, ez] = list[Math.floor(list.length / 2)];
      return { x: ex, z: ez, side };
    }
  }
  return null;
}
const entrance = pickEntrance();

// Mechanical box on the roof: interior cells near the middle.
const mechCells = new Set();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (x >= 2 && x <= 3 && z >= 6 && z <= 7 && exposedFaces(x, z).length === 0) {
    mechCells.add(key(x, z));
  }
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slab at the cell's ground level.
  put(x, gr, z, "smooth_stone");

  const faces = exposedFaces(x, z);

  for (let y = gr + 1; y <= TOP; y++) {
    const r = y - m;

    // Floor slabs and roof slab across the whole footprint.
    if (SLAB_R.has(r)) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Parapet cap on the perimeter.
    if (r === 26) {
      if (faces.length) {
        put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      } else if (mechCells.has(key(x, z))) {
        put(x, y, z, "iron_block");
      }
      continue;
    }

    if (!faces.length) continue; // interior air

    const storey = Math.floor(r / 5);  // 0 = ground storey
    const o = r % 5;                   // 1..4 within storey

    for (const name of faces) {
      const d = DIRS[name];
      const pillar = isPillar(x, z, name);
      const { idx } = facadeIndex(x, z, name);

      // Entrance door occupies the two ground-storey window rows.
      if (
        entrance && storey === 0 && (o === 1 || o === 2) &&
        entrance.x === x && entrance.z === z && entrance.side === name
      ) {
        put(x, y, z, "dark_oak_door", {
          facing: d.facing,
          half: o === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        if (o === 1) {
          // Warm lantern just inside the entrance.
          const ix = x - d.dx, iz = z - d.dz;
          if (inside(ix, iz)) put(ix, y, iz, "lantern", { hanging: "false" });
        }
        continue;
      }

      if (pillar) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      if (storey === 0) {
        if (o === 1 || o === 2) {
          put(x, y, z, "tinted_glass");
        } else if (o === 3) {
          put(x, y, z, "red_concrete");
        } else {
          put(x, y, z, "white_concrete");
        }
        continue;
      }

      // Upper storeys: three window rows, one spandrel row.
      if (o === 1 || o === 2 || o === 3) {
        put(x, y, z, "light_blue_stained_glass");
        // Warm light behind some windows, inside the room.
        if (o === 2 && (idx + storey) % 4 === 1) {
          const ix = x - d.dx, iz = z - d.dz;
          if (inside(ix, iz)) put(ix, y, iz, "glowstone");
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: 28 x 15 footprint, roof ~11 blocks above lowest ground.
// Decision: a two-storey, mid-century (c. 1960s-70s) concrete commercial block.
// White-painted concrete walls, grey base course and cornice bands, a glazed
// shopfront on the street (south) face with a central door, paired window bays
// on each storey, warm glowstone lights set behind some windows, and a flat
// roof with parapet and a small water tank.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538408134";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell: N = z-1, S = z+1, W = x-1, E = x+1
function faces(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

// Inward offset for each face
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Street face: south wall. Find its cells to place the central door.
const southXs = cells
  .filter(([x, z]) => faces(x, z).includes("S"))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;
const doorZ = southXs.length ? cells.find(([x, z]) => x === doorX && faces(x, z).includes("S"))?.[1] : -1;

// Pass 1: foundations, base course, floors, walls, windows, lights
for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Base course on the ground row
  put(x, gr, z, "gray_concrete");

  // Floor slabs across the full footprint (second floor and roof deck)
  put(x, gr + 5, z, "white_concrete");
  put(x, gr + 10, z, "light_gray_concrete");

  const fs = faces(x, z);

  if (fs.length === 0) continue; // interior: air between slabs

  // Walls and parapet
  for (let y = gr + 1; y <= gr + 11; y++) {
    let m = "white_concrete";
    if (y === gr + 5 || y === gr + 10) m = "light_gray_concrete"; // cornice bands
    if (y === gr + 11) m = "gray_concrete"; // parapet cap
    put(x, y, z, m);
  }

  // Window bays only on single-face wall cells; corners stay as pillars
  if (fs.length !== 1) continue;
  const face = fs[0];
  const idx = (face === "N" || face === "S") ? x : z;
  const alongX = face === "N" || face === "S";
  const paneProps = alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const isWindow = idx % 3 === 1;

  // Storey 1 (ground floor)
  if (face === "S" && x !== doorX) {
    // Shopfront: full glass with pillars every fourth bay
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (idx % 4 === 0) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    }
  } else if (face === "S" && x === doorX) {
    // Door handled later; transom glass above
    put(x, gr + 3, z, "glass");
  } else {
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isWindow) put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      else put(x, y, z, "white_concrete");
    }
  }
  put(x, gr + 4, z, "white_concrete"); // lintel

  // Storey 2
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (isWindow) put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    else put(x, y, z, "white_concrete");
  }
  put(x, gr + 9, z, "white_concrete"); // lintel

  // Warm lights behind alternating windows (interior cell just inside)
  if (isWindow) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && faces(ix, iz).length === 0) {
      if (idx % 6 === 1) put(ix, gr + 2, iz, "glowstone");
      else put(ix, gr + 7, iz, "glowstone");
    }
  }
}

// Pass 2: roof equipment near the roof centre (water tank on a 2x2 plinth)
{
  const interior = cells.filter(([x, z]) => faces(x, z).length === 0);
  if (interior.length) {
    const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
    const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
    const [ax, az, agr] = interior.reduce((best, c) => {
      const d = (c[0] - cx) ** 2 + (c[1] - cz) ** 2;
      const bd = (best[0] - cx) ** 2 + (best[1] - cz) ** 2;
      return d < bd ? c : best;
    });
    for (const dx of [0, 1]) {
      for (const dz of [0, 1]) {
        const x = ax + dx, z = az + dz;
        if (!has(x, z) || faces(x, z).length) continue;
        const gr = ground.get(`${x},${z}`);
        put(x, gr + 11, z, "smooth_stone");
        put(x, gr + 12, z, "smooth_stone");
      }
    }
  }
}

// Pass 3: door (last so nothing overwrites it)
if (doorZ !== -1 && doorX !== -1) {
  const gr = ground.get(`${doorX},${doorZ}`);
  put(doorX, gr + 1, doorZ, "dark_oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(doorX, gr + 2, doorZ, "dark_oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);

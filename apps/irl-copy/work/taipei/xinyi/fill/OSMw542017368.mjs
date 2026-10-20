import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Building OSMw542017368: 7x7 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey mid-century Taipei mixed-use block: shopfront ground
// floor, white tiled concrete piers, blue-tinted glazing, quartz spandrels,
// a cornice and parapet, and a rooftop with AC units, a water tank and a rod.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017368";
const W = 7, H = 23, D = 7;
const TOP = 11;          // parapet course; roof slab sits at TOP
const GLASS = "light_blue_stained_glass";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = raw
  .map((c) => (Array.isArray(c) ? { x: c[0], z: c[1], g: c[2] } : c))
  .filter((c) => c.x >= 0 && c.x < W && c.z >= 0 && c.z < D)
  .map((c) => ({ x: c.x, z: c.z, g: Math.max(0, Math.min(8, Math.round(c.g ?? 0))) }));

const inFp = new Set(list.map((c) => `${c.x},${c.z}`));
const has = (x, z) => inFp.has(`${x},${z}`);
const K = (x, y, z) => `${x},${y},${z}`;

// Faces exposed to the outside for a footprint cell.
const facesOf = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("north");
  if (!has(x, z + 1)) f.push("south");
  if (!has(x - 1, z)) f.push("west");
  if (!has(x + 1, z)) f.push("east");
  return f;
};

// Entrance on the south face if exposed, otherwise the first exposed face.
let doorFace = null;
for (const c of list) if (facesOf(c.x, c.z).includes("south")) { doorFace = "south"; break; }
if (!doorFace) for (const c of list) { const f = facesOf(c.x, c.z); if (f.length) { doorFace = f[0]; break; } }

const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

const blocks = new Map();
const put = (x, y, z, id, props) => blocks.set(K(x, y, z), { x, y, z, id, props });

// Pass 1: foundations and interior solid mass with roof slab above.
for (const c of list) {
  const { x, z, g } = c;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  if (facesOf(x, z).length === 0) {
    for (let y = g; y < TOP; y++) put(x, y, z, "gray_concrete");
    put(x, TOP, z, "light_gray_concrete");
  }
}

// Pass 2: perimeter shell, windows, door, canopy, cornice and parapet.
const gaps = [];
for (const c of list) {
  const { x, z, g } = c;
  const faces = facesOf(x, z);
  if (!faces.length) continue;

  const corner = faces.length >= 2;
  const face = faces[0];
  const i = (face === "north" || face === "south") ? x : z;
  const pier = corner || i % 3 === 0;
  const isDoor = !corner && face === doorFace && i === 3;
  const canopy = !corner && face === doorFace && (i === 2 || i === 3 || i === 4);
  const lanternCell = !corner && face === doorFace && (i === 2 || i === 4);

  for (let y = g; y <= TOP; y++) {
    const r = y - g;
    if (y === TOP) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === TOP - 1) { put(x, y, z, "smooth_quartz"); continue; }
    if (r === 0) { put(x, y, z, "polished_granite"); continue; }

    if (pier) {
      if (isDoor && r === 1) {
        put(x, y, z, "dark_oak_door", { facing: doorFace, half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (isDoor && r === 2) {
        put(x, y, z, "dark_oak_door", { facing: doorFace, half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (canopy && r === 3) {
        put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      } else if (r === 4 || r === 9) {
        put(x, y, z, "smooth_quartz");
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Window column
    if (r >= 1 && r <= 3) {
      if (canopy && r === 3) put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      else if (lanternCell && r === 2) put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      else put(x, y, z, GLASS);
    } else if (r === 4 || r === 5) {
      put(x, y, z, "smooth_quartz");
    } else if (r === 6 || r === 7) {
      put(x, y, z, GLASS);
    } else if (r === 8) {
      put(x, y, z, "white_concrete");
    } else if (r === 9) {
      put(x, y, z, "smooth_quartz");
    }
  }

  // Air gap behind glazing on the inward cell (only if it is interior).
  if (!corner) {
    const [dx, dz] = inward[face];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && facesOf(ix, iz).length === 0) {
      for (const r of [1, 2, 3, 6, 7]) {
        const y = g + r;
        if (y < TOP) gaps.push({ x: ix, y, z: iz, r });
      }
    }
  }
}

for (const gp of gaps) put(gp.x, gp.y, gp.z, "air");

// Warm light behind some upper-floor windows.
for (const gp of gaps) {
  if (gp.r === 6 && (gp.x * 2 + gp.z) % 4 === 0) put(gp.x, gp.y, gp.z, "glowstone");
}

// Pass 3: rooftop equipment and corner warm lights.
const roofBase = TOP + 1;
if (has(2, 2)) put(2, roofBase, 2, "iron_block");
if (has(4, 4)) put(4, roofBase, 4, "iron_block");
if (has(4, 1)) { put(4, roofBase, 1, "white_concrete"); put(4, roofBase + 1, 1, "white_concrete"); }
if (has(3, 3)) put(3, roofBase, 3, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
if (has(0, 0)) put(0, roofBase, 0, "shroomlight");
if (has(6, 6)) put(6, roofBase, 6, "shroomlight");

// Emit into the voxel grid.
const g = new Voxels([W, H, D]);
for (const b of blocks.values()) {
  if (b.id === "air") continue;
  g.set(b.x, b.y, b.z, b.id, b.props);
}
g.save(`${DIR}/${ID}.nbt`);

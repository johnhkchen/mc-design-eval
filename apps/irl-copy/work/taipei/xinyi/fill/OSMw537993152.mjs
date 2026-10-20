import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993152";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 17, H = 23, D = 16;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const occ = new Map();
for (const [x, z, gr] of cells) occ.set(`${x},${z}`, gr);
const has = (x, z) => occ.has(`${x},${z}`);

// Outward normals for each face (neighbour offset -> facing name)
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// Materials: 1990s Xinyi commercial mid-rise, cream tile, blue-grey glass, stone trim
const WALL = "white_terracotta";
const TRIM = "smooth_stone";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const GLASS_UP = "light_blue_stained_glass";
const GLASS_SHOP = "tinted_glass";
const SLAB_FLOOR = "smooth_stone";
const ROOF = "light_gray_concrete";
const LAMP = "glowstone";

// Door cell: perimeter cell on the north face, nearest the middle of the facade
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    if (has(x, z - 1)) continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Roof level: about 11 blocks above lowest ground; keep at least 7 blocks of body
  const T = Math.max(11, gr + 7);

  const faces = FACES.filter(f => !has(x + f.dx, z + f.dz));
  const perim = faces.length > 0;
  const corner = faces.length >= 2;

  if (!perim) {
    // Interior: floor slabs per storey and a roof deck, no interior fit-out
    g.set(x, gr, z, SLAB_FLOOR);
    g.set(x, gr + 5, z, SLAB_FLOOR);
    g.set(x, T - 1, z, ROOF);
    // Rooftop plant on a sparse pattern of interior cells
    if ((x + z) % 7 === 3 && T + 1 < H) {
      g.set(x, T, z, ROOF);
      g.set(x, T + 1, z, "iron_block");
    }
    continue;
  }

  const face = faces[0];
  const along = (face.name === "north" || face.name === "south") ? x : z;
  const isDoor = doorKey === `${x},${z}`;

  // Base course at the ground line
  for (let y = gr; y <= gr; y++) g.set(x, y, z, BASE);

  // Storey 1: shopfront band gr+1..gr+3, lintel at gr+4
  for (let y = gr + 1; y <= gr + 3; y++) {
    if (corner) {
      g.set(x, y, z, TRIM);
    } else if (isDoor && y <= gr + 2) {
      // handled below with door blocks
      g.set(x, y, z, GLASS_SHOP);
    } else if (along % 3 === 1) {
      g.set(x, y, z, GLASS_SHOP);
    } else {
      g.set(x, y, z, TRIM);
    }
  }
  g.set(x, gr + 4, z, corner ? TRIM : (isDoor ? "dark_oak_slab" : TRIM),
    isDoor ? { type: "top", waterlogged: "false" } : undefined);

  // Storey line
  g.set(x, gr + 5, z, corner ? TRIM : SLAB_FLOOR);

  // Storey 2: upper windows gr+6..gr+8 with spandrel at gr+9
  for (let y = gr + 6; y <= gr + 8; y++) {
    if (corner) {
      g.set(x, y, z, TRIM);
    } else if (along % 3 === 1) {
      const lamp = y === gr + 7 && (along + gr) % 5 === 0;
      g.set(x, y, z, lamp ? LAMP : GLASS_UP);
    } else {
      g.set(x, y, z, WALL);
    }
  }
  g.set(x, gr + 9, z, TRIM);

  // Cornice / parapet cap at the roof line
  g.set(x, T - 1, z, TRIM);

  // Fill remaining wall above shopfront where still empty (wall body)
  for (let y = gr + 1; y <= T - 2; y++) {
    if (g.get && g.get(x, y, z)) continue;
  }

  // Corner columns run the full height
  if (corner) {
    for (let y = gr; y <= T - 1; y++) g.set(x, y, z, TRIM);
  }

  // Entrance door on the north face
  if (isDoor) {
    g.set(x, gr + 1, z, "dark_oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 2, z, "dark_oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr + 3, z, GLASS_SHOP);
  }
}

// Second pass: fill any perimeter wall gaps with cream tile so the envelope is closed
for (const [x, z, gr] of cells) {
  const T = Math.max(11, gr + 7);
  const faces = FACES.filter(f => !has(x + f.dx, z + f.dz));
  if (faces.length === 0) continue;
  const corner = faces.length >= 2;
  const along = (faces[0].name === "north" || faces[0].name === "south") ? x : z;
  for (let y = gr + 1; y <= T - 2; y++) {
    if (y >= gr + 1 && y <= gr + 3) continue; // shopfront already set
    if (y === gr + 4 || y === gr + 5 || y === gr + 9) continue;
    if (corner) continue;
    if (y >= gr + 6 && y <= gr + 8 && along % 3 === 1) continue; // windows set
    g.set(x, y, z, WALL);
  }
}

g.save(`${DIR}/${ID}.nbt`);

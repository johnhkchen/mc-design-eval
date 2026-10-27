import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1920s stripped-classical brick commercial block (Auckland's Karangahape/Newton streets): a two-storey brick
// shell with a shopfront at street level, cement-render piers and string courses, sash-style windows in white
// frames, and a set-back third floor on the taller core, behind a brick parapet. Flat roof with a gravel-grey
// membrane and two plant boxes on the terrace.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326664546.cells.json", "utf8"));

const BRICK = "bricks", BASE = "polished_andesite", STONE = "smooth_stone", ROOF = "stone";
const GLASS = "glass_pane", FRAME = "white_concrete", SHOP_FRAME = "dark_oak_planks", PLANT = "light_gray_concrete";
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const key = (x, z) => `${x},${z}`;
const r = new Map();                                    // footprint cell -> lidar roof height above y 0
for (const [x, z, , roof] of cells) r.set(key(x, z), roof);
const inFp = (x, z) => r.has(key(x, z));

// Massing: cells the lidar puts at 9 or 10 are the tall core; the 8s are the lower wings. Each cell's storey count
// comes from its distance to the outer edge or a wing: cells at least two in from both are a set-back third floor.
const tall = new Set([...r].filter(([, h]) => h >= 9).map(([k]) => k));
const dist = new Map();
const queue = [];
for (const k of r.keys()) {
  const [x, z] = k.split(",").map(Number);
  const edge = DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz));
  if (!tall.has(k) || edge) { dist.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (inFp(x + dx, z + dz) && !dist.has(k)) { dist.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}
const attic = new Set([...tall].filter((k) => dist.get(k) >= 2));

const g = new Voxels([21, 23, 19]);
const glass = [];
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); if (block === GLASS) glass.push([x, y, z]); };
const shopGlass = (x, y, z) => put(x, y, z, GLASS, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
const isGlowLit = (x, z, t) => (x * 7 + z * 11 + t) % 5 === 0;

// the bay pattern along a face: piers every fourth bay, a frame mullion in the bay after, glass between
const bay = (t, mullion, x, y, z) => {
  if (t % 4 === 0) return put(x, y, z, STONE);
  if (t % 4 === 2) return put(x, y, z, mullion);
  return shopGlass(x, y, z);
};

// the door: the outer-face cell in the north wall, facing the street at the front
const DOOR = key(5, 0);

for (const k of r.keys()) {
  const [x, z] = k.split(",").map(Number);
  const A = attic.has(k);
  const outward = DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
  const outer = outward.length > 0;
  const corner = outward.length >= 2;
  const setback = A && DIRS.some(([dx, dz]) => inFp(x + dx, z + dz) && !attic.has(key(x + dx, z + dz)));
  const t = x + z;

  // ground: plinth on the outer edge, floor slab inside
  put(x, 0, z, BASE);
  // storey lines: string course over the outer walls, floor slab inside
  put(x, 4, z, STONE);
  // the storey 2 / roof line: a cornice on the walls, the roof membrane or attic floor inside
  if (outer || setback) put(x, 7, z, STONE);
  else put(x, 7, z, ROOF);

  if (outer) {
    if (corner) {                                       // quoined corners in cement render
      for (let y = 1; y <= 6; y++) put(x, y, z, STONE);
    } else if (k === DOOR) {                            // timber entrance door in the street-front shopfront
      put(x, 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, 3, z, STONE);
    } else {                                            // shopfront: glass with dark frames and stone piers
      for (const y of [1, 2]) bay(t, SHOP_FRAME, x, y, z);
      put(x, 3, z, STONE);
    }
    if (!corner) for (const y of [5, 6]) bay(t, FRAME, x, y, z);
  }

  if (A && (outer || setback)) {                       // the set-back third floor's walls and windows
    if (corner) { put(x, 8, z, STONE); put(x, 9, z, STONE); }
    else { bay(t, FRAME, x, 8, z); put(x, 9, z, STONE); }
    if (outer) put(x, 10, z, BRICK);                   // parapet on the set-back storey's outer edge
  } else if (A) {
    put(x, 9, z, ROOF);                                // the attic's roof, air inside
  } else if (outer) {
    put(x, 8, z, BRICK);                               // the lower wings' brick parapet
  }
}

// warm light behind some glass: glowstone on the floor just inside a lit window bay
for (const k of r.keys()) {
  const [x, z] = k.split(",").map(Number);
  const outward = DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
  if (!outward.length || k === DOOR || outward.length >= 2) continue;
  const [dx, dz] = outward[0];
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || DIRS.some(([ax, az]) => !inFp(ix + ax, iz + az))) continue;
  if (isGlowLit(x, z, x + z)) {
    g.set(ix, (x + z) % 2 ? 5 : 1, iz, "glowstone");
  }
}

// a rooftop plant box or two on the lower terrace, and warm lanterns on the attic's corners
for (const k of r.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (attic.has(k) || dist.get(k) === 0) continue;
  if ((x * 5 + z * 3) % 13 === 0 && dist.get(k) >= 1) {
    put(x, 8, z, PLANT);
    put(x, 9, z, PLANT);
  }
}
for (const k of attic) {
  const [x, z] = k.split(",").map(Number);
  if (dist.get(k) >= 2 && (x * 3 + z) % 17 === 0) put(x, 10, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// glass panes connect to the neighbours that are solid (not air, not a lamp inside)
for (const [x, y, z] of glass) {
  const conn = {};
  for (const [name, [dx, dz]] of [["east", [1, 0]], ["west", [-1, 0]], ["south", [0, 1]], ["north", [0, -1]]]) {
    const n = g.get(x + dx, y, z + dz);
    conn[name] = n && n.block !== "minecraft:glowstone" ? "true" : "false";
  }
  g.set(x, y, z, GLASS, { ...conn, waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_326664546.nbt";
const res = g.save(out);
console.log(`way_326664546: ${cells.length} footprint cells, ${attic.size} set-back cells, ${res.blocks} blocks, ${res.palette} palette entries -> ${out}`);

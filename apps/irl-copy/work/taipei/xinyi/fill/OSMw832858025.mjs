import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block (c. 1980s Taipei shophouse-office):
// stone plinth, shopfront with a recessed entrance on the z=0 (north) street face,
// upper storey of punched glass bays between quartz pillars, cornice and parapet,
// flat roof with a stair housing, AC plant and a lightning rod.
// Storey levels are absolute from the lowest ground B: ground slab B, floor B+5,
// roof slab B+10, parapet B+11. Cells on a slope stand on a stone foundation.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw832858025";
const W = 20, D = 22, H = 23;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of raw) ground.set(`${x},${z}`, Math.round(gy));

const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
let B = Infinity;
for (const gy of ground.values()) B = Math.min(B, gy);

const g = new Voxels([W, H, D]);

// Place a block only on footprint cells, and only at or above that cell's ground.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!inFp(x, z) || y < gAt(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gy && y < H; y++) g.set(x, y, z, "stone");
}

// Faces: outward direction and the inward offset.
const FACES = [
  { f: "N", dx: 0, dz: -1, ix: 0, iz: 1 },
  { f: "S", dx: 0, dz: 1, ix: 0, iz: -1 },
  { f: "W", dx: -1, dz: 0, ix: 1, iz: 0 },
  { f: "E", dx: 1, dz: 0, ix: -1, iz: 0 },
];

// Facade block for a perimeter cell on face `face` at storey level `rel` (y = B + rel).
function skin(face, x, z, rel) {
  const ns = face === "N" || face === "S";
  const a = ns ? x : z;
  const L = ns ? W : D;
  const pil = a % 4 === 0 || a === L - 1;
  const front = face === "N" && z === 0;
  const ent = front && a >= 8 && a <= 11;
  const door = front && (a === 9 || a === 10);
  const glass = ns
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: a === 9 ? "left" : "right",
    open: "false",
    powered: "false",
  });

  switch (rel) {
    case 0:
      return ["stone_bricks"];                      // ground slab / plinth
    case 1:
      if (door) return ["dark_oak_door", doorProps("lower")];
      if (ent) return ["quartz_pillar", { axis: "y" }];
      return ["polished_andesite"];                 // base course
    case 2:
      if (door) return ["dark_oak_door", doorProps("upper")];
      if (ent || pil) return ["quartz_pillar", { axis: "y" }];
      return ["glass_pane", glass];                 // shopfront glazing
    case 3:
      if (door) return ["glass_pane", glass];       // transom over door
      if (ent && !door) return ["quartz_pillar", { axis: "y" }];
      if (pil) return ["quartz_pillar", { axis: "y" }];
      return ["glass_pane", glass];
    case 4:
      if (ent) return ["light_gray_concrete"];      // entrance lintel
      if (pil) return ["quartz_pillar", { axis: "y" }];
      return ["light_gray_concrete"];               // fascia band
    case 5:
      return ["light_gray_concrete"];               // storey line
    case 6:
      if (pil) return ["quartz_pillar", { axis: "y" }];
      return ["white_concrete"];                    // upper spandrel body
    case 7:
    case 8:
      if (pil) return ["quartz_pillar", { axis: "y" }];
      return ["glass_pane", glass];                 // upper window bays
    case 9:
      if (pil) return ["quartz_pillar", { axis: "y" }];
      return ["light_gray_concrete"];               // sill band
    case 10:
      return ["smooth_stone"];                      // cornice
    case 11:
      return ["white_concrete"];                    // parapet
  }
  return null;
}

// 2. Walls, plinth, floor slabs, cornice, parapet.
for (const [key, gy] of ground) {
  const [x, z] = key.split(",").map(Number);
  const exposed = FACES.filter((o) => !inFp(x + o.dx, z + o.dz));
  const face = exposed.length ? exposed.find((o) => o.f === "N" || o.f === "S")?.f ?? exposed[0].f : null;

  for (let rel = 0; rel <= 11; rel++) {
    const y = B + rel;
    if (face) {
      const s = skin(face, x, z, rel);
      if (s) put(x, y, z, s[0], s[1]);
    } else if (rel === 0 || rel === 5) {
      put(x, y, z, "smooth_stone");                 // interior floor slabs
    } else if (rel === 10) {
      put(x, y, z, "gray_concrete");                // roof deck
    }
  }
}

// 3. Warm lights behind the glass (interior cell just inside each lit bay).
for (const [key] of ground) {
  const [x, z] = key.split(",").map(Number);
  const exposed = FACES.filter((o) => !inFp(x + o.dx, z + o.dz));
  if (!exposed.length) continue;
  const o = exposed.find((e) => e.f === "N" || e.f === "S") ?? exposed[0];
  const ns = o.f === "N" || o.f === "S";
  const a = ns ? x : z;
  const front = o.f === "N" && z === 0;
  if (front && a >= 7 && a <= 12) continue;        // keep entrance clear
  if (a % 4 !== 2) continue;
  const bay = a >> 2;
  if (bay % 2 === 0) put(x + o.ix, B + 7, z + o.iz, "glowstone");
  if ((bay + 1) % 2 === 0) put(x + o.ix, B + 2, z + o.iz, "glowstone");
}

// 4. Entrance: lantern inside the door, canopy soffit over the entry.
put(9, B + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
for (let a = 7; a <= 12; a++) {
  put(a, B + 4, 1, "smooth_stone_slab", { type: "top", waterlogged: "false" });
}

// 5. Roof: stair housing with door, AC plant, water tank, lightning rod.
const SH = { x0: 3, x1: 6, z0: 3, z1: 6 };
for (let x = SH.x0; x <= SH.x1; x++) {
  for (let z = SH.z0; z <= SH.z1; z++) {
    const edge = x === SH.x0 || x === SH.x1 || z === SH.z0 || z === SH.z1;
    for (let rel = 11; rel <= 12; rel++) {
      if (edge) put(x, B + rel, z, "white_concrete");
    }
    put(x, B + 13, z, "smooth_stone");              // roof of housing
  }
}
// Door on the housing's north face (z = SH.z0), lower and upper halves.
put(4, B + 11, SH.z0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(4, B + 12, SH.z0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// Clear the housing interior.
for (let x = SH.x0 + 1; x <= SH.x1 - 1; x++) {
  for (let z = SH.z0 + 1; z <= SH.z1 - 1; z++) {
    for (let rel = 11; rel <= 12; rel++) {
      if (inFp(x, z) && B + rel < H) g.set(x, B + rel, z, "air");
    }
  }
}

// AC units on the east side of the roof.
for (const [x, z] of [[13, 5], [14, 5], [13, 9], [14, 9]]) put(x, B + 11, z, "iron_block");
put(13, B + 12, 5, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
put(13, B + 12, 9, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

// Water tank: 2 x 2 x 2 copper block tower.
for (const [x, z] of [[16, 14], [17, 14], [16, 15], [17, 15]]) {
  put(x, B + 11, z, "copper_block");
  put(x, B + 12, z, "copper_block");
}

// Lightning rod on the south-east parapet corner.
put(17, B + 11, 19, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);

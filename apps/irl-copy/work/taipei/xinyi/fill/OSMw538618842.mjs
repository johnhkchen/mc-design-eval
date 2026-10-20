import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618842";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 23, D = 21;
const ROOF = 10;      // roof slab level; parapet sits on top at y=11
const STOREY = 5;     // storey line between floors
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, gr | 0));
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, b, p) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Outward faces of a perimeter cell
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}

const isPerimeter = (x, z) => facesOf(x, z).length > 0;

// Pass 1: foundations, floor slabs, storey line, roof slab for every footprint cell
for (const [x, z, ground0] of cells) {
  const base = gr(x, z);
  // foundation plinth from lowest ground up to this cell's ground
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");
  // ground floor slab
  put(x, base, z, "light_gray_concrete");
  // storey slab (only where it lies above the ground floor)
  if (base < STOREY) put(x, STOREY, z, "light_gray_concrete");
  // roof slab
  if (base < ROOF) put(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: facade walls, openings, pillars, cornice, parapet
for (const [x, z] of cells) {
  if (!isPerimeter(x, z)) continue;
  const base = gr(x, z);
  const faces = facesOf(x, z);
  const face = ["S", "N", "E", "W"].find((f) => faces.includes(f)) ?? faces[0];
  const alongX = face === "N" || face === "S";
  const t = alongX ? x : z;           // position along the facade
  const bay = ((t % 4) + 4) % 4;      // 0 pillar, 1-2 window, 3 wall
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[face];

  // parapet and cornice on the roof edge
  put(x, ROOF, z, "smooth_quartz");
  put(x, ROOF + 1, z, "smooth_quartz");

  for (let y = base; y < ROOF; y++) {
    // base course
    if (y === base) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    // storey band
    if (y === STOREY) {
      put(x, y, z, "smooth_quartz");
      continue;
    }
    // ground floor (base+1..4) and second floor (6..9)
    const isGround = y > base && y < STOREY;
    const isUpper = y > STOREY && y < ROOF;
    if (!isGround && !isUpper) {
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // main entrance on the south (front) facade, centred, ground floor only
    const centre = Math.floor(W / 2);
    const isDoor =
      isGround && face === "S" && Math.abs(x - centre) <= 1 && y <= base + 2;
    if (isDoor) {
      const half = y === base + 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "south", half, hinge: x < centre ? "left" : "right",
        open: "false", powered: "false",
      });
      continue;
    }

    if (bay === 0) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (bay === 3) {
      put(x, y, z, "smooth_quartz");
    } else {
      // glass pane window, connected along the facade
      const props = alongX
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", props);

      // warm light behind some windows (interior air cell)
      const ix = x + inward[0], iz = z + inward[1];
      if (has(ix, iz) && t % 8 === 1) {
        if (isGround && y === base + 2) put(ix, y, iz, "glowstone");
        if (isUpper && y === 7) put(ix, y, iz, "shroomlight");
      }
    }
  }
}

// Pass 3: rooftop plant on the roof (stands on the roof slab at y=10)
for (let x = 10; x <= 18; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!has(x, z) || isPerimeter(x, z)) continue;
    if (x >= 11 && x <= 17 && z >= 8 && z <= 12) {
      put(x, ROOF + 1, z, "light_gray_concrete");
      if (x >= 12 && x <= 16 && z >= 9 && z <= 11) put(x, ROOF + 2, z, "light_gray_concrete");
    }
  }
}
// small air-handling units at two corners of the plant
for (const [x, z] of [[11, 8], [17, 12]]) {
  if (has(x, z)) put(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

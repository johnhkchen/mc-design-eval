import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Commercial low-rise, c. 1990s Xinyi frontage: two storeys (5 blocks each), a shopfront
// ground floor with a centred entrance and canopy band, a glazed upper storey with
// concrete piers, a cornice, a parapet and rooftop plant. Roof top ~11 blocks above lowest ground.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541994058";
const W = 29, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const FLOOR = 5;     // belt course / floor slab between storeys
const ROOF = 10;     // cornice and roof deck
const PARAPET = 11;  // top of parapet

// [name, dx, dz] for the four outward directions
const DIRS = [["north", 0, -1], ["south", 0, 1], ["east", 1, 0], ["west", -1, 0]];

const at = new Map();
let minZ = Infinity;
for (const [x, z, gr] of cells) {
  at.set(`${x},${z}`, gr);
  if (z < minZ) minZ = z;
}
const inside = (x, z) => at.has(`${x},${z}`);
const outs = (x, z) => DIRS.filter(([, dx, dz]) => !inside(x + dx, z + dz));

// Entrance: centre of the north frontage (lowest z edge)
const northXs = cells.filter(([, z]) => z === minZ).map(c => c[0]).sort((a, b) => a - b);
const cx = northXs[Math.floor(northXs.length / 2)];
const isEntrance = (x, z) => z === minZ && Math.abs(x - cx) <= 1;

// Glass pane connections running along the facade
function paneProps(name) {
  const ew = name === "north" || name === "south"; // wall runs east-west
  return {
    north: String(!ew), south: String(!ew),
    east: String(ew), west: String(ew),
    waterlogged: "false",
  };
}

// Block for a perimeter cell at height y, or null
function facade(x, z, y, base, [name]) {
  if (y === FLOOR || y === ROOF) return ["light_gray_concrete"];
  if (y === PARAPET) return ["white_concrete"];
  const pier = (x + z) % 3 === 0;
  if (y < FLOOR) {
    // Shopfront storey
    const r = y - base;
    if (isEntrance(x, z)) {
      if (r === 0) return ["dark_oak_door", { facing: name, half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (r === 1) return ["dark_oak_door", { facing: name, half: "upper", hinge: "left", open: "false", powered: "false" }];
      if (r === 2 && !pier) return ["black_concrete"];
    }
    if (pier) return ["white_concrete"];
    if (r === 0) return ["gray_concrete"];           // stall kick plate
    return ["glass_pane", paneProps(name)];
  }
  // Upper storey: glazed bays between concrete piers, light sill at the base
  if (pier) return ["white_concrete"];
  if (y === 6) return ["light_gray_concrete"];        // sill
  return ["glass_pane", paneProps(name)];
}

// Foundations, floors, facades
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  if (gr <= FLOOR) g.set(x, FLOOR, z, "light_gray_concrete");
  if (gr <= ROOF) g.set(x, ROOF, z, "light_gray_concrete");

  const os = outs(x, z);
  if (os.length === 0) continue;
  const out = os[0];
  for (let y = Math.max(gr, 0); y <= PARAPET; y++) {
    const b = facade(x, z, y, gr, out);
    if (!b) continue;
    const [id, props] = b;
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  }
}

// Warm lights behind some upper-storey windows (interior air cell just inside the glass)
for (const [x, z, gr] of cells) {
  const os = outs(x, z);
  if (os.length === 0 || isEntrance(x, z)) continue;
  if ((x + z) % 3 === 0) continue;
  if ((x * 5 + z * 7) % 13 !== 0) continue;
  const [, dx, dz] = os[0];
  const ix = x - dx, iz = z - dz;
  const ig = at.get(`${ix},${iz}`);
  if (ig === undefined || ig > 7) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Rooftop plant: small 2x2 gray concrete units on interior roof cells
for (const [x, z] of cells) {
  if (x % 8 !== 4 || z % 6 !== 3) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  const ok = block.every(([bx, bz]) => inside(bx, bz) && outs(bx, bz).length === 0);
  if (!ok) continue;
  const roofY = Math.max(...block.map(([bx, bz]) => at.get(`${bx},${bz}`)));
  if (roofY > ROOF) continue;
  for (const [bx, bz] of block) {
    g.set(bx, PARAPET, bz, "gray_concrete");
    g.set(bx, PARAPET + 1, bz, "gray_concrete");
  }
}

g.save(`${SRC}/${ID}.nbt`);

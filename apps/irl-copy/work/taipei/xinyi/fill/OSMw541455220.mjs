import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455220";
const W = 15, H = 23, D = 10;

// Two-storey Taipei commercial block (1990s shophouse-style): white tiled walls,
// granite base, quartz bands, shopfront with an iron entrance door on the south face,
// and punched windows with warm lights behind the glass.
const FOUND = "polished_andesite";
const FLOOR = "smooth_stone";
const BAND = "smooth_quartz";
const WALL = "white_concrete";
const BASE = "polished_granite";
const ROOF = "light_gray_concrete";
const EQUIP = "iron_block";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g0] of cells) ground.set(key(x, z), Math.round(g0));
const footprint = cells.map(([x, z]) => [x, z]);

const has = (x, z) => ground.has(key(x, z));
const xs = footprint.map((c) => c[0]), zs = footprint.map((c) => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs), zmax = Math.max(...zs);

// Foundation level: the highest ground under the footprint, so the block sits flat.
const base = Math.max(...ground.values());
if (base + 11 >= H) console.warn(`roof reaches y=${base + 11}, above volume height ${H}`);

const g = new Voxels([W, H, D]);

// Outward face of a perimeter cell, or null for interior cells.
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Piers every 3 blocks along each facade, plus the corners.
function isPier(x, z, face) {
  if (face === "north" || face === "south") return (x - xmin) % 3 === 0 || x === xmax;
  return (z - zmin) % 3 === 0 || z === zmax;
}

const doorX = Math.round((xmin + xmax) / 2);

function paneProps(face) {
  const alongX = face === "north" || face === "south";
  return {
    north: "false",
    south: "false",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// Pass 1: foundation, floor slabs, roof slab across the whole footprint.
for (const [x, z] of footprint) {
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);
  g.set(x, base, z, FLOOR);
  g.set(x, base + 5, z, BAND);
  g.set(x, base + 10, z, ROOF);
}

// Pass 2: facade on perimeter cells.
for (const [x, z] of footprint) {
  const face = faceOf(x, z);
  if (!face) continue;
  const yb = base;
  const pier = isPier(x, z, face);

  g.set(x, yb + 1, z, BASE);

  // Ground floor shopfront
  for (const y of [yb + 2, yb + 3]) {
    if (pier) g.set(x, y, z, BAND);
    else g.set(x, y, z, "glass_pane", paneProps(face));
  }
  g.set(x, yb + 4, z, BAND);

  // Storey band
  g.set(x, yb + 5, z, BAND);

  // Upper floor windows
  if (pier) {
    for (const y of [yb + 6, yb + 7, yb + 8]) g.set(x, y, z, WALL);
  } else {
    g.set(x, yb + 6, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
    for (const y of [yb + 7, yb + 8]) g.set(x, y, z, "glass_pane", paneProps(face));
  }
  g.set(x, yb + 9, z, BAND);

  // Cornice and parapet
  g.set(x, yb + 10, z, BAND);
  g.set(x, yb + 11, z, pier ? BAND : WALL);
}

// Pass 3: entrance on the south face (iron door, lantern just inside).
{
  const z = zmax;
  if (has(doorX, z)) {
    g.set(doorX, base + 1, z, "iron_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(doorX, base + 2, z, "iron_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    if (has(doorX, z - 1)) {
      g.set(doorX, base + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Pass 4: warm lights just inside the glass, staggered across each facade.
for (const [x, z] of footprint) {
  const face = faceOf(x, z);
  if (!face) continue;
  if (isPier(x, z, face)) continue;

  let ix = x, iz = z;
  const along = face === "north" || face === "south" ? x - xmin : z - zmin;
  if (face === "north") iz = z + 1;
  else if (face === "south") iz = z - 1;
  else if (face === "west") ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || faceOf(ix, iz)) continue;

  if (along % 6 === 4) g.set(ix, base + 2, iz, "glowstone");
  if (along % 6 === 1) g.set(ix, base + 7, iz, "shroomlight");
}

// Pass 5: roof equipment (two condenser units) on the parapet-level roof.
for (const [x, z] of [[xmin + 3, zmin + 3], [xmax - 3, zmax - 3]]) {
  if (has(x, z) && !faceOf(x, z)) g.set(x, base + 11, z, EQUIP);
}

g.save(`${DIR}/${ID}.nbt`);

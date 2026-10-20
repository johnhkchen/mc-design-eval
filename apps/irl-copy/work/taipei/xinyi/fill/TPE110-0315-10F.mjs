import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE110-0315-10F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 23, D = 18;
const g = new Voxels([W, H, D]);

// Built 2021: modern white-concrete and glass low-rise with a stone plinth,
// shopfront ground floor, glazed upper storey, quartz storey lines,
// cornice parapet and roof plant.
const FLOOR = 5;      // storey line / floor slab row
const ROOF = 10;      // top occupied row (cornice / roof slab)
const ROOF_TOP = 11;  // roof surface
const GLASS = "light_blue_stained_glass_pane";
const WARM = "yellow_stained_glass_pane";
const LAMP = "glowstone";

const key = (x, z) => `${x},${z}`;
const inside = new Set();
const ground = new Map();
for (const [x, z, gr] of cells) {
  inside.add(key(x, z));
  ground.set(key(x, z), Math.max(0, Math.round(gr)));
}
const has = (x, z) => inside.has(key(x, z));
const groundAt = (x, z) => ground.get(key(x, z)) ?? 0;

// Outward face of an edge cell. Priority: south, north, west, east.
function faceOf(x, z) {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  return null;
}

// The interior cell directly behind an edge cell's glass (opposite to its outward face).
function behind(x, z, face) {
  if (face === "S") return [x, z - 1];
  if (face === "N") return [x, z + 1];
  if (face === "W") return [x + 1, z];
  return [x - 1, z]; // E
}

function panePropsFor(face) {
  if (face === "N" || face === "S") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Front door: the south-facing edge cell nearest the façade centre.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (faceOf(x, z) === "S") {
      const d = Math.abs(x - W / 2);
      if (d < best) { best = d; doorCell = { x, z, gr: groundAt(x, z) }; }
    }
  }
}

const lamps = []; // interior cells that get a glowstone behind a warm pane

for (const [x, z] of cells) {
  const gr = groundAt(x, z);
  const face = faceOf(x, z);
  const edge = face !== null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const along = face === "N" || face === "S" ? x : z;
  const pillar = along % 3 === 0;
  const isDoor = doorCell && x === doorCell.x && z === doorCell.z && face === "S";

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      g.set(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (y === FLOOR) {
      g.set(x, y, z, edge ? "smooth_quartz" : "white_concrete");
      continue;
    }
    if (!edge) continue; // interior air

    if (y < FLOOR) {
      // Ground floor: plinth course, shopfront glass, pillars, entrance.
      if (y === gr && gr < FLOOR) {
        if (isDoor) continue;
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      if (isDoor && (y === gr || y === gr + 1)) continue;
      if (pillar) {
        g.set(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        const warm = (along + y) % 7 === 0;
        g.set(x, y, z, warm ? WARM : GLASS, panePropsFor(face));
        if (warm) lamps.push({ x, y, z, face });
      }
      continue;
    }

    if (y < ROOF) {
      // Upper storey: windows rows 6..8, spandrel row 9, mullions every 3 blocks.
      if (y === ROOF - 1) {
        g.set(x, y, z, "white_concrete");
      } else if (pillar) {
        g.set(x, y, z, "smooth_quartz");
      } else {
        const warm = (along + y) % 5 === 0;
        g.set(x, y, z, warm ? WARM : GLASS, panePropsFor(face));
        if (warm) lamps.push({ x, y, z, face });
      }
    }
  }

  // Roof plant near the centre.
  if (!edge && x >= 8 && x <= 13 && z >= 6 && z <= 11) {
    g.set(x, ROOF_TOP, z, "iron_block");
  }
}

// Warm glass reads as lit: put a glowstone in the interior air directly behind it.
for (const { x, y, z, face } of lamps) {
  const [bx, bz] = behind(x, z, face);
  if (!has(bx, bz)) continue;
  if (faceOf(bx, bz) !== null) continue; // only interior cells
  if (y < FLOOR && y > groundAt(bx, bz) - 1 && y < FLOOR) {
    g.set(bx, y, bz, LAMP);
  } else if (y > FLOOR && y < ROOF) {
    g.set(bx, y, bz, LAMP);
  }
}

// Entrance: door two blocks high, facing out to the south.
if (doorCell && doorCell.gr + 1 < FLOOR) {
  const { x, z, gr } = doorCell;
  g.set(x, gr, z, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 1, z, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(`${DIR}/${ID}.nbt`);

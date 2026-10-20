import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537993161";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 16, H = 23, D = 13;
const STOREY = 5;
const ROOF_OFF = 10;          // roof/parapet course sits at ground + 10, total 11 blocks
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.min(12, gr)));
const has = (x, z) => ground.has(key(x, z));

// Outward faces of a footprint cell (a face is outward when its neighbour is absent)
function outward(x, z) {
  const d = [];
  if (!has(x - 1, z)) d.push("W");
  if (!has(x + 1, z)) d.push("E");
  if (!has(x, z - 1)) d.push("N");
  if (!has(x, z + 1)) d.push("S");
  return d;
}
const isEdge = (x, z) => outward(x, z).length > 0;

// Pick one street entrance: a south-facing (or failing that, any) edge cell nearest the centre of the south wall
let doorCell = null;
{
  const xs = cells.map(c => c[0]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const pick = (dirPref) => {
    let best = null;
    for (const [x, z] of cells) {
      const d = outward(x, z);
      if (!d.includes(dirPref)) continue;
      if (!best || Math.abs(x - cx) < Math.abs(best.x - cx)) best = { x, z, dir: dirPref };
    }
    return best;
  };
  doorCell = pick("S") || pick("N") || pick("E") || pick("W");
}

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const G = Math.max(0, Math.min(12, gr));

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const dirs = outward(x, z);
  const edge = dirs.length > 0;
  const corner = dirs.length >= 2;
  const primary = dirs[0];
  const alongZ = primary === "W" || primary === "E";
  const p = alongZ ? z : x;

  for (let o = 0; o <= ROOF_OFF; o++) {
    const y = G + o;
    if (y >= H) continue;

    if (!edge) {
      // Interior: only floor slabs and roof deck, the rest is air gap
      if (o === 0 || o === STOREY || o === ROOF_OFF) {
        const roofDeck = o === ROOF_OFF;
        if (roofDeck && (x * 2 + z) % 7 === 0) g.set(x, y, z, "iron_block");   // roof plant
        else g.set(x, y, z, "light_gray_concrete");
      } else if ((o === 2 || o === STOREY + 2) && (x * 3 + z * 5) % 4 === 0 &&
                 [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dz]) => has(x + dx, z + dz) && isEdge(x + dx, z + dz))) {
        g.set(x, y, z, "glowstone");   // warm light behind the glazing
      }
      continue;
    }

    // Edge cells: facade
    if (o === ROOF_OFF) {
      g.set(x, y, z, "white_concrete");       // parapet
      continue;
    }
    if (o === 0) {
      g.set(x, y, z, "polished_andesite");    // base course on the ground floor
      continue;
    }
    if (o === STOREY) {
      g.set(x, y, z, "light_gray_concrete");  // storey line
      continue;
    }

    if (corner) {
      g.set(x, y, z, "light_gray_concrete");  // corner pilaster
      continue;
    }
    if (p % 3 === 0) {
      g.set(x, y, z, "white_concrete");       // pier / mullion
      continue;
    }

    const local = o < STOREY ? o : o - STOREY;   // 1..4 within a storey
    const ground_floor = o < STOREY;

    if (local === 4) {
      g.set(x, y, z, "white_concrete");       // spandrel
      continue;
    }

    // Door on the ground floor, lantern over it
    if (ground_floor && doorCell && x === doorCell.x && z === doorCell.z && primary === doorCell.dir) {
      const facing = { S: "south", N: "north", E: "east", W: "west" }[doorCell.dir];
      if (o === 1) {
        g.set(x, y, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (o === 2) {
        g.set(x, y, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (o === 3) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
    }

    if (ground_floor) {
      g.set(x, y, z, "glass");                // shopfront glazing
    } else {
      g.set(x, y, z, "cyan_stained_glass_pane", alongZ ? PANE_NS : PANE_EW);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

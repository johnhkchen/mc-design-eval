import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded low-rise: a 1970s-80s Taipei commercial block. Two storeys of
// white concrete with ribbon windows over a shopfront, a light-grey cornice and
// quartz parapet, a flat roof with an AC unit and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw772039811";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 13;
const TOP = 11;      // parapet top (roof ~11 blocks above lowest ground)
const DECK = 10;     // roof deck / cornice level
const FLOOR2 = 5;    // second-storey floor slab
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));

const inFoot = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => inFoot(x, z) && (!inFoot(x - 1, z) || !inFoot(x + 1, z) || !inFoot(x, z - 1) || !inFoot(x, z + 1));
const pillar = (x, z) => {
  const missX = !inFoot(x - 1, z) || !inFoot(x + 1, z);
  const missZ = !inFoot(x, z - 1) || !inFoot(x, z + 1);
  return (missX && missZ) || (x + z) % 3 === 0;
};
const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props); else g.set(x, y, z, name);
};

// Door: on the front (lowest z) face, nearest the centre, not a corner.
let door = null;
{
  const minZ = Math.min(...cells.map(c => c[1]));
  const cands = cells
    .filter(([x, z]) => z === minZ && perim(x, z) && !inFoot(x, z - 1) && !pillar(x, z))
    .map(([x, z]) => [x, z]);
  cands.sort((a, b) => Math.abs(a[0] - (W - 1) / 2) - Math.abs(b[0] - (W - 1) / 2));
  if (cands.length) door = cands[0];
}

// Lights/AC/tank placement helpers
const interiorCells = cells.map(([x, z]) => [x, z]).filter(([x, z]) => inFoot(x, z) && !perim(x, z));

// 1. Foundation, walls, floors, roof
for (const [x, z, gr] of cells) {
  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) {
    put(x, y, z, y === gr ? "stone_bricks" : "stone");
  }
  const base = gr;

  if (perim(x, z)) {
    const isPillar = pillar(x, z);
    for (let y = base + 1; y <= TOP; y++) {
      let name = null, props = null;
      if (y <= 4) {
        // ground storey: base course, shopfront glazing, lintel
        if (y === base + 1) name = "polished_andesite";
        else if (y === 4) name = "light_gray_concrete";
        else name = isPillar ? "polished_andesite" : "cyan_stained_glass";
      } else if (y === FLOOR2) {
        name = "light_gray_concrete";                       // storey line
      } else if (y < DECK) {
        // upper storey: ribbon windows between concrete mullions
        if (isPillar) name = "white_concrete";
        else if (y === 6 || y === 9) name = "light_gray_concrete";
        else name = "light_blue_stained_glass";
      } else if (y === DECK) {
        name = "light_gray_concrete";                       // cornice
      } else {
        name = "smooth_quartz";                             // parapet
      }
      put(x, y, z, name);
    }
    // Door (lower and upper halves) on the front face
    if (door && door[0] === x && door[1] === z) {
      const dy = base + 1;
      if (dy + 1 <= 4) {
        put(x, dy, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        put(x, dy + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      }
    }
  } else {
    // interior: floor slab over the ground storey, roof deck, warm lights
    if (FLOOR2 > base) put(x, FLOOR2, z, "light_gray_concrete");
    if (DECK > base) put(x, DECK, z, "gray_concrete");
    if (FLOOR2 > base && (x + 2 * z) % 4 === 0 && 4 > base) {
      put(x, 4, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    if (FLOOR2 > base && (x + z) % 4 === 1 && 6 > base) {
      put(x, 6, z, "glowstone");
    }
  }
}

// 2. Roof equipment: AC unit in the lowest-corner interior cell
if (interiorCells.length) {
  const [ax, az] = interiorCells.reduce((a, b) => (a[0] + a[1] <= b[0] + b[1] ? a : b));
  put(ax, DECK + 1, az, "iron_block");
}

// 3. Rooftop water tank: 3x3 interior block, corners cut for a rounded read
{
  const interior = new Set(interiorCells.map(([x, z]) => `${x},${z}`));
  let best = null;
  for (const [cx, cz] of interiorCells) {
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dz = -1; dz <= 1 && ok; dz++)
        if (!interior.has(`${cx + dx},${cz + dz}`)) ok = false;
    if (ok && (!best || Math.abs(cx - 5) + Math.abs(cz - 6) < Math.abs(best[0] - 5) + Math.abs(best[1] - 6))) best = [cx, cz];
  }
  if (best) {
    const [tx, tz] = best;
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++) {
        const corner = dx !== 0 && dz !== 0;
        for (let y = DECK + 1; y <= DECK + 3; y++) {
          if (corner) continue;
          put(tx + dx, y, tz + dz, "light_gray_concrete");
        }
      }
    // corners stand as short stubs so the tank has a rounded silhouette
    for (let dx = -1; dx <= 1; dx += 2)
      for (let dz = -1; dz <= 1; dz += 2)
        put(tx + dx, DECK + 1, tz + dz, "light_gray_concrete");
    // cap
    for (let dx = -1; dx <= 1; dx++)
      for (let dz = -1; dz <= 1; dz++)
        put(tx + dx, DECK + 4, tz + dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

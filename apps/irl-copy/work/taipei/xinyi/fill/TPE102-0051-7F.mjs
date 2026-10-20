import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE102-0051-7F";
const W = 15, H = 47, D = 13;
const ROOF = 35;          // roof slab top, about 35 blocks above lowest ground
const TIER = 30;          // upper setback tier starts here; lower terrace slab at TIER-1
const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const LEDGE = "light_gray_concrete";
const SPAN = "gray_concrete";
const FOUND = "gray_concrete";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inL = (x, z) => ground.has(`${x},${z}`);
// upper tier footprint: lower footprint inset by one block
const inU = (x, z) => inL(x, z) && inL(x - 1, z) && inL(x + 1, z) && inL(x, z - 1) && inL(x, z + 1);
const edgeOf = set => (x, z) =>
  set(x, z) && (!set(x - 1, z) || !set(x + 1, z) || !set(x, z - 1) || !set(x, z + 1));
const edgeU = edgeOf(inU);

const zMin = Math.min(...cells.map(c => c[1]));
const xMin = Math.min(...cells.map(c => c[0]));
const xMax = Math.max(...cells.map(c => c[0]));
const cx = Math.round((xMin + xMax) / 2);

// Facade block for an edge cell at height y, using the set that defines its tier
function facade(x, z, y, set, gr) {
  const k = Math.floor(y / 5);
  const r = y % 5;
  const front = !set(x, z - 1);
  const onZ = !set(x, z - 1) || !set(x, z + 1);
  const onX = !set(x - 1, z) || !set(x + 1, z);
  const corner = onZ && onX;
  const mullion = corner || (onZ ? x % 2 === 0 : z % 2 === 0);

  if (gr >= 0 && y === gr) return { id: "stone_bricks" };          // base course
  if (r === 0) return { id: LEDGE };                               // floor line
  if (r === 4) return { id: SPAN };                                // spandrel band
  if (front && gr >= 0 && k === 0 && x === cx && (y === gr + 1 || y === gr + 2)) {
    return {
      id: "dark_oak_door",
      props: {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      },
    };
  }
  if (mullion) return { id: FRAME };
  return { id: GLASS };
}

for (const [x, z, gr] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  if (!inU(x, z)) {
    // lower ring: facade up to the terrace, then a walkable terrace slab
    for (let y = gr; y <= TIER - 2; y++) {
      const f = facade(x, z, y, inL, gr);
      g.set(x, y, z, f.id, f.props);
    }
    g.set(x, TIER - 1, z, LEDGE);                 // terrace surface
    g.set(x, TIER, z, "iron_bars");               // guard rail
  } else {
    // lower interior: floor slabs per storey, glowstone behind the glass
    for (let y = gr; y <= TIER - 2; y++) {
      if (y === gr || y % 5 === 0) {
        g.set(x, y, z, LEDGE);
      } else if (
        z === zMin + 1 && (x === cx - 3 || x === cx + 3) &&
        Math.floor(y / 5) % 2 === 1 && y % 5 === 1
      ) {
        g.set(x, y, z, "glowstone");
      }
    }
    g.set(x, TIER - 1, z, LEDGE);                 // slab across the whole lower footprint

    // upper setback tier
    for (let y = TIER; y < ROOF; y++) {
      if (edgeU(x, z)) {
        const f = facade(x, z, y, inU, -1);
        g.set(x, y, z, f.id, f.props);
      } else if (y % 5 === 0) {
        g.set(x, y, z, LEDGE);
      } else if (
        z === zMin + 2 && (x === cx - 3 || x === cx + 3) &&
        Math.floor(y / 5) % 2 === 1 && y % 5 === 1
      ) {
        g.set(x, y, z, "glowstone");
      }
    }

    // roof slab and parapet on the upper tier
    g.set(x, ROOF, z, LEDGE);
    if (edgeU(x, z)) {
      g.set(x, ROOF + 1, z, FRAME);
      g.set(x, ROOF + 2, z, FRAME);
    }
  }
}

// Entrance canopy over the front door bay, with a hanging lantern
for (let x = cx - 2; x <= cx + 2; x++) {
  if (!inL(x, zMin)) continue;
  const grF = ground.get(`${x},${zMin}`);
  g.set(x, grF + 3, zMin, LEDGE);
  g.set(x, grF + 3, zMin + 1, LEDGE);
}
{
  const grD = ground.get(`${cx},${zMin + 1}`) ?? 0;
  if (inL(cx, zMin + 1)) {
    g.set(cx, grD + 2, zMin + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Roof plant room, x 4..10, z 4..8
const PX0 = 4, PX1 = 10, PZ0 = 4, PZ1 = 8;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!inU(x, z)) continue;
    const edge = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    if (edge) {
      g.set(x, 36, z, FRAME);
      g.set(x, 37, z, (x + z) % 2 === 0 ? GLASS : "iron_bars");
      g.set(x, 38, z, (x + z) % 2 === 0 ? GLASS : "iron_bars");
      g.set(x, 39, z, FRAME);
    }
    g.set(x, 40, z, FRAME); // lid
  }
}

// Antenna mast on the plant room
const mx = cx, mz = PZ0 + 2;
for (let y = 41; y <= 43; y++) g.set(mx, y, mz, "iron_block");
g.set(mx, 44, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);

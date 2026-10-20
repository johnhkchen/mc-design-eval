import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw549464123";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 33, D = 21;
const v = new Voxels([W, H, D]);

// Four storeys of 5 blocks, white-tiled concrete frame, ribbon glazing,
// stone plinth, cornice and a parapet. Roof deck at y 20, parapet at y 21.
const STOREY = 5;
const STOREYS = 4;
const ROOF_Y = STOREYS * STOREY;        // 20
const PARAPET_Y = ROOF_Y + 1;           // 21
const TOP_WALL = ROOF_Y - 1;            // 19

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Entrance: median x of the north-most row of cells.
const frontXs = cells
  .filter(([x, z]) => z === minZ && !has(x, z - 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : null;

// Classify each footprint cell.
function classify(x, z) {
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const wall = mN || mS || mW || mE;
  const corner = (mN || mS) && (mW || mE);
  const axisX = (mN || mS) && !(mW || mE); // wall runs along x
  let inward = null;
  if (!corner) {
    if (mN) inward = [x, z + 1];
    else if (mS) inward = [x, z - 1];
    else if (mW) inward = [x + 1, z];
    else if (mE) inward = [x - 1, z];
  }
  return { mN, mS, mW, mE, wall, corner, axisX, inward };
}

const paneProps = (axisX) => ({
  east: axisX ? "true" : "false",
  west: axisX ? "true" : "false",
  north: axisX ? "false" : "true",
  south: axisX ? "false" : "true",
  waterlogged: "false",
});

for (const [x, z, gr] of cells) {
  const c = classify(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");

  // Floor slabs on the interior and under walls, storey by storey.
  v.set(x, gr, z, "light_gray_concrete");
  for (let s = 1; s < STOREYS; s++) {
    const fy = s * STOREY;
    if (fy > gr) v.set(x, fy, z, "light_gray_concrete");
  }

  // Roof deck and cornice.
  v.set(x, ROOF_Y, z, c.wall ? "smooth_stone" : "light_gray_concrete");

  if (!c.wall) continue; // interior stays as air gap behind glass

  // Parapet.
  v.set(x, PARAPET_Y, z, "white_concrete");

  // Facade body with storey lines.
  for (let y = gr; y <= TOP_WALL; y++) {
    const isLine = y % STOREY === 0 && y > gr;
    v.set(x, y, z, isLine ? "light_gray_concrete" : "white_concrete");
  }

  // Stone plinth at the base.
  for (let y = gr; y <= gr + 1 && y <= TOP_WALL; y++) v.set(x, y, z, "stone_bricks");

  const idx = c.axisX ? x : z;
  const pillar = c.corner || (idx % 3 === 0);
  const isEntrance = c.mN && z === minZ && x === entranceX;

  if (isEntrance) {
    // Door on the front facade, transom above, lantern inside under the lintel.
    v.set(x, gr, z, "spruce_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    v.set(x, gr + 1, z, "spruce_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    if (c.inward && has(c.inward[0], c.inward[1])) {
      v.set(c.inward[0], gr + 3, c.inward[1], "lantern", { hanging: "true", waterlogged: "false" });
    }
    continue;
  }

  // Ribbon glazing in each storey band, pillars between bays.
  for (let s = 0; s < STOREYS; s++) {
    const lo = s === 0 ? gr + 2 : s * STOREY + 1;
    const hi = s === 0 ? gr + 3 : s * STOREY + 3;
    for (let y = lo; y <= hi && y <= TOP_WALL; y++) {
      if (pillar) {
        v.set(x, y, z, "white_concrete");
      } else {
        v.set(x, y, z, "light_blue_stained_glass_pane", paneProps(c.axisX));
      }
    }
    // Warm light behind some panes on odd storeys.
    if (!pillar && s % 2 === 1 && idx % 6 === 1 && c.inward) {
      const [ix, iz] = c.inward;
      if (has(ix, iz) && !classify(ix, iz).wall) {
        v.set(ix, lo + 1, iz, "shroomlight");
      }
    }
  }
}

// Roof plant: a small block with a warm light on top, centred on the footprint.
const cx = Math.floor((minX + maxX) / 2);
const cz = Math.floor((minZ + maxZ) / 2);
for (let x = cx - 2; x <= cx + 2; x++) {
  for (let z = cz - 2; z <= cz + 2; z++) {
    if (!has(x, z) || classify(x, z).wall) continue;
    v.set(x, PARAPET_Y, z, "gray_concrete");
  }
}
for (let x = cx - 1; x <= cx + 1; x++) {
  for (let z = cz - 1; z <= cz + 1; z++) {
    if (!has(x, z) || classify(x, z).wall) continue;
    v.set(x, PARAPET_Y + 1, z, "light_gray_concrete");
  }
}
if (has(cx, cz)) v.set(cx, PARAPET_Y + 2, cz, "glowstone");

v.save(`${DIR}/${ID}.nbt`);

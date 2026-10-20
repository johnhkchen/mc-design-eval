import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1038711369";
const W = 13, H = 23, D = 25;

// Two-storey 1970s-80s Xinyi-fringe commercial block: red brick upper storeys,
// white concrete piers and bands, glazed shopfront arcade, parapet and rooftop tank.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, Math.min(10, Math.max(0, Math.round(gy))));
}
const inFp = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) => !inFp(x + 1, z) || !inFp(x - 1, z) || !inFp(x, z + 1) || !inFp(x, z - 1);

const xs = cells.map((c) => c[0]), zs = cells.map((c) => c[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const z0 = Math.min(...zs), z1 = Math.max(...zs);

const isCorner = (x, z) => (x === x0 || x === x1) && (z === z0 || z === z1);
const isPillar = (x, z) => {
  if (isCorner(x, z)) return true;
  // bays of 3 blocks along the wall; pier on every third block
  if (z === z0 || z === z1) return (x - x0) % 3 === 0;
  return (z - z0) % 3 === 0;
};
const isDoor = (x, z, g) => x === 6 && z === z0 && isPerim(x, z) && g <= 3;

const g = new Voxels([W, H, D]);

const DOOR_PROPS = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false",
});

// Pass 1: walls, floors, roof, foundations
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gy = gAt(x, z);
  const perim = isPerim(x, z);
  const pil = perim && isPillar(x, z);
  const door = isDoor(x, z, gy);

  for (let y = 0; y <= 12; y++) {
    if (y < gy) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (door && (y === gy || y === gy + 1)) {
      g.set(x, y, z, "oak_door", DOOR_PROPS(y === gy ? "lower" : "upper"));
      continue;
    }

    if (!perim) {
      // interior: floor slabs at storey lines and the roof deck
      if (y === 5 || y === 10) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // perimeter structure
    if (y === 5 || y === 10) {
      g.set(x, y, z, "white_concrete");            // string course / cornice
    } else if (y <= 1) {
      g.set(x, y, z, "stone_bricks");              // base course
    } else if (y === 4) {
      g.set(x, y, z, "white_concrete");            // shopfront lintel band
    } else if (y <= 3) {
      g.set(x, y, z, pil ? "white_concrete" : "glass");   // arcade piers and glazing
    } else if (y <= 9) {
      if (pil) g.set(x, y, z, "white_concrete");
      else if (y === 7 || y === 8) g.set(x, y, z, "glass");
      else g.set(x, y, z, "bricks");                       // spandrels
    } else if (y === 11) {
      g.set(x, y, z, "bricks");                            // parapet
    } else if (y === 12) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// Pass 2: warm lights behind selected windows
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!isPerim(x, z) || isPillar(x, z) || isDoor(x, z, gAt(x, z))) continue;
  const ix = x === x0 ? 1 : x === x1 ? -1 : 0;
  const iz = z === z0 ? 1 : z === z1 ? -1 : 0;
  if (ix === 0 && iz === 0) continue;
  const xi = x + ix, zi = z + iz;
  if (!inFp(xi, zi) || isPerim(xi, zi)) continue;
  const gi = gAt(xi, zi);
  const t = ix !== 0 ? z - z0 : x - x0;

  if (t % 6 === 1 && gi <= 3) {
    g.set(xi, gi, zi, "lantern", { hanging: "false", waterlogged: "false" });
  } else if (t % 6 === 4 && gi <= 3) {
    g.set(xi, gi, zi, "shroomlight");
  }
  if (t % 6 === 1 && gi <= 6) {
    g.set(xi, 6, zi, "glowstone");
  }
}

// Pass 3: roof plant, a water tank and a condenser pad
const tankCells = [];
for (let x = 3; x <= 5; x++) for (let z = 17; z <= 19; z++) tankCells.push([x, z]);
if (tankCells.every(([x, z]) => inFp(x, z) && !isPerim(x, z))) {
  for (const [x, z] of tankCells) {
    g.set(x, 11, z, "white_concrete");
    g.set(x, 12, z, "white_concrete");
    g.set(x, 13, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}
for (const [x, z] of [[8, 8], [9, 8], [8, 9], [9, 9]]) {
  if (inFp(x, z) && !isPerim(x, z)) g.set(x, 11, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);

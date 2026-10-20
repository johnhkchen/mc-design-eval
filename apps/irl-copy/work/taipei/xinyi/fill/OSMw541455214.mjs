import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455214";
const W = 17, H = 23, DEPTH = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const has = (x, z) => ground.has(key(x, z));

// Body base row (highest ground under the footprint), roof deck row, floor geometry.
const B = Math.max(...cells.map((c) => c[2]));
const D = Math.max(9, B + 8);          // roof deck row; parapet sits on D+1 (~11 above lowest ground)
const FH = Math.floor((D - B) / 2);    // floor pitch incl. slab
const SL2 = B + FH;                    // upper floor slab row

const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const missing = (x, z) => dirs.filter(([dx, dz]) => !has(x + dx, z + dz));
const isFacade = (x, z) => missing(x, z).length > 0;
const isCorner = (x, z) => {
  const m = missing(x, z);
  return m.some(([dx]) => dx !== 0) && m.some(([, dz]) => dz !== 0);
};

const g = new Voxels([W, H, DEPTH]);

// ---- Entrance: facade cell on the minimum-z edge, nearest the middle of that edge.
const minZ = Math.min(...cells.map((c) => c[1]));
const frontCells = cells.filter(([x, z]) => z === minZ && isFacade(x, z));
const meanX = frontCells.reduce((s, c) => s + c[0], 0) / frontCells.length;
const doorCell = frontCells.reduce((best, c) =>
  Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);
const [doorX, doorZ] = doorCell;
const doorOut = missing(doorX, doorZ)[0] ?? [0, -1];
const FACING = { "0,-1": "north", "0,1": "south", "1,0": "east", "-1,0": "west" };
const doorFacing = FACING[`${doorOut[0]},${doorOut[1]}`];

// ---- Foundation, base course, floors, cornice, parapet.
for (const [x, z, gnd] of cells) {
  const facade = isFacade(x, z);

  // Foundation from y 0 up to this cell's ground, plinth from ground up to the body base.
  for (let y = 0; y < B; y++) {
    g.set(x, y, z, y < gnd ? "stone" : "stone_bricks");
  }

  // Floor slab at base row.
  g.set(x, B, z, facade ? "stone_bricks" : "smooth_stone");

  // Storeys.
  for (let y = B + 1; y <= D - 1; y++) {
    if (y === SL2) {
      g.set(x, y, z, facade ? "smooth_stone" : "smooth_stone"); // floor slab / storey line
      continue;
    }
    if (!facade) continue; // interior air (no interiors)

    const lower = y < SL2;
    const pier = isCorner(x, z) || (x + z) % 3 === 0;
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "glass");
    }
    // Ground-floor shopfront: glass with a concrete head band just under the slab.
    if (lower && y === SL2 - 1 && !pier) g.set(x, y, z, "glass");
  }

  // Roof deck row and facade cornice.
  g.set(x, D, z, facade ? "smooth_quartz" : "light_gray_concrete");

  // Parapet on the facade, roof plant inside.
  if (facade) {
    g.set(x, D + 1, z, "white_concrete");
  }
}

// ---- Warm lights behind some windows (glowstone in the interior cell next to the glass).
for (const [x, z] of cells) {
  if (!isFacade(x, z)) continue;
  for (const floor of [1, 2]) {
    const lower = floor === 1;
    const rowsOk = lower ? (B + 1 <= SL2 - 1) : (SL2 + 1 <= D - 1);
    if (!rowsOk) continue;
    if (((x * 3 + z * 5 + floor) % 4) !== 0) continue;
    const isWindowCell = !isCorner(x, z) && (x + z) % 3 !== 0;
    if (!isWindowCell) continue;
    if (lower && x === doorX && z === doorZ) continue;
    const inward = dirs.find(([dx, dz]) => has(x + dx, z + dz) && !isFacade(x + dx, z + dz));
    if (!inward) continue;
    const ly = lower ? B + 2 : SL2 + 2;
    g.set(x + inward[0], ly, z + inward[1], "glowstone");
  }
}

// ---- Entrance door, hanging lantern on its head.
const doorBlock = (half) => ({
  facing: doorFacing, half, hinge: "left", open: "false", powered: "false", waterlogged: "false",
});
g.set(doorX, B + 1, doorZ, "dark_oak_door", doorBlock("lower"));
g.set(doorX, B + 2, doorZ, "dark_oak_door", doorBlock("upper"));
g.set(doorX, B + 3, doorZ, "lantern", { hanging: "true", waterlogged: "false" });

// ---- Roof plant: AC boxes on interior roof cells, a lightning-rod mast at the centre.
for (const [x, z] of cells) {
  if (isFacade(x, z)) continue;
  if (x % 5 === 2 && z % 4 === 1) g.set(x, D + 1, z, "light_gray_concrete");
}
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
const interiorCells = cells.filter(([x, z]) => !isFacade(x, z));
const mastCell = (interiorCells.length ? interiorCells : cells).reduce((best, c) =>
  Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best);
g.set(mastCell[0], D + 1, mastCell[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
g.set(mastCell[0], D + 2, mastCell[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);

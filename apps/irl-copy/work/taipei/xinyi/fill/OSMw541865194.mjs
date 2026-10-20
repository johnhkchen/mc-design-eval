import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865194.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541865194.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 14, H = 23, D = 30;
const g = new Voxels([W, H, D]);

// Low-rise 1990s commercial block: concrete frame, cream quartz-clad walls,
// stone base, tinted-glass shopfront and storey windows, parapet roof with plant room.
const ROOF = 11;   // parapet top, 11 blocks above lowest ground
const DECK = 10;   // roof deck surface
const FLOOR = 5;   // storey 2 floor line

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inside = (x, z) => G.has(`${x},${z}`);

const put = (x, y, z, id, st) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (st) g.set(x, y, z, id, st);
  else g.set(x, y, z, id);
};

// outward faces of a footprint cell: N = z-1 side, S = z+1, W = x-1, E = x+1
const faces = (x, z) => {
  const f = [];
  if (!inside(x, z - 1)) f.push("N");
  if (!inside(x, z + 1)) f.push("S");
  if (!inside(x - 1, z)) f.push("W");
  if (!inside(x + 1, z)) f.push("E");
  return f;
};

// main entrance: north-facing exposed cell nearest the middle of the frontage
let doorCell = null;
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (f.includes("N") && (!doorCell || Math.abs(x - 6) < Math.abs(doorCell.x - 6))) {
    doorCell = { x, z, face: "N" };
  }
}
if (!doorCell) {
  for (const [x, z] of cells) {
    const f = faces(x, z);
    if (f.includes("S") && (!doorCell || Math.abs(x - 6) < Math.abs(doorCell.x - 6))) {
      doorCell = { x, z, face: "S" };
    }
  }
}

for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));

  // foundation up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const fc = faces(x, z);
  const per = fc.length > 0;

  if (!per) {
    // interior: floor slabs only, no interior fit-out
    if (gr < H) put(x, gr, z, "smooth_stone");
    if (FLOOR >= gr) put(x, FLOOR, z, "smooth_stone");
    put(x, DECK, z, "light_gray_concrete");
    continue;
  }

  const idx = fc[0] === "W" || fc[0] === "E" ? z : x;
  const corner = fc.length > 1;
  const pier = corner || idx % 4 === 0;
  const isDoor = doorCell && doorCell.x === x && doorCell.z === z;

  for (let y = gr; y <= ROOF; y++) {
    if (y === ROOF) {
      put(x, y, z, "smooth_quartz_slab", { type: "bottom" });
      continue;
    }

    // entrance door on the chosen frontage
    if (isDoor && (y === 1 || y === 2)) {
      const facing = doorCell.face === "N" ? "north" : "south";
      put(x, y, z, "dark_oak_door", {
        facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (y === DECK || y === FLOOR || y === 10) {
      put(x, y, z, "quartz_block");          // storey lines / roof band
      continue;
    }
    if (y === gr || y === 1) {
      put(x, y, z, "stone_bricks");          // base course
      continue;
    }
    if (y === 4 || y === 6 || y === 9) {
      put(x, y, z, "smooth_quartz");         // lintels and sills
      continue;
    }

    // window zones: storey 1 at y 2-3, storey 2 at y 7-8
    if (pier) {
      put(x, y, z, "smooth_quartz");
    } else if (y === 7 && (idx + z + x) % 5 === 0) {
      put(x, y, z, "glowstone");             // warm light behind glass
    } else {
      put(x, y, z, "light_blue_stained_glass");
    }
  }
}

// rooftop plant room and a short mast on the deck, kept off the perimeter
for (let x = 4; x <= 9; x++) {
  for (let z = 11; z <= 18; z++) {
    if (!inside(x, z) || faces(x, z).length > 0) continue;
    put(x, DECK + 1, z, "light_gray_concrete");
  }
}
for (let x = 5; x <= 8; x++) {
  for (let z = 12; z <= 17; z++) {
    if (!inside(x, z) || faces(x, z).length > 0) continue;
    if (x === 5 || x === 8 || z === 12 || z === 17) {
      put(x, DECK + 2, z, "smooth_quartz_slab", { type: "bottom" });
    }
  }
}
const mx = 6, mz = 14;
if (inside(mx, mz)) {
  for (let y = DECK + 1; y <= DECK + 4; y++) put(mx, y + 1, mz, "iron_bars");
}

g.save(OUT);

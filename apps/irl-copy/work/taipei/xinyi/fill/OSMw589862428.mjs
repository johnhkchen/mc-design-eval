import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw589862428.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw589862428.nbt";

const W = 22, H = 34, D = 30;
const ROOF = 22;       // roof deck top sits about 22 blocks above lowest ground
const PARAPET = 23;    // parapet course above the deck
const SHOP_TOP = 4;    // ground-floor shopfront band runs up to y=4
const STOREY = 5;      // storey lines every 5 blocks (absolute)

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(ROOF - 2, Math.round(gr))));
}
const inFoot = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Faces: which neighbours lie outside the footprint
const FACES = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const minZ = Math.min(...cells.map(c => c[1]));
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const doorX = Math.round((minX + maxX) / 2);

const glass = "glass";
const pier = "white_concrete";
const base = "polished_andesite";
const storeyLine = "smooth_quartz";

function facadeBlock(x, z, y, gr, face) {
  const along = (face === "north" || face === "south") ? x : z;
  if (y === gr) return { id: base };
  if (y < SHOP_TOP) {
    if (along % 3 === 0) return { id: base };
    return { id: glass };
  }
  if (y % STOREY === 0) return { id: storeyLine };
  if (along % 3 === 0) return { id: pier };
  if (y % STOREY === 2 && (along * 7 + y * 3) % 5 === 0) return { id: "glowstone" };
  return { id: glass };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  let perimeter = false;
  let face = null;
  for (const f of FACES) {
    if (!inFoot(x + f.dx, z + f.dz)) {
      perimeter = true;
      if (!face) face = f;
    }
  }

  // Walls: solid core for interior cells, facade for perimeter cells
  for (let y = gr; y < ROOF; y++) {
    if (!perimeter) {
      g.set(x, y, z, "light_gray_concrete");
    } else {
      const fb = facadeBlock(x, z, y, gr, face.name);
      g.set(x, y, z, fb.id);
    }
  }

  // Main entrance on the minimum-z face, middle of the frontage
  if (perimeter && z === minZ && x === doorX && face && face.name === "north") {
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false", waterlogged: "false" });
    // Lit glass flanking the door
    for (const dx of [-1, 1]) {
      if (inFoot(x + dx, z)) g.set(x + dx, gr + 3, z, "glowstone");
    }
  }

  // Roof deck and parapet
  g.set(x, ROOF, z, "gray_concrete");
  if (perimeter) g.set(x, PARAPET, z, storeyLine);
}

// Roof plant room in the middle of the roof
for (let x = 8; x <= 13; x++) {
  for (let z = 11; z <= 18; z++) {
    if (!inFoot(x, z)) continue;
    for (let y = PARAPET; y <= PARAPET + 2; y++) {
      const edge = x === 8 || x === 13 || z === 11 || z === 18;
      g.set(x, y, z, edge ? "light_gray_concrete" : "stone_bricks");
    }
    if (z === 11 || z === 18) {
      g.set(x, PARAPET + 1, z, glass);
    }
  }
}

// Rooftop mast at the centre of the plant room
const cx = 10, cz = 14;
if (inFoot(cx, cz)) {
  g.set(cx, PARAPET + 3, cz, "lightning_rod");
}

g.save(OUT);

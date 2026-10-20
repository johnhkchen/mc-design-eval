import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119870";

// Two-storey 1980s-style Xinyi commercial block: stone-base shopfront,
// white-tile piers and spandrels, light-blue glazing, cornice and parapet.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map((c) => [c[0], c[1], c[2]]);

const W = 16, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  east: [1, 0],
  west: [-1, 0],
};
const OPP = { north: "south", south: "north", east: "west", west: "east" };

const outward = (x, z) =>
  Object.entries(DIRS)
    .filter(([, [dx, dz]]) => !has(x + dx, z + dz))
    .map(([n]) => n);

const set = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const maxGround = Math.max(...cells.map((c) => c[2]));
if (maxGround + 12 >= H) {
  console.warn(`roof top ${maxGround + 11} exceeds grid height ${H}`);
}

// Entrance: prefer a south-facing exposed cell nearest the footprint's mean x.
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const perimCells = cells.filter(([x, z]) => outward(x, z).length > 0);
let doorCand = perimCells.filter(([x, z]) => outward(x, z).includes("south"));
if (doorCand.length === 0) doorCand = perimCells.filter(([x, z]) => outward(x, z).includes("north"));
if (doorCand.length === 0) doorCand = perimCells;
doorCand.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const [dX, dZ] = doorCand[0] ?? [-1, -1];
const doorFacing = dX >= 0 ? outward(dX, dZ)[0] : null;

for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  const perim = out.length > 0;
  const corner = out.length >= 2;
  const isDoor = x === dX && z === dZ;
  const pier = corner || (x + z) % 3 === 0;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  // Base course / floor slab at ground level.
  set(x, gr, z, perim ? "polished_granite" : "light_gray_concrete");

  // Ground floor (shopfront), gr+1..gr+4.
  if (perim) {
    if (isDoor) {
      const hinge = "left";
      set(x, gr + 1, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge, open: "false", powered: "false" });
      set(x, gr + 2, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge, open: "false", powered: "false" });
      set(x, gr + 3, z, "white_concrete");
    } else {
      for (let y = gr + 1; y <= gr + 3; y++) {
        set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
      set(x, gr + 3, z, "white_concrete");
    }
    set(x, gr + 4, z, "white_concrete"); // fascia
  }

  // Floor slab / belt course between storeys.
  set(x, gr + 5, z, perim ? "white_concrete" : "light_gray_concrete");

  // Upper floor, gr+6..gr+9.
  if (perim && !isDoor) {
    for (let y = gr + 6; y <= gr + 9; y++) {
      if (pier || y === gr + 6 || y === gr + 9) {
        set(x, y, z, "white_concrete");
      } else {
        set(x, y, z, "light_blue_stained_glass");
      }
    }
  }

  // Cornice and roof slab.
  set(x, gr + 10, z, perim ? "smooth_stone" : "light_gray_concrete");

  // Parapet and roof equipment.
  if (perim) {
    set(x, gr + 11, z, "white_concrete");
  } else if (x >= 5 && x <= 10 && z >= 6 && z <= 12 && x % 3 === 0 && z % 3 === 0) {
    set(x, gr + 11, z, "iron_block");
  }
}

// Warm lights: glowstone set just inside some upper-floor windows.
for (const [x, z, gr] of cells) {
  const out = outward(x, z);
  if (out.length !== 1) continue;
  const isDoor = x === dX && z === dZ;
  const pier = (x + z) % 3 === 0;
  if (isDoor || pier) continue;
  if ((x * 3 + z) % 5 !== 0) continue;
  const [dx, dz] = DIRS[OPP[out[0]]];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz) && outward(ix, iz).length === 0) {
    set(ix, gr + 7, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

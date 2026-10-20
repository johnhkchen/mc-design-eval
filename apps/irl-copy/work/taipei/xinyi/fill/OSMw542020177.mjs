import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020177";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint is 15 x 15. Roof sits about 11 blocks above the lowest ground.
// Reads as a 1980s-90s Xinyi mid-rise: stone plinth, cream quartz walls,
// blue-glass strip windows, a storey band, a parapet, and a rooftop penthouse.
const W = 15, H = 23, D = 15;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => ground.has(`${x},${z}`);

const gs = [...ground.values()];
const T = Math.min(...gs);          // lowest ground: base of the storey lines
const ROOF = T + 10;                // top row of the parapet (roof about T+11)
const xs = cells.map((c) => c[0]);
const zs = cells.map((c) => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);

const DIRS = [
  { n: "east", dx: 1, dz: 0 },
  { n: "west", dx: -1, dz: 0 },
  { n: "south", dx: 0, dz: 1 },
  { n: "north", dx: 0, dz: -1 },
];

const doorProps = (half) => ({
  facing: "south", half, hinge: "left", open: "false", powered: "false",
});

// Penthouse footprint (3 x 3 at the centre), only if every cell exists and sits low enough.
const pcx = minX + Math.floor((maxX - minX) / 2);
const pcz = minZ + Math.floor((maxZ - minZ) / 2);
const penthouse = [];
for (let px = pcx - 1; px <= pcx + 1; px++) {
  for (let pz = pcz - 1; pz <= pcz + 1; pz++) {
    if (has(px, pz) && ground.get(`${px},${pz}`) <= T + 9) penthouse.push([px, pz]);
  }
}
const inPenthouse = (x, z) => penthouse.some(([px, pz]) => px === x && pz === z);
const hasPenthouse = penthouse.length === 9;

for (const [cx, cz, cg] of cells) {
  const x = cx, z = cz, gr = Math.round(cg);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const outs = DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const ins = DIRS.filter((d) => has(x + d.dx, z + d.dz));

  if (outs.length) {
    // Perimeter wall cell.
    const o = outs[0];
    const along = o.dx !== 0 ? z - minZ : x - minX;
    const maxA = o.dx !== 0 ? maxZ - minZ : maxX - minX;
    const corner = outs.length > 1;
    const pier = corner || along % 3 === 0 || along === maxA;
    const door = o.n === "south" && along === Math.floor(maxA / 2) && gr + 2 <= T + 4;
    const inn = ins[0];

    for (let y = gr; y <= ROOF; y++) {
      if (y === gr) {
        put(x, y, z, "stone_bricks");                       // base course
      } else if (y === T + 5) {
        put(x, y, z, "smooth_stone");                       // storey band
      } else if (y === ROOF) {
        put(x, y, z, "smooth_quartz");                      // parapet cap row
      } else if (door && (y === gr + 1 || y === gr + 2)) {
        put(x, y, z, "oak_door", doorProps(y === gr + 1 ? "lower" : "upper"));
      } else if (y >= T + 1 && y <= T + 3) {
        // Ground-floor shopfront glass, quartz piers.
        put(x, y, z, pier ? "smooth_quartz" : "glass");
      } else if (y >= T + 6 && y <= T + 8) {
        // Upper storey: blue glass strip windows between piers.
        put(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
        // Warm light in some windows, in the room behind the glass.
        if (!pier && y === T + 7 && along % 6 === 2 && inn) {
          put(x + inn.dx, y, z + inn.dz, "shroomlight");
        }
      } else {
        put(x, y, z, "smooth_quartz");
      }
    }
  } else {
    // Interior cell: floor slab at the storey line, roof deck below the parapet.
    if (T + 5 >= gr) put(x, T + 5, z, "smooth_stone");
    if (T + 9 >= gr) {
      if (!inPenthouse(x, z) || !hasPenthouse) put(x, T + 9, z, "stone");
      // Rooftop AC units on a sparse grid.
      if (!inPenthouse(x, z) && (x + z) % 7 === 0 && gr <= T + 9) {
        put(x, T + 10, z, "iron_block");
      }
    }
  }
}

// Rooftop penthouse: a 3 x 3 box on the roof deck with a stone cap and a lightning rod.
if (hasPenthouse) {
  for (let px = pcx - 1; px <= pcx + 1; px++) {
    for (let pz = pcz - 1; pz <= pcz + 1; pz++) {
      const edge = Math.abs(px - pcx) === 1 || Math.abs(pz - pcz) === 1;
      for (let y = T + 10; y <= T + 12; y++) {
        if (edge) {
          const midRow = y === T + 11;
          const corner = Math.abs(px - pcx) === 1 && Math.abs(pz - pcz) === 1;
          put(px, y, pz, midRow && !corner ? "light_blue_stained_glass" : "smooth_quartz");
        }
      }
      put(px, T + 13, pz, "stone_bricks");
    }
  }
  if (T + 14 < H) put(pcx, T + 14, pcz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);

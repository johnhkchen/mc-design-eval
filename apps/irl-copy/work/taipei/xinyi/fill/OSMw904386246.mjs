import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw904386246.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw904386246.nbt";

const W = 16, H = 23, D = 31;
const ROOF_BASE = 11;   // roof about 11 blocks above lowest ground
const vox = new Voxels([W, H, D]);

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const minRaw = Math.min(...raw.map(r => Math.round(r[2])));

const cells = raw.map(([x, z, g]) => ({ x, z, g: Math.round(g) - minRaw }));
const G = new Map(cells.map(c => [key(c.x, c.z), c]));

const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, block, props);
  else vox.set(x, y, z, block);
};

const exposure = c => DIRS.filter(d => !G.has(key(c.x + d.dx, c.z + d.dz)));

// Entrance: on the north (-z) face if present, at the median x of that face.
const northCells = cells.filter(c => exposure(c).some(d => d.n === "north"))
  .sort((a, b) => a.x - b.x);
let entrance;
if (northCells.length) {
  const ec = northCells[Math.floor(northCells.length / 2)];
  entrance = { x: ec.x, z: ec.z, dir: DIRS.find(d => d.n === "north") };
} else {
  const ec = cells.find(c => exposure(c).length > 0);
  const ed = exposure(ec)[0];
  entrance = { x: ec.x, z: ec.z, dir: ed };
}

// Bounding box for the rooftop plant room
const minX = Math.min(...cells.map(c => c.x)), maxX = Math.max(...cells.map(c => c.x));
const minZ = Math.min(...cells.map(c => c.z)), maxZ = Math.max(...cells.map(c => c.z));

const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const GLASS = "glass";
const BASE = "stone_bricks";

for (const c of cells) {
  const { x, z, g } = c;
  const R = Math.max(ROOF_BASE, g + 10);  // roof slab level for this column
  const exp = exposure(c);
  const perimeter = exp.length > 0;

  // Foundation from y0 up to ground, then base course at ground level
  for (let y = 0; y < g; y++) put(x, y, z, "stone");
  put(x, g, z, perimeter ? BASE : "stone");

  // Storey floor slab at the first-floor line (interior and perimeter)
  put(x, g + 5, z, TRIM);

  // Roof slab
  put(x, R, z, "gray_concrete");

  if (!perimeter) continue;

  // Parapet ring
  put(x, R + 1, z, WALL);

  // Corners: solid piers
  if (exp.length >= 2) {
    for (let y = g + 1; y <= R - 1; y++) put(x, y, z, WALL);
    put(x, R - 1, z, TRIM);
    continue;
  }

  const d = exp[0];
  const u = d.dx !== 0 ? z : x;      // coordinate running along the face
  const isPier = u % 4 === 0;
  const isEntrance = x === entrance.x && z === entrance.z && d.n === entrance.dir.n;

  if (isPier && !isEntrance) {
    for (let y = g + 1; y <= R - 1; y++) put(x, y, z, WALL);
    put(x, R - 1, z, TRIM);
    continue;
  }

  // Ground storey
  if (isEntrance) {
    put(x, g + 1, z, "dark_oak_door", {
      facing: d.n, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, g + 2, z, "dark_oak_door", {
      facing: d.n, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, g + 3, z, GLASS);
    put(x, g + 4, z, "red_terracotta");
  } else {
    put(x, g + 1, z, BASE);
    put(x, g + 2, z, GLASS);
    put(x, g + 3, z, GLASS);
    put(x, g + 4, z, TRIM);
  }

  // Storey line
  put(x, g + 5, z, TRIM);

  // Upper storey: sill, glass, head, cornice
  if (!isEntrance) {
    put(x, g + 6, z, TRIM);
    for (let y = g + 7; y <= R - 3; y++) put(x, y, z, GLASS);
    put(x, R - 2, z, TRIM);
  } else {
    for (let y = g + 6; y <= R - 3; y++) put(x, y, z, WALL);
    put(x, R - 2, z, TRIM);
  }
  put(x, R - 1, z, TRIM);

  // Warm lights behind some glass: shroomlight/glowstone in the air gap
  const inX = x - (d.dx), inZ = z - (d.dz);
  const inner = G.get(key(inX, inZ));
  if (inner && !isEntrance) {
    const yl = g + 8;
    if (yl < R - 2 && yl > inner.g + 5 && (u + g) % 7 === 0) {
      put(inX, yl, inZ, "glowstone");
    }
  }
  // Warm lanterns on the ground floor behind the shopfront
  if (inner && !isEntrance && (u % 5 === 2)) {
    if (g + 1 > inner.g && g + 1 < inner.g + 5) {
      put(inX, g + 1, inZ, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Rooftop plant room, inset from the perimeter, standing on the roof slab
for (const c of cells) {
  const { x, z, g } = c;
  const R = Math.max(ROOF_BASE, g + 10);
  if (x < minX + 4 || x > maxX - 4 || z < minZ + 9 || z > maxZ - 9) continue;
  const top = Math.min(R + 2, H - 1);
  for (let y = R + 1; y <= top; y++) put(x, y, z, TRIM);
  put(x, top, z, BASE);
}

vox.save(OUT);

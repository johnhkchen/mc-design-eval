import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3000081";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 5 Front Street, 1834: three-storey Federal/Greek Revival brick building
// on a brownstone base, stone string courses, stone cornice and parapet,
// shopfront with a central door on the main street face, and a window grid above.
const W = 7, H = 22, D = 15;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(key(x, z), { g: gr, r: rf });
const has = (x, z) => map.has(key(x, z));

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

// Median lidar roof height gives one clean flat roof line for the building.
const roofVals = cells.map((c) => c[3]).sort((a, b) => a - b);
const ROOF = Math.min(roofVals[Math.floor(roofVals.length / 2)], H - 2);

// Outward faces per cell
const faceCount = { north: 0, south: 0, west: 0, east: 0 };
const faceCells = { north: [], south: [], west: [], east: [] };
const cellFaces = new Map(); // key -> list of outward dir names
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  for (const [name, [dx, dz]] of Object.entries(DIRS)) {
    if (!has(x + dx, z + dz)) {
      if (!cellFaces.has(key(x, z))) cellFaces.set(key(x, z), []);
      cellFaces.get(key(x, z)).push(name);
      faceCount[name]++;
      faceCells[name].push([x, z]);
    }
  }
}

// Main street face = longest outward face; door at its middle.
let doorDir = "north";
for (const n of Object.keys(faceCount)) if (faceCount[n] > faceCount[doorDir]) doorDir = n;
const alongT = (name, x, z) => (name === "north" || name === "south" ? x : z);
const doorList = faceCells[doorDir].slice()
  .sort((a, b) => alongT(doorDir, a[0], a[1]) - alongT(doorDir, b[0], b[1]));
const doorCell = doorList.length ? doorList[Math.floor(doorList.length / 2)] : null;
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

// Facade direction per perimeter cell; the door cell is forced onto the door face.
const facadeOf = (x, z) => {
  const list = cellFaces.get(key(x, z));
  if (!list) return undefined;
  if (key(x, z) === doorKey) return doorDir;
  if (list.includes(doorDir)) return doorDir;
  return list[0];
};

const glowSpots = [];

for (const [x, z, gr] of cells) {
  const ground = map.get(key(x, z)).g;
  const T = ROOF - 1; // roof deck / cornice row, same for every cell
  const facade = facadeOf(x, z);
  const perimeter = facade !== undefined;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const t = perimeter ? alongT(facade, x, z) : 0;

  for (let y = ground; y <= T; y++) {
    const rel = y - ground;
    const isFloor = rel % 3 === 0;

    if (!perimeter) {
      if (y === T) g.set(x, y, z, "smooth_stone");
      else if (isFloor) g.set(x, y, z, "spruce_planks");
      continue;
    }

    // Perimeter facade
    if (y === T) { g.set(x, y, z, "stone_bricks"); continue; }
    if (isFloor) { g.set(x, y, z, "stone_bricks"); continue; }

    if (rel === 1 || rel === 2) {
      const isDoorCell = key(x, z) === doorKey;
      if (isDoorCell && ground === gr) {
        g.set(x, y, z, "dark_oak_door", {
          facing: doorDir,
          half: rel === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (t % 3 === 0) {
        g.set(x, y, z, "bricks"); // pier between bays
      } else {
        g.set(x, y, z, "glass");
        if (rel === 1 && y >= ground + 3 && t % 6 === 2) {
          const [dx, dz] = DIRS[facade];
          const ix = x - dx, iz = z - dz;
          if (has(ix, iz)) {
            const ic = map.get(key(ix, iz));
            if (y >= ic.g && y < T) glowSpots.push([ix, y, iz]);
          }
        }
      }
      continue;
    }
    g.set(x, y, z, "bricks");
  }

  // Single parapet slab course on the perimeter
  if (perimeter && T + 1 < H) {
    g.set(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Interior glow last so it is not overwritten
for (const [x, y, z] of glowSpots) g.set(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);

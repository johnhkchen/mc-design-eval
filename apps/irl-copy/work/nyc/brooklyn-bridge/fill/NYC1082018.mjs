import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 29 Peck Slip, South Street Seaport. c.1900 commercial block: red brick walls on a
// granite base, stone-brick piers, lintels and cornice, a parapet cap, shopfront glazing
// at street level, storeys of 2 blocks, and one recessed entrance on the street side.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const W = 6, H = 28, D = 5;

const cells = JSON.parse(readFileSync(`${DIR}/NYC1082018.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
const roofVals = [];
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 6, Math.round(gr)));
  cellMap.set(key(x, z), { x, z, ground, roofRaw: Number(rf) });
  roofVals.push(Number(rf));
}
const has = (x, z) => cellMap.has(key(x, z));

// One flat roof for the whole block: median of the lidar roof heights, lifted above
// the highest foundation so every wall column is continuous.
roofVals.sort((a, b) => a - b);
const medianRoof = roofVals[Math.floor(roofVals.length / 2)];
const maxGround = Math.max(...[...cellMap.values()].map((c) => c.ground));
const ROOF = Math.max(maxGround + 6, Math.min(H - 2, Math.round(medianRoof)));
for (const c of cellMap.values()) c.roof = ROOF;

// Facade directions: a missing neighbour means that side is street-facing.
const DIRS = {
  N: { dx: 0, dz: -1, along: "x", facing: "north" },
  S: { dx: 0, dz: 1, along: "x", facing: "south" },
  W: { dx: -1, dz: 0, along: "z", facing: "west" },
  E: { dx: 1, dz: 0, along: "z", facing: "east" },
};
const exposed = (x, z) =>
  Object.keys(DIRS).filter((k) => !has(x + DIRS[k].dx, z + DIRS[k].dz));
const alongIdx = (x, z, d) => (DIRS[d].along === "x" ? x : z);

// Entrance: prefer the south frontage (street side), else any exposed face, on a
// plain (non-corner) cell near the middle of the run.
let doorKey = null, doorDir = null;
for (const d of ["S", "N", "E", "W"]) {
  const cand = [...cellMap.values()]
    .filter((c) => {
      const ex = exposed(c.x, c.z);
      return ex.includes(d) && ex.length === 1;
    })
    .sort((a, b) => Math.abs(alongIdx(a.x, a.z, d) - 2) - Math.abs(alongIdx(b.x, b.z, d) - 2));
  if (cand.length) {
    doorDir = d;
    doorKey = key(cand[0].x, cand[0].z);
    break;
  }
}

for (const c of cellMap.values()) {
  const { x, z, ground: G, roof: R } = c;

  // Foundation: solid stone from y 0 up to this cell's ground.
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone");

  const ex = exposed(x, z);
  const isExt = ex.length > 0;
  const corner = ex.length >= 2;
  const isDoorCell = key(x, z) === doorKey;

  for (let y = G; y <= R - 1; y++) {
    const rel = y - G;

    // Top course: stone cornice on the walls, roof deck inside.
    if (y === R - 1) {
      g.set(x, y, z, isExt ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // Interior: floor slab per storey, air between, warm lights behind some windows.
    if (!isExt) {
      if (rel % 2 === 0) {
        g.set(x, y, z, rel === 0 ? "smooth_stone" : "spruce_planks");
      }
      continue;
    }

    // Exterior wall.
    const primary = ex[0];
    const idx = alongIdx(x, z, primary);
    const pier = corner || idx % 3 === 0;

    if (isDoorCell && doorDir === primary && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: DIRS[primary].facing,
        hinge: "left",
        open: "false",
        powered: "false",
        half: rel === 1 ? "lower" : "upper",
      });
      continue;
    }
    if (isDoorCell && doorDir === primary && rel === 3) {
      // Lintel over the entrance.
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (rel === 0) {
      g.set(x, y, z, "polished_granite");               // base course
    } else if (rel % 2 === 0) {
      g.set(x, y, z, pier ? "stone_bricks" : "bricks"); // storey line / spandrel
    } else {
      if (pier) {
        g.set(x, y, z, "bricks");                       // brick pier at window rows
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane"); // glazing
        // Warm light in the room behind a few windows (interior cell must exist).
        const inwardX = x - DIRS[primary].dx;
        const inwardZ = z - DIRS[primary].dz;
        if (has(inwardX, inwardZ) && exposed(inwardX, inwardZ).length === 0 && (x + z + rel) % 4 === 0) {
          g.set(inwardX, y, inwardZ, "glowstone");
        }
      }
    }
  }

  // Parapet cap on the street walls, sitting on the cornice course.
  if (isExt) {
    g.set(x, R, z, pier(x, z, ex) ? "stone_brick_wall" : "stone_brick_slab");
  }
}

function pier(x, z, ex) {
  const primary = ex[0];
  return ex.length >= 2 || alongIdx(x, z, primary) % 3 === 0;
}

g.save(`${DIR}/NYC1082018.nbt`);

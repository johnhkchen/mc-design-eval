import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3000007.cells.json`, "utf8"));

const W = 22, H = 18, D = 25;
const g = new Voxels([W, H, D]);

const K = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(c => K(c[0], c[1])));
const has = (x, z) => inside.has(K(x, z));

const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// One flat roof for the whole building: median lidar roof, rounded to even blocks
const roofVals = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofVals[Math.floor(roofVals.length / 2)];
const FLAT_TOP = Math.min(H - 1, 2 * Math.round(medianRoof / 2));

const info = new Map();
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const top = Math.min(H - 1, Math.max(gr + 4, FLAT_TOP));
  info.set(K(x, z), { x, z, gr, top });
}

// Pass 1: foundation, walls, floor slabs, roof, parapet, windows, lanterns
for (const [x, z] of [...info.keys()].map(k => k.split(",").map(Number))) {
  const { gr, top } = info.get(K(x, z));

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const exposed = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  const perim = exposed.length > 0;
  const corner = exposed.length >= 2;

  for (let y = gr; y <= top - 1; y++) {
    const off = y - gr;
    const isRoofSlab = y === top - 1;

    if (!perim) {
      if (off % 2 === 0 || isRoofSlab) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (off === 0) g.set(x, y, z, "stone_bricks");
    else if (off % 2 === 0 || isRoofSlab) g.set(x, y, z, "smooth_stone");
    else g.set(x, y, z, "bricks");
  }

  if (perim) g.set(x, top, z, "stone_bricks");

  // Windows on every non-corner exposed face, spaced in bays of three
  if (perim && !corner) {
    const [dx, dz] = exposed[0];
    const along = dx !== 0 ? z : x;
    if (along % 3 === 1) {
      const conn = dx !== 0
        ? { north: "true", south: "true", east: "false", west: "false" }
        : { north: "false", south: "false", east: "true", west: "true" };
      for (let y = gr + 1; y < top - 1; y += 2) {
        g.set(x, y, z, "glass_pane", { ...conn, waterlogged: "false" });
        const ix = x - dx, iz = z - dz;
        if (has(ix, iz) && (x + z + y) % 4 === 0) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Pass 2: rooftop mechanical penthouse, on the flat roof
for (const { x, z, top } of info.values()) {
  if (top + 1 >= H) continue;
  if (x >= 7 && x <= 10 && z >= 9 && z <= 13) {
    const exposedAny = DIRS.some(([dx, dz]) => !has(x + dx, z + dz));
    if (!exposedAny) {
      g.set(x, top, z, "light_gray_concrete");
      g.set(x, top + 1, z, "light_gray_concrete");
    }
  }
}

// Pass 3: entrance on the north (Plymouth Street) face, near centre, with stone surround
let door = null;
for (const { x, z, gr, top } of info.values()) {
  if (has(x, z - 1)) continue;
  if (has(x - 1, z) && has(x + 1, z)) { /* straight run */ }
  else continue;
  if (top < gr + 3) continue;
  const score = Math.abs(x - W / 2);
  if (!door || score < door.score) door = { x, z, gr, score };
}
if (door) {
  const { x, z, gr } = door;
  g.set(x, gr, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 1, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Stone lintel over the door
  g.set(x, gr + 2, z, "stone_bricks");
  if (has(x, z + 1)) g.set(x, gr + 2, z + 1, "lantern", { hanging: "true" });
}

g.save(`${DIR}/NYC3000007.nbt`);

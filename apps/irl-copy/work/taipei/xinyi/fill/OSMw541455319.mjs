import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block with shopfront, tiled upper floor,
// flat parapet roof and rooftop cooling units. Built per cell on its own ground.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455319";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, D = 12;
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, g] of cells) ground.set(key(x, z), g);
const maxG = Math.max(...cells.map((c) => c[2]));
const H = Math.max(23, maxG + 13); // roof parapet at +11, rooftop units at +12
const g3 = new Voxels([W, H, D]);

const DIRS = {
  north: { dx: 0, dz: -1 },
  south: { dx: 0, dz: 1 },
  west: { dx: -1, dz: 0 },
  east: { dx: 1, dz: 0 },
};
const ORDER = ["south", "north", "east", "west"];

const exposed = (x, z, d) => !ground.has(key(x + DIRS[d].dx, z + DIRS[d].dz));
const exposedDirs = (x, z) => ORDER.filter((d) => exposed(x, z, d));
// index along the face, used for mullion rhythm
const faceIndex = (x, z, d) => (d === "north" || d === "south" ? x : z);

// Entrance: middle of the street-facing (south) frontage, else any exposed face
let ent = null;
const southFaces = cells
  .filter(([x, z]) => exposed(x, z, "south"))
  .sort((a, b) => a[0] - b[0]);
if (southFaces.length) {
  const m = southFaces[Math.floor(southFaces.length / 2)];
  ent = { x: m[0], z: m[1], d: "south" };
} else {
  for (const [x, z] of cells) {
    const d = exposedDirs(x, z)[0];
    if (d) { ent = { x, z, d }; break; }
  }
}
const isEntrance = (x, z, d) => ent && ent.x === x && ent.z === z && ent.d === d;

// Behind each window glass in the wall: one air block, some with a warm lantern
const WIN_ROWS = [1, 2, 3, 6, 7, 8];
const air = new Set();
const lamps = new Set();
for (const [x, z] of cells) {
  for (const d of ORDER) {
    if (!exposed(x, z, d)) continue;
    const i = faceIndex(x, z, d);
    const ix = x - DIRS[d].dx, iz = z - DIRS[d].dz;
    if (!ground.has(key(ix, iz))) continue;
    for (const r of WIN_ROWS) {
      if (isEntrance(x, z, d) && r <= 2) continue;
      const k = `${ix},${iz},${r}`;
      air.add(k);
      if ((r === 2 && i % 4 === 1) || (r === 7 && i % 3 === 2)) lamps.add(k);
    }
  }
}

const paneProps = (d) =>
  d === "north" || d === "south"
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const GLASS = "light_blue_stained_glass_pane";
const MULLION = "gray_concrete";
const WALL = "smooth_quartz";
const BASE = "polished_andesite";
const FOUNDATION = "stone_bricks";

for (const [x, z, g] of cells) {
  // foundation from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) g3.set(x, y, z, FOUNDATION);

  const exDirs = exposedDirs(x, z);
  const exposedHere = exDirs.length > 0;
  const d = exDirs[0]; // facing used for pane/door orientation at corners

  for (let r = 0; r <= 11; r++) {
    const k = `${x},${z},${r}`;
    const y = g + r;

    if (air.has(k)) {
      if (lamps.has(k)) g3.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue; // air gap behind glass
    }

    // base course
    if (r === 0) {
      g3.set(x, y, z, BASE);
      continue;
    }

    // ground floor: shopfront
    if (r >= 1 && r <= 3) {
      if (exposedHere) {
        const i = faceIndex(x, z, d);
        if (isEntrance(x, z, d) && r <= 2) {
          const half = r === 1 ? "lower" : "upper";
          g3.set(x, y, z, "oak_door", { facing: d, half, hinge: "left", open: "false", powered: "false" });
        } else if (i % 3 === 0) {
          g3.set(x, y, z, MULLION);
        } else {
          g3.set(x, y, z, GLASS, paneProps(d));
        }
      } else {
        g3.set(x, y, z, WALL);
      }
      continue;
    }

    // fascia / storey line / upper windows / cornice
    if (r === 4) {
      g3.set(x, y, z, exposedHere ? "black_concrete" : WALL);
      continue;
    }
    if (r === 5) {
      g3.set(x, y, z, WALL);
      continue;
    }
    if (r >= 6 && r <= 8) {
      if (exposedHere) {
        const i = faceIndex(x, z, d);
        if (i % 3 === 0) g3.set(x, y, z, MULLION);
        else g3.set(x, y, z, GLASS, paneProps(d));
      } else {
        g3.set(x, y, z, WALL);
      }
      continue;
    }
    if (r === 9) {
      g3.set(x, y, z, WALL); // cornice course
      continue;
    }

    // roof: parapet on the edge, membrane inside
    if (r === 10) {
      g3.set(x, y, z, exposedHere ? WALL : "light_gray_concrete");
      continue;
    }

    // rooftop cooling units on the interior roof
    if (r === 11 && !exposedHere && (x + z) % 4 === 0) {
      g3.set(x, y, z, "iron_block");
    }
  }
}

g3.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001558";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 10, H = 24, D = 5;
const g = new Voxels([W, H, D]);

// Lookup of per-cell ground and roof heights
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 3, Math.round(gr)));
  const roof = Math.max(ground + 2, Math.min(H - 1, Math.round(rf)));
  cm.set(`${x},${z}`, { ground, roof });
}

// Brownstone-era Italianate brick townhouse: brick walls, brownstone sills
// and string courses, stone-brick base, dark cornice.
// Street face is z=0; entrance sits at x=4 on that face.
const perimeter = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const corner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
const DOOR_X = 4;

function windowCell(x, z) {
  if (corner(x, z) || !perimeter(x, z)) return false;
  if (z === 0 || z === D - 1) return x % 2 === 1;   // street and rear faces
  return z % 2 === 1;                               // side faces
}

function glassProps(z) {
  // Pane connects along the wall it sits in
  if (z === 0 || z === D - 1) {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const isDoor = (x, z) => z === 0 && x === DOOR_X;

for (const [key, { ground, roof }] of cm) {
  const [x, z] = key.split(",").map(Number);
  const per = perimeter(x, z);
  const top = roof - 1;

  // Brownstone foundation from y 0 up to ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y <= top; y++) {
    const rel = y - ground;
    const sillRow = rel % 2 === 0;

    if (y === top) {
      // Dark cornice band over the walls, flat roof inside
      if (per) g.set(x, y, z, "dark_oak_planks");
      else g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (per) {
      if (isDoor(x, z) && rel <= 1) {
        const half = rel === 0 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false"
        });
        continue;
      }
      if (windowCell(x, z)) {
        if (sillRow) g.set(x, y, z, "brown_terracotta");   // brownstone sill band
        else g.set(x, y, z, "glass_pane", glassProps(z));  // window glass
      } else {
        // Brick wall with a brownstone string course at each storey line
        g.set(x, y, z, sillRow && rel > 0 ? "stone_bricks" : "bricks");
      }
    } else {
      // Interior: floor slab per storey, air between
      if (sillRow) g.set(x, y, z, "oak_planks");
    }
  }
}

// Entrance: brownstone step just inside the door and a lantern over it
{
  const key = `${DOOR_X},0`;
  if (cm.has(key)) {
    const { ground } = cm.get(key);
    // Stair step inside the footprint, in front of the door
    g.set(DOOR_X, ground, 1, "stone_brick_stairs", {
      facing: "north", half: "bottom", shape: "straight", waterlogged: "false"
    });
    // Lantern above the door, on the sill band
    g.set(DOOR_X, ground + 2, 0, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Warm lights behind a few front windows only: one column, every other storey
for (const [key, { ground, roof }] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (z !== 1 || x !== 3) continue;
  for (let y = ground + 3; y < roof - 1; y += 4) {
    g.set(x, y, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

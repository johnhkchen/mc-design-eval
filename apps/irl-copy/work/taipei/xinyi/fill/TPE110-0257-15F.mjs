import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE110-0257-15F";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 28 x 86 x 59: 15 storeys of 5 blocks (roof slab top at y=74), parapet, plant penthouse, rod.
const W = 28, H = 86, D = 59;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const STOREY = 5;
const ROOF_Y = 75;          // first course above the top storey slab
const SETBACK_Y = 50;       // upper tier (storeys 10-14) steps back from the north strip
const SETBACK_Z = 4;        // strip z < 4 is removed above SETBACK_Y
const PH = { x0: 7, x1: 20, z0: 16, z1: 42 }; // plant penthouse footprint

const inFoot = (x, z) => ground.has(`${x},${z}`);
const inTier = (x, z, y) => {
  if (!inFoot(x, z)) return false;
  if (y >= SETBACK_Y && z < SETBACK_Z) return false;
  return true;
};
const isPerim = (x, z, y) =>
  inTier(x, z, y) &&
  (!inTier(x + 1, z, y) || !inTier(x - 1, z, y) || !inTier(x, z + 1, y) || !inTier(x, z - 1, y));
// corner: perimeter cell that is open in both an x and a z direction
const isCorner = (x, z, y) =>
  (!inTier(x + 1, z, y) || !inTier(x - 1, z, y)) && (!inTier(x, z + 1, y) || !inTier(x, z - 1, y));
const inPH = (x, z) =>
  x >= PH.x0 && x <= PH.x1 && z >= PH.z0 && z <= PH.z1 && inTier(x, z, ROOF_Y);
const isPHWall = (x, z) => x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
const hsh = (x, y, z) => (x * 7919 + y * 104729 + z * 1299709) % 97;
const nearPerim = (x, z, y) =>
  isPerim(x + 1, z, y) || isPerim(x - 1, z, y) || isPerim(x, z + 1, y) || isPerim(x, z - 1, y);

// Entrance: north (min z) side, median x among the cells on that edge.
const minZ = Math.min(...cells.map(([, z]) => z));
const edgeXs = cells.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
const DOOR_X = edgeXs[Math.floor(edgeXs.length / 2)];
const DOOR_Z = minZ;
const DOOR_G = ground.get(`${DOOR_X},${DOOR_Z}`);

for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFoot(x, z)) continue;
    const gr = ground.get(`${x},${z}`);

    for (let y = 0; y <= 79; y++) {
      // Foundation: solid from y 0 up to this cell's ground.
      if (y < gr) {
        g.set(x, y, z, "stone_bricks");
        continue;
      }
      if (!inTier(x, z, y)) continue;

      if (y >= ROOF_Y) {
        if (inPH(x, z)) {
          if (y === ROOF_Y || y === 79) {
            g.set(x, y, z, "quartz_block");
          } else if (isPHWall(x, z)) {
            g.set(x, y, z, "light_gray_concrete");
          }
          continue;
        }
        if (y <= 76 && isPerim(x, z, y)) g.set(x, y, z, "white_concrete"); // parapet
        continue;
      }

      const k = Math.floor(y / STOREY);
      const r = y % STOREY;
      const perim = isPerim(x, z, y);

      if (r === 4) {
        // full floor slab / ceiling of each storey: bright quartz storey line
        g.set(x, y, z, "quartz_block");
      } else if (r === 0) {
        if (perim) g.set(x, y, z, k === 0 ? "polished_granite" : "white_concrete");
      } else {
        // r = 1..3: glazing band with frames on the perimeter, air inside
        if (perim) {
          const fin = isCorner(x, z, y) || x % 4 === 0 || z % 4 === 0;
          if (fin) {
            g.set(x, y, z, "white_concrete");
          } else {
            // alternate bays of two glass tones for vertical rhythm
            const bay = (Math.floor(x / 4) + Math.floor(z / 4)) % 2 === 0;
            g.set(x, y, z, bay ? "cyan_stained_glass" : "light_blue_stained_glass");
          }
        } else if (r === 2 && nearPerim(x, z, y) && hsh(x, y, z) % 5 === 0) {
          g.set(x, y, z, "glowstone"); // warm light behind the glass
        }
      }
    }
  }
}

// Entrance: doors, a wider canopy course and lanterns either side of the door.
const gd = DOOR_G;
for (let dx = -2; dx <= 2; dx++) {
  const x = DOOR_X + dx;
  if (isPerim(x, DOOR_Z, gd + 3)) g.set(x, gd + 3, DOOR_Z, "smooth_quartz"); // canopy course
}
g.set(DOOR_X, gd + 1, DOOR_Z, "birch_door", {
  facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
});
g.set(DOOR_X, gd + 2, DOOR_Z, "birch_door", {
  facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
});
for (const dx of [-1, 1]) {
  const x = DOOR_X + dx;
  if (inTier(x, DOOR_Z + 1, gd + 3)) {
    g.set(x, gd + 3, DOOR_Z + 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}
if (inTier(DOOR_X, DOOR_Z + 1, gd + 3)) {
  g.set(DOOR_X, gd + 3, DOOR_Z + 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Lightning rod on the penthouse roof.
const rodX = Math.round((PH.x0 + PH.x1) / 2);
const rodZ = Math.round((PH.z0 + PH.z1) / 2);
for (let y = 80; y <= 84; y++) {
  g.set(rodX, y, rodZ, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

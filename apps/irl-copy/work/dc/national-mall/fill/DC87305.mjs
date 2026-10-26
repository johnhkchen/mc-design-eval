import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC87305";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Three-storey Federal-era brick commercial block: stone base, brick shell,
// stone string courses, one flat stone parapet roof, central entrance on the front (z=0).
const W = 25, H = 21, D = 10;
const g = new Voxels([W, H, D]);

const foot = new Set(cells.map(c => `${c[0]},${c[1]}`));
const has = (x, z) => foot.has(`${x},${z}`);

// Smooth the lidar roof into one flat tier for the whole block (no stray blocks).
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
const grounds = cells.map(c => Math.round(c[2]));
const maxGround = Math.max(...grounds);
let R = roofs[Math.floor(roofs.length / 2)];          // median roof height
R = Math.max(R, maxGround + 9);                        // three storeys of 3 blocks above the highest ground
R = Math.min(R, H - 1);
const top = R - 1;                                     // top roof layer (y index)

function faceOf(x, z) {
  if (!has(x, z - 1)) return { name: "front", dx: 0, dz: 1 };
  if (!has(x, z + 1)) return { name: "back", dx: 0, dz: -1 };
  if (!has(x - 1, z)) return { name: "west", dx: 1, dz: 0 };
  if (!has(x + 1, z)) return { name: "east", dx: -1, dz: 0 };
  return null;
}

for (const [x, z, ground0] of cells) {
  const ground = Math.round(ground0);
  const face = faceOf(x, z);
  const perimeter = face !== null;

  // Foundation fills solid up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Ground level: base course on shell, floor slab inside.
  g.set(x, ground, z, perimeter ? "stone_bricks" : "smooth_stone");

  // Interior floor slabs at storey lines and the roof deck.
  if (!perimeter) {
    for (const fy of [ground + 3, ground + 6]) {
      if (fy < top) g.set(x, fy, z, "smooth_stone");
    }
    g.set(x, top, z, "smooth_stone");
    continue;
  }

  // Shell walls, ground+1 up to the parapet.
  const bands = [[ground + 1, ground + 2], [ground + 4, ground + 5], [ground + 7, ground + 8]];
  const inBand = y => bands.some(([a, b]) => y >= a && y <= b && y < top);

  let isWindowCell = false;
  let isDoorCell = false;
  if (face.name === "front" || face.name === "back") {
    isWindowCell = x % 3 !== 0 && x !== 0 && x !== W - 1;
    isDoorCell = face.name === "front" && x === 12;
  } else {
    isWindowCell = z % 3 !== 0 && z !== 0 && z !== D - 1;
  }

  for (let y = ground + 1; y < top; y++) {
    if (y === ground + 3 || y === ground + 6) {
      g.set(x, y, z, "stone_bricks");                  // string courses
      continue;
    }
    if (isDoorCell && (y === ground + 1 || y === ground + 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: y === ground + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isWindowCell && inBand(y)) {
      g.set(x, y, z, "glass_pane");
      if (face.name === "front" || face.name === "back") {
        if (x % 6 === 2 && y === ground + 5) {
          g.set(x, y, z + face.dz, "glowstone");       // warm light behind glass
        }
      }
      continue;
    }
    g.set(x, y, z, "bricks");
  }

  // Parapet cap on the shell, flush with the roof deck.
  g.set(x, top, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

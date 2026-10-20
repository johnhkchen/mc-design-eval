import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1990s Xinyi commercial block: stone plinth, white spandrels,
// light-grey piers, glazed bays, a three-bay glass entrance on the south face
// with a lantern behind it, a parapet, and a stepped roof penthouse.
// Two storeys of 5 blocks; roof about 11 above lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw365099781";
const W = 46, H = 23, D = 43;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2;
const cz = (minZ + maxZ) / 2;

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const n = !has(x, z - 1); // north face (z min)
  const s = !has(x, z + 1); // south face (z max)
  const w = !has(x - 1, z); // west face
  const e = !has(x + 1, z); // east face
  const edge = n || s || w || e;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  // Plinth / ground-floor slab.
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  // Storey lines: spandrel band at gr+5 and roof slab / cornice at gr+10.
  put(x, gr + 5, z, edge ? "white_concrete" : "smooth_stone");
  put(x, gr + 10, z, edge ? "white_concrete" : "light_gray_concrete");

  // Parapet on the perimeter, roof surface inside.
  if (edge) put(x, gr + 11, z, "white_concrete");

  // Walls and openings for the two storeys.
  const storeys = [gr + 1, gr + 6];
  storeys.forEach((b, si) => {
    for (let y = b; y <= b + 3; y++) {
      if (!edge) continue;
      const alongNS = n || s;
      const a = alongNS ? x : z;
      const isCorner = (n || s) && (e || w);
      const isPier = isCorner || a % 3 === 0;

      // Entrance on the south face: three centred bays, ground storey only.
      if (si === 0 && s && Math.abs(x - cx) <= 1.5) {
        if (y <= b + 2) {
          put(x, y, z, "glass");
        } else {
          put(x, y, z, "stone_bricks"); // lintel
        }
        continue;
      }

      // Top row of each storey is a spandrel wall.
      if (y === b + 3) {
        put(x, y, z, "white_concrete");
        continue;
      }

      if (isPier) {
        put(x, y, z, "quartz_block");
        continue;
      }

      // Glazed bay: pane, oriented along its wall face.
      const props = alongNS ? PANE_NS : PANE_EW;
      put(x, y, z, "light_blue_stained_glass_pane", props);
    }
  });

  // Lantern hanging just inside the entrance lintel (attached to the floor slab above).
  if (!edge && s === false && has(x, z + 1) && Math.abs(x - cx) <= 0.5 && z === maxZ - 1) {
    put(x, gr + 4, z, "lantern", { hanging: "true", waterlogged: "false" });
  }

  // Warm lamps standing inside, on the storey floors, behind some bays.
  if (!edge) {
    if ((x + 2 * z) % 9 === 0) put(x, gr + 1, z, "glowstone");
    if ((2 * x + z) % 11 === 0) put(x, gr + 6, z, "shroomlight");
  }

  // Roof penthouse: a stepped plant box near the centre of the roof.
  if (!edge) {
    const dx = Math.abs(x - cx);
    const dz = Math.abs(z - cz);
    if (dx <= 5 && dz <= 4) {
      // Base block of the plant room.
      put(x, gr + 11, z, "light_gray_concrete");
      // Louvred upper body on the inner footprint.
      if (dx <= 4 && dz <= 3) {
        put(x, gr + 12, z, dx === 4 || dz === 3 ? "white_concrete" : "iron_bars");
      }
      // Stepped top with a small stair core.
      if (dx <= 2 && dz <= 2) {
        put(x, gr + 13, z, "light_gray_concrete");
      }
      if (dx <= 1 && dz <= 1) {
        put(x, gr + 14, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

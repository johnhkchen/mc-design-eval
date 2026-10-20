import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538402983";
const W = 20, H = 23, D = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inside = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const faces = (x, z) => ({
  n: !inside(x, z - 1),
  s: !inside(x, z + 1),
  w: !inside(x - 1, z),
  e: !inside(x + 1, z),
});

// Two-storey cream-tile commercial block, 1990s Xinyi style:
// stone base course, cream wall with white mullions and spandrels,
// blue-green glass bands, quartz storey lines, parapet and rooftop plant.
for (const [x, z, gr0] of cells) {
  const gr = Math.min(Math.max(0, gr0), 11); // roof top = gr + 11 <= H - 1
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-floor deck / base course
  put(x, gr, z, edge ? "stone_bricks" : "smooth_quartz");

  // Storey line between floors
  put(x, gr + 5, z, "smooth_quartz");

  // Roof deck and parapet
  put(x, gr + 10, z, "light_gray_concrete");
  if (edge) put(x, gr + 11, z, "white_concrete");

  if (!edge) {
    // Interior: air between slabs; warm light behind glass on upper floor
    if (x % 4 === 2 && z % 4 === 2) put(x, gr + 7, z, "shroomlight");
    // Rooftop plant on a regular grid
    if (x % 7 === 3 && z % 7 === 3) put(x, gr + 11, z, "light_gray_concrete");
    continue;
  }

  // Exterior walls
  const alongX = f.n || f.s; // face runs east-west, so position along = x
  const along = alongX ? x : z;

  for (const y of [gr + 1, gr + 2, gr + 3, gr + 4, gr + 6, gr + 7, gr + 8, gr + 9]) {
    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }
    const ground = y <= gr + 4;
    if (ground) {
      if (y === gr + 4) {
        put(x, y, z, "white_concrete"); // shopfront transom
      } else if (along % 3 === 0) {
        put(x, y, z, "white_concrete"); // mullion
      } else {
        put(x, y, z, "cyan_stained_glass");
      }
    } else {
      if (y === gr + 6 || y === gr + 9) {
        put(x, y, z, "white_concrete"); // spandrel
      } else if (along % 3 === 0) {
        put(x, y, z, "white_concrete"); // mullion
      } else {
        put(x, y, z, "cyan_stained_glass");
      }
    }
  }
}

// Main entrance on the north face, nearest the centre line
let best = null;
for (const [x, z, gr0] of cells) {
  const f = faces(x, z);
  if (!f.n) continue;
  if (!best || Math.abs(x - W / 2) < Math.abs(best.x - W / 2)) {
    best = { x, z, gr: Math.min(Math.max(0, gr0), 11) };
  }
}
if (best) {
  const { x, z, gr } = best;
  put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lantern-lit transom above the door
  put(x, gr + 3, z, "glass_pane");
}

g.save(`${DIR}/${ID}.nbt`);

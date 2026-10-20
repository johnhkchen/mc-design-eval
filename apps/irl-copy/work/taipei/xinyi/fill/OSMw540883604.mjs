import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883604";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 16;
const ROOF = 11;                       // roof/parapet top, blocks above lowest ground
const g = new Voxels([W, H, D]);

const L = Math.min(...cells.map(c => c[2]));
const key = (x, z) => `${x},${z}`;
const cellSet = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => cellSet.has(key(x, z));

const DIRS = [
  { name: "N", dx: 0, dz: -1 },
  { name: "S", dx: 0, dz: 1 },
  { name: "E", dx: 1, dz: 0 },
  { name: "W", dx: -1, dz: 0 },
];

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade material for an exposed face d at cell (x,z), storey-relative level f (y - ground).
// f 1 plinth | f 2-4 shopfront | f 5 lintel band | f 6 sill band | f 7-9 upper windows
// f 10 cornice | f 11 parapet
function faceSpec(d, x, z, f) {
  const idx = d.dz !== 0 ? x : z;               // position along the face
  const isDoorCol = d.name === "N" && idx === 3;
  if (f === 1) return { id: "polished_andesite" };
  if (f === 2 || f === 3) {
    if (isDoorCol) {
      return {
        id: "iron_door",
        props: { facing: "north", half: f === 2 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" },
        door: true,
      };
    }
  }
  if (f >= 2 && f <= 4) {
    if (isDoorCol && f === 4) return { id: "white_concrete" };   // transom over door
    if (idx % 3 === 0) return { id: "white_concrete" };          // mullion / pillar
    return { id: "glass" };
  }
  if (f === 5 || f === 6) return { id: "light_gray_concrete" };
  if (f >= 7 && f <= 9) {
    if (idx % 3 === 0) return { id: "white_concrete" };
    return { id: "glass" };
  }
  if (f === 10) return { id: "smooth_quartz" };
  return { id: "white_concrete" };              // f 11 parapet
}

// Interior: air gaps behind glass, floor/ceiling slabs per storey, roof plant, warm lights.
function interior(x, y, z, f) {
  if (f === 1 || f === 5 || f === 10) return put(x, y, z, "smooth_stone");
  if (f === 11) {
    if ((x + z) % 6 === 2) put(x, y, z, "iron_block");
    return;
  }
  if (f === 4 && x === 3 && z === 1) return put(x, y, z, "lantern", { hanging: "true" });
  if ((f === 3 || f === 8) && (2 * x + z) % 5 === 0) return put(x, y, z, "shroomlight");
}

for (const [x, z, gr] of cells) {
  const rel = gr - L;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= rel; y++) put(x, y, z, "stone_bricks");

  const exposed = DIRS.filter(d => !has(x + d.dx, z + d.dz));

  for (let y = rel + 1; y <= ROOF && y < H; y++) {
    const f = y - rel;
    if (exposed.length) {
      const specs = exposed.map(d => faceSpec(d, x, z, f));
      const pick = specs.find(s => s.door) ?? specs[0];
      put(x, y, z, pick.id, pick.props);
    } else {
      interior(x, y, z, f);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Two-storey mid-rise commercial block, Taipei late-20th-century style:
// stone-bricks plinth, white-concrete piers and frames, quartz belt courses,
// glass shopfront at street level, light-blue glass bands above, parapet roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541864110";
const W = 17, H = 23, D = 25;
const ROOF_TOP = 11;      // parapet top (lidar: about 11 above lowest ground)
const BELT_LOW = 5;       // storey line between ground and upper storey
const CORNICE = 10;       // cornice / interior roof deck

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(8, Math.round(gr))));
}
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const NAME = { "0,1": "south", "0,-1": "north", "1,0": "east", "-1,0": "west" };
const outward = (x, z) => {
  const out = [];
  if (!has(x, z + 1)) out.push([0, 1]);
  if (!has(x, z - 1)) out.push([0, -1]);
  if (!has(x + 1, z)) out.push([1, 0]);
  if (!has(x - 1, z)) out.push([-1, 0]);
  return out;
};

// Pick the street-front door: the south-facing wall cell nearest the middle.
let doorKey = null;
{
  const southCells = [];
  for (const [k] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (!has(x, z + 1)) southCells.push(x);
  }
  if (southCells.length) {
    const mean = southCells.reduce((a, b) => a + b, 0) / southCells.length;
    const best = southCells.reduce((a, b) => (Math.abs(b - mean) < Math.abs(a - mean) ? b : a));
    const k = `${best},${Math.max(...[...ground.keys()].map(s => +s.split(",")[1]))}`;
    if (ground.has(k)) doorKey = k;
  }
}

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground, base course on top.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "stone_bricks");

  const outs = outward(x, z);

  // Interior cell: floor slab at the storey line and a roof deck; air between.
  if (outs.length === 0) {
    if (BELT_LOW > gr) put(x, BELT_LOW, z, "smooth_stone");
    if (CORNICE > gr) put(x, CORNICE, z, "smooth_stone");
    // Roof plant on a few interior cells.
    if (((x * 3 + z * 5) % 11 === 0) && ROOF_TOP > CORNICE && ROOF_TOP > gr) {
      put(x, ROOF_TOP - 1, z, "iron_block");
    }
    continue;
  }

  // Facade cell.
  const o = outs[0];
  const corner = outs.length > 1;
  const i = o[0] !== 0 ? z : x;      // position along the facade
  const pier = corner || i % 3 === 0;
  const isDoor = k === doorKey;
  const facing = NAME[`${o[0]},${o[1]}`];
  const litBay = !corner && (i % 6 === 4);

  for (let y = gr + 1; y <= ROOF_TOP; y++) {
    // Storey belt courses.
    if (y === BELT_LOW) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === CORNICE) { put(x, y, z, "smooth_quartz"); continue; }
    if (y === ROOF_TOP) { put(x, y, z, "white_concrete"); continue; }

    // Ground storey (between base and storey line).
    if (y < BELT_LOW) {
      if (isDoor && y <= gr + 2 && gr + 2 <= BELT_LOW - 1) {
        if (y === gr + 1) {
          put(x, y, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
        } else {
          put(x, y, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
        }
        continue;
      }
      if (isDoor && y === gr + 3 && gr + 3 < BELT_LOW) {
        // Hanging lantern over the door, supported by the wall above.
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
      continue;
    }

    // Upper storey: frames at sill and head, glass between, piers at bays.
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    if (y === 6 || y === 9) { put(x, y, z, "white_concrete"); continue; }
    if (litBay) { put(x, y, z, "shroomlight"); continue; }
    put(x, y, z, "light_blue_stained_glass");
  }
}

g.save(`${DIR}/${ID}.nbt`);

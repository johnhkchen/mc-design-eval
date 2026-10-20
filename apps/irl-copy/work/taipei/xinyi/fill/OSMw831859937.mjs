import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831859937.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831859937.nbt";

const W = 14, H = 23, D = 15;
const ROOF = 11;      // roof deck top, about 11 blocks above the lowest ground
const FLOOR = 5;      // storey floor slab between ground and upper storey

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const vox = new Voxels([W, H, D]);

// footprint lookup: "x,z" -> ground y
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(`${x},${z}`, Math.round(gr));
const has = (x, z) => groundAt.has(`${x},${z}`);
const gnd = (x, z) => groundAt.get(`${x},${z}`);

// exposed sides: N = -z, S = +z, W = -x, E = +x
const expo = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pick the entrance: north-facing, non-corner perimeter cell nearest the centre line,
// on the lowest ground so the threshold reads at street level.
const minGround = Math.min(...cells.map(([, , gr]) => Math.round(gr)));
let door = null;
for (const [x, z, gr] of cells) {
  const e = expo(x, z);
  if (!e.N || e.E || e.W) continue;
  if (gr > minGround + 1) continue;
  const score = Math.abs(x - 6.5);
  if (!door || score < door.score) door = { x, z, gr, score };
}

// 1. Foundations, walls, floors, roof, parapet
for (const [x, z, gr] of cells) {
  // foundation: solid from 0 up to this cell's ground
  for (let y = 0; y <= gr; y++) put(x, y, z, "minecraft:stone_bricks");

  const e = expo(x, z);
  const perim = e.N || e.S || e.E || e.W;

  if (perim) {
    const ns = e.N || e.S;
    const corner = (e.N || e.S) && (e.E || e.W);
    const u = ns ? x : z;                 // index along the facade
    const pier = corner || (u % 3 === 0); // mullion / pier columns
    const isDoor = door && door.x === x && door.z === z;

    for (let y = gr + 1; y <= 10; y++) {
      if (y === gr + 1) {
        put(x, y, z, "minecraft:polished_granite");                 // base course
      } else if (y >= 2 && y <= 4) {
        // ground-floor shopfront
        if (isDoor && (y === 2 || y === 3)) {
          put(x, y, z, "minecraft:dark_oak_door", {
            facing: "north",
            half: y === 2 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (pier) {
          put(x, y, z, "minecraft:smooth_quartz");
        } else {
          put(x, y, z, "minecraft:light_blue_stained_glass");
        }
      } else if (y === FLOOR) {
        put(x, y, z, "minecraft:smooth_quartz");                    // storey band
      } else if (y === 6 || y === 10) {
        put(x, y, z, "minecraft:smooth_quartz");                    // spandrel / cornice course
      } else {
        // upper storey windows, y 7..9
        if (pier) put(x, y, z, "minecraft:smooth_quartz");
        else put(x, y, z, "minecraft:light_blue_stained_glass_pane", ns ? PANE_NS : PANE_EW);
      }
    }

    // the door sits at street level, so its threshold must be solid
    if (isDoor) put(x, 1 > gr ? gr + 1 : gr + 1, z, "minecraft:polished_granite");

    // roof deck and parapet
    if (ROOF > gr) put(x, ROOF, z, "minecraft:smooth_stone");
    put(x, ROOF + 1, z, "minecraft:smooth_quartz");

    // corner lanterns on the parapet
    if (corner && ((x + z) % 4 === 0)) {
      put(x, ROOF + 2, z, "minecraft:lantern", { hanging: "false", waterlogged: "false" });
    }
  } else {
    // interior cell: storey floor slab, roof deck, roof equipment
    if (FLOOR > gr) put(x, FLOOR, z, "minecraft:smooth_stone");
    if (ROOF > gr) put(x, ROOF, z, "minecraft:smooth_stone");

    if (x % 5 === 2 && z % 5 === 2 && ROOF > gr) {
      put(x, ROOF + 1, z, "minecraft:light_gray_concrete");          // AC plant block
      put(x, ROOF + 2, z, "minecraft:smooth_stone_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

// 2. Warm light behind some upper-storey windows (glowstone in the interior air gap)
for (const [x, z, gr] of cells) {
  const e = expo(x, z);
  const perim = e.N || e.S || e.E || e.W;
  if (!perim) continue;
  const corner = (e.N || e.S) && (e.E || e.W);
  if (corner) continue;
  const ns = e.N || e.S;
  const u = ns ? x : z;
  if (u % 3 === 0 || u % 6 !== 1) continue;

  let ix = x, iz = z;
  if (e.N) iz = z + 1;
  else if (e.S) iz = z - 1;
  else if (e.W) ix = x + 1;
  else if (e.E) ix = x - 1;

  if (!has(ix, iz)) continue;
  if (expo(ix, iz).N || expo(ix, iz).S || expo(ix, iz).E || expo(ix, iz).W) continue;
  if (gnd(ix, iz) >= 8) continue;
  put(ix, 8, iz, "minecraft:glowstone");
}

// 3. Warm light in the entrance hall behind the shopfront
if (door) {
  const ix = door.x, iz = door.z + 1;
  if (has(ix, iz) && gnd(ix, iz) < 3) put(ix, 3, iz, "minecraft:lantern", { hanging: "false", waterlogged: "false" });
}

vox.save(OUT);

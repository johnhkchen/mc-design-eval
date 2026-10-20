import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538401855";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Footprint 20 x 19, roof ~11 blocks above lowest ground.
// Era read: 1990s Taipei commercial midrise, two storeys of 5 blocks, white
// tiled/quartz facade, granite base, stone cornice, glazed bays, parapet roof.
const W = 20, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const gmap = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => gmap.has(key(x, z));
const clampGround = (gr) => Math.max(0, Math.min(4, gr ?? 0));

const FLOOR_Y = 5;   // storey line / upper floor slab
const CORNICE_Y = 9; // roof deck / cornice band
const PARAPET_Y = 10; // top of parapet, roof is 11 blocks tall

const dirs = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(dirs).filter(([k]) => !has(x + dirs[k][0], z + dirs[k][1]));

// Find entrance: middle of the single-face cells on the south (+z) side.
const southCells = cells
  .filter(([x, z]) => {
    const ex = exposed(x, z);
    return ex.length === 1 && ex[0] === "S";
  })
  .sort((a, b) => a[0] - b[0]);
const doorCell = southCells.length
  ? southCells[Math.floor(southCells.length / 2)]
  : null;
const door = doorCell ? { x: doorCell[0], z: doorCell[1], gr: clampGround(doorCell[2]) } : null;

for (const [x, z, grRaw] of cells) {
  const gr = clampGround(grRaw);
  const ex = exposed(x, z);
  const edge = ex.length > 0;
  const corner = ex.length > 1;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!edge) {
    // Interior: ground floor slab, upper floor slab, roof deck, no interior air beyond shell.
    g.set(x, gr, z, "smooth_stone");
    g.set(x, FLOOR_Y, z, "smooth_stone");
    g.set(x, CORNICE_Y, z, "light_gray_concrete");
    // Roof plant: a few small mechanical blocks on the roof deck.
    if (x % 5 === 2 && z % 5 === 2) g.set(x, PARAPET_Y, z, "light_gray_concrete");
    continue;
  }

  const face = ex[0];
  const alongX = face === "N" || face === "S";
  const t = alongX ? x : z;
  const pier = corner || t % 3 === 0;
  const isDoor = door && door.x === x && door.z === z && gr <= 3;
  const facing = { N: "north", S: "south", E: "east", W: "west" }[face];

  // Base course at ground level.
  if (isDoor) {
    const doorProps = (half) => ({
      facing, half, hinge: "left", open: "false", powered: "false",
    });
    g.set(x, gr, z, "dark_oak_door", doorProps("lower"));
    g.set(x, gr + 1, z, "dark_oak_door", doorProps("upper"));
  } else {
    g.set(x, gr, z, "polished_granite");
  }

  // Shopfront: ground floor from gr+1 to 4.
  for (let y = gr + 1; y <= 4; y++) {
    if (isDoor && y === gr + 1) continue; // door upper half already set
    if (isDoor && y > gr + 1) {
      g.set(x, y, z, "smooth_quartz");
    } else if (pier) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      g.set(x, y, z, "glass");
    }
  }

  // Storey line at floor level.
  g.set(x, FLOOR_Y, z, "stone_bricks");

  // Upper storey, y 6..8: glazed bays with piers, some lit from behind.
  for (let y = FLOOR_Y + 1; y < CORNICE_Y; y++) {
    if (pier) {
      g.set(x, y, z, "smooth_quartz");
    } else {
      const warm = (t * 3 + z * 5 + x * 7) % 7 === 0;
      if (warm && y === 7) g.set(x, y, z, "glowstone");
      else g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Cornice band and parapet.
  g.set(x, CORNICE_Y, z, "stone_bricks");
  g.set(x, PARAPET_Y, z, "smooth_quartz");
}

g.save(`${dir}/${id}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 272 Water Street, South Street Seaport. Built 1867: a red brick walk-up with a
// granite base course, stone-capped cornice with dentils, dark storefronts on
// Water Street with a granite-surrounded central street door. Storeys are set at
// 3 blocks (one band course plus two window rows) so the window grid reads from the street.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001359";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 32, D = 24;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), {
    ground: Math.max(0, Math.round(gr)),
    roof: Math.round(rf),
  });
}
const has = (x, z) => map.has(key(x, z));

// [dx, dz, facing name]; z small = Manhattan end
const NB = [
  [1, 0, "east"],
  [-1, 0, "west"],
  [0, 1, "south"],
  [0, -1, "north"],
];
const outward = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));
const isWall = (x, z) => outward(x, z).length > 0;

// Entrance: street-side (north, low z) wall cell nearest the middle of the frontage.
let door = null;
{
  const cands = [];
  for (const [k] of map) {
    const [x, z] = k.split(",").map(Number);
    const out = outward(x, z);
    if (out.some(([, dz]) => dz === -1)) cands.push({ x, z, out });
  }
  if (cands.length) {
    cands.sort((a, b) => Math.abs(a.x - 3) - Math.abs(b.x - 3) || a.z - b.z);
    const c = cands[0];
    door = { x: c.x, z: c.z, facing: c.out.find(([, dz]) => dz === -1)[2] };
  }
}

// Cells that flank the door on the same street face get a granite surround.
const isDoorSurround = (x, z) => {
  if (!door) return false;
  return Math.abs(x - door.x) + Math.abs(z - door.z) === 1 && z === door.z;
};

for (const [k, { ground, roof }] of map) {
  const [x, z] = k.split(",").map(Number);
  // roof from lidar, clamped to a sensible minimum; exclusive top index
  const top = Math.min(H, Math.max(roof, ground + 4));
  const out = outward(x, z);
  const wall = out.length > 0;
  const corner = out.length >= 2;

  for (let y = 0; y < top; y++) {
    // foundation below the cell's ground
    if (y < ground) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    const r = y - ground;
    const storey = Math.floor(r / 3);

    if (!wall) {
      // interior: floor slab per storey, roof deck, air between (no interiors)
      if (y === top - 1 || (r % 3 === 0)) put(x, y, z, "smooth_stone");
      continue;
    }

    // ---- wall cells ----
    if (y === top - 1) {
      put(x, y, z, "stone_brick_slab", { type: "top" }); // parapet cap
      continue;
    }
    if (y === top - 2) {
      put(x, y, z, "stone_bricks"); // cornice course
      continue;
    }
    if (y === top - 3) {
      // dentil course: alternating corbels under the cornice
      if ((x + z) % 2 === 0) put(x, y, z, "stone_brick_slab", { type: "bottom" });
      else put(x, y, z, "bricks");
      continue;
    }
    if (r === 0) {
      put(x, y, z, "polished_granite"); // base course at street level
      continue;
    }
    if (r % 3 === 0) {
      put(x, y, z, "stone_brick_slab", { type: "bottom" }); // storey string course
      continue;
    }

    const pier = corner || ((x + z) % 2 === 1);
    const ground1 = r < 3; // ground-floor storefront band

    if (ground1) {
      if (door && door.x === x && door.z === z) {
        const half = r === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: door.facing,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoorSurround(x, z)) {
        put(x, y, z, "polished_granite"); // granite jamb framing the entrance
      } else if (pier) {
        put(x, y, z, "dark_oak_log");
      } else {
        put(x, y, z, "glass_pane");
      }
      continue;
    }

    // upper storeys: brick piers and glass window grid
    if (pier) {
      put(x, y, z, "bricks");
    } else {
      put(x, y, z, "glass_pane");
      // warm light behind some sill-level windows, placed on the interior floor
      if (r % 3 === 1 && y < top - 3 && out.length === 1) {
        const [dx, dz] = out[0];
        const ix = x - dx, iz = z - dz;
        const lit = ((x * 5 + z * 3 + storey) % 3) === 0;
        if (lit && has(ix, iz) && !isWall(ix, iz)) {
          put(ix, y, iz, "lantern", { hanging: "false" });
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

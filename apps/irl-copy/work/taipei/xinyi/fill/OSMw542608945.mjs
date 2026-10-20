import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1980s Taipei commercial block: two concrete-frame storeys over a
// stone plinth, shopfront at street level, tiled upper facades with pier and
// window bays, a cornice, a parapet, and roof plant (water tank, AC units).
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608945.cells.json", "utf8"));

const W = 18, H = 23, D = 17;
const key = (x, z) => x + "," + z;
const fp = new Set(cells.map(([x, z]) => key(x, z)));
const B = Math.max(...cells.map((c) => c[2])); // common floor level (max ground)
const cx = (W - 1) / 2;

const g = new Voxels([W, H, D]);

// Bounds-guarded setter so roof plant can never fall outside the volume.
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces in priority order. Facade = a footprint cell with a missing neighbour.
const dirs = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const outwardOf = (x, z) => dirs.filter(([dx, dz]) => !fp.has(key(x + dx, z + dz)));

// Choose the entrance: a north-facing facade cell nearest the centre, else any facade cell.
const facadeCells = cells
  .map(([x, z]) => [x, z, outwardOf(x, z)])
  .filter(([, , o]) => o.length > 0);
const northCells = facadeCells
  .filter(([, , o]) => o[0][2] === "north")
  .sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const doorCell = northCells[0] || facadeCells[0];
const doorKey = doorCell ? key(doorCell[0], doorCell[1]) : null;

// 1. Foundation: solid stone from y 0 up to the floor level under every cell.
for (const [x, z] of cells) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// 2. Floor slabs and roof deck over the whole footprint (nothing floats).
for (const [x, z] of cells) {
  for (const lvl of [B, B + 5, B + 10]) put(x, lvl, z, "smooth_stone");
}

// 3. Facades, per storey.
for (const [x, z, outs] of facadeCells) {
  const [dx, dz, face] = outs[0];
  const along = dx === 0 ? x : z; // position along the wall, used for bay rhythm
  const isDoor = key(x, z) === doorKey;

  // Pane orientation: a wall running along x connects east/west, and vice versa.
  const paneProps = dz !== 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "false", east: "false", west: "false", waterlogged: "false" };
  if (dx !== 0) {
    paneProps.north = "true"; paneProps.south = "true";
    paneProps.east = "false"; paneProps.west = "false";
  }

  for (let s = 0; s < 2; s++) {
    const base = B + 5 * s;
    const glass = s === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";

    // Base or spandrel course at the storey line.
    put(x, base, z, s === 0 ? "polished_andesite" : "smooth_quartz");

    if (s === 0 && isDoor) {
      // Entrance: lower and upper door halves, transom and lintel above.
      put(x, base + 1, z, "birch_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, base + 2, z, "birch_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, base + 3, z, "smooth_quartz");
      put(x, base + 4, z, "smooth_quartz");
      continue;
    }

    for (let k = 1; k <= 3; k++) {
      const y = base + k;
      const pier = along % 3 === 0;
      if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, glass, paneProps);
      }
    }

    // Lintel / spandrel course.
    put(x, base + 4, z, "smooth_quartz");

    // Warm light behind some upper and ground windows, on the interior floor.
    if (!(s === 0 && isDoor) && along % 6 === 1) {
      const ix = x - dx, iz = z - dz;
      if (fp.has(key(ix, iz))) put(ix, base + 1, iz, "glowstone");
    }
  }

  // Cornice overhang and parapet on top of the roof deck.
  put(x, B + 10, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  put(x, B + 11, z, "white_concrete");
}

// 4. Roof plant on the deck: a galvanised water tank and a row of AC units.
for (const [x, z] of cells) {
  const isFacade = outwardOf(x, z).length > 0;
  if (isFacade) continue;
  // Water tank, roughly centred and set back from the parapet.
  if (x >= 4 && x <= 7 && z >= 4 && z <= 7) {
    for (let y = B + 11; y <= B + 13; y++) put(x, y, z, "iron_block");
    put(x, B + 14, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
  // AC condenser row on the north-east side.
  if (x >= 11 && x <= 14 && z >= 3 && z <= 4) {
    put(x, B + 11, z, "light_gray_concrete");
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608945.nbt");

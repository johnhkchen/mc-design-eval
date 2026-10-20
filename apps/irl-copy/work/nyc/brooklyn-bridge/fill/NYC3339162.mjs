import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3339162.cells.json`, "utf8"));

const W = 10, H = 16, D = 5;
const g = new Voxels([W, H, D]);

// ---- footprint lookup and per-cell massing ----
const cellMap = new Map();
for (const [x, z, gr, roof] of cells) {
  const base = Math.max(0, Math.min(H - 3, Math.round(gr)));
  // roof is absolute height above y0; quantise to 2-block storeys above this cell's ground
  const storeys = Math.max(1, Math.round((roof - base) / 2));
  const top = Math.min(H - 1, base + 2 * storeys);
  cellMap.set(`${x},${z}`, { x, z, base, top });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

// ---- materials ----
const FOUND = "stone_bricks";
const BASE = "stone_bricks";
const WALL = "bricks";
const BAND = "smooth_stone";
const CORNICE = "smooth_stone";
const GLASS = "light_blue_stained_glass";
const ROOF = "stone";
const PENT = "stone_bricks";

for (const c of cellMap.values()) {
  const { x, z, base, top } = c;

  // exposed faces
  const nZm = !has(x, z - 1); // street face, low z
  const nZp = !has(x, z + 1);
  const nXm = !has(x - 1, z);
  const nXp = !has(x + 1, z);
  const ext = nZm || nZp || nXm || nXp;
  const corner = (nZm || nZp) && (nXm || nXp);
  const alongIdx = (nZm || nZp) ? x : z;

  // foundation up to the cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);

  for (let y = base; y < top; y++) {
    if (!ext) {
      // interior: floor slabs per storey, roof deck on top, air between
      if (y === top - 1) g.set(x, y, z, ROOF);
      else if (y === base || (y - base) % 2 === 0) g.set(x, y, z, BAND);
      continue;
    }

    // exterior shell
    if (y === top - 1) {
      g.set(x, y, z, CORNICE); // parapet cap, flush with roof deck
    } else if (y === base) {
      g.set(x, y, z, BASE); // base course
    } else if ((y - base) % 2 === 0) {
      g.set(x, y, z, BAND); // storey line / spandrel
    } else {
      // window row
      const groundRow = y - base === 1;
      const windowable = !corner;
      const isPier = alongIdx % 2 === 0;
      const isGlass = windowable && (groundRow && nZm ? true : !isPier);
      if (isGlass) {
        g.set(x, y, z, GLASS);
      } else {
        g.set(x, y, z, WALL);
      }

      // warm light behind some glass
      if (isGlass && alongIdx % 4 === 1) {
        let ix = x, iz = z;
        if (nZm) iz = z + 1;
        else if (nZp) iz = z - 1;
        else if (nXm) ix = x + 1;
        else if (nXp) ix = x - 1;
        if (has(ix, iz) && (ix !== x || iz !== z)) {
          g.set(ix, y, iz, "shroomlight");
        }
      }
    }
  }
}

// ---- entrance on the street face (low z), two-high door ----
const door = cellMap.get("4,0");
if (door) {
  const { x, z, base } = door;
  g.set(x, base, z, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, base + 1, z, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // lanterns flanking the entrance on the ground storey
  if (has(3, 0) && cellMap.get("3,0").top > base + 1) g.set(3, base + 1, 0, "lantern", { hanging: "false" });
  if (has(5, 0) && cellMap.get("5,0").top > base + 1) g.set(5, base + 1, 0, "lantern", { hanging: "false" });
}

// ---- roof plant: small brick penthouse on an interior roof cell ----
const pent = cellMap.get("2,2");
if (pent) {
  const { x, z, top } = pent;
  if (top + 1 < H) {
    g.set(x, top, z, PENT);
    g.set(x, top + 1, z, PENT);
  }
}

g.save(`${DIR}/NYC3339162.nbt`);

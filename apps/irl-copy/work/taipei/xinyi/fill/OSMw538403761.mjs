import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538403761";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const g = new Voxels([19, 23, 19]);

const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => groundOf.has(key(x, z));
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const put = (x, y, z, id, props) => {
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Pane connection props: runs along x on the south/north faces (z edges), along z on the side faces.
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Main shell, cell by cell. Shape: 1980s-90s Taipei office/commercial block,
// white tiled facade, light grey mullions, blue-tinted glass, stone base and cornice,
// shopfront at ground, entrance on the north (z = 0) face at x = 10.
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to the cell's own ground.
  for (let y = 0; y <= gr; y++) put(x, y, z, "stone_bricks");

  const per = perim(x, z);
  const zEdge = z === 0 || z === 18;
  const xEdge = x === 0 || x === 18;
  const pillar = (zEdge && x % 3 === 0) || (xEdge && z % 3 === 0);
  const paneProps = zEdge ? PANE_EW : PANE_NS;
  const isDoor = (zEdge && z === 0 && x === 10);

  for (let y = gr + 1; y <= 11; y++) {
    // Parapet
    if (y === 11) {
      if (per) put(x, y, z, pillar ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    // Roof deck inside, stone cornice on the perimeter
    if (y === 10) {
      put(x, y, z, per ? "smooth_stone" : "gray_concrete");
      continue;
    }
    // Storey line / floor slab for the whole plate
    if (y === 5) {
      put(x, y, z, "smooth_stone");
      continue;
    }
    if (!per) continue; // no interiors: air behind the facade

    // Upper storey (y 6..9): spandrels top and bottom, glass between mullions
    if (y >= 6 && y <= 9) {
      if (pillar) {
        put(x, y, z, "light_gray_concrete");
      } else if (y === 6 || y === 9) {
        put(x, y, z, "white_concrete");
      } else {
        const warm = y === 7 && ((x * 7 + z * 3) % 11 === 0);
        if (warm) put(x, y, z, "glowstone");
        else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
      }
      continue;
    }

    // Ground storey (y < 5): base course, shopfront glass, entrance, lintel
    if (y < 5) {
      if (y === gr + 1) {
        put(x, y, z, "stone_bricks"); // base course
        continue;
      }
      if (isDoor && (y === gr + 2 || y === gr + 3)) {
        const half = y === gr + 2 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === 4) {
        put(x, y, z, pillar ? "light_gray_concrete" : "white_concrete"); // lintel
        continue;
      }
      if (pillar) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", paneProps);
    }
  }
}

// Roof equipment: two plant units on the deck, a small rod on the centre.
const units = [[4, 4], [13, 12]];
for (const [x0, z0] of units) {
  for (let dx = 0; dx <= 1; dx++) {
    for (let dz = 0; dz <= 1; dz++) {
      const x = x0 + dx, z = z0 + dz;
      if (has(x, z) && groundOf.get(key(x, z)) <= 10) {
        put(x, 11, z, "light_gray_concrete");
      }
    }
  }
  if (has(x0, z0) && groundOf.get(key(x0, z0)) <= 10) put(x0, 12, z0, "iron_block");
}
if (has(9, 9) && groundOf.get(key(9, 9)) <= 10) {
  for (let y = 11; y <= 13; y++) {
    put(9, y, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);

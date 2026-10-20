import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542014195";
const W = 18, H = 23, D = 11;

// Two-storey, flat-roofed, tiled commercial block with a stone base and a parapet.
// Roof at y=11 (about 11 blocks above the lowest ground); storey lines at y=5 and y=10.
const WALL = "white_terracotta";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const CORN = "stone_bricks";
const DECK = "gray_concrete";
const SILL = "quartz_slab";
const GLASS = "glass_pane";
const LINTEL = "dark_oak_planks";
const LIGHT = "glowstone";
const ROOFBOX = "light_gray_concrete";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.floor(g)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Outward faces: N/S faces run along x, E/W faces run along z.
const FACE = {
  N: { dx: 0, dz: -1, axis: "x", facing: "north" },
  S: { dx: 0, dz: 1, axis: "x", facing: "south" },
  W: { dx: -1, dz: 0, axis: "z", facing: "west" },
  E: { dx: 1, dz: 0, axis: "z", facing: "east" },
};
const faces = (x, z) =>
  Object.keys(FACE).filter((k) => !has(x + FACE[k].dx, z + FACE[k].dz));

// Pane connection props along the facade line.
const paneProps = (axis) =>
  axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Street door: the south-facing edge cell nearest the median x.
const southXs = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x]) => x)
  .sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;
const doorZ = southXs.length ? Math.max(...cells.filter(([x]) => x === doorX).map(([, z]) => z)) : -1;

const g = new Voxels([W, H, D]);

for (const [x, z] of cells) {
  const gr = Math.min(gAt(x, z), 8);
  const fs = faces(x, z);
  const perim = fs.length > 0;

  // Foundation up to ground, then base course / interior floor at ground level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, perim ? BASE : FLOOR);

  // Floor slab between storeys, and roof deck with cornice.
  if (gr < 5) g.set(x, 5, z, FLOOR);
  if (gr < 10) g.set(x, 10, z, perim ? CORN : DECK);

  if (!perim) {
    // Interior: air behind the glass, slabs above; roof plant on the deck.
    if (x % 6 === 3 && z === 5) g.set(x, 11, z, ROOFBOX);
    continue;
  }

  // Parapet ring.
  g.set(x, 11, z, WALL);

  const f = FACE[fs[0]];
  const axisT = f.axis === "x" ? x : z;
  const isDoor = x === doorX && z === doorZ;

  // Ground storey: shopfront glazing, door, wood lintel band at y=4.
  if (gr < 4) {
    for (let y = gr + 1; y <= 3; y++) {
      if (isDoor && (y === gr + 1 || y === gr + 2)) {
        const half = y === gr + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: FACE.S.facing,
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (isDoor && y === gr + 3) {
        g.set(x, y, z, WALL);
      } else {
        g.set(x, y, z, GLASS, paneProps(f.axis));
      }
    }
    g.set(x, 4, z, LINTEL);
  }

  // Upper storey: windows every third cell, sill, lintel, warm lights behind some.
  const isWindow = axisT % 3 === 1;
  for (let y = 6; y <= 9; y++) {
    if (!isWindow) {
      g.set(x, y, z, WALL);
    } else if (y === 6) {
      g.set(x, y, z, SILL, { type: "bottom", waterlogged: "false" });
    } else if (y === 9) {
      g.set(x, y, z, WALL);
    } else {
      g.set(x, y, z, GLASS, paneProps(f.axis));
    }
  }

  // Lit rooms behind some upper windows (inward neighbour is interior).
  if (isWindow && axisT % 6 === 1) {
    const ix = x - f.dx, iz = z - f.dz;
    if (has(ix, iz)) g.set(ix, 7, iz, LIGHT);
  }
}

g.save(`${DIR}/${ID}.nbt`);

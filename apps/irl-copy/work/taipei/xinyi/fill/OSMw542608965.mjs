import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608965.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw542608965.nbt";

// 13 x 23 x 20: two-storey mid-century commercial block, cream concrete,
// shopfront on the south (street) face, flat roof with cornice and parapet.
const W = 13, H = 23, D = 20;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Roof is about 11 blocks above the lowest ground: roof slab at minG+10, parapet at minG+11.
const roofY = Math.min(minG + 10, H - 3);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Exterior faces of a footprint cell (direction letters, neighbour missing).
const faces = (x, z) => {
  const out = [];
  if (!has(x, z - 1)) out.push("N");
  if (!has(x, z + 1)) out.push("S");
  if (!has(x - 1, z)) out.push("W");
  if (!has(x + 1, z)) out.push("E");
  return out;
};

const DIRV = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const INWARD = { N: "S", S: "N", W: "E", E: "W" };

const paneProps = (d) =>
  d === "N" || d === "S"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Entrance: middle of the south-face cells.
const southXs = cells.filter(([x, z]) => !has(x, z + 1)).map((c) => c[0]).sort((a, b) => a - b);
const doorX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

for (const [x, z, gr] of cells) {
  const ex = faces(x, z);
  const boundary = ex.length > 0;
  const corner = ex.length > 1;
  const rY = Math.max(roofY, gr + 1);

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground storey at gr, upper storey at gr+5 if it fits under the roof.
  const floors = [gr];
  if (gr + 5 < rY - 3) floors.push(gr + 5);

  // Walls: plinth course then white concrete up to the roof, only on the shell.
  if (boundary) {
    for (let y = gr + 1; y <= rY - 1; y++) {
      put(x, y, z, y === gr + 1 ? "stone_bricks" : "white_concrete");
    }
  }

  // Floor slabs run across interior and shell alike (overrides wall in those rows).
  for (const f of floors) put(x, f, z, "smooth_stone");

  // Roof: cornice + parapet on the shell, roof deck inside with a few plant boxes.
  if (boundary) {
    put(x, rY, z, "smooth_stone");
    put(x, rY + 1, z, "white_concrete");
  } else {
    put(x, rY, z, "light_gray_concrete");
    if ((x * 3 + z * 5) % 7 === 0) put(x, rY + 1, z, "light_gray_concrete");
  }

  // Facade openings per exposed face.
  for (const d of ex) {
    const along = d === "N" || d === "S" ? x - minX : z - minZ;
    const isPier = corner || along % 2 === 0;
    const [dx, dz] = DIRV[d];
    const ix = x - dx, iz = z - dz; // inward neighbour cell
    const inKey = `${ix},${iz}`;
    const inwardOk =
      G.has(inKey) && faces(ix, iz).length === 0 && G.get(inKey) === gr;

    floors.forEach((f, fi) => {
      if (isPier) return;

      if (fi === 0 && d === "S") {
        if (x === doorX) {
          // Entrance door, transom and canopy.
          put(x, f + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
          put(x, f + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
          put(x, f + 3, z, "glass_pane", paneProps(d));
          put(x, f + 4, z, "red_terracotta");
          return;
        }
        // Shopfront: polished plinth, glass, red awning band.
        put(x, f + 1, z, "polished_andesite");
        put(x, f + 2, z, "glass_pane", paneProps(d));
        put(x, f + 3, z, "glass_pane", paneProps(d));
        put(x, f + 4, z, "red_terracotta");
      } else {
        // Ordinary window: sill, two rows of glass, light grey head.
        put(x, f + 1, z, "smooth_stone");
        put(x, f + 2, z, "glass_pane", paneProps(d));
        put(x, f + 3, z, "glass_pane", paneProps(d));
        put(x, f + 4, z, "light_gray_concrete");
      }

      // Warm light behind some glass.
      if (inwardOk && along % 4 === 1) {
        put(ix, f + 2, iz, "glowstone");
      }
    });
  }
}

g.save(OUT);

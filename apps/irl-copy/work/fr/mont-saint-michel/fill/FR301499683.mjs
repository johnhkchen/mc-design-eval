import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499683";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 32, D = 17;
const g = new Voxels([W, H, D]);

const inside = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inside.has(`${x},${z}`);

// Minecraft directions: north = -z, south = +z, west = -x, east = +x
const FACES = {
  n: { dx: 0, dz: -1 },
  s: { dx: 0, dz: 1 },
  w: { dx: -1, dz: 0 },
  e: { dx: 1, dz: 0 },
};
const outwardFaces = (x, z) =>
  Object.keys(FACES).filter((f) => !has(x + FACES[f].dx, z + FACES[f].dz));
const isInterior = (x, z) => has(x, z) && outwardFaces(x, z).length === 0;

const STOREY = 5;

// ---------- pass 1: solid massing, bands, roof, parapet ----------
for (const [x, z, gr, roof] of cells) {
  const top = roof - 1;                       // roof cap layer
  const perim = outwardFaces(x, z).length > 0;

  // granite plinth from y 0 to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");

  // solid body from ground to roof: walls on the perimeter, stone core inside
  for (let y = gr; y < top; y++) g.set(x, y, z, "stone_bricks");

  // storey floors as smooth bands (sill line at each storey base, lintel above)
  for (let b = gr; b < top; b += STOREY) {
    g.set(x, b, z, "smooth_stone");
    if (b + 4 < top) g.set(x, b + 4, z, "chiseled_stone_bricks");
  }

  // slate roof, with a crenellated parapet on the street edges
  g.set(x, top, z, "deepslate_tiles");
  if (perim && top + 1 < H) g.set(x, top + 1, z, "stone_brick_wall");
}

// ---------- pass 2: windows, air gaps behind glass, lights, entrance ----------
const southX = cells.filter(([x, z]) => !has(x, z + 1)).map(([x]) => x).sort((a, b) => a - b);
const doorX = southX.length ? southX[Math.floor(southX.length / 2)] : null;
const doorCell = doorX === null ? null : cells.find(([x, z]) => x === doorX && !has(x, z + 1));
const doorZ = doorCell ? doorCell[1] : null;

for (const [x, z, gr, roof] of cells) {
  const top = roof - 1;
  for (const f of outwardFaces(x, z)) {
    const { dx, dz } = FACES[f];
    const isNS = f === "n" || f === "s";
    const along = isNS ? x : z;
    const alongs = cells
      .filter(([cx, cz]) => outwardFaces(cx, cz).includes(f))
      .map(([cx, cz]) => (isNS ? cx : cz));
    const amin = Math.min(...alongs), amax = Math.max(...alongs);
    if (along === amin || along === amax) continue;   // keep corners solid
    const r = along - amin;

    for (let k = 0; gr + STOREY * k < top; k++) {
      const b = gr + STOREY * k;
      const shopfront = k === 0;
      const isWin = shopfront ? r % 3 !== 0 : r % 3 === 1;
      if (!isWin) continue;

      const ix = x - dx, iz = z - dz;              // cell behind the glass
      const yTop = Math.min(b + (shopfront ? 2 : 3), top - 1);

      // glass in the wall, with a 3-high air gap behind it
      for (let y = b + 1; y <= yTop; y++) g.set(x, y, z, "glass_pane");
      if (isInterior(ix, iz)) {
        for (let y = b + 1; y <= yTop; y++) g.set(ix, y, iz, "air");
        if (r % 6 === 1 && (k === 0 || k % 2 === 0)) {
          g.set(ix, b + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
      // sill and lintel reinforce the opening
      if (shopfront && yTop + 1 < top) g.set(x, yTop + 1, z, "stone_bricks");
    }
  }
}

// main entrance on the south street face, with a lintel canopy above it
if (doorX !== null) {
  const gr = cells.find(([x, z]) => x === doorX && z === doorZ)[2];
  const roof = cells.find(([x, z]) => x === doorX && z === doorZ)[3];
  const top = roof - 1;
  g.set(doorX, gr, doorZ, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, gr + 1, doorZ, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // open the cell behind the door so it does not sit against solid stone
  if (isInterior(doorX, doorZ - 1)) {
    g.set(doorX, gr + 1, doorZ - 1, "air");
    g.set(doorX, gr + 2, doorZ - 1, "air");
  }
  // lintel slab over the door, inside the wall line
  if (gr + 2 < top) g.set(doorX, gr + 2, doorZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

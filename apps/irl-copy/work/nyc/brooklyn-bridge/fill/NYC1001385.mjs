import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001385.cells.json`, "utf8"));

const W = 6, H = 35, D = 16;
const g = new Voxels([W, H, D]);

// ---- footprint --------------------------------------------------------------
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) cellMap.set(`${x},${z}`, { x, z, gr: Math.round(gr), rf: Math.round(rf) });
const inFp = (x, z) => cellMap.has(`${x},${z}`);

const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: 1, dz: 0, facing: "east" },
  { dx: -1, dz: 0, facing: "west" },
];
function outward(x, z) {
  for (const d of DIRS) if (!inFp(x + d.dx, z + d.dz)) return d;
  return null;
}

// ---- smoothed massing: one roof level for the whole block -------------------
const all = [...cellMap.values()];
const grounds = all.map((c) => c.gr).sort((a, b) => a - b);
const roofs = all.map((c) => c.rf).sort((a, b) => a - b);
const minGr = grounds[0];
const medRoof = roofs[Math.floor(roofs.length / 2)];
const R = Math.min(Math.max(medRoof, minGr + 20), H - 5); // flat roof, clamped

const info = all.map((c) => ({ ...c, perim: outward(c.x, c.z) !== null, out: outward(c.x, c.z) }));

// entrance: street-level perimeter cell at the lowest z on the long face
const doorCell = info
  .filter((c) => c.perim && c.out && c.out.dz !== 0) // facing north/south (long face)
  .sort((a, b) => a.z - b.z || a.x - b.x)[0] ?? info.find((c) => c.perim && c.out);

// ---- build ------------------------------------------------------------------
for (const c of info) {
  const { x, z, gr, perim, out } = c;

  // foundation fill up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gr, z, perim ? "stone_bricks" : "smooth_stone");

  if (perim) {
    // brick shell from storefront to roof
    for (let y = gr + 1; y <= R - 1; y++) g.set(x, y, z, "bricks");

    // bay position along the face: corners are piers, between them odd bays glaze
    const u = out.dz !== 0 ? x : z;
    const maxU = out.dz !== 0 ? 5 : 15;
    const isEdge = u === 0 || u === maxU;
    const bayWin = !isEdge && u % 2 === 1;

    // storefront: dark-oak cast-iron frames and shop glass, with a base course
    for (let y = gr + 1; y <= gr + 2; y++) {
      g.set(x, y, z, bayWin ? "glass" : "dark_oak_planks");
    }
    g.set(x, gr + 1, z, "stone_bricks");

    if (doorCell && doorCell.x === x && doorCell.z === z) {
      const facing = out.facing;
      g.set(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // storeys: 2-block bays, stone floor band then a glazed row
    let k = 0;
    for (let b = gr + 3; b + 1 < R; b += 2, k++) {
      g.set(x, b, z, "stone_bricks");
      if (bayWin) {
        g.set(x, b + 1, z, "glass");
        // warm light behind every few windows, in the interior air gap
        if ((u + k) % 4 === 1) {
          const ix = x - out.dx, iz = z - out.dz;
          if (inFp(ix, iz) && outward(ix, iz) === null) g.set(ix, b + 1, iz, "glowstone");
        }
      } else {
        g.set(x, b + 1, z, "bricks");
      }
    }
  } else {
    // interior: floor slabs only, air elsewhere
    for (let b = gr + 3; b + 1 < R; b += 2) g.set(x, b, z, "smooth_stone");
  }

  // flat roof and parapet
  g.set(x, R, z, perim ? "stone_bricks" : "smooth_stone");
  if (perim) g.set(x, R + 1, z, "stone_bricks");
}

// ---- roof equipment: stair bulkhead with a cornice cap ----------------------
for (const c of info) {
  if (c.perim) continue;
  if (c.x >= 2 && c.x <= 3 && c.z >= 6 && c.z <= 9) {
    g.set(c.x, R + 1, c.z, "bricks");
    g.set(c.x, R + 2, c.z, "bricks");
    g.set(c.x, R + 3, c.z, "stone_bricks");
  }
}

g.save(`${DIR}/NYC1001385.nbt`);

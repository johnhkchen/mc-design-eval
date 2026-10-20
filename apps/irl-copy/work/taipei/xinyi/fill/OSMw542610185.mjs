import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542610185";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Ground per footprint cell, clamped to a sane foundation range.
const clampG = (v) => Math.max(0, Math.min(6, Math.round(v)));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, clampG(gr));
}
const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const NORMALS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const exposed = (x, z) => NORMALS.filter(([nx, nz]) => !has(x + nx, z + nz));
const isInterior = (x, z) => has(x, z) && exposed(x, z).length === 0;

const put = (x, y, z, name, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, name, props);
  else g.set(x, y, z, name);
};
const GLASS_PROPS = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const pane = (x, y, z) => put(x, y, z, "light_blue_stained_glass_pane", GLASS_PROPS);

// Door: on a south-facing exposed cell nearest the footprint's middle, else first exposed cell.
const entries = [...ground.entries()].map(([k, gr]) => {
  const [x, z] = k.split(",").map(Number);
  return { x, z, gr, ex: exposed(x, z) };
});
const xs = entries.map((e) => e.x);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
const perim = entries.filter((e) => e.ex.length > 0);
const southCands = perim
  .filter((e) => e.ex.some(([, nz]) => nz === 1))
  .sort((a, b) => Math.abs(a.x - midX) - Math.abs(b.x - midX));
const doorCell = southCands[0] ?? perim[0];
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;
const doorFace = doorCell
  ? (doorCell.ex.find(([, nz]) => nz === 1) ?? doorCell.ex[0])[2]
  : null;

// Main shell: foundation, floors, roof, facade articulation.
for (const { x, z, gr, ex } of entries) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (ex.length === 0) {
    // Interior: air behind glass, floor slabs per storey, roof slab.
    put(x, gr, z, "smooth_stone");
    if (5 > gr) put(x, 5, z, "smooth_quartz");
    if (10 >= gr) put(x, 10, z, "gray_concrete");
    continue;
  }

  const corner = ex.length > 1;
  const [nx, nz, face] = ex[0];
  const u = nx !== 0 ? z : x; // position along the exposed face
  const pier = corner || u % 3 === 0;
  const isDoorCell = key(x, z) === doorKey;

  if (10 >= gr) put(x, 10, z, "smooth_stone"); // cornice, sits on the roof slab line
  if (5 > gr) put(x, 5, z, "smooth_stone"); // string course at the floor line

  for (let y = gr; y <= 12; y++) {
    if (y === gr) {
      put(x, y, z, "polished_granite");
    } else if (y <= 3) {
      // Ground storey: shopfront.
      if (isDoorCell && (y === gr + 1 || y === gr + 2) && face === doorFace) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: face, half, hinge: "left", open: "false", powered: "false" });
      } else if (pier) {
        put(x, y, z, "smooth_quartz");
      } else {
        pane(x, y, z);
      }
    } else if (y === 4) {
      put(x, y, z, "gray_concrete"); // fascia / sign band
    } else if (y === 5) {
      // string course already placed
    } else if (y === 6 || y === 9) {
      put(x, y, z, "light_gray_concrete"); // spandrels
    } else if (y === 7 || y === 8) {
      if (pier) put(x, y, z, "smooth_quartz");
      else pane(x, y, z);
    } else if (y === 10) {
      // cornice already placed
    } else if (y === 11) {
      put(x, y, z, "smooth_quartz"); // parapet
    } else if (y === 12) {
      put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }

  // Warm light: lanterns inside the shopfront, shroomlights behind upper windows.
  if (!corner) {
    const ix = x - nx, iz = z - nz;
    if (isInterior(ix, iz)) {
      if (!pier && u % 6 === 1 && ix !== doorCell?.x) {
        put(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
      if (u % 6 === 2) {
        put(ix, 7, iz, "shroomlight");
      }
    }
  }
}

// Roof: plant and a lightning rod on interior roof cells.
for (const { x, z, ex } of entries) {
  if (ex.length > 0) continue;
  if (x % 8 === 4 && z % 6 === 3) {
    put(x, 11, z, "light_gray_concrete");
    put(x, 12, z, "light_gray_concrete");
    put(x, 13, z, "iron_block");
  } else if (x % 8 === 1 && z % 6 === 1) {
    put(x, 11, z, "white_concrete");
  }
  if (x === 12 && z === 9) {
    for (let y = 11; y <= 14; y++) {
      put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407455110";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 55, H = 23, D = 80;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, y] of cells) ground.set(`${x},${z}`, y);
const has = (x, z) => ground.has(`${x},${z}`);
const base = Math.min(...ground.values());

// Two storeys of 5 plus a cornice/roof line: roof surface about 11 above lowest ground.
const LINE = base + 5;     // storey-2 floor line
const ROOFY = base + 10;   // roof deck (surface at base + 11)
const FL1 = [base + 1, base + 3];  // ground-floor window band
const FL2 = [base + 6, base + 8];  // upper-floor window band
const CX = Math.floor(W / 2);      // entrance centre on the street side

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const GLASS_PANE = "light_blue_stained_glass_pane";

function paneProps(dx, dz) {
  // Pane on a face whose normal runs along z connects east/west; otherwise north/south.
  const ew = dz !== 0 ? "true" : "false";
  const ns = dx !== 0 ? "true" : "false";
  return { east: ew, west: ew, north: ns, south: ns, waterlogged: "false" };
}

// Facade bays: piers every third along-axis cell, with stone pilasters every sixth.
function pierMaterial(along) {
  return along % 6 === 0 ? "stone_bricks" : "white_concrete";
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone");

  const ext = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));

  if (ext.length === 0) {
    // Interior: floor slabs, roof deck, no walls.
    g.set(x, gr, z, "light_gray_concrete");          // ground-floor slab
    if (LINE >= gr) g.set(x, LINE, z, "light_gray_concrete");
    if (ROOFY >= gr) g.set(x, ROOFY, z, "gray_concrete");

    // Rooftop plant room, a small block on the deck.
    if (x >= 14 && x <= 22 && z >= 30 && z <= 42) {
      for (const y of [base + 11, base + 12]) {
        if (y >= gr) g.set(x, y, z, "light_gray_concrete");
      }
    }
    continue;
  }

  // Edge cell: choose the facade by its first exterior side.
  const [dx, dz] = ext[0];
  const along = dz !== 0 ? x : z;   // position along the facade
  const onStreet = dz === -1 && dx === 0;

  // Cornice cap on top of the wall.
  g.set(x, ROOFY, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Storey line.
  if (LINE >= gr) g.set(x, LINE, z, "smooth_stone");

  // Entrance: three bays wide on the street face, glass to 3 blocks above the base,
  // flanked by stone pilasters, with a stone lintel above.
  const entranceCell = onStreet && Math.abs(x - CX) <= 1;
  const entranceFlank = onStreet && Math.abs(x - CX) === 2;

  for (let y = gr; y <= ROOFY - 1; y++) {
    if (y === LINE) continue;

    if (y === gr) {
      // Base course; entrance threshold in smooth stone.
      g.set(x, y, z, entranceCell ? "smooth_stone" : "stone_bricks");
      continue;
    }

    if (entranceCell) {
      if (y <= gr + 2) {
        g.set(x, y, z, "glass");
      } else if (y === gr + 3) {
        g.set(x, y, z, "smooth_stone"); // lintel
      } else {
        g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    if (entranceFlank && y <= gr + 3) {
      g.set(x, y, z, "stone_bricks"); // pilaster beside the door
      continue;
    }

    const inFl1 = y >= FL1[0] && y <= FL1[1] && y > gr;
    const inFl2 = y >= FL2[0] && y <= FL2[1];

    if (inFl1 || inFl2) {
      if (along % 3 !== 0) {
        g.set(x, y, z, GLASS_PANE, paneProps(dx, dz));

        // Warm light behind some panes, standing on the floor slab inside.
        const ix = x - dx, iz = z - dz;
        const floorY = inFl1 ? gr : LINE;
        const lightY = floorY + 1;
        if (has(ix, iz) && lightY === y && (x + z + y) % 5 === 0) {
          g.set(ix, lightY, iz, "shroomlight");
        }
      } else {
        g.set(x, y, z, pierMaterial(along));
      }
    } else {
      // Spandrels: a slightly darker band so the storeys read against the piers.
      g.set(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

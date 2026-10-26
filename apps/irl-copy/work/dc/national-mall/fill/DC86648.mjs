import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86648.cells.json`, "utf8"));

const W = 3, H = 17, D = 10;
const g = new Voxels([W, H, D]);

const cellMap = new Map(cells.map(([x, z, gr, rf]) => [`${x},${z}`, [gr, rf]]));

// One clean flat roof tier for the whole building, taken from the lidar median,
// so the massing reads as a single cornice line instead of lidar steps.
const roofs = cells.map((c) => c[3]).sort((a, b) => a - b);
const roofTarget = Math.round(roofs[Math.floor(roofs.length / 2)]);

// Facade rhythm along z (front = x 0, facing the street)
const shop = (z) => z >= 1 && z <= 8 && z !== 4;                  // shopfront glazing, doorway at z=4
const frontUpper = (z) => z >= 1 && z <= 8 && (z - 1) % 3 !== 2;  // paired windows, brick piers
const backUpper = (z) => z >= 1 && z <= 8 && z % 2 === 1;         // rear windows

const paneProps = (pred, z) => ({
  north: pred(z - 1) ? "true" : "false",
  south: pred(z + 1) ? "true" : "false",
  east: "false",
  west: "false",
  waterlogged: "false",
});

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z, gr, rf0] of cells) {
  const roofTop = Math.min(Math.max(roofTarget, gr + 4), H - 2);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perimeter = x === 0 || x === 2 || z === 0 || z === 9;

  if (!perimeter) {
    // Interior void behind the glass: floor slabs per storey, air gap, lanterns, flat roof deck
    for (let y = gr; y < roofTop - 1; y++) {
      if (y === gr || y === gr + 2) put(x, y, z, "smooth_stone");
      else if (y === gr + 4 && z % 3 === 2) put(x, y, z, "lantern", { hanging: "false" });
    }
    put(x, roofTop - 1, z, "smooth_stone");
    continue;
  }

  const front = x === 0;
  const back = x === 2;
  const corner = x !== 1 && (z === 0 || z === 9); // stone quoins at the four corners

  // Facade stack from plinth up to the lintel row
  for (let y = gr; y <= roofTop - 2; y++) {
    let id = "bricks";
    let props = null;

    if (y === gr) {
      id = "stone_bricks";                         // plinth
    } else if (y === gr + 1) {
      if (front && shop(z)) { id = "glass_pane"; props = paneProps(shop, z); }
    } else if (y === gr + 2) {
      id = "stone_bricks";                         // belt course / transom line
    } else if (corner) {
      id = "stone_bricks";                         // quoins
    } else if (y === roofTop - 2) {
      if ((front && frontUpper(z)) || (back && backUpper(z))) id = "stone_bricks"; // window lintels
    } else {
      if (front && frontUpper(z)) { id = "glass_pane"; props = paneProps(frontUpper, z); }
      else if (back && backUpper(z)) { id = "glass_pane"; props = paneProps(backUpper, z); }
    }

    put(x, y, z, id, props);
  }

  // Cornice band and parapet cap
  put(x, roofTop - 1, z, "stone_bricks");
  put(x, roofTop, z, "stone_bricks");
}

// Entrance doorway on the street front at z=4
if (cellMap.has("0,4")) {
  const [gr, rf] = cellMap.get("0,4");
  const doorProps = (half) => ({
    facing: "west",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(0, gr, 4, "oak_door", doorProps("lower"));
  if (gr + 1 < rf) g.set(0, gr + 1, 4, "oak_door", doorProps("upper"));
}

g.save(`${DIR}/DC86648.nbt`);

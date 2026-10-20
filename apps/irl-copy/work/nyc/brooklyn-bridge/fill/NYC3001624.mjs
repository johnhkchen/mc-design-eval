import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001624";
const W = 13, H = 26, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Clean, uniform massing: one roof level for the whole building (median lidar roof),
// lifted where a cell's own ground would otherwise leave less than four blocks of wall.
const sortedRoofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = sortedRoofs[Math.floor(sortedRoofs.length / 2)];

const info = new Map();
for (const c of cells) {
  const [x, z] = c;
  const gnd = Math.max(0, Math.min(H - 8, Math.round(c[2])));
  let roof = Math.max(gnd + 4, Math.round(medianRoof));
  roof = Math.min(roof, H - 4);
  info.set(`${x},${z}`, { x, z, gnd, roof });
}
const has = (x, z) => info.has(`${x},${z}`);
const isExterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Door on the street face (z = 0), centred on the 13-block frontage.
const DOOR_X = 6, DOOR_Z = 0;

for (const { x, z, gnd, roof } of info.values()) {
  const exterior = isExterior(x, z);
  const top = roof - 1; // cornice / roof deck row

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gnd; y++) put(x, y, z, "stone_bricks");

  // Window positions on clean faces; corners and the door bay stay solid.
  const winZFace = (z === 0 || z === D - 1) && x > 0 && x < W - 1 && x % 2 === 0;
  const winXFace = (x === 0 || x === W - 1) && z > 0 && z < D - 1 && z % 2 === 1;
  const isWindow = exterior && (winZFace || winXFace) && !(z === DOOR_Z && Math.abs(x - DOOR_X) <= 1);

  for (let y = gnd; y <= top; y++) {
    const rel = y - gnd;

    // Cornice / roof deck on every cell.
    if (y === top) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (!exterior) {
      // Interior: one floor slab per storey, air gap otherwise.
      if (rel % 2 === 0) put(x, y, z, "oak_planks");
      continue;
    }

    // Exterior wall.
    if (rel === 0) {
      put(x, y, z, "stone_bricks"); // base course
      continue;
    }

    // Entrance bay on the street face.
    if (z === DOOR_Z && Math.abs(x - DOOR_X) <= 1 && rel <= 3) {
      if (x === DOOR_X) {
        if (rel === 1) put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        else if (rel === 2) put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        else if (rel === 3) put(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      } else {
        // Stone surround either side of the door.
        put(x, y, z, "stone_bricks");
      }
      continue;
    }

    if (rel % 2 === 0) {
      // Storey line.
      put(x, y, z, "smooth_stone");
      continue;
    }

    // rel odd: storey window row.
    if (isWindow) {
      const storey = (rel - 1) / 2;
      const lit = (x + z + storey) % 4 === 0;
      put(x, y, z, lit ? "glowstone" : "glass");
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Parapet on exterior cells.
  if (exterior) put(x, roof, z, "stone_brick_wall");
}

// Two brick chimneys on interior cells, if the footprint allows.
for (const [cx, cz] of [[3, 2], [9, 3]]) {
  const c = info.get(`${cx},${cz}`);
  if (!c || isExterior(cx, cz)) continue;
  for (let y = c.roof; y <= c.roof + 2 && y < H; y++) put(cx, y, cz, "bricks");
  put(cx, c.roof + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 29 Columbia Heights (1924): 72 x 19 commercial/office block, Brooklyn Heights/DUMBO edge.
// 1920s brick office block with limestone banding. The street fronts are recessed:
// piers stay on the outer line, windows sit one block back in deep reveals,
// the shopfront has a stone-framed entrance, and a brick penthouse sits on the lower roofs.

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC3001479.cells.json`, "utf8"));

const W = 72, H = 45, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  // Smooth lidar roof into even-height tiers, keep at least 4 blocks of building.
  let roof = Math.round(rf / 2) * 2;
  roof = Math.min(44, Math.max(ground + 4, roof));
  info.set(key(x, z), { ground, roof });
}
const has = (x, z) => info.has(key(x, z));
const cellList = [...info.keys()].map((k) => k.split(",").map(Number));

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const isPerimeter = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Pass 1: foundations, walls, floors, cornice, parapet, roof deck, recessed street fronts.
for (const [x, z] of cellList) {
  const { ground, roof } = info.get(key(x, z));
  const perim = isPerimeter(x, z);
  const street = perim && (z === 0 || z === D - 1);
  const dz = z === 0 ? 1 : -1; // direction from the street line into the building
  const sz = z === 0 ? 0 : D - 1;

  // Foundation under everything, up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y < roof; y++) {
    const rel = y - ground;

    // Roof deck on the top block.
    if (y === roof - 1) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    // Limestone cornice course under the parapet.
    if (y === roof - 2 && perim) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    // Interior: floor slab each storey, otherwise air.
    if (!perim) {
      if (y === ground || y % 2 === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (street) {
      if (rel === 0) {
        // Plinth course at grade.
        put(x, y, z, "polished_andesite");
      } else if (rel < 3) {
        // Shopfront with a stone-framed entrance bay.
        const isDoor = z === 0 && x % 24 === 12;
        const isSurround = z === 0 && (x % 24 === 11 || x % 24 === 13);
        if (isDoor && (rel === 1 || rel === 2)) {
          put(x, y, z, "dark_oak_door", {
            facing: "south",
            half: rel === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (isSurround) {
          put(x, y, z, "stone_bricks");
        } else if (x % 3 === 0) {
          put(x, y, z, "dark_oak_planks");
        } else if (rel === 2) {
          put(x, y, z, "smooth_stone");
        } else {
          put(x, y, z, "glass");
        }
      } else {
        // Upper storeys: limestone spandrels on even y; on odd y the brick piers
        // stay on the street line and the windows are recessed one block back.
        if (y % 2 === 0) {
          put(x, y, z, "smooth_stone");
        } else if (x % 3 === 0) {
          put(x, y, z, "bricks");
        } else {
          // Recessed window: glass one block in, shadowed reveal in front.
          const inZ = sz + dz;
          if (has(x, inZ)) put(x, y, inZ, "glass_pane");
        }
      }
    } else {
      // End walls and other exposed edges: brick with limestone storey lines.
      put(x, y, z, y % 2 === 0 ? "smooth_stone" : "bricks");
    }
  }
}

// Pass 2: warm light behind the recessed street-front windows.
for (const [x, z] of cellList) {
  if (!isPerimeter(x, z) || !(z === 0 || z === D - 1)) continue;
  const { ground, roof } = info.get(key(x, z));
  const inner = z === 0 ? 2 : D - 3;
  if (!has(x, inner)) continue;
  if (x % 9 !== 4) continue;
  for (let y = ground + 3; y < roof - 2; y++) {
    if (y % 2 === 1 && (y - ground) % 4 === 1) {
      put(x, y, inner, "glowstone");
    }
  }
}

// Pass 3: small brick penthouse on the lower roofs in the middle of the block.
for (const [x, z] of cellList) {
  if (x < 30 || x > 41 || z < 6 || z > 12) continue;
  const { roof } = info.get(key(x, z));
  if (roof > 40) continue;
  const edge = x === 30 || x === 41 || z === 6 || z === 12;
  put(x, roof, z, edge && x % 3 === 0 ? "bricks" : edge ? "glass_pane" : "bricks");
  put(x, roof + 1, z, "bricks");
  put(x, roof + 2, z, "stone_bricks");
}

g.save(`${dir}/NYC3001479.nbt`);

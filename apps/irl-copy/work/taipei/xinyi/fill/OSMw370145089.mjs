import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370145089";
const W = 34, H = 23, D = 18;

// Record: 2-storey commercial block, Xinyi district, c. 1990s-2000s.
// Light-grey concrete frame, white spandrels, tinted glass shopfront,
// stone-brick cornice and parapet with corner piers, flat roof with HVAC units.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const foot = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  foot.set(key(x, z), gr);
}

const gMin = Math.min(...foot.values());
const R = gMin + 11;          // roof deck / parapet top layer
const xs = [...foot.keys()].map((k) => +k.split(",")[0]);
const zs = [...foot.keys()].map((k) => +k.split(",")[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2;

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const DIRS = {
  N: [0, -1],
  S: [0, 1],
  W: [-1, 0],
  E: [1, 0],
};
const PRIORITY = ["N", "S", "W", "E"];

// Entrance: two cells wide on the north (street) face, centred on the footprint
const isEntrance = (x, face) => face === "N" && Math.abs(x - cx) <= 1;

function facadeBlock(x, y, z, face, gr) {
  const rel = y - gMin;
  const alongNS = face === "N" || face === "S";
  const along = alongNS ? x - minX : z - minZ;
  const bay = Math.floor(along / 6) % 2; // alternating 6-wide bays break up the flat run

  const paneProps = alongNS
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };

  // Base course at the first built layer
  if (y === gr) return { id: "stone_bricks" };

  // Ground floor shopfront: glazing rel 1..3, lintel rel 4
  if (rel <= 4) {
    if (rel === 4) return { id: "stone_bricks" };
    if (isEntrance(x, face)) {
      // Entrance frame: glass door leaf in the centre, stone jambs at the edges
      if (Math.abs(x - cx) < 1) return { id: "light_blue_stained_glass" };
      return { id: "stone_bricks" };
    }
    if (along % 3 === 0) return { id: "light_gray_concrete" };
    return { id: "light_blue_stained_glass_pane", props: paneProps };
  }

  // Storey line
  if (rel === 5) return { id: "light_gray_concrete" };

  // Upper floor: spandrels, glazing with mullions; every other bay has a stone spandrel
  if (rel === 6 || rel === 9) {
    return { id: bay ? "smooth_stone" : "white_concrete" };
  }
  if (rel === 7 || rel === 8) {
    if (along % 3 === 0) return { id: "stone_bricks" };
    return { id: "glass_pane", props: paneProps };
  }

  // Cornice and parapet
  if (rel === 10) return { id: "stone_bricks" };
  if (rel >= 11) return { id: "stone_bricks" };

  return null;
}

for (const [k, gr] of foot) {
  const [x, z] = k.split(",").map(Number);

  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  const faces = PRIORITY.filter((f) => {
    const [dx, dz] = DIRS[f];
    return !foot.has(key(x + dx, z + dz));
  });

  if (faces.length > 0) {
    const face = faces[0];
    for (let y = gr; y <= R; y++) {
      const b = facadeBlock(x, y, z, face, gr);
      if (b) put(x, y, z, b.id, b.props);
    }

    // Corner piers: two exposed faces means a convex corner, so rise one block above the parapet
    if (faces.length >= 2 && gr <= R) {
      put(x, R + 1, z, "stone_bricks");
    }

    // Entrance interior lighting: lantern just behind the door opening (rel 2)
    if (isEntrance(x, face) && Math.abs(x - cx) >= 1) {
      // edge cells of the entrance: nothing extra
    }
    if (face === "N" && Math.abs(x - cx) < 1) {
      const iz = z + 1;
      const yLamp = gMin + 2;
      if (foot.has(key(x, iz)) && yLamp >= foot.get(key(x, iz))) {
        put(x, yLamp, iz, "lantern", { hanging: "false" });
      }
    }

    // Sparse warm light behind a few upper-floor panes
    const [dx, dz] = DIRS[face];
    const along = face === "N" || face === "S" ? x - minX : z - minZ;
    const y7 = gMin + 7;
    if (y7 >= gr && y7 <= R && along % 3 !== 0 && along % 12 === 4) {
      const ix = x - dx, iz = z - dz;
      if (foot.has(key(ix, iz)) && foot.get(key(ix, iz)) <= y7) {
        put(ix, y7, iz, "glowstone");
      }
    }
  } else {
    // Interior: floor slabs per storey and roof deck
    for (let y = gr; y <= R; y++) {
      if (y === gr || y === gMin + 5 || y === gMin + 10) {
        put(x, y, z, "smooth_stone");
      } else if (y === R) {
        put(x, y, z, "gray_concrete");
      }
    }

    // Roof plant: HVAC boxes on the roof deck
    if (gr <= R && x % 7 === 3 && z % 5 === 2) {
      put(x, R + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

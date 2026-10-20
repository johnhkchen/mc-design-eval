import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538458212";
const W = 9, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground height
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Bounds-checked setter; props optional
function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const PANE_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Is a cell on the outer ring of the footprint?
const isPerimeter = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

for (const [x, z, gr] of cells) {
  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground-storey base course / ground slab
  put(x, gr, z, "polished_granite");

  // Exterior faces of this cell
  const faces = [];
  if (!has(x, z - 1)) faces.push({ axis: "z", nz: -1, i: x, dx: 0, dz: 1 }); // north face (street/front)
  if (!has(x, z + 1)) faces.push({ axis: "z", nz: 1, i: x, dx: 0, dz: -1 });
  if (!has(x - 1, z)) faces.push({ axis: "x", nx: -1, i: z, dx: 1, dz: 0 });
  if (!has(x + 1, z)) faces.push({ axis: "x", nx: 1, i: z, dx: -1, dz: 0 });

  const corner = faces.length > 1;

  if (faces.length > 0) {
    // Use the first exterior face for articulation; corners become pillars
    const f = faces[0];
    const i = f.i;
    const pillar = corner || i % 3 === 0;
    const front = f.axis === "z" && f.nz === -1;
    const paneProps = f.axis === "z" ? PANE_Z : PANE_X;
    const entrance = front && Math.abs(i - 4) <= 1 && has(4, 0);

    for (let dy = 0; dy <= 10; dy++) {
      const y = gr + dy;
      let id, props;

      if (dy === 0) {
        id = "polished_granite";
      } else if (dy <= 3) {
        // Ground storey: shopfront
        if (pillar) id = "white_concrete";
        else if (entrance && i === 4 && dy === 1) {
          id = "dark_oak_door";
          props = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
        } else if (entrance && i === 4 && dy === 2) {
          id = "dark_oak_door";
          props = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
        } else if (entrance) {
          id = "glass";
        } else {
          id = "glass_pane";
          props = paneProps;
        }
      } else if (dy === 4) {
        id = "white_concrete"; // storey line
      } else if (dy === 5) {
        id = pillar ? "white_concrete" : "light_gray_concrete"; // spandrel
      } else if (dy <= 8) {
        // Upper storey window grid
        if (pillar) id = "white_concrete";
        else { id = "glass_pane"; props = paneProps; }
      } else if (dy === 9) {
        id = "smooth_stone"; // cornice
      } else {
        id = "white_concrete"; // parapet
      }

      put(x, y, z, id, props);
    }

    // Warm lights in some upper windows, placed in the air gap behind the glass
    if (!pillar && i % 6 === 2) {
      const bx = x + f.dx, bz = z + f.dz;
      if (has(bx, bz) && !isPerimeter(bx, bz)) {
        put(bx, gr + 7, bz, "glowstone");
      }
    }
    if (!pillar && i % 6 === 5 && !front) {
      const bx = x + f.dx, bz = z + f.dz;
      if (has(bx, bz) && !isPerimeter(bx, bz)) {
        put(bx, gr + 2, bz, "shroomlight");
      }
    }
  } else {
    // Interior cell: floor slab per storey and flat roof deck
    put(x, gr + 5, z, "smooth_stone");
    put(x, gr + 10, z, "gray_concrete");
  }
}

// Roof equipment: mechanical box and a short mast, on roof interior cells
for (const [x, z, gr] of cells) {
  if (isPerimeter(x, z)) continue;
  if (x >= 3 && x <= 4 && z >= 5 && z <= 6) {
    put(x, gr + 11, z, "light_gray_concrete");
    put(x, gr + 12, z, "light_gray_concrete");
  }
  if (x === 4 && z === 11) {
    for (let dy = 11; dy <= 13; dy++) {
      put(x, gr + dy, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);

import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw538401858";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 16, H = 23, D = 29;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const G = new Map();
let B = Infinity;
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, gr);
  B = Math.min(B, gr);
}
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);

// Roof sits 11 blocks above the lowest ground: 2 storeys of 5 plus a parapet
const T = B + 11;      // parapet row
const DECK = T - 1;    // roof deck / cornice row

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const exposedFaces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};

// Front (north, z-min) edge cells, choose the middle one for the entrance
const frontCells = cells
  .filter(([x, z]) => !has(x, z - 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = frontCells.length ? frontCells[Math.floor(frontCells.length / 2)] : 8;
const doorZ = (() => {
  const c = cells.find(([x, z]) => x === doorX && !has(x, z - 1));
  return c ? c[1] : null;
})();

const paneProps = (f) => {
  const horizontal = f === "N" || f === "S";
  return {
    north: horizontal ? "false" : "true",
    south: horizontal ? "false" : "true",
    east: horizontal ? "true" : "false",
    west: horizontal ? "true" : "false",
    waterlogged: "false",
  };
};

for (const [x, z, gr] of cells) {
  // Foundation below the cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const faces = exposedFaces(x, z);
  const edge = faces.length > 0;

  // Floor slabs, ground row and roof deck (interior)
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");
  if (gr + 5 < DECK) put(x, gr + 5, z, "light_gray_concrete");
  put(x, DECK, z, "light_gray_concrete");

  // Interior cells stay open air above the floor slabs (no interiors)
  if (!edge) {
    // Roof equipment on a central block of the roof
    if (x >= 4 && x <= 7 && z >= 8 && z <= 11 && (x + z) % 2 === 0) {
      put(x, T, z, "light_gray_concrete");
      put(x, T + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior wall shell
  for (let y = gr + 1; y <= DECK - 1; y++) put(x, y, z, "white_concrete");

  // Storey lines: quartz bands at lintel, floor, and sill of the second storey
  for (const yb of [gr + 4, gr + 5, gr + 9]) {
    if (yb < DECK) put(x, yb, z, "smooth_quartz");
  }

  // Cornice and parapet on the top edge
  put(x, DECK, z, "smooth_quartz");
  put(x, T, z, "white_concrete");

  const isCorner = faces.length > 1;
  if (isCorner) continue;

  const f = faces[0];
  const k = f === "N" || f === "S" ? x : z;

  // Entrance on the front face
  if (f === "N" && x === doorX && z === doorZ) {
    put(x, gr + 1, z, "oak_door", {
      facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 2, z, "oak_door", {
      facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, gr + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    continue;
  }

  // Shopfront glazing on the ground floor of the front face, otherwise every third bay
  const groundGlass = f === "N";
  const isWindow1 = groundGlass || k % 3 === 1;
  const isWindow2 = k % 3 === 1;

  if (isWindow1 && gr + 3 < DECK) {
    for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "glass_pane", paneProps(f));
  }
  if (isWindow2 && gr + 8 < DECK) {
    for (let y = gr + 6; y <= gr + 8; y++) put(x, y, z, "glass_pane", paneProps(f));
  }

  // Warm lights standing on the interior floor behind some windows
  const inner = {
    N: [x, z + 1], S: [x, z - 1], W: [x + 1, z], E: [x - 1, z],
  }[f];
  if (inner && has(inner[0], inner[1])) {
    const [ix, iz] = inner;
    if (isWindow1 && k % 6 === 1 && gr + 1 < DECK) {
      put(ix, gr + 1, iz, "glowstone");
    }
    if (isWindow2 && k % 6 === 4 && gr + 6 < DECK) {
      put(ix, gr + 6, iz, "shroomlight");
    }
  }
}

g.save(`${dir}/${id}.nbt`);

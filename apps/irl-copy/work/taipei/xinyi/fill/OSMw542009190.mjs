import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542009190";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Footprint lookup
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);
const groundOf = (x, z) => G.get(`${x},${z}`);

// Outward normals of exposed sides
const outward = (x, z) => {
  const f = [];
  if (!has(x - 1, z)) f.push([-1, 0]);
  if (!has(x + 1, z)) f.push([1, 0]);
  if (!has(x, z - 1)) f.push([0, -1]);
  if (!has(x, z + 1)) f.push([0, 1]);
  return f;
};
const isPerim = (x, z) => outward(x, z).length > 0;

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Facade role by absolute height: two storeys, cornice at 10, parapet to 11
const roleBlock = (y, gr, i) => {
  const pier = i % 3 === 0;
  if (y === gr) return "stone_bricks";                       // base course
  if (y > gr && y <= 3) return pier ? "white_concrete" : "glass"; // shopfront band
  if (y === 4) return "white_concrete";                      // lintel / storey line
  if (y === 5) return "smooth_stone";                        // floor line
  if (y >= 6 && y <= 8) return pier ? "white_concrete" : "glass"; // upper windows
  if (y === 9) return "white_concrete";                      // window head
  if (y === 10) return "stone_bricks";                       // cornice
  if (y === 11) return "white_concrete";                     // parapet
  return null;
};

// Main entrance on the southern (max z) face, centred on that row
const maxZ = Math.max(...cells.map(([, z]) => z));
const southXs = cells.filter(([x, z]) => z === maxZ).map(([x]) => x).sort((a, b) => a - b);
const doorX = southXs[Math.floor(southXs.length / 2)];

for (const [x, z, gr] of cells) {
  // Foundation: solid from 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = outward(x, z);
  if (f.length) {
    const [dx, dz] = f[0];
    const i = dx !== 0 ? z : x;
    const [ix, iz] = [x - dx, z - dz]; // inward neighbour
    for (let y = gr; y <= 11; y++) {
      const b = roleBlock(y, gr, i);
      if (!b) continue;
      put(x, y, z, b);
      // warm light behind some upper glass, in the interior cell
      if (y === 7 && b === "glass" && i % 6 === 1 && has(ix, iz) && !isPerim(ix, iz)) {
        put(ix, 7, iz, "glowstone");
      }
    }
  } else {
    // Interior: floor slabs and roof deck, no rooms
    if (gr < 5) put(x, 5, z, "smooth_stone");
    put(x, gr, z, "smooth_stone");
    if (gr <= 10) put(x, 10, z, "smooth_stone");
  }
}

// Entrance doors and transom on the south face
{
  const gr = groundOf(doorX, maxZ);
  const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(doorX, gr + 1, maxZ, "oak_door", { ...props, half: "lower" });
  put(doorX, gr + 2, maxZ, "oak_door", { ...props, half: "upper" });
  put(doorX, gr + 3, maxZ, "white_concrete");
}

// Roof plant: 2x2 mechanical boxes on the deck, away from the parapet
for (const [x, z, gr] of cells) {
  if (gr > 10 || isPerim(x, z)) continue;
  if (x % 6 !== 4 || z % 6 !== 4) continue;
  const block2 = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block2.every(([a, b]) => has(a, b) && !isPerim(a, b) && groundOf(a, b) <= 10)) continue;
  for (const [a, b] of block2) {
    put(a, 11, b, "light_gray_concrete");
    put(a, 12, b, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

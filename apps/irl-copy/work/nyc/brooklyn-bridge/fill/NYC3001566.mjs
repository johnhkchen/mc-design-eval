import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001566";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 22, D = 10;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Footprint membership
const key = (x, z) => `${x},${z}`;
const S = new Set(cells.map(c => key(c[0], c[1])));
const has = (x, z) => S.has(key(x, z));
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const isWallCell = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Base line: highest ground under the footprint; lower cells get a plinth up to it
const B = Math.max(...cells.map(c => c[2]));

// Flat roof tier from the median lidar roof height (smooths noise)
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
let Tc = Math.round(roofs[Math.floor(roofs.length / 2)]);
Tc = Math.min(Math.max(Tc, B + 5), H - 2);

// Storeys of 2 blocks above the base; parapet band above the last storey
const nSt = Math.floor((Tc - 1 - B) / 2);

// Street (north, low z) entrance: the non-corner north-exposed cell nearest the centre
const centreX = (minX + maxX) / 2;
let doorX = null;
for (const c of cells) {
  const x = c[0], z = c[1];
  if (z !== minZ) continue;
  if (x === minX || x === maxX) continue; // corners
  if (doorX === null || Math.abs(x - centreX) < Math.abs(doorX - centreX) ||
      (Math.abs(x - centreX) === Math.abs(doorX - centreX) && x < doorX)) doorX = x;
}

const doorProps = (half) => ({
  facing: "north", half, hinge: "left", open: "false", powered: "false"
});

for (const c of cells) {
  const x = c[0], z = c[1];
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const wall = n || s || w || e;
  const corner = (n || s) && (w || e);

  // Foundation / plinth up to the base line
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  if (!wall) {
    // Interior: one floor slab per storey, air between, roof deck on top
    for (let y = B; y <= Tc - 2; y++) {
      const k = y - B;
      if (k % 2 === 0 && k < 2 * nSt) put(x, y, z, "oak_planks");
    }
    put(x, Tc - 1, z, "smooth_stone");
    continue;
  }

  const face = n ? "n" : s ? "s" : w ? "w" : "e";
  const alongX = face === "n" || face === "s";
  const idx = alongX ? x - minX : z - minZ;
  const isDoor = face === "n" && !corner && x === doorX;
  const win = !corner && idx % 3 !== 0;

  for (let y = B; y <= Tc - 2; y++) {
    const k = y - B;
    if (corner) { put(x, y, z, "smooth_sandstone"); continue; }   // quoins
    if (k >= 2 * nSt) { put(x, y, z, "bricks"); continue; }        // parapet
    if (k % 2 === 0) {
      // string course / sill band; the door cell gets the lower door half
      if (isDoor && k === 0) put(x, y, z, "dark_oak_door", doorProps("lower"));
      else put(x, y, z, "smooth_sandstone");
    } else {
      // window row; the door cell gets the upper door half
      if (isDoor && k === 1) put(x, y, z, "dark_oak_door", doorProps("upper"));
      else if (win) {
        put(x, y, z, "glass_pane", alongX
          ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
        // warm light behind one window in three, inside the room
        if (idx % 3 === 1) {
          let dx = 0, dz = 0;
          if (face === "n") dz = 1; else if (face === "s") dz = -1;
          else if (face === "w") dx = 1; else dx = -1;
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !isWallCell(ix, iz)) put(ix, y, iz, "glowstone");
        }
      } else put(x, y, z, "bricks");
    }
  }

  // Cornice: cap course and a projecting slab on every wall cell
  put(x, Tc - 1, z, "smooth_sandstone");
  put(x, Tc, z, "smooth_sandstone_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance surround: a sandstone lintel above the door and stone-brick jambs
if (doorX !== null) {
  const zf = minZ;
  put(doorX, B + 2, zf, "smooth_sandstone");
  put(doorX - 1, B, zf, "stone_bricks");
  put(doorX + 1, B, zf, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);

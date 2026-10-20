import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1990s: two storeys on a granite plinth,
// white tiled facade with bands, shopfront with a red fascia, glass windows
// with light-behind-glass at dusk, and a rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833632";
const W = 20, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cellList = cells.map(([x, z, g]) => ({ x, z, g: Number(g) }));
const gmap = new Map(cellList.map((c) => [key(c.x, c.z), c]));
const inFp = (x, z) => gmap.has(key(x, z));

// Datum: highest ground under the footprint, clamped so the roof plant fits the canvas.
const maxG = Math.max(...cellList.map((c) => c.g));
const F = Math.min(maxG, 10);

// Outward faces of a footprint cell.
function faces(x, z) {
  const out = [];
  if (!inFp(x, z - 1)) out.push({ dx: 0, dz: -1, facing: "north", idx: x, along: "ew" });
  if (!inFp(x, z + 1)) out.push({ dx: 0, dz: 1, facing: "south", idx: x, along: "ew" });
  if (!inFp(x - 1, z)) out.push({ dx: -1, dz: 0, facing: "west", idx: z, along: "ns" });
  if (!inFp(x + 1, z)) out.push({ dx: 1, dz: 0, facing: "east", idx: z, along: "ns" });
  return out;
}
const isEdge = (x, z) => faces(x, z).length > 0;

const g = new Voxels([W, H, D]);

const paneProps = (along) =>
  along === "ew"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Plinth: solid from y 0 up to the datum under every footprint cell (no floating).
for (const c of cellList) {
  for (let y = 0; y < F; y++) g.set(c.x, y, c.z, "polished_granite");
}

// 2. Interior floor slabs and roof slab (interior cells stay air between them).
for (const c of cellList) {
  if (isEdge(c.x, c.z)) continue;
  g.set(c.x, F, c.z, "smooth_stone");
  g.set(c.x, F + 5, c.z, "smooth_stone");
  g.set(c.x, F + 10, c.z, "light_gray_concrete");
}

// 3. Facade: two storeys of 5 blocks, base course, shopfront, bands, cornice, parapet.
const glowSpots = [];
for (const c of cellList) {
  const fs = faces(c.x, c.z);
  if (fs.length === 0) continue;
  for (const f of fs) {
    for (let k = 0; k <= 11; k++) {
      const y = F + k;
      let b = null;
      let props;
      const winCol = f.idx % 3 === 1;
      if (k === 0) b = "polished_granite";
      else if (k <= 2) {
        if (winCol) { b = "light_gray_stained_glass_pane"; props = paneProps(f.along); }
        else b = "white_concrete";
      } else if (k === 3) b = "red_concrete";
      else if (k === 4) b = "smooth_quartz";
      else if (k === 5) b = "white_concrete";
      else if (k >= 6 && k <= 8) {
        if (winCol) { b = "gray_stained_glass_pane"; props = paneProps(f.along); }
        else b = "white_concrete";
      } else if (k === 9 || k === 10) b = "smooth_quartz";
      else if (k === 11) b = "white_concrete";
      if (b) {
        if (props) g.set(c.x, y, c.z, b, props);
        else g.set(c.x, y, c.z, b);
      }
      // Warm light one block behind some windows (in the air gap).
      const isWinRow = (k >= 1 && k <= 2) || (k >= 6 && k <= 8);
      if (isWinRow && winCol && (f.idx + k) % 4 === 0) {
        const ix = c.x - f.dx, iz = c.z - f.dz;
        if (inFp(ix, iz) && !isEdge(ix, iz)) glowSpots.push([ix, y, iz]);
      }
    }
  }
}
for (const [x, y, z] of glowSpots) g.set(x, y, z, "glowstone");

// 4. Entrance on the south (+z) face, near the middle of the frontage.
const front = cellList.filter((c) => !inFp(c.x, c.z + 1)).sort((a, b) => a.x - b.x);
if (front.length) {
  const d = front[Math.floor(front.length / 2)];
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  g.set(d.x, F + 1, d.z, "dark_oak_door", doorProps("lower"));
  g.set(d.x, F + 2, d.z, "dark_oak_door", doorProps("upper"));
}

// 5. Roof plant box on the roof, inside the footprint and away from the parapet.
for (const c of cellList) {
  if (isEdge(c.x, c.z)) continue;
  if (c.x >= 7 && c.x <= 12 && c.z >= 8 && c.z <= 12) {
    g.set(c.x, F + 11, c.z, "light_gray_concrete");
    g.set(c.x, F + 12, c.z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);

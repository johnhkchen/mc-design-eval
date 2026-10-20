import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557667";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 22 x 16 footprint, roof ~26 blocks above lowest ground, 5 storeys of 5 blocks.
// Read as a mid-1980s Taipei commercial office block: white-tiled concrete frame,
// bronze-tinted glass bands, granite base course, quartz spandrels, shopfront ground floor.
const W = 22, H = 38, D = 16;
const STOREY = 5;
const TOP = 25;       // top floor line (storey 5 base) is the roof cap, 26 blocks tall
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inFoot = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => inFoot.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Classify each footprint cell: which sides are open to the outside.
const edgeInfo = (x, z) => {
  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  return {
    mN, mS, mW, mE,
    edge: mN || mS || mW || mE,
    corner: (mN || mS) && (mW || mE),
  };
};

// Entrance: a south-facing edge cell nearest the middle of the frontage.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const e = edgeInfo(x, z);
    if (e.mS && !e.corner) {
      const d = Math.abs(x - W / 2);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

const glassProps = (e) =>
  (e.mN || e.mS)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floors, facades, parapet, roof plant.
for (const [x, z, gr] of cells) {
  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const e = edgeInfo(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;
  const idx = (e.mN || e.mS) ? x : z; // position along the wall

  for (let h = 0; h <= TOP; h++) {
    const y = gr + h;
    const s = Math.floor(h / STOREY);
    const r = h % STOREY;

    // Floor line / slab at every storey base, across all cells.
    if (r === 0) {
      if (e.edge && s === 0) put(x, y, z, "polished_granite");        // base course
      else if (e.edge) put(x, y, z, "white_concrete");               // storey line
      else put(x, y, z, "smooth_stone");                             // floor slab
      continue;
    }

    if (!e.edge) continue; // interior air

    if (e.corner) { put(x, y, z, "white_concrete"); continue; }     // corner pier

    const pier = idx % 3 === 0;

    if (s === 0) {
      // Shopfront ground floor.
      if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }     // lintel
      if (isDoor && r === 1) { // door lower half
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && r === 2) { // door upper half
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (isDoor && r === 3) { // hanging lantern over entrance
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass_pane", glassProps(e));
      continue;
    }

    // Upper storeys: spandrel, window band, lintel.
    if (r === 1) { put(x, y, z, "smooth_quartz"); continue; }       // spandrel
    if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }       // lintel / sill
    // r = 2 or 3: window band
    if (pier) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane", glassProps(e));
  }

  // Parapet on the outer edge, one block above the roof cap.
  if (e.edge) put(x, gr + TOP + 1, z, "white_concrete");

  // Roof cap on interior cells and rooftop plant.
  if (!e.edge) {
    if ((x + z) % 5 === 0) {
      put(x, gr + TOP + 1, z, "light_gray_concrete");
      put(x, gr + TOP + 2, z, "iron_bars");
    }
  }
}

// Pass 2: warm light behind some windows (glowstone set in the room just inside the glass).
for (const [x, z, gr] of cells) {
  const e = edgeInfo(x, z);
  if (!e.edge || e.corner) continue;
  const idx = (e.mN || e.mS) ? x : z;
  if (idx % 3 === 0) continue;
  let ix = x, iz = z;
  if (e.mN) iz = z + 1;
  else if (e.mS) iz = z - 1;
  else if (e.mW) ix = x + 1;
  else if (e.mE) ix = x - 1;
  if (!has(ix, iz)) continue;
  const ei = edgeInfo(ix, iz);
  if (ei.edge) continue;
  const igr = groundOf.get(key(ix, iz));
  for (let s = 1; s < 5; s++) {
    if ((x + z + s) % 4 !== 0) continue;
    put(ix, igr + s * STOREY + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);

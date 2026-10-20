import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${dir}/OSMw1038711391.cells.json`, "utf8"));

// Low-rise 1980s Xinyi commercial block: two storeys of tiled quartz-coloured
// concrete over a stone plinth, shopfront glazing at street level, a cornice
// and parapet, and a rooftop plant room.
const W = 14, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const ROOF = 10;   // roof slab / cornice course
const CAP = 11;    // parapet coping; roof reads at y 11 from the lowest ground
const LINE = 5;    // storey line between the two floors

const key = (x, z) => `${x},${z}`;
const groundOf = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => groundOf.has(key(x, z));

// Classify a footprint cell: is it on the outer shell, which face, and where
// along that face it sits (t) and which way is inward.
function edgeInfo(x, z) {
  if (!has(x - 1, z)) return { edge: true, side: "w", t: z, dx: 1, dz: 0, alongZ: true };
  if (!has(x + 1, z)) return { edge: true, side: "e", t: z, dx: -1, dz: 0, alongZ: true };
  if (!has(x, z - 1)) return { edge: true, side: "n", t: x, dx: 0, dz: 1, alongZ: false };
  if (!has(x, z + 1)) return { edge: true, side: "s", t: x, dx: 0, dz: -1, alongZ: false };
  return { edge: false };
}

// Glass pane whose connections follow the wall it sits in.
function pane(alongZ) {
  return alongZ
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

// Pass 1: foundation, walls, floors, roof and shopfronts.
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.min(gr0, 9));

  // Solid foundation from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const e = edgeInfo(x, z);

  for (let y = gr + 1; y <= CAP; y++) {
    let b = null;
    let props = null;

    if (y === CAP) {
      if (e.edge) b = "smooth_stone";                     // parapet coping
    } else if (y === ROOF) {
      b = e.edge ? "stone_bricks" : "smooth_quartz";      // cornice / roof slab
    } else if (y === LINE) {
      b = "smooth_stone";                                  // floor line (edge and interior)
    } else if (!e.edge) {
      b = null;                                            // interior air gap
    } else {
      const pier = e.t % 3 === 0;
      if (y === gr + 1 && y <= 4) {
        b = "stone_bricks";                                // plinth course
      } else if (y <= 4) {
        // Ground storey: shopfront glazing between piers.
        if (y === 2 || y === 3) {
          if (!pier) b = "glass";
          else b = "stone_bricks";
        } else {
          b = "smooth_quartz";                             // spandrel above shopfront
        }
      } else {
        // Upper storey: punched window grid of panes with quartz frames.
        if (y === 7 || y === 8) {
          if (!pier) { b = "glass_pane"; props = pane(e.alongZ); }
          else b = "smooth_quartz";
        } else {
          b = pier ? "stone_bricks" : "smooth_quartz";
        }
      }

      // Entrance on the north face: glazed doorway with a dark lintel.
      if (e.side === "n" && (e.t === 6 || e.t === 7)) {
        if (y === 2 || y === 3) b = "glass";
        if (y === 4) b = "dark_oak_planks";
      }
    }

    if (b) {
      if (props) g.set(x, y, z, b, props);
      else g.set(x, y, z, b);
    }
  }
}

// Pass 2: warm lights just inside some upper-storey windows.
for (const [x, z, gr0] of cells) {
  const e = edgeInfo(x, z);
  if (!e.edge) continue;
  if (e.t % 6 !== 2) continue;
  if (e.side === "n" || e.side === "s") {
    // fall through to the same test below
  }
  const ix = x + e.dx, iz = z + e.dz;
  if (!has(ix, iz)) continue;
  if (edgeInfo(ix, iz).edge) continue;
  const gr = Math.max(0, Math.min(gr0, 9));
  if (7 <= gr) continue;
  g.set(ix, 7, iz, "glowstone");
}

// Pass 3: rooftop plant room on the interior of the roof, with a cap.
for (const [x, z] of cells) {
  const e = edgeInfo(x, z);
  if (e.edge) continue;
  if (x < 4 || x > 9 || z < 5 || z > 13) continue;
  g.set(x, 11, z, "light_gray_concrete");
  g.set(x, 12, z, "light_gray_concrete");
  g.set(x, 13, z, "smooth_stone");
}

g.save(`${dir}/OSMw1038711391.nbt`);

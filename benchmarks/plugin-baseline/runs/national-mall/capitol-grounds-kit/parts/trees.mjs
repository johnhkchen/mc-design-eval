// Trees and planting (plan.md part 5): oak trees on the trunk table, hedge beds with hidden shroomlights.
// Trees are placed into air only (oakTree / hedgeBed refuse anything else), so the walks, terrace and statues built
// before this part keep their cells. Crowns are clipped at the view corridor z 44..80 (plan: nothing in the corridor).
import { oakTree, hedgeBed } from "../vocab.mjs";

const CORRIDOR_Z = [44, 80];

// Trunk centres from plan.md's Trees table. Groups are listed as the plan gives them; the south grove is the north
// grove mirrored about z 62 (z' = 124 - z), and the lawn-edge groups are listed with their own mirrors.
const NORTH_GROVE = [[78, 8], [90, 5], [104, 9], [117, 6], [131, 10], [143, 6], [152, 15], [96, 15], [125, 16], [140, 17], [75, 18]];
const NORTH_LAWN = [[110, 32], [128, 36], [146, 42], [86, 38]];
const WEST_CORNERS = [[6, 4], [12, 118], [65, 5], [66, 119], [8, 40], [8, 84]];
const TERRACE_CORNERS = [[156, 10], [156, 114]];

const mirrorZ = (pts) => pts.map(([x, z]) => [x, 124 - z]);

// Trunk height 5..7 and crown radius 4 for the groves; the terrace corners get radius 3 so the crown stays off the wall.
function treeList() {
  const big = [...NORTH_GROVE, ...mirrorZ(NORTH_GROVE), ...NORTH_LAWN, ...mirrorZ(NORTH_LAWN)];
  const list = big.map(([x, z], i) => ({ x, z, h: 5 + (i % 3), r: 4 }));
  list.push(...WEST_CORNERS.map(([x, z], i) => ({ x, z, h: 6 + (i % 2), r: 4 })));
  list.push(...TERRACE_CORNERS.map(([x, z]) => ({ x, z, h: 6, r: 3 })));
  return list;
}

// The ground part owns each column's top block H (grass) and runParts locks it, so two writes at H would be refused:
// oakTree's podzol / rooted_dirt soil patch, and hedgeBed's moss_block base. Both are dropped here and counted, so
// the trunks, crowns and hedges still land. The grid is wrapped (Object.create), so reads go through to the real grid.
// A moss base for the four beds belongs in the ground part (plan 11): the ground there is grass until it is changed.
const DROPPED = new Set(["podzol", "rooted_dirt", "moss_block"]);
// Also: no shroomlight in the view corridor (oakTree's light sits one cell off the trunk, which can fall in z 44..80),
// and an optional x limit (maxX) keeps a crown off a wall it would touch.
function withoutGroundTop(g, counter, { maxX = Infinity } = {}) {
  const w = Object.create(g);
  w.set = (x, y, z, block, state, ...rest) => {
    const id = String(block).replace("minecraft:", "");
    if (DROPPED.has(id)) { counter.dropped++; return; }
    if (x > maxX || (id === "shroomlight" && z >= CORRIDOR_Z[0] && z <= CORRIDOR_Z[1])) { counter.clipped++; return; }
    return g.set(x, y, z, block, state, ...rest);
  };
  return w;
}

export function build(g) {
  let placed = 0, refused = 0;
  const counter = { dropped: 0, clipped: 0 };
  const tg = withoutGroundTop(g, counter);
  for (const t of treeList()) {
    // the terrace-corner crowns stop at x 157, short of the Tier 1 face at x 158/159
    const tt = t.x === 156 ? withoutGroundTop(g, counter, { maxX: 157 }) : tg;
    const res = oakTree(tt, t.x, t.z, t.h, t.r, { clearZ: CORRIDOR_Z });
    placed += res.cells?.length ?? 0;
    refused += res.refused?.length ?? 0;
  }
  // Planting beds at the foot of Tier 1 (plan 11): clear of the stair openings at z 33..39, 52..58, 65..71, 85..91.
  const beds = [[155, 15, 158, 31], [155, 41, 158, 50], [155, 74, 158, 83], [155, 93, 158, 109]];
  for (const [x0, z0, x1, z1] of beds) hedgeBed(tg, x0, z0, x1, z1);
  console.log(`trees: ${treeList().length} trees, ${placed} cells placed, ${refused} refused by the tree helper (non-air: walls, terrace); ${counter.dropped} ground-top writes left to the ground part, ${counter.clipped} clipped (corridor light, terrace face)`);
}

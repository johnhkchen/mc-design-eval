// P3 West front and towers (plan.md PARTS): the three west portals with doors, the Gallery of Kings, string courses,
// the west rose, the towers' blind lancets, the Grand Gallery colonnade, the chimera balustrade and gargoyles, the
// tower parapets with corner pinnacles (to y 97, flat tops) and hanging lanterns under the gallery cornice.
// The belfry lancets' louvres and black panes are already set by P1's belfryLancet (frame + fill in one call).
// Every helper runs on a view that reads "not air" outside the FOOTPRINT, so nothing leaves the plot.
import {
  inFootprint, portal, kingNiche, stringCourse, roseWindow, colonnade, balustrade, gargoyle,
} from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

function view(g) {
  return new Proxy(g, {
    get(t, k) {
      if (k === "isAir") return (x, y, z) => inFootprint(x, z) && t.isAir(x, y, z);
      const v = t[k];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
// set only into air inside the footprint
const put = (g, x, y, z, ...b) => {
  if (g.inBounds(x, y, z) && inFootprint(x, z) && g.isAir(x, y, z)) g.set(x, y, z, ...b);
};

const TOWERS = [[10, 30], [46, 66]];          // z ranges of M1 / M2 (x 2..22)

// A blind lancet in relief on the tower's west face (the shell left the wall solid there): a cut_sandstone frame
// standing 1 proud at x 1 round z0..z0+2, y y0..y1, a pointed head of upside-down stairs and a slab sill.
function blindLancet(g, z0, y0 = 32, y1 = 45) {
  const x = 1;
  put(g, x, y0 - 1, z0 - 1, ...B.slab("smooth_sandstone", "top"));
  for (let z = z0; z <= z0 + 2; z++) put(g, x, y0 - 1, z, ...B.slab("smooth_sandstone", "top"));
  put(g, x, y0 - 1, z0 + 3, ...B.slab("smooth_sandstone", "top"));
  for (let y = y0; y <= y1; y++) { put(g, x, y, z0 - 1, "cut_sandstone"); put(g, x, y, z0 + 3, "cut_sandstone"); }
  put(g, x, y1 - 1, z0, ...B.stairs("smooth_sandstone", "north", "top"));
  put(g, x, y1 - 1, z0 + 2, ...B.stairs("smooth_sandstone", "south", "top"));
  put(g, x, y1, z0, "cut_sandstone"); put(g, x, y1, z0 + 2, "cut_sandstone");
  put(g, x, y1, z0 + 1, "chiseled_sandstone");
  put(g, x, y1 + 1, z0 + 1, ...B.stairs("smooth_sandstone", "east", "bottom"));
}

export function build(g) {
  const v = view(g);

  // ---- the three west portals (P1 left their boxes as holes; same parameters fill them) ----
  portal(v, { at: [6, 3, 38], face: "west", w: 7, h: 12, archTop: 20, rings: 5, trumeau: true });
  portal(v, { at: [6, 3, 21], face: "west", w: 5, h: 10, archTop: 18, rings: 5 });
  portal(v, { at: [6, 3, 55], face: "west", w: 5, h: 10, archTop: 18, rings: 5 });

  // ---- Gallery of Kings: 28 niches, even z 12..64 ----
  for (let z = 12; z <= 64; z += 2) kingNiche(v, { z, y0: 23 });
  // the odd front cells between the niches below the hoods stay as pilasters' shadow: fill the hood row's gaps
  for (let z = 13; z <= 63; z += 2) put(g, 2, 27, z, ...B.stairs("smooth_sandstone", "east", "top"));

  // ---- string courses 21..22 and 29, 1 proud at x 1, only in front of solid wall (never across a portal) ----
  const front = (y) => { const c = []; for (let z = 12; z <= 64; z++) if (!g.isAir(2, y, z)) c.push([1, z]); return c; };
  stringCourse(v, { cells: front(21), y: 21, face: "west" });
  for (const [x, z] of front(22)) put(g, x, 22, z, ...B.slab("cut_sandstone", "bottom"));
  stringCourse(v, { cells: front(29), y: 29, face: "west" });

  // ---- west rose: glass plane x 3 (-1), the front ring at x 2 closed round it ----
  roseWindow(v, { center: [3, 39, 38], plane: "x", r: 6, glass: true, frame: 6 });
  roseWindow(v, { center: [2, 39, 38], plane: "x", r: 6, glass: false });

  // ---- blind lancets on each tower's west face, y 32..45 ----
  for (const z0 of [15, 23, 51, 59]) blindLancet(g, z0);

  // ---- Grand Gallery: colonnade x 2, walk x 3, cornices 47 / 57 ----
  colonnade(v, { x: 2, z0: 12, z1: 64, y0: 48, y1: 56, step: 2, face: "west" });
  for (let z = 12; z <= 64; z++) {
    put(g, 3, 47, z, "smooth_sandstone");                                   // the gallery's walk
    put(g, 3, 57, z, ...B.slab("cut_sandstone", "top"));               // its ceiling / top cornice
  }
  // hanging lanterns under the top cornice, one per west buttress
  for (const z of [13, 30, 46, 63]) put(g, 3, 56, z, ...B.lantern(true));

  // ---- chimera gallery: balustrade y 58 over the centre (z 31..45) and along the tower fronts' cornice ----
  const chim = [];
  for (let z = 12; z <= 64; z++) if (!g.isAir(2, 57, z) && g.isAir(2, 58, z)) chim.push([2, z]);
  balustrade(v, { cells: chim, y: 58, posts: 4 });
  // chimeras (gargoyles) at the 8 tower corners, y 58
  for (const [x, z, face] of [
    [6, 10, "north"], [21, 10, "north"], [6, 66, "south"], [21, 66, "south"],
    [4, 30, "south"], [21, 30, "south"], [4, 46, "north"], [21, 46, "north"],
  ]) gargoyle(v, { x, z, y: 58, face });

  // ---- tower tops: corner pinnacles (2x2, y 96..97), then the openwork parapet on the rest of the rim ----
  for (const [zA, zB] of TOWERS) {
    const notch = zA === 10 ? [10, 11] : [65, 66];
    const inTower = (x, z) => x >= 2 && x <= 22 && z >= zA && z <= zB && !(x < 5 && z >= notch[0] && z <= notch[1]);
    const corners = zA === 10
      ? [[2, 12], [5, 10], [21, 10], [21, 29], [2, 29]]
      : [[2, 46], [21, 46], [21, 65], [5, 65], [2, 63]];
    for (const [cx, cz] of corners) {
      for (const [dx, dz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const x = cx + dx, z = cz + dz;
        put(g, x, 96, z, "cut_sandstone");
        // a little pyramid: each stair's back toward the pinnacle's centre
        const f = dx === 0 ? "east" : "west";
        put(g, x, 97, z, ...B.stairs("smooth_sandstone", f, "bottom"));
      }
    }
    const rim = [];
    for (let x = 2; x <= 22; x++) for (let z = zA; z <= zB; z++) {
      if (!inTower(x, z) || g.isAir(x, 95, z) || !g.isAir(x, 96, z)) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inTower(x + dx, z + dz))) rim.push([x, z]);
    }
    balustrade(v, { cells: rim, y: 96, posts: 3 });
    for (const [x, z] of rim) if (!g.isAir(x, 96, z)) put(g, x, 97, z, ...B.slab("cut_sandstone", "bottom"));
  }
}

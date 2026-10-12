// P4 glazing and window dressing (plan.md PARTS 4; elements 2, 6, 8, 19, 20). Fills the plan's OPENINGS with glass,
// casings, sills and hoods (vocab window / hoodPair / hoodSingle / sill), the entry door and transom, the garage door
// panels, the rear French doors and windows, and the skylight glass. Writes only into air: a cell an earlier part
// already holds is skipped and listed (plan.md NOTES), so this part never replaces or carves.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { PANE, GLASS, PLUM, window, sill, hoodSingle, entryDoor, garageDoor } from "../vocab.mjs";

const span = (a, b) => {
  const out = [];
  for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
  return out;
};

/** airOnly(g, skipped): a view of g whose set() writes only into air; occupied cells are pushed to `skipped`. */
function airOnly(g, skipped) {
  const view = new Proxy(g, {
    get(target, prop) {
      if (prop === "set") {
        return (x, y, z, ...rest) => {
          if (target.isAir(x, y, z)) target.set(x, y, z, ...rest);
          else skipped.push(`${x},${y},${z}`);
          return view;
        };
      }
      const v = Reflect.get(target, prop);
      return typeof v === "function" ? v.bind(target) : v;
    },
  });
  return view;
}

/**
 * diagonal(x, y0, y1, z): a bay diagonal single window (plan OPENINGS): glass, a cream sill and a single cream hood.
 * No casing: the cells beside it on the face row are bay wall, so the window() casing would land in the wall.
 */
function diagonal(g, x, y0, y1, z) {
  for (const y of span(y0, y1)) g.set(x, y, z, ...B.pane(PANE));
  sill(g, x, x, y0 - 1, z - 1);
  hoodSingle(g, x, y1 + 1, z - 1);
}

export function build(g) {
  const skipped = [];
  const w = airOnly(g, skipped);

  // North bay face (z=4) and diagonals (plan OPENINGS): S1 y5..7, S2 y10..12, S3 y14..15 (storey 3 hood = flat slab)
  window(w, 4, 5, 5, 7, 4);
  diagonal(w, 2, 5, 7, 5);
  diagonal(w, 7, 5, 7, 5);
  diagonal(w, 1, 5, 7, 6);
  diagonal(w, 8, 5, 7, 6);

  window(w, 4, 5, 10, 12, 4);
  diagonal(w, 2, 10, 12, 5);
  diagonal(w, 7, 10, 12, 5);
  diagonal(w, 1, 10, 12, 6);
  diagonal(w, 8, 10, 12, 6);

  window(w, 4, 5, 14, 15, 4, "north", { hood: "slab" });
  diagonal(w, 2, 14, 15, 5);
  diagonal(w, 7, 14, 15, 5);
  diagonal(w, 1, 14, 15, 6);
  diagonal(w, 8, 14, 15, 6);

  // North over the porch (z=7): S2 pair with a stair hood at y13 (z=6), S3 pair with a flat slab hood at y16
  window(w, 11, 12, 10, 12, 7);
  window(w, 11, 12, 14, 15, 7, "north", { hood: "slab" });

  // Entry (plan OPENINGS): two crimson doors in the back wall z=10, a glass pane above them at y7, transom at y8
  entryDoor(w);
  for (const x of [11, 12]) w.set(x, 7, 10, ...B.pane(PANE));

  // Garage door: plum panels in the plinth opening x3..6 y1..3 z=4, cream lintel at y4 z=3
  garageDoor(w);

  // Rear (z=30, south face): French doors x7..8 y5..6 with glass above (y7) and a flat hood at y8; windows with flat
  // hoods one cell proud (z=31). The garage-level window gets glass only: the deck planks sit at y4 over z31.
  for (const [x, hinge] of [[7, "left"], [8, "right"]]) {
    w.set(x, 5, 30, ...B.door(PLUM, "south", "lower", hinge));
    w.set(x, 6, 30, ...B.door(PLUM, "south", "upper", hinge));
  }
  window(w, 7, 8, 5, 7, 30, "south");
  window(w, 3, 4, 6, 7, 30, "south");
  window(w, 3, 4, 10, 12, 30, "south");
  window(w, 11, 12, 10, 12, 30, "south");
  window(w, 3, 4, 14, 15, 30, "south");
  window(w, 11, 12, 14, 15, 30, "south");
  for (const x of [3, 4]) w.set(x, 3, 30, ...B.pane(PANE));

  // Skylight glass in the deck opening x6..9 z15..17 y17 (the curb is the roof part's)
  for (const x of span(6, 9)) for (const z of span(15, 17)) w.set(x, 17, z, GLASS);

  if (skipped.length) console.log(`# openings: ${skipped.length} cells already set (shared hood/sill cells, or earlier parts), left alone: ${skipped.join(" ")}`);
}

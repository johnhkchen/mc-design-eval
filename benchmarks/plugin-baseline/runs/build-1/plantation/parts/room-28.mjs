// Part 35: room: upper porch (interior furnisher + lamplighter). The gallery is furnished as text (one layer per y) and
// placed with layers(). Rows run along +x from x26 (the first free column past the x25 end balustrade) to x69, one row
// per z from z35 (the balustrade row, left empty) to z41 (the shutter row in front of the wall, left empty for the
// doorway lane and the window bays). Furniture is kept to the z36..z39 band; the focal table sits on the door axis x47.5.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 26;
const Z0 = 35;
const X1 = 69;
const Z1 = 41;

// Sparse cells ("x,z" -> character) to rows of text over the gallery's free columns.
function draw(cells) {
  const rows = [];
  for (let z = Z0; z <= Z1; z++) {
    let row = "";
    for (let x = X0; x <= X1; x++) row += cells[`${x},${z}`] ?? " ";
    rows.push(row);
  }
  return rows;
}

// Mirror pairs about x = 47.5 (x <-> 95 - x), so the room is symmetric about the door axis.
function mirror(list) {
  return list.flatMap(([x, z, ch]) => [[x, z, ch], [95 - x, z, ch]]);
}
function place(cells, list) {
  for (const [x, z, ch] of list) cells[`${x},${z}`] = ch;
  return cells;
}

export function build(g) {
  // Floor layer, y11: planters at the bay ends, rocking chairs and side barrels on row z38 facing north (toward the
  // drive), a red rug under the focal pair on z37. Barrels are the side tables; the focal pair of barrels is the table.
  const floor = place({}, [
    ...mirror([[27, 36, "P"], [34, 36, "P"], [40, 36, "P"]]),
    ...mirror([[35, 38, "C"], [41, 38, "C"], [46, 38, "C"]]),
    ...mirror([[36, 38, "B"], [40, 38, "B"]]),
    [47, 38, "B"], [48, 38, "B"],
    [46, 37, "R"], [47, 37, "R"], [48, 37, "R"], [49, 37, "R"],
    // lamp posts: a dark oak fence post with a standing lantern on top, one per ~9 cells along the rail row
    [30, 38, "Q"], [39, 38, "Q"], [56, 38, "Q"], [65, 38, "Q"],
  ]);

  layers(g, [X0, 11, Z0], {
    R: "red_carpet",
    P: "decorated_pot",
    C: ["dark_oak_stairs", { facing: "south", half: "bottom" }],
    B: "barrel",
    Q: "dark_oak_fence",
  }, draw(floor));

  // Table layer, y12: a flower pot on each side table, lit candles on the inner tables, and a standing lantern on the
  // focal barrel and on each lamp post. Standing lanterns sit low (feet 1 below), so they light the bays and the rail
  // rows best: each lamp reaches about 4 cells along the rail row and the bays behind it.
  const table = place({}, [
    [36, 38, "F"], [59, 38, "F"],
    [40, 38, "c"], [55, 38, "c"], [48, 38, "c"],
    [47, 38, "L"], [30, 38, "L"], [39, 38, "L"], [56, 38, "L"], [65, 38, "L"],
  ]);
  layers(g, [X0, 12, Z0], {
    F: "flower_pot",
    c: ["candle", { candles: "1", lit: "true" }],
    L: ["lantern", { hanging: "false" }],
  }, draw(table));

  // Lamplighter, y11: standing lanterns on the deck (y10). The west-east pair in the shutter row (z41) lifts the
  // gallery's end bays; one lantern at (47, 39) in front of the focal table lifts the three dim cells that were left
  // in the centre bays (x43, x51, x52 on z41). Nothing is placed over a fence or shutter.
  const lamps = place({}, [...mirror([[28, 41, "L"]]), [47, 39, "L"]]);
  layers(g, [X0, 11, Z0], {
    L: ["lantern", { hanging: "false" }],
  }, draw(lamps));
}

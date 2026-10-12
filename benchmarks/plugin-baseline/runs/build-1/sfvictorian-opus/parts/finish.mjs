// Part 6: doors and lights. A birch_door in every interior doorway (plan OPENINGS, the cased openings stay doorless),
// the hall's three hanging lamps from the slab above, and one hanging lantern in the garage. Adds into air only.
import { door, hangLamp, HALL_LAMPS } from "../vocab.mjs";

// [x, y, z, facing]: lower half at y, upper at y+1. A door in an east-west wall (z fixed) faces north or south; a door in
// a north-south wall (x fixed) faces east or west.
const INTERIOR_DOORS = [
  // base: garage / laundry partition z19
  [7, 1, 19, "north"],
  // main: hall to dining (x10), dining to kitchen (z25), hall to kitchen (z25)
  [10, 5, 21, "east"],
  [7, 5, 25, "north"],
  [12, 5, 25, "north"],
  // 2nd: front bedroom to upper hall (x10), sewing room to upper hall (z10), bathroom to upper hall (x10),
  // back bedroom to upper hall (z25)
  [10, 9, 12, "east"],
  [12, 9, 10, "south"],
  [10, 9, 21, "east"],
  [12, 9, 25, "north"],
  // top: studio to top landing (z18), attic bedroom to top landing (z25)
  [11, 13, 18, "south"],
  [12, 13, 25, "north"],
];

// Garage: one hanging lantern in the middle of the room, off the car bay, under the main floor slab (y4).
const GARAGE_LANTERN = [9, 3, 11];

export function build(g) {
  for (const [x, y, z, facing] of INTERIOR_DOORS) door(g, x, y, z, facing, "left", "birch");
  for (const [x, y, z] of HALL_LAMPS) hangLamp(g, x, y, z);
  hangLamp(g, ...GARAGE_LANTERN);
}

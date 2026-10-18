// Part "glazing, doors, shutters" (plan.md PARTS 5): every window, door, sidelight, fanlight, shutter and window box
// listed in plan.md OPENINGS and the Winona window boxes of elements.md. Absolute coordinates. Writes go only into air
// (a cell an earlier part built is refused and reported). Windows use the vocabulary helpers (windowPair, windowTriple,
// doorSet, shutterPair, windowBox); single panes (sidelights, fanlights, a 1-wide vent) use pane() below.
import { windowPair, windowTriple, doorSet, shutterPair, windowBox } from "../vocab.mjs";

// one glass pane in a wall line: connects east and west along a north or south wall, north and south along an east or
// west wall (the same states windowPair sets), and only into air
function pane(g, x, y, z, face = "north") {
  if (!g.isAir(x, y, z)) return 0;
  const ew = face === "east" || face === "west";
  const state = ew
    ? { east: "false", west: "false", north: "true", south: "true" }
    : { east: "true", west: "true", north: "false", south: "false" };
  g.set(x, y, z, "glass_pane", state);
  return 1;
}

// the sidelights and the fanlight of a door: glass beside it at y and y+1, or above it
function sidelights(g, xs, y, z, face) {
  for (const x of xs) for (const dy of [0, 1]) pane(g, x, y + dy, z, face);
}

export function build(g) {
  // ---- plot 0 Magnolia: symmetric front, portico, balcony; sides; back ----
  // N z13: ground pairs x3..4 and x11..12, sidelights x6 and x9, double door x7..8, fanlight x7..8 y4
  windowPair(g, { x: 3, y: 2, z: 13, face: "north" });
  windowPair(g, { x: 11, y: 2, z: 13, face: "north" });
  sidelights(g, [6, 9], 2, 13, "north");
  doorSet(g, { x: 7, y: 2, z: 13, face: "north", wood: "dark_oak", hinge: "left", double: true });
  pane(g, 7, 4, 13, "north");
  pane(g, 8, 4, 13, "north");
  // upper: pairs x3..4 and x11..12, singles x6 and x9, French double door x7..8 to the balcony
  windowPair(g, { x: 3, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 11, y: 6, z: 13, face: "north" });
  pane(g, 6, 6, 13, "north");
  pane(g, 6, 7, 13, "north");
  pane(g, 9, 6, 13, "north");
  pane(g, 9, 7, 13, "north");
  doorSet(g, { x: 7, y: 6, z: 13, face: "north", wood: "dark_oak", hinge: "left", double: true });
  // shutters at x2, x5, x10, x13 on z12, both floors
  for (const y of [2, 6]) {
    shutterPair(g, { x0: 2, x1: 5, y, z: 12, face: "north", trap: "dark_oak" });
    shutterPair(g, { x0: 10, x1: 13, y, z: 12, face: "north", trap: "dark_oak" });
  }
  // W x2 / E x13: pairs z14..15 and z19..20, both floors (the chimney sits between them at z16..18)
  for (const z of [14, 19]) {
    windowPair(g, { x: 2, y: 2, z, face: "west" });
    windowPair(g, { x: 2, y: 6, z, face: "west" });
    windowPair(g, { x: 13, y: 2, z, face: "east" });
    windowPair(g, { x: 13, y: 6, z, face: "east" });
  }
  // S z21: pairs x4..5 and x10..11, both floors; back door x8
  windowPair(g, { x: 4, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 10, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 4, y: 6, z: 21, face: "south" });
  windowPair(g, { x: 10, y: 6, z: 21, face: "south" });
  doorSet(g, { x: 8, y: 2, z: 21, face: "south", wood: "dark_oak" });

  // ---- plot 1 Alhambra: arcade bays behind the arches, parapet vent, back door ----
  // N z13: ground pairs x20..21 and x26..27, double door x23..24 (behind the centre arch)
  windowPair(g, { x: 20, y: 2, z: 13, face: "north" });
  windowPair(g, { x: 26, y: 2, z: 13, face: "north" });
  doorSet(g, { x: 23, y: 2, z: 13, face: "north", wood: "spruce", hinge: "left", double: true });
  // upper: pairs x19..20, x23..24, x27..28
  windowPair(g, { x: 19, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 23, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 27, y: 6, z: 13, face: "north" });
  // parapet vent: a 1x1 pane pair at x23..24 y11 (the parapet body is the porches part's; air only)
  pane(g, 23, 11, 13, "north");
  pane(g, 24, 11, 13, "north");
  // W x18 / E x29: pairs z15..16 and z18..19, both floors
  for (const z of [15, 18]) {
    windowPair(g, { x: 18, y: 2, z, face: "west" });
    windowPair(g, { x: 18, y: 6, z, face: "west" });
    windowPair(g, { x: 29, y: 2, z, face: "east" });
    windowPair(g, { x: 29, y: 6, z, face: "east" });
  }
  // S z21: pair x20..21 both floors; back door x24
  windowPair(g, { x: 20, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 20, y: 6, z: 21, face: "south" });
  doorSet(g, { x: 24, y: 2, z: 21, face: "south", wood: "spruce" });

  // ---- plot 2 Vallonia: ground triples, door, gabled dormer, side pairs, back ----
  // N z13: triples x36..38 and x42..44, door x40
  windowTriple(g, { x: 36, y: 2, z: 13, face: "north" });
  windowTriple(g, { x: 42, y: 2, z: 13, face: "north" });
  doorSet(g, { x: 40, y: 2, z: 13, face: "north", wood: "spruce" });
  // dormer face z11: triple x39..41 y10..11
  windowTriple(g, { x: 39, y: 10, z: 11, face: "north" });
  // W x35 / E x45: pairs z14..15 and z19..20 (ground), gable pair z16..17 y6..7 on both ends
  for (const z of [14, 19]) {
    windowPair(g, { x: 35, y: 2, z, face: "west" });
    windowPair(g, { x: 45, y: 2, z, face: "east" });
  }
  // the west gable pair moves to z18..19: at z16..17 it looked straight into the chimney flue at x34, which must stay walled
  windowPair(g, { x: 35, y: 6, z: 18, face: "west" });
  windowPair(g, { x: 45, y: 6, z: 16, face: "east" });
  // S z21: pairs x37..38 and x42..43; back door x40
  windowPair(g, { x: 37, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 42, y: 2, z: 21, face: "south" });
  doorSet(g, { x: 40, y: 2, z: 21, face: "south", wood: "spruce" });

  // ---- plot 3 Puritan: ground pairs, door, shed dormer ribbon, gambrel ends, back door ----
  // N z13: ground pairs x52..53 and x59..60, door x56; shutters z12 at x51, x54, x58, x61 (green warped trapdoors)
  windowPair(g, { x: 52, y: 2, z: 13, face: "north" });
  windowPair(g, { x: 59, y: 2, z: 13, face: "north" });
  doorSet(g, { x: 56, y: 2, z: 13, face: "north", wood: "oak" });
  shutterPair(g, { x0: 51, x1: 54, y: 2, z: 12, face: "north", trap: "warped" });
  shutterPair(g, { x0: 58, x1: 61, y: 2, z: 12, face: "north", trap: "warped" });
  // shed dormer face z13: two pairs x54..55 and x57..58, y6..7
  windowPair(g, { x: 54, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 57, y: 6, z: 13, face: "north" });
  // W x51 / E x61: ground pairs z14..15 and z19..20; gambrel end pairs (E z17..18, W z19..20) y6..7
  for (const z of [14, 19]) {
    windowPair(g, { x: 51, y: 2, z, face: "west" });
    windowPair(g, { x: 61, y: 2, z, face: "east" });
  }
  windowPair(g, { x: 61, y: 6, z: 17, face: "east" });
  windowPair(g, { x: 51, y: 6, z: 19, face: "west" });
  // S z21: ground pair x53..54; back door x58
  windowPair(g, { x: 53, y: 2, z: 21, face: "south" });
  doorSet(g, { x: 58, y: 2, z: 21, face: "south", wood: "oak" });

  // ---- plot 4 Cornell: front pairs, sidelights, triple, hipped dormer, sides, back ----
  // N z13: ground pairs x68..69 and x75..76, sidelights x71 and x73, door x72; upper pairs x68..69 and x75..76, triple x71..73
  windowPair(g, { x: 68, y: 2, z: 13, face: "north" });
  windowPair(g, { x: 75, y: 2, z: 13, face: "north" });
  sidelights(g, [71, 73], 2, 13, "north");
  doorSet(g, { x: 72, y: 2, z: 13, face: "north", wood: "dark_oak" });
  windowPair(g, { x: 68, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 75, y: 6, z: 13, face: "north" });
  windowTriple(g, { x: 71, y: 6, z: 13, face: "north" });
  // hipped dormer face z14: triple x71..73 y11..12
  windowTriple(g, { x: 71, y: 11, z: 14, face: "north" });
  // W x67 / E x77: pairs z14..15 and z19..20 both floors
  for (const z of [14, 19]) {
    windowPair(g, { x: 67, y: 2, z, face: "west" });
    windowPair(g, { x: 67, y: 6, z, face: "west" });
    windowPair(g, { x: 77, y: 2, z, face: "east" });
    windowPair(g, { x: 77, y: 6, z, face: "east" });
  }
  // S z21: pairs x69..70 and x74..75 both floors; back door x72
  windowPair(g, { x: 69, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 74, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 69, y: 6, z: 21, face: "south" });
  windowPair(g, { x: 74, y: 6, z: 21, face: "south" });
  doorSet(g, { x: 72, y: 2, z: 21, face: "south", wood: "dark_oak" });

  // ---- plot 5 Stanford: centred door, shuttered pairs, side gable pairs, back ----
  // N z14: pairs x84..85 and x91..92, door x88; shutters z13 at x83, x86, x90, x93 (dark oak)
  windowPair(g, { x: 84, y: 2, z: 14, face: "north" });
  windowPair(g, { x: 91, y: 2, z: 14, face: "north" });
  doorSet(g, { x: 88, y: 2, z: 14, face: "north", wood: "spruce" });
  shutterPair(g, { x0: 83, x1: 86, y: 2, z: 13, face: "north", trap: "dark_oak" });
  shutterPair(g, { x0: 90, x1: 93, y: 2, z: 13, face: "north", trap: "dark_oak" });
  // W x83 / E x93: ground pair z15..16, gable pair z17..18 y7..8
  windowPair(g, { x: 83, y: 2, z: 15, face: "west" });
  windowPair(g, { x: 93, y: 2, z: 15, face: "east" });
  windowPair(g, { x: 83, y: 7, z: 17, face: "west" });
  windowPair(g, { x: 93, y: 7, z: 17, face: "east" });
  // S z21: pairs x85..86 and x90..91; back door x88
  windowPair(g, { x: 85, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 90, y: 2, z: 21, face: "south" });
  doorSet(g, { x: 88, y: 2, z: 21, face: "south", wood: "spruce" });

  // ---- plot 6 Winona: gable triple, front pairs with window boxes, sides, back ----
  // N z13: pairs x101..102 and x106..107, door x104; gable triple x103..105 y6..7
  windowPair(g, { x: 101, y: 2, z: 13, face: "north" });
  windowPair(g, { x: 106, y: 2, z: 13, face: "north" });
  doorSet(g, { x: 104, y: 2, z: 13, face: "north", wood: "oak" });
  windowTriple(g, { x: 103, y: 6, z: 13, face: "north" });
  // window boxes under the front pairs, on the cells the porch deck leaves free
  windowBox(g, { x: 101, y: 2, z: 13, w: 1, face: "north" });
  windowBox(g, { x: 107, y: 2, z: 13, w: 1, face: "north" });
  // W x100 / E x108: pairs z15..16 and z20..21
  for (const z of [15, 20]) {
    windowPair(g, { x: 100, y: 2, z, face: "west" });
    windowPair(g, { x: 108, y: 2, z, face: "east" });
  }
  // S z22: pair x103..104 (x102 stays solid behind bed 2's foot); back door x106
  windowPair(g, { x: 103, y: 2, z: 22, face: "south" });
  doorSet(g, { x: 106, y: 2, z: 22, face: "south", wood: "oak" });

  // ---- plot 7 Craftsman: front triple, door, pairs, gable pair, sides, back ----
  // N z13: ground triple x115..117, door x119, pair x122..123; upper pairs x115..116 and x122..123; gable pair x119..120 y10..11
  windowTriple(g, { x: 115, y: 2, z: 13, face: "north" });
  doorSet(g, { x: 119, y: 2, z: 13, face: "north", wood: "dark_oak" });
  windowPair(g, { x: 122, y: 2, z: 13, face: "north" });
  windowPair(g, { x: 115, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 122, y: 6, z: 13, face: "north" });
  windowPair(g, { x: 119, y: 10, z: 13, face: "north" });
  // W x114 / E x125: pairs z14..15 and z19..20, both floors (east upper only z19..20, beside the stack)
  for (const z of [14, 19]) {
    windowPair(g, { x: 114, y: 2, z, face: "west" });
    windowPair(g, { x: 114, y: 6, z, face: "west" });
  }
  windowPair(g, { x: 125, y: 2, z: 14, face: "east" });
  windowPair(g, { x: 125, y: 2, z: 19, face: "east" });
  windowPair(g, { x: 125, y: 6, z: 19, face: "east" });
  // S z21: pairs x116..117 and x121..122 both floors; back door x119
  windowPair(g, { x: 116, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 121, y: 2, z: 21, face: "south" });
  windowPair(g, { x: 116, y: 6, z: 21, face: "south" });
  windowPair(g, { x: 121, y: 6, z: 21, face: "south" });
  doorSet(g, { x: 119, y: 2, z: 21, face: "south", wood: "dark_oak" });
}

// Part: room: church nave (interior designer). Inner air box [50,2,10,55,7,16]; door x52..53 z9 (north, the way in).
// Layout: pews of spruce stairs (seats facing the altar, +z) either side of a centre aisle x52..53, gap rows at z12 and z14
// so each pew is reached from the aisle; the lectern (focal, at the aisle's end, the spec's (52,2,16)) and a polished
// andesite altar with candles on the back row; spruce beams at y7 (z11, z14) carry chains and hanging lanterns down
// the centre; fence posts with standing lanterns mark the narthex corners. Floor y2 is the stand level.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    p: ["spruce_stairs", { facing: "north", half: "bottom" }], // pew seat, back to the north, faces the altar
    f: "pale_oak_fence", // narthex post
    A: "polished_andesite", // altar block
    c: ["candle", { candles: "3", lit: "true" }], // altar candles
    l: ["lantern", { hanging: "false" }], // standing lantern (on a post or the altar)
    h: ["lantern", { hanging: "true" }], // hanging lantern under a chain
    i: ["iron_chain", { axis: "y" }], // chain from the beam
    b: ["stripped_spruce_log", { axis: "x" }], // ceiling beam across the nave
  };
  // Rows run along +x (x 50..55), successive rows along +z (z 10..16). One layer per y, from y2 up to y7.
  const y2 = [
    "f    f", // z10 narthex: posts at the corners, clear door path
    "pp  pp", // z11 pew
    "      ", // z12 gap: walk into the pews
    "pp  pp", // z13 pew
    "      ", // z14 gap
    "pp  pp", // z15 pew
    "   AA ", // z16 altar (53..54) by the lectern at (52,2,16), which the hearths part already placed; (55, 2..7, 16) is the tower ladder
  ];
  const y3 = [
    "l    l", // lanterns standing on the narthex posts
    "      ",
    "      ",
    "      ",
    "      ",
    "      ",
    "   cl ", // altar candle and a standing lantern on the altar
  ];
  const y4 = ["      ", "      ", "      ", "      ", "      ", "      ", "      "];
  const y5 = [
    "      ",
    " h  h ", // hanging lanterns at z11
    "      ",
    "      ",
    "  hh  ", // hanging lanterns at z14
    "      ",
    "      ",
  ];
  const y6 = [
    "      ",
    " i  i ", // chains from the z11 beam
    "      ",
    "      ",
    "  ii  ", // chains from the z14 beam
    "      ",
    "      ",
  ];
  const y7 = [
    "      ",
    "bbbbbb", // beam across the nave at z11
    "      ",
    "      ",
    "bbbbbb", // beam across the nave at z14
    "      ",
    "      ",
  ];
  layers(g, [50, 2, 10], legend, [y2, y3, y4, y5, y6, y7]);
}

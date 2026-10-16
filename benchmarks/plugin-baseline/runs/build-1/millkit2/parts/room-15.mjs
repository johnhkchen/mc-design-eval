// Part: room: Pyramid NE kitchen. Interior of box [43,3,10, 45,6,12] (plan FLOORS / ROOMS). Furnished in place:
// a lit furnace stove on a stone mantle against the hearth mass (x42), a one-cell table with a lantern on it,
// and barrels for stores. The lane runs down x44 from the vestibule door (x42 z10) to the SE bedroom door (x44 z13).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hearth_nook } from "../vocab.mjs";

export function build(g) {
  // Stove: furnace (lit) on the stone mantle, front facing east into the room (writes furnace y3, mantle y4).
  hearth_nook(g, 43, 3, 11, "east");

  // Floor layer y 3: B barrel, T table legs (fence). The furnace cell is drawn as '.' (written by hearth_nook).
  // Rows run along +x (43..45), successive rows along +z (10..12).
  // Lane x44 stays clear from z10 to z12.
  layers(g, [43, 3, 10], { B: "barrel", T: "spruce_fence" }, [
    ["..B",
     "..T",
     "B.B"],
  ]);

  // Table top y 4 (top slab, so nothing stands on a bottom half) and a standing lantern on it at y 5.
  layers(g, [43, 4, 10], { S: ["spruce_slab", { type: "top" }] }, [
    ["...",
     "..S",
     "..."],
  ]);
  layers(g, [43, 5, 10], { L: ["lantern", { hanging: "false" }] }, [
    ["...",
     "..L",
     "..."],
  ]);
}

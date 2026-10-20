// Part 3, Tunnel portal: the east portal face (x74..75, z46..65, y2..6) with its two 6x3 mouths and centre pier, the
// bores behind it (x65..76), the north and south wing retaining walls stepping down to the park, the iron_bars rail,
// and the lid walk paving on the lid over the bores. The parkway apron and its markings belong to the ground part.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  portalFace, tunnelBore, walkPaving, LIGHT_GRAY_CONCRETE, SMOOTH_STONE, IRON_BARS,
  PORTAL_FACE, BORE_NORTH, BORE_SOUTH, LID_WALK, WING_NORTH, WING_SOUTH,
} from "../vocab.mjs";

// the ground height map, read as the ground part reads it: the wing walls stop where the ground already stands
const dir = fileURLToPath(new URL(".", import.meta.url));
const HM = readFileSync(dir + "heights.txt", "utf8").trim().split("\n").map((r) => [...r].map((c) => parseInt(c, 36)));
const mapH = (x, z) => HM[Math.min(72, z >> 1)][Math.min(42, x >> 1)];

// wing wall top course at z: north steps 4 -> 6 going south toward the face, south steps 6 -> 4 going away from it
const wingTop = (z) => {
  if (z <= 45) return z <= 39 ? 4 : z <= 42 ? 5 : 6;     // north wing, z36..45
  return z <= 71 ? 6 : z <= 77 ? 5 : 4;                   // south wing, z66..83
};

// a wing wall column: concrete from the ground up to its top course, smooth_stone coping on top, iron_bars rail above
function wing([x0, x1, z0, z1]) {
  for (let z = z0; z <= z1; z++) {
    const top = wingTop(z), H = mapH(x0, z);
    for (let x = x0; x <= x1; x++) {
      for (let y = Math.max(2, H + 1); y < top; y++) g.set(x, y, z, ...B.block(LIGHT_GRAY_CONCRETE));
      if (top > H) g.set(x, top, z, ...B.block(SMOOTH_STONE));
      // the rail stands on the coping only: where a lawn-edge slab holds the coping's cell, nothing goes above it
      if (top > H && /smooth_stone$/.test(String(g.blockAt(x1, top, z)))) g.set(x1, top + 1, z, ...B.block(IRON_BARS));
    }
  }
}

// runParts locks every cell an earlier part built (air included), and the ground part built each column up to its height
// map. A write into that ground is refused, so the portal writes into air only: a cell already built stays as the ground
// part left it, and is counted here.
let g, skipped = 0;
function airOnly(target) {
  const view = new Proxy(target, {
    get(t, prop) {
      if (prop === "set") return (x, y, z, block, state, nbt) => {
        if (/(^|:)(cave_)?air$/.test(t.blockAt(x, y, z))) t.set(x, y, z, block, state, nbt);
        else skipped++;
        return view;
      };
      const v = Reflect.get(t, prop);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
  return view;
}

export function build(gridIn) {
  skipped = 0;
  g = airOnly(gridIn);

  // the face: light grey concrete y2..6, mouths y3..5 at z48..53 and z57..62 (the pier z54..56 stays solid), coping,
  // iron_bars rail one block above the coping, running the length of the face
  portalFace(g, {
    x: PORTAL_FACE[0], depth: 2, z0: PORTAL_FACE[2], z1: PORTAL_FACE[3], yLo: 2, yHi: 6,
    mouthY: [3, 5], mouths: [[BORE_NORTH[2], BORE_NORTH[3]], [BORE_SOUTH[2], BORE_SOUTH[3]]],
    rail: [PORTAL_FACE[2], PORTAL_FACE[3]], facing: "east",
  });

  // the two bores: road y2, tunnel air y3..5, black back wall at x65, hanging lanterns under the lid
  tunnelBore(g, BORE_NORTH[2], BORE_NORTH[3], { lanternZ: [49, 51, 53] });
  tunnelBore(g, BORE_SOUTH[2], BORE_SOUTH[3], { lanternZ: [57, 59, 61] });

  // wing retaining walls, stepping down to the park on each side of the face
  wing(WING_NORTH);
  wing(WING_SOUTH);

  // lid walk: smooth stone paving on the lid (W cells) at y6, a light band every 6 along z
  walkPaving(g, [LID_WALK[0], LID_WALK[2], LID_WALK[1], LID_WALK[3]], 6, { over: true });

  console.log(`portal: ${skipped} cells left as the ground part built them (no air there)`);
}

// Armory roof and porch (P2): the flat-parapet roof itself is laid by runParts from roof.json right after the shell.
// This part adds the roof monitors, the steel trusses under the deck, the north porch, the south C1 glass vestibule
// (with its doors). The parapet lanterns are not placed: the roof's bottom coping slab leaves half a block of air
// under any lantern on it. Everything writes only into air, so the shell's walls and doors stay.
import { B, tile } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { roofMonitor, steelTruss, doorPair } from "../vocab.mjs";
import { ARCADE_DOORS } from "./armory-shell.mjs";

const put = (g, x, y, z, block, state) => {
  if (g.inBounds(x, y, z) && g.isAir(x, y, z)) g.set(x, y, z, block, state);
};
const GLASS_NS = { north: "true", south: "true", east: "false", west: "false" };
const GLASS_EW = { north: "false", south: "false", east: "true", west: "true" };

// C1 glazed vestibule, x4..111 z144..147, walls y1..6, roof y7. The north edge (z144) is left open for x5..110: the
// curtain is left out behind C1 (plan FACADES), so the vestibule opens straight into the hall. Door openings (2 high,
// y1..2) are left air for doorPair; the glass above them carries on as the lintel.
const DOOR_S = [[24, 27], [56, 59], [88, 91]];
const inRanges = (x, ranges) => ranges.some(([a, b]) => x >= a && x <= b);

function c1Vestibule(g) {
  const x0 = 4, x1 = 111, z0 = 144, z1 = 147, h = 7;
  const postX = (x) => x === x0 || x === x1 || (x - x0) % 7 === 0;
  for (let y = 1; y <= h - 1; y++) {
    // south face z147: glass with posts every 7, doors low in the three openings
    for (let x = x0; x <= x1; x++) {
      if (y <= 2 && inRanges(x, DOOR_S)) continue;
      if (postX(x)) put(g, x, y, z1, "smooth_quartz");
      else put(g, x, y, z1, "glass_pane", GLASS_EW);
    }
    // side faces x4 and x111, z145..146 (2-wide doors low, glass above)
    for (const x of [x0, x1]) {
      put(g, x, y, z0, "smooth_quartz");
      put(g, x, y, z1, "smooth_quartz");
      for (const z of [z0 + 1, z0 + 2]) {
        if (y <= 2) continue;
        put(g, x, y, z, "glass_pane", GLASS_NS);
      }
    }
  }
  // roof: quartz rim at y7 round the edge, quartz beams every 7 x, glass between
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const edge = x === x0 || x === x1 || z === z0 || z === z1;
      if (edge) put(g, x, h, z, ...B.slab("smooth_quartz", "bottom"));
      else if (postX(x)) put(g, x, h, z, "smooth_quartz");
      else put(g, x, h, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true" });
    }
  }
}

// North porch, x0..x0+3 z0..z0+3: sandstone corner posts y1..4, a brown_terracotta fascia ring at y5 that is a full
// block (so nothing stands on a half slab), a smooth_sandstone_slab canopy bottom-half over the inner 2x2 at y5, and
// two hanging lanterns under it at y4. The porchCanopy helper's fascia at y6 sat half a block off its slab.
function porch(g, x0, z0) {
  const x1 = x0 + 3, z1 = z0 + 3;
  for (const [x, z] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) for (let y = 1; y <= 4; y++) put(g, x, y, z, "calcite");
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const ring = x === x0 || x === x1 || z === z0 || z === z1;
    if (ring) put(g, x, 5, z, "bricks");
    else put(g, x, 5, z, ...B.slab("smooth_quartz", "bottom"));
  }
  put(g, x0 + 1, 4, z0 + 1, "lantern", { hanging: "true", waterlogged: "false" });
  put(g, x0 + 2, 4, z0 + 2, "lantern", { hanging: "true", waterlogged: "false" });
}

// Lawn-side glass arcade (owner's comment): a single-storey glazed gallery along the hall's east wall in the open strip
// x104..107, z36..119, its glass face at x107 (smooth_quartz posts every 4 z, glass_pane between, a quartz head beam at
// y5), a flat smooth_quartz_slab canopy roof at y6 overhanging one onto the lawn (x108), doors facing the lawn opposite
// the hall doors, red awnings over two of them, and lanterns hung under the roof. A's south wall closes the north end.
function lawnArcade(g) {
  const X = 107, z0 = 36, z1 = 119;
  const post = (z) => z === z0 || z === z1 || (z - 37) % 4 === 0;
  const door = (z) => ARCADE_DOORS.some((d) => z === d || z === d + 1);
  for (let z = z0; z <= z1; z++) {
    for (let y = 1; y <= 5; y++) {
      if (y <= 2 && door(z)) continue;
      if (post(z) || y === 5) put(g, X, y, z, "smooth_quartz");
      else put(g, X, y, z, "glass_pane", GLASS_NS);
    }
    for (let x = 104; x <= 108; x++) put(g, x, 6, z, ...B.slab("smooth_quartz", "bottom"));
  }
  // south end glazed (x104..106 at z119)
  for (let x = 104; x <= 106; x++) for (let y = 1; y <= 5; y++) put(g, x, y, z1, y === 5 ? "smooth_quartz" : "glass_pane", GLASS_EW);
  for (const z of ARCADE_DOORS) doorPair(g, { x: X, z, face: "east", width: 2 });
  // red awnings over the first two doors: a flat red_concrete hood 2 deep at y4, 4 wide
  for (const d of ARCADE_DOORS.slice(0, 2)) for (let z = d - 1; z <= d + 2; z++) {
    put(g, 108, 4, z, "red_concrete");
    put(g, 109, 4, z, "red_concrete");
  }
  for (let z = 38; z <= 118; z += 4) put(g, 105, 5, z, "lantern", { hanging: "true", waterlogged: "false" });
}

export function build(g) {
  lawnArcade(g);
  // roof monitors (plan: M1 x28..39, M2 x68..79; keep boxes 29..38 and 69..78, z 45..122)
  roofMonitor(g, { x0: 29, x1: 38, z0: 45, z1: 122 });
  roofMonitor(g, { x0: 69, x1: 78, z0: 45, z1: 122 });
  // steel trusses under the deck, z = 40 + 8k, k 0..11, across the atrium
  tile(g, { from: 40, step: 8, count: 12 }, (z) => steelTruss(g, { z }));
  // north porch, x60..63 z0..3 (the shell's birch doors and red surround are already in the z5 wall)
  porch(g, 60, 0);
  // south C1 vestibule and its doors
  c1Vestibule(g);
  for (const [a, b] of DOOR_S) doorPair(g, { x: a, z: 147, face: "south", width: b - a + 1 });
  doorPair(g, { x: 4, z: 145, face: "west", width: 2 });
  doorPair(g, { x: 111, z: 145, face: "east", width: 2 });
}

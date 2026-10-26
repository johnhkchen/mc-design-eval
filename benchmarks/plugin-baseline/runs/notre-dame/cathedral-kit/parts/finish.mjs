// Part: glass, light and grounds (plan.md P6). Glazes the openings the shell leaves empty, shroomlight behind the
// roses, ochre_froglight floods and lamp posts, the paving and the Square Jean-XXIII garden. Writes only into air.
import { glazeOpening, roseWindow, floodlight, lampPost, pavePatch } from "../vocab.mjs";

const PANE = "blue_stained_glass_pane";
const HEAD = "purple_stained_glass_pane";

// bay centres between the piers (plan.md: nave piers 31..32, 40..41 ...; choir piers 113..114, 122..123 ...)
const NAVE_BAYS = [36, 45, 54, 63, 72, 81];
const CHOIR_BAYS = [118, 127, 136, 145];

// chevet apse: seven radial bays centred on -77..77 degrees (r 10 wall, centre C = (150, 37))
const APSE_BAYS = [-77, -51, -26, 0, 26, 51, 77];

// chevet chapel bays (r 32, y 6..15) and tribune ring bays (r 17, y 31..33): one window per radial bay
const CHAPEL_ANGLES = [-72, -36, 0, 36, 72];
const TRIBUNE_ANGLES = [-77, -51, -26, 0, 26, 51, 77];

// a curved window on a chevet ring: 3 cells across the wall (tangent) at radius r, y0..y1, air cells only
function ringWindow(g, angle, r, y0, y1, headRows = 0) {
  const a = (angle * Math.PI) / 180;
  for (let t = -1; t <= 1; t++) for (let y = y0; y <= y1; y++) {
    const x = Math.round(150 + r * Math.cos(a) - t * Math.sin(a));
    const z = Math.round(37 + r * Math.sin(a) + t * Math.cos(a));
    if (!g.isAir(x, y, z)) continue;
    const glass = y > y1 - headRows ? HEAD : PANE;
    g.set(x, y, z, glass, { north: "false", east: "false", south: "false", west: "false" });
  }
}

// the apse clerestory: a curved lancet, y 35..43, purple heads
function apseLancet(g, angle) {
  ringWindow(g, angle, 10, 35, 43, 2);
}

export function build(g) {
  // nave and choir clerestories (z 27 north, z 47 south), tall lancets y 35..43
  for (const xc of [...NAVE_BAYS, ...CHOIR_BAYS]) {
    glazeOpening(g, [xc - 1, 35, 47, xc + 1, 43, 47], "south");
    glazeOpening(g, [xc - 1, 35, 27, xc + 1, 43, 27], "north");
  }
  // tribune windows (z 18 north, z 56 south), y 31..33
  for (const xc of [...NAVE_BAYS, ...CHOIR_BAYS]) {
    glazeOpening(g, [xc - 1, 31, 18, xc + 1, 33, 18], "north");
    glazeOpening(g, [xc - 1, 31, 56, xc + 1, 33, 56], "south");
  }
  // chapel lancets (z 5 north, z 69 south), y 6..16
  for (const xc of [...NAVE_BAYS, ...CHOIR_BAYS]) {
    glazeOpening(g, [xc - 1, 6, 5, xc + 1, 16, 5], "north");
    glazeOpening(g, [xc - 1, 6, 69, xc + 1, 16, 69], "south");
  }
  // apse clerestory: seven curved lancets; chevet ring windows (tribune r 17, chapels r 32)
  for (const a of APSE_BAYS) apseLancet(g, a);
  for (const a of TRIBUNE_ANGLES) ringWindow(g, a, 17, 31, 33);
  for (const a of CHAPEL_ANGLES) ringWindow(g, a, 32, 6, 15, 2);

  // transept roses (glass at z 68 south, z 2 north) and their small gable roses
  roseWindow(g, [95, 34, 68], "south", 7, true);
  roseWindow(g, [95, 34, 2], "north", 7, true);
  roseWindow(g, [95, 51, 68], "south", 2, true);
  roseWindow(g, [95, 51, 2], "north", 2, true);
  // west rose, glass at x 3
  roseWindow(g, [3, 49, 37], "west", 7, true);

  // tower lancet pairs (rose stage), glass two cells behind the facade plane x 2
  for (const [z0, z1] of [[10, 12], [22, 24], [50, 52], [62, 64]]) {
    glazeOpening(g, [4, 42, z0, 4, 56, z1], "west");
  }

  // ochre_froglight floods on the garden paving
  for (const [x, z] of [[108, 74], [114, 74]]) floodlight(g, x, 2, z, "y");

  // Square Jean-XXIII: paving to the north of the garden, planting in the south
  pavePatch(g, [105, 2, 70, 119, 2, 73]);
  g.fill([105, 2, 74], [107, 2, 79], "moss_block");
  g.fill([108, 2, 74], [119, 2, 79], "grass_block");
  for (const [x, y, z] of [[106, 3, 77], [111, 3, 76], [116, 3, 78]]) {
    if (g.isAir(x, y, z)) g.set(x, y, z, "azalea", { persistent: "true" });
  }

  // lamp posts along the garden path (every 8-10 blocks)
  for (const [x, z] of [[106, 71], [116, 71], [106, 78], [116, 78]]) lampPost(g, x, 2, z);
}

// P3 FRONT FACADE (plan.md FRONT FACADE, elements.md E2, E4..E9, E12): corbels and soffit under the bay (y3), bay glazing,
// tall windows with pediment hoods, the bracketed cornice and bay cap (y16..17), the false-front parapet and pediment
// (y19..20), the recessed porch (columns, arch, hood, lantern), the entry door and the carriage doors.
// Every element writes into air only: P1's walls and openings and earlier parts' cells are skipped, never overwritten.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  tallWindow, pairedWindow, diagWindow, bracket, crown, corbel, column, entryDoor, carriageDoor,
  SMOOTH_QUARTZ, CHISELED_QUARTZ_BLOCK,
} from "../vocab.mjs";

// Add into air only (vocab's put() is not exported): a cell another part owns is skipped.
const isAir = (g, x, y, z) => ["minecraft:air", "minecraft:cave_air"].includes(g.blockAt(x, y, z));
const put = (g, x, y, z, block, state) => {
  if (!isAir(g, x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
};

// Porch: the recessed entry at z6..9 (columns, arch springing, hood over the mouth, hanging lantern).
function porch(g) {
  column(g, 10, 7);
  column(g, 14, 7);
  put(g, 11, 7, 7, ...B.stairs(SMOOTH_QUARTZ, "west", "top"));
  put(g, 13, 7, 7, ...B.stairs(SMOOTH_QUARTZ, "east", "top"));
  for (let x = 10; x <= 14; x++) crown(g, x, 8, 6);
  // Lantern hangs at y7 under the porch ceiling (y8). Placed directly: hangLamp() throws when the ceiling is not built yet.
  put(g, 12, 7, 8, ...B.lantern(true));
}

// Bay cornice and soffit: corbels under the bay at y3, the soffit slab row, brackets and crown lip at y16..17, bay cap.
function bayCornice(g) {
  corbel(g, 2, 5);
  corbel(g, 5, 5);
  corbel(g, 1, 6);
  corbel(g, 6, 6);
  for (const x of [3, 4]) put(g, x, 3, 5, ...B.slab(SMOOTH_QUARTZ, "top"));
  for (let x = 2; x <= 5; x++) put(g, x, 3, 6, ...B.slab(SMOOTH_QUARTZ, "top"));
}

function cornice(g) {
  // Brackets at y16 on the flat front, and on the bay.
  for (const x of [7, 9, 11, 13, 14]) bracket(g, x, 16, 6);
  bracket(g, 2, 16, 4);
  bracket(g, 5, 16, 4);
  put(g, 1, 16, 5, ...B.slab("quartz", "top"));
  put(g, 6, 16, 5, ...B.slab("quartz", "top"));
  // Crown lip at y17: along the front, across the bay front, and at the bay corners.
  for (let x = 7; x <= 14; x++) crown(g, x, 17, 6);
  for (let x = 2; x <= 5; x++) crown(g, x, 17, 4);
  crown(g, 1, 17, 5);
  crown(g, 6, 17, 5);
  // Bay cap: solid quartz over the bay top.
  for (let x = 2; x <= 5; x++) for (const z of [5, 6]) put(g, x, 17, z, SMOOTH_QUARTZ);
  put(g, 1, 17, 6, SMOOTH_QUARTZ);
  put(g, 6, 17, 6, SMOOTH_QUARTZ);
}

// Parapet: coping along the false front (y19), pediment over x6..9 (y19..20), quartz ends at y20.
function parapet(g) {
  put(g, 6, 19, 7, ...B.stairs(SMOOTH_QUARTZ, "east", "bottom"));
  put(g, 7, 19, 7, CHISELED_QUARTZ_BLOCK);
  put(g, 8, 19, 7, CHISELED_QUARTZ_BLOCK);
  put(g, 9, 19, 7, ...B.stairs(SMOOTH_QUARTZ, "west", "bottom"));
  put(g, 7, 20, 7, ...B.stairs(SMOOTH_QUARTZ, "east", "bottom"));
  put(g, 8, 20, 7, ...B.stairs(SMOOTH_QUARTZ, "west", "bottom"));
  for (const x of [1, 2, 3, 4, 5, 10, 11, 12, 13, 14]) put(g, x, 19, 7, ...B.slab(SMOOTH_QUARTZ, "bottom"));
  put(g, 1, 20, 7, ...B.slab("quartz", "bottom"));
  put(g, 14, 20, 7, ...B.slab("quartz", "bottom"));
}

// Front glazing: tall windows (hoods on the two lower rows), the top row without a hood, the bay's paired and diagonal
// glass at yb 5, 9, 13, and the small base window.
function glazing(g) {
  tallWindow(g, 8, 5, 7, "north", { hood: true });
  tallWindow(g, 8, 9, 7, "north", { hood: true });
  tallWindow(g, 8, 13, 7, "north", { hood: false });
  tallWindow(g, 12, 9, 7, "north", { hood: true });
  tallWindow(g, 12, 13, 7, "north", { hood: false });
  put(g, 8, 2, 7, ...B.pane());
  for (const yb of [5, 9, 13]) {
    pairedWindow(g, yb);
    diagWindow(g, 1, yb);
    diagWindow(g, 6, yb);
  }
}

export function build(g) {
  // Doors first: they are the cells the rest of the front must not cover.
  entryDoor(g);
  carriageDoor(g);
  porch(g);
  bayCornice(g);
  cornice(g);
  glazing(g);
  parapet(g);
}

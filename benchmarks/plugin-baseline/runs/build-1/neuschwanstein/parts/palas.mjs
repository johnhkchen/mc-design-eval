// The Palas: tall white-limestone block, steep dark-slate gable roof, cross-gabled front wing, stepped gables.
import { P, shell, roof, note, B, arch, archWindow, romWindow, pilaster, corniceRing, stepGable, finialAt } from "./shared.mjs";
export const PALAS = { x0: 60, z0: 31, x1: 104, z1: 46, y0: 17, top: 52 };
export const WING = { x0: 79, z0: 22, x1: 87, z1: 31 };
export function palas(g, { level }) {
  const { x0, z0, x1, z1, y0, top } = PALAS;
  // podium under the wing, down to the lower terrace
  g.fill([WING.x0, 11, WING.z0], [WING.x1, 16, WING.z1], P.base);
  shell(g, [x0, y0, z0], [x1, top, z1], P.wall, { floor: false, ceiling: true });
  shell(g, [WING.x0, y0, WING.z0], [WING.x1, top, WING.z1 - 1], P.wall, { floor: false, ceiling: true });
  g.fill([x0 + 1, y0, 38], [x1 - 1, top - 1, 39], P.wall);   // interior partition: windows never see through to the sky
  // open the wing into the hall: remove the shared wall
  g.fill([WING.x0 + 1, y0, WING.z1], [WING.x1 - 1, top - 1, WING.z1], "minecraft:air");
  // roof: preset civic overridden to a steep slate gable (a palace hall, cross-gabled)
  const rects = [[x0, z0, x1, z1], [WING.x0, WING.z0, WING.x1, WING.z1]];
  const opts = { y: top + 1, style: "gable", pitch: "very-steep", material: P.slate, ridge: "crest", ridgeAxis: "x", overhang: 1, eave: "cornice", trim: "smooth_sandstone", gable: P.wall, pediment: undefined, preset: "civic", dormers: { face: ["north", "south"], count: 4, style: "gable", width: 3, height: 3 }, chimneys: [{ at: [70, 39], size: 2 }, { at: [96, 39], size: 2 }] };
  const dry = roof(g, rects, "gable", { ...opts, dryRun: true });
  for (const w of dry.warnings ?? []) note(`palas roof WARN ${w.code}: ${w.message ?? ""}`);
  const r = roof(g, rects, "gable", opts);
  note(`palas roof top ${r.top} notes: ${(r.notes ?? []).join(" | ")}`);
  if (level < 2) return;
  // ---- facades: pilaster strips divide each face into bays; every storey has its own window group ----------------
  const FL = [17, 24, 31, 38, 45];                                   // storey stand levels (5 storeys, 7 high)
  const KINDS = [[3], [3, 3], [1, 3, 1], [3, 3], [1, 1, 1]];          // single / pair / triple (tall centre) / pair / lancets
  const bayWin = (face, plane, b0, bw, storeys, o = {}) => {
    for (const s of storeys) {
      const lights = KINDS[s], wd = lights.reduce((a, b) => a + b, 0) + lights.length - 1;
      const L = bw < wd ? [3] : lights, w2 = L.reduce((a, b) => a + b, 0) + L.length - 1;
      romWindow(g, face, plane, b0 + Math.floor((bw - w2) / 2), FL[s] + 2, L, s === 0 ? 4 : 5);
    }
  };
  for (const x of [63, 72, 81, 90, 99]) pilaster(g, "south", z1, x, y0, top - 1);
  for (const x of [69, 78, 88]) pilaster(g, "north", z0, x, y0, top - 1);
  for (const z of [34, 43]) { pilaster(g, "east", x1, z, y0, top - 1); pilaster(g, "west", x0, z, y0, top - 1); }
  for (const b0 of [64, 73, 82, 91]) bayWin("south", z1, b0, 8, [0, 1, 2, 3, 4]);
  bayWin("north", z0, 70, 8, [0, 2, 3, 4]);
  bayWin("north", z0, 98, 3, [0, 1, 2]);
  bayWin("east", x1, 35, 8, [0, 1, 2, 3, 4]);
  bayWin("west", x0, 35, 8, [0, 1, 2, 3, 4]);
  // wing (north gable): one group per storey on the centre line
  for (const s of [0, 1, 2, 3, 4]) bayWin("north", WING.z0, 80, 7, [s]);
  // ---- north balcony: bold, 5 deep, on corbelled brackets and stout piers rising from the lower court, French doors above
  const bx0 = 69, bx1 = 78, by = 23, bz = 26;
  romWindow(g, "north", z0, 70, 24, [3, 3], 7);
  for (let x = bx0; x <= bx1; x++) for (let z = bz; z <= 30; z++) {
    g.set(x, by, z, (x + z) % 2 === 0 || z === bz ? "smooth_sandstone" : "quartz_block");
    if (z === bz) g.set(x, by - 1, z, ...B.stairs("smooth_sandstone", "south", "top"));
    if (z === bz + 1) g.set(x, by - 1, z, ...B.slab("smooth_sandstone", "top"));
  }
  for (let x = bx0; x <= bx1; x++) g.set(x, by + 1, bz, ...B.wall("diorite"));
  for (let z = bz + 1; z <= 28; z++) { g.set(bx0, by + 1, z, ...B.wall("diorite")); g.set(bx1, by + 1, z, ...B.wall("diorite")); }
  for (const x of [bx0, 73, 74, bx1]) { for (const y of [by + 1, by + 2]) g.set(x, y, bz, "quartz_pillar"); g.set(x, by + 3, bz, ...(x === bx0 || x === bx1 ? ["gold_block"] : B.lantern(false))); }
  for (const x of [bx0, bx1]) { g.set(x, by + 1, 28, "quartz_pillar"); g.set(x, by + 2, 28, "quartz_pillar"); g.set(x, by + 3, 28, "gold_block"); }
  for (const x of [bx0, 73, 74, bx1]) for (let y = 11; y < by - 1; y++) g.set(x, y, bz, y < 13 ? P.base : "quartz_pillar");   // piers to the lower court
  for (const x of [bx0 + 1, 72, 75, bx1 - 1]) { g.set(x, by - 2, bz, ...B.stairs("smooth_sandstone", "south", "top")); }
  for (const x of [bx0, bx1]) g.set(x, 20, bz - 1, ...B.banner("light_blue", [["rhombus", "white"], ["border", "white"]], { facing: "north" }));
  // ---- the Singers' Hall loggia: two storeys of round arches on the courtyard front, over a rusticated arcade ---------
  const lx0 = 90, lx1 = 102, lz0 = 28, lz1 = 30;
  const piers = [90, 94, 98, 102], bays = [91, 95, 99];
  g.fill([lx0, y0, lz0], [lx1, 36, lz1], P.base);                                   // rusticated base block ...
  for (const x of bays) arch(g, { at: [x, y0, lz0], width: 3, height: 8, depth: 3, axis: "x", profile: "round", block: P.base });   // ... carved with three round arches
  for (const y of [37, 44]) g.fill([lx0, y, lz0], [lx1, y, lz1], "smooth_sandstone");
  for (const [y, h] of [[38, 6], [45, 6]]) {
    g.fill([lx0, y, lz0], [lx1, y + h - 1, lz0], P.wall);                            // front plane, carved into arches below
    for (const x of bays) {
      archWindow(g, "north", lz0, x, y, { w: 3, h, frame: false });
      for (let j = 0; j < h; j++) if (g.blockAt(x + 1, y + j, lz0).includes("pane") || g.blockAt(x, y + j, lz0).includes("pane") || g.blockAt(x + 2, y + j, lz0).includes("pane")) for (const dx of [0, 1, 2]) if (g.blockAt(x + dx, y + j, lz0).includes("pane")) g.unset(x + dx, y + j, lz0);
    }
    for (const x of piers) for (let j = 0; j < h; j++) for (const z of [lz0]) g.set(x, y + j, z, "quartz_pillar");
    for (const z of [lz0, lz1]) for (const x of [lx0, lx1]) for (let j = 0; j < h; j++) g.set(x, y + j, z, j < h - 1 ? "quartz_pillar" : P.wall);
    for (let j = 0; j < h; j++) for (const x of [lx0, lx1]) g.set(x, y + j, 29, P.wall);
    // loggia doors into the hall behind (storey 4), arched windows into storey 5
    for (const x of bays) archWindow(g, "north", z0, x, y, { w: 3, h: y === 38 ? 6 : 5, frame: "quartz_pillar" });
    for (let x = lx0 + 1; x <= lx1 - 1; x++) for (const z of [lz0 + 1, lz0 + 2]) g.set(x, y + 0, z, g.isAir(x, y, z) ? "air" : g.blockAt(x, y, z));
  }
  for (const x of [91, 92, 93, 95, 96, 97, 99, 100, 101]) for (const y of [38, 45]) g.set(x, y, lz0, ...B.wall("diorite"));   // balustrades in the arches
  for (let x = lx0 - 1; x <= lx1 + 1; x++) { g.set(x, 51, lz0 - 1, ...B.stairs("smooth_sandstone", "south", "top")); for (const z of [lz0, 29, lz1]) g.set(x, 51, z, ...B.slab("smooth_sandstone", "bottom")); }
  for (const x of piers) g.set(x, 51, lz0 - 1, ...B.stairs("smooth_sandstone", "south", "top"));
  // ---- the Palas interiors: floors on every storey, throne hall (2 storeys, south half), Singers' Hall (storey 4, north half)
  const fl = [[23, "dark_oak_planks"], [37, "dark_oak_planks"], [44, "dark_oak_planks"]];
  for (const [y, b] of fl) {
    g.fill([x0 + 1, y, z0 + 1], [x1 - 1, y, z1 - 1], b);
    g.fill([WING.x0 + 1, y, WING.z0 + 1], [WING.x1 - 1, y, WING.z1 - 1], b);
  }
  // throne hall: x84..103, z41..45, y24..36: blue walls with gold bands, apse + gold throne platform east, chandeliers
  g.fill([84, 24, 40], [103, 36, 40], "blue_concrete");
  g.fill([84, 24, 41], [84, 36, 45], "blue_concrete");
  for (const y of [24, 30, 36]) { g.fill([84, y, 40], [103, y, 40], "gold_block"); g.fill([84, y, 41], [84, y, 45], "gold_block"); }
  for (const x of [88, 92, 96]) for (let y = 25; y <= 35; y++) g.set(x, y, 40, y % 6 === 0 ? "gold_block" : "light_blue_concrete");
  g.fill([84, 24, 41], [103, 24, 45], "light_blue_wool");
  g.fill([86, 24, 43], [99, 24, 43], "red_carpet");
  g.fill([100, 24, 41], [103, 25, 45], "gold_block");                              // raised throne platform
  for (const z of [41, 45]) for (let y = 26; y <= 31; y++) g.set(103, y, z, "gold_block");
  for (let z = 42; z <= 44; z++) { g.set(103, 26, z, "blue_concrete"); }
  g.set(102, 26, 43, ...B.stairs("smooth_quartz", "west", "bottom"));
  g.set(103, 26, 43, "gold_block"); g.set(103, 27, 43, "gold_block"); g.set(103, 28, 43, "gold_block");
  for (const z of [42, 44]) for (let y = 27; y <= 33; y++) g.set(103, y, z, "light_blue_concrete");
  for (let y = 29; y <= 33; y++) g.set(103, y, 43, "light_blue_concrete");
  g.set(103, 34, 43, "gold_block");
  for (const [cx, cz] of [[88, 43], [93, 43], [98, 43]]) {
    for (let y = 33; y <= 36; y++) g.set(cx, y, cz, ...B.chain("y"));
    g.set(cx, 32, cz, "gold_block");
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { g.set(cx + dx, 32, cz + dz, "iron_bars", {}); g.set(cx + dx * 2, 32, cz + dz * 2, "iron_bars", {}); g.set(cx + dx * 2, 31, cz + dz * 2, ...B.lantern(true)); }
  }
  // Singers' Hall: long hall, storey 4 (y38..43), coffered wooden ceiling under the storey-5 floor
  for (let x = x0 + 1; x <= x1 - 1; x++) for (const z of [32, 33, 34, 35, 36, 37]) {
    const beam = x % 4 === 0 || z % 3 === 0;
    g.set(x, 43, z, beam ? "dark_oak_planks" : "spruce_planks");
    if (x % 4 === 0 && z % 3 === 0) g.set(x, 42, z, ...B.lantern(true));
  }
  for (let x = x0 + 1; x <= x1 - 1; x++) { g.set(x, 38, 37, "red_carpet"); }
  corniceRing(g, [x0, z0, x1, z1], top);
  // crow-stepped gables: the Palas ends and the wing's north face (stepped, coped with sandstone slabs)
  const step = { y: top + 1, rise: 2, run: 1, block: P.wall, coping: { block: "smooth_sandstone_slab" } };
  stepGable(g, { face: "east", plane: x1 + 1, from: z0 - 1, to: z1 + 1, ...step });
  stepGable(g, { face: "west", plane: x0 - 1, from: z0 - 1, to: z1 + 1, ...step });
  stepGable(g, { face: "north", plane: WING.z0 - 1, from: WING.x0 - 1, to: WING.x1 + 1, ...step });
  for (const [x, z] of [[x1 + 1, Math.round((z0 + z1) / 2)], [x0 - 1, Math.round((z0 + z1) / 2)], [Math.round((WING.x0 + WING.x1) / 2), WING.z0 - 1]]) finialAt(g, x, z, 1, true);
}

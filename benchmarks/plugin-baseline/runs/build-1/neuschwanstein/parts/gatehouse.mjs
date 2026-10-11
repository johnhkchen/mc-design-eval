// The red-brick gatehouse with white trim, crenellated top, pointed arched gate, flanked by two round white towers with cone caps.
import { P, B, shell, arch, parapet, note, turretCap, roundTower, rectOf, archWindow, corniceRing } from "./shared.mjs";
export const GATE = { x0: 46, z0: 7, x1: 64, z1: 15, y0: 11, top: 30 };
export const GTOWERS = [[44, 9], [66, 9]];
export function gatehouse(g, { level }) {
  const { x0, z0, x1, z1, y0, top } = GATE;
  shell(g, [x0, y0, z0], [x1, top, z1], P.brick, { floor: false, ceiling: true });
  // passage walls and vault so the arch opens into a tunnel
  for (const x of [52, 58]) g.fill([x, y0, z0], [x, 20, z1], P.brick);
  g.fill([52, 21, z0], [58, 21, z1], P.brick);
  // front arch (carved through the front wall) and back arch
  arch(g, { at: [53, y0, z0], width: 5, height: 10, depth: 1, axis: "x", profile: "pointed", block: P.brick, frame: P.trim });
  arch(g, { at: [53, y0, z1], width: 5, height: 10, depth: 1, axis: "x", profile: "pointed", block: P.brick });
  g.fill([53, 20, z0 + 1], [57, 20, z0 + 1], "iron_bars");                    // portcullis half raised
  g.fill([54, 19, z0 + 1], [56, 19, z0 + 1], "iron_bars");
  // round white towers
  for (const [cx, cz] of GTOWERS) {
    roundTower(g, cx, cz, 4, y0, 25);                                          // y11..35
    turretCap(g, rectOf(cx, cz, 4), 36, { pitch: 3.9 });
  }
  // crenellated brick parapet round the top
  parapet(g, { from: [x0, top + 1, z0], to: [x1, z1], block: P.brick, style: "crenellated" });
  if (level < 2) return;
  // quartz string course and base plinth
  for (let x = x0; x <= x1; x++) { if (g.isAir(x, 21, z0 - 1) && g.isAir(x, 21, z0)) g.set(x, 21, z0 - 1, ...B.stairs("smooth_quartz", "south", "top")); }
  for (let x = x0; x <= x1; x++) if (!g.isAir(x, top, z0)) g.set(x, top, z0, "smooth_quartz");
  // windows above the gate
  for (const px of [50, 54, 58]) archWindow(g, "north", z0, px, 23, { w: 3, h: 5, block: P.brick, frame: P.trim });
  // lamp posts either side of the arch
  for (const x of [51, 59]) { g.set(x, 11, z0 - 1, ...B.wall("stone_brick")); g.set(x, 12, z0 - 1, ...B.wall("stone_brick")); g.set(x, 13, z0 - 1, ...B.lantern(false)); }
  // Bavarian lozenge banners
  for (const x of [49, 61]) g.set(x, 19, z0 - 1, ...B.banner("light_blue", [["rhombus", "white"], ["border", "white"]], { facing: "north" }));
  for (const x of [49, 61]) { g.set(x, 20, z0 - 1, "smooth_quartz"); }
  // flagpole on the roof
  for (let y = top + 1; y <= top + 9; y++) g.set(55, y, 10, ...B.fence("spruce"));
  g.set(55, top + 9, 9, ...B.banner("light_blue", [["rhombus", "white"]], { facing: "north" }));
}

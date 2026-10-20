// ITB shell and lobby (plot 0): plinth/plaza, north lobby podium, 50x50 chamfered curtain-wall shaft y5..182.
import { readFileSync } from "node:fs";
import { plinth_fill, chamfer_corner, lit_lobby_front } from "../vocab/h1.mjs";
import { curtain_bay, window_backing } from "../vocab/h2.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 18, X1 = 67, Z0 = 20, Z1 = 69, CH = 6;
const inShaft = (x, z) => x >= X0 && x <= X1 && z >= Z0 && z <= Z1 &&
  Math.min(x - X0, X1 - x) + Math.min(z - Z0, Z1 - z) >= CH;

export function build(g) {
  const site = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8")).plots[0];
  const groundAt = (x, z) => {
    const r = z >> 1, c = x >> 1;
    return site.footprint[r]?.[c] === "#" ? (site.ground[r][c] || 0) : null;
  };
  // plinth / plaza: granite, slab coping on the rim, smooth_stone paving with andesite bands inside
  plinth_fill(g, [0, 0, 0, 89, 4, 91], groundAt, "polished_granite");
  // rim: full granite instead of a bottom slab, so the lobby walls and edge planters stand on solid stone at the plaza level
  for (let x = 0; x <= 89; x++) for (let z = 0; z <= 91; z++) {
    if (groundAt(x, z) == null) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => groundAt(x + dx, z + dz) == null)) g.set(x, 4, z, "polished_granite");
  }
  for (let x = 0; x <= 89; x++) for (let z = 0; z <= 91; z++) {
    if (groundAt(x, z) == null || inShaft(x, z)) continue;
    let inner = true;
    for (let d = -2; d <= 2 && inner; d++) inner = groundAt(x + d, z) != null && groundAt(x, z + d) != null;
    if (!inner) continue;
    g.set(x, 4, z, x % 10 === 0 || z % 10 === 0 ? "polished_andesite" : "smooth_stone");
  }

  // lobby podium (north): walls, lit glass front, roof deck with parapet and lights
  for (let z = 12; z <= 19; z++) for (const x of [22, 59]) for (let y = 5; y <= 13; y++) g.set(x, y, z, "brown_terracotta");
  lit_lobby_front(g, "north", 22, 59, 5, 13, 12, { doors: [[38, 43]] });
  for (let x = 22; x <= 59; x++) for (let z = 12; z <= 19; z++) {
    const lit = (x - 22) % 6 === 3 && (z - 12) % 6 === 1;
    g.set(x, 14, z, lit ? "sea_lantern" : "smooth_stone");
    if (x === 22 || x === 59 || z === 12) g.set(x, 15, z, "smooth_stone");
  }
  // north wall of the shaft behind the podium
  for (let y = 5; y <= 14; y++) for (let x = 25; x <= 60; x++) g.set(x, y, Z0, "brown_terracotta");

  // lit ground-floor lobbies on the other faces
  lit_lobby_front(g, "south", 25, 60, 5, 14, Z1, { doors: [[40, 45]] });
  lit_lobby_front(g, "east", 27, 62, 5, 14, X1, { doors: [[42, 47]] });
  lit_lobby_front(g, "west", 27, 62, 5, 14, X0);

  // chamfered corners, full height with piers
  const backing = [];
  const chamfers = [[X0, Z0, "nw"], [X1, Z0, "ne"], [X0, Z1, "sw"], [X1, Z1, "se"]];
  for (const [cx, cz, dir] of chamfers) {
    chamfer_corner(g, cx, cz, dir, CH, 5, 181);
    const sx = dir.includes("e") ? -1 : 1, sz = dir.includes("s") ? -1 : 1;
    for (let a = 1; a < CH; a++) for (let y = 5; y <= 181; y++) {
      if ((y - 5) % 5 === 0 || a % 3 === 0) continue;
      const bx = cx + sx * a + sx, bz = cz + sz * (CH - a) + sz;
      g.set(bx, y, bz, "black_concrete");
      if (y >= 15 && y <= 174) backing.push([bx, y, bz]);
    }
  }

  // curtain grid on the four faces, 32 storeys y15..174, then the top band y175..181
  const faces = [["north", 25, Z0], ["south", 25, Z1], ["east", X1, 27], ["west", X0, 27]];
  for (const [face, x0, z0] of faces) {
    const r = curtain_bay(g, face, x0, 15, z0, 32, { length: 36 });
    backing.push(...r.backing);
    // top band: bigger dark glass, a mullion every 6 cells, spandrel row at y175
    const alongX = face === "north" || face === "south";
    const plane = alongX ? z0 : x0, a0 = alongX ? x0 : z0;
    const inward = face === "north" || face === "west" ? 1 : -1;
    for (let i = 0; i < 36; i++) for (let y = 175; y <= 181; y++) {
      const m = y === 175 || i % 6 === 0;
      const p = (d) => (alongX ? [a0 + i, y, plane + d * inward] : [plane + d * inward, y, a0 + i]);
      g.set(...p(0), m ? "brown_terracotta" : "brown_stained_glass");
      if (!m) g.set(...p(1), "black_concrete");
    }
  }
  window_backing(g, backing);

  // roof deck y182 over the shaft, smooth_stone cornice proud by 1
  for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) if (inShaft(x, z)) g.set(x, 182, z, "smooth_stone");
  for (let i = 25; i <= 60; i++) {
    g.set(i, 182, Z0 - 1, "smooth_stone"); g.set(i, 182, Z1 + 1, "smooth_stone");
  }
  for (let i = 27; i <= 62; i++) { g.set(X0 - 1, 182, i, "smooth_stone"); g.set(X1 + 1, 182, i, "smooth_stone"); }
}

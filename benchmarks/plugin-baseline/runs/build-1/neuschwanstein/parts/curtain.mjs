// Curtain walls round the lower courtyard, the retaining wall between the terraces, courtyard floors, the grand stair and a well.
import { P, B, parapet, hash, slit } from "./shared.mjs";
export function curtain(g, { level }) {
  const wallTop = 19;
  const wall = (x0, z0, x1, z1) => {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) for (let y = 11; y <= wallTop; y++) g.set(x, y, z, y <= 13 ? P.base : P.wall);
    parapet(g, { from: [x0, wallTop + 1, z0], to: [x1, z1], block: P.wall, style: "crenellated" });
  };
  wall(22, 8, 23, 27); wall(88, 8, 89, 27);
  wall(22, 8, 39, 9); wall(71, 8, 89, 9);
  // lower courtyard floor
  for (let x = 24; x <= 87; x++) for (let z = 10; z <= 27; z++) g.set(x, 10, z, hash(x, z, 4) < 0.3 ? "cobblestone" : hash(x, z, 5) < 0.2 ? "gravel" : "stone_bricks");
  for (let x = 53; x <= 57; x++) for (let z = 16; z <= 27; z++) g.set(x, 10, z, "polished_andesite");
  // retaining wall between the terraces: stone-brick face, quartz-stair cornice, balustrade
  for (let x = 20; x <= 91; x++) {
    for (let y = 11; y <= 16; y++) g.set(x, y, 28, y > 14 ? P.wall : (hash(x, y, 2) < 0.2 ? "cracked_stone_bricks" : P.base));
    g.set(x, 17, 28, ...B.wall("stone_brick"));
  }
  for (let x = 24; x <= 88; x += 8) for (let y = 11; y <= 15; y++) { g.set(x, y, 27, P.base); if (y < 14) g.set(x + 1, y, 27, P.base); }  // buttresses
  // grand stair from the lower to the upper courtyard, rising south through the retaining wall
  for (let i = 0; i < 7; i++) for (let x = 40; x <= 46; x++) {
    const z = 22 + i;
    for (let y = 10; y < 11 + i; y++) g.set(x, y, z, P.base);
    g.set(x, 11 + i, z, ...B.stairs("stone_brick", "south"));
  }
  for (let x = 40; x <= 46; x++) g.unset(x, 17, 28);
  for (const x of [39, 47]) for (let i = 0; i < 7; i++) { for (let y = 10; y <= 11 + i; y++) g.set(x, y, 22 + i, P.base); g.set(x, 12 + i, 22 + i, ...B.wall("stone_brick")); }
  // upper courtyard paving
  for (let x = 39; x <= 58; x++) for (let z = 29; z <= 50; z++) if (g.isAir(x, 17, z)) g.set(x, 16, z, hash(x, z, 6) < 0.3 ? "cobblestone" : "stone_bricks");
  if (level < 2) return;
  // well in the upper court
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) g.set(44 + dx, 17, 44 + dz, "stone_bricks"); else g.set(44, 16, 44, "water");
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) for (const y of [18, 19]) g.set(44 + dx, y, 44 + dz, ...B.wall("stone_brick"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) g.set(44 + dx, 20, 44 + dz, ...B.slab("deepslate_tile"));
  g.set(44, 19, 44, ...B.chain("y")); g.set(44, 18, 44, ...B.lantern(true));
  // arrow slits and lanterns on the curtain walls
  for (const x of [26, 31, 36, 75, 80, 85]) { slit(g, x, 15, 8, 2); }
  for (const z of [12, 17, 22]) { slit(g, 22, 15, z, 2); slit(g, 89, 15, z, 2); }
}

// Prometheus: the dark wall, zodiac, inscription, basin and cascades, and the gilded figure with its mount and gold ring
// (plan.md SITE rows for the Prometheus wall, basin and figure; FACADES for the wall face).
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { darkWall, zodiacRing, inscriptionBand, prometheus, ZODIAC } from "../vocab.mjs";

export function build(g) {
  // dark granite back wall x18..19, z18..37, y0..10; its east face x19 keeps the zodiac and inscription cells as air
  darkWall(g, 18, 18, 19, 37, { base: 0, top: 10 });

  // zodiac ring on the wall face: gold circle with 12 sign marks, centred (y 5.5, z 27.5), radius 4.5
  zodiacRing(g, 19, [ZODIAC.y, ZODIAC.z], ZODIAC.radius);

  // inscription band at y 9, either side of the ring
  inscriptionBand(g, 19, 19, 22, 9);
  inscriptionBand(g, 19, 33, 36, 9);

  // fountain basin x20..22, z20..35: water at y1 (not over the mount), dark rim at x23, cascades on x20. basin() is not
  // called: its floor (polished_blackstone at y0) is a write into the ground part's locked cells, so every floor cell was
  // refused. The floor stays the ground's smooth_stone; the rest of the basin is written here, as basin() writes it.
  const SOURCE = { level: "0" };
  const SLAB = { type: "bottom", waterlogged: "false" };
  for (let x = 20; x <= 22; x++) for (let z = 20; z <= 35; z++) {
    if (z < 26 || z > 29) g.set(x, 1, z, "water", SOURCE);
  }
  for (let z = 20; z <= 35; z++) {
    g.set(23, 1, z, "polished_blackstone");
    g.set(23, 2, z, "polished_blackstone_slab", SLAB);
  }
  for (const [za, zb] of [[20, 23], [32, 35]]) for (let z = za; z <= zb; z++) {
    g.set(20, 5, z, "polished_blackstone_slab", SLAB);
    g.set(20, 6, z, "water", SOURCE);
  }

  // gilded figure: stepped gold mount z26..29 from y1, flying body, raised arm, shroomlight fire, and the gold ring in
  // the plane x21 (centred y 5.5, z 27.5). The helper lays the mount and ring itself, so goldMount/goldRing are not called.
  prometheus(g, 20, 24, { base: 1 });
  // the ring's diagonal steps leave four cells hanging by one face; a gold cell beside each ties it into the ring
  for (const [y, z] of [[3, 24], [3, 31], [8, 26], [8, 29]]) g.set(21, y, z, "gold_block");

  // lanterns stand on the wall top (y10) at z 18, 23, 32, 37
  for (const z of [18, 23, 32, 37]) g.set(18, 11, z, ...B.lantern(false));
}

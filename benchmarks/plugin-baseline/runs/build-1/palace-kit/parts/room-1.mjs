// room: Rotunda interior. No furniture (plan.md: a monument); the room's work is light. Under the inner keystone of each of
// the eight arches a hanging lantern hangs from the keystone (plan.md Lighting: "a hanging lantern under the crown of each
// arch at t = 0"), one cell lower than the keystone's own course: the keystone is chiseled_sandstone at y 26 on the inner
// archivolt, and the cell under it at y 25 is the room's own air. Standing lanterns on the paving stand only inside the
// inner octagon (|dx| <= 21, |dz| <= 21, |dx| + |dz| <= 30), where the ring's arch mouths and corners can't be blocked.
// Writes only into air.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const C = 31.5;
// inside the inner octagon (plan.md ROTUNDA: |dx| <= 21, |dz| <= 21, |dx| + |dz| <= 30)
const inside = (x, z) => {
  const dx = Math.abs(x - C), dz = Math.abs(z - C);
  return dx <= 21 && dz <= 21 && dx + dz <= 30;
};
// the eight arch axes: the inner keystones sit about 20 from the centre on each (N, NE, E, ...), so the keystone cell
// nearest that point is the arch's own keystone
const CROWN_R = 20;
const AXES = 8;
// standing lanterns on the paving, each checked against the inner octagon: 2 cells in from the N/E/S/W inner faces or
// the diagonal faces, clear of the ring's arch mouths (which lie outside the inner octagon)
const FLOOR_LAMPS = [[22, 13], [41, 13], [22, 50], [41, 50], [12, 24], [51, 24], [12, 39], [51, 39], [12, 42], [51, 42]];

export function build(g) {
  // the keystone cell nearest each arch axis (chiseled_sandstone at y 26 inside the octagon), so the lantern follows it
  const keystones = [];
  for (let x = 11; x <= 52; x++) for (let z = 11; z <= 52; z++) {
    if (inside(x, z) && g.blockAt(x, 26, z) === "minecraft:chiseled_sandstone") keystones.push({ x, z });
  }
  const crowns = [];
  for (let k = 0; k < AXES; k++) {
    const a = (k * Math.PI) / (AXES / 2);
    const tx = C + CROWN_R * Math.cos(a), tz = C + CROWN_R * Math.sin(a);
    let best = null;
    for (const s of keystones) {
      const d = Math.hypot(s.x - tx, s.z - tz);
      if (!best || d < best.d) best = { ...s, d };
    }
    // the cell under the keystone must be air (the room's own space), else no lantern on that arch
    if (best && g.isAir(best.x, 25, best.z)) crowns.push(best);
  }
  for (const { x, z } of crowns) g.set(x, 25, z, ...B.lantern(true));

  // standing lanterns: only where the cell is air and inside the inner octagon
  let floor = 0;
  const skipped = [];
  for (const [x, z] of FLOOR_LAMPS) {
    if (!inside(x, z)) { skipped.push(`${x},${z} (outside the inner octagon)`); continue; }
    if (!g.isAir(x, 1, z)) { skipped.push(`${x},${z} (cell taken)`); continue; }
    g.set(x, 1, z, ...B.lantern(false));
    floor++;
  }
  console.log(`room Rotunda interior: ${crowns.length} arch-crown lanterns (${crowns.map((c) => `${c.x},25,${c.z}`).join(" ")}), ${floor} floor lanterns${skipped.length ? `; skipped ${skipped.join("; ")}` : ""}`);
}

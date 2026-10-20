// Part "Stairs and ladders": B lobby->upper->top (x41..44 z25..34), E wing ground->upper (x128..130 z77..90).
import { flight, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const notes = [];
  const f = (o) => { const r = flight(g, { material: "smooth_quartz", ...o }); if (r.notes?.length) notes.push(...r.notes); return r; };
  g.fill([41, 10, 30], [42, 10, 34], "air");
  g.fill([43, 18, 29], [44, 18, 32], "air");
  // B: ground -> upper (x41..42, rising south), upper -> top (x43..44, rising south)
  f({ from: [42, 1, 25], facing: "south", to: 10, width: 2 });
  f({ from: [44, 11, 25], facing: "south", to: 18, width: 2 });
  // E wing: ground -> upper, x128..130 rising south (width 3)
  f({ from: [130, 1, 77], facing: "south", to: 10, width: 3 });
  if (notes.length) console.log("stairs notes:", notes.join("; "));
}

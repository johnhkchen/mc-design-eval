// Part: chimneys, stairs, hearths, job sites
import { chimney, flight, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { jobSite } from "../vocab.mjs";

function ladder(g, x, y0, y1, z, facing) {
  for (let y = y0; y <= y1; y++) g.set(x, y, z, "ladder", { facing });
}

export function build(g) {
  // chimneys, called directly (they lay their own footing and cut the mouth). The barn's flue stops at y 12: the roof's
  // back eave at (65, 13..14, 15) is kept clear by the roof part, so above y 12 the flue has no roof block beside it.
  const chims = [
    { wall: [32, 2, 15], into: "west", top: 13 },
    { wall: [40, 1, 15], into: "north", top: 12 },
    { wall: [65, 1, 15], into: "north", top: 12 },
    { wall: [91, 2, 15], into: "north", top: 16 },
  ];
  for (const c of chims) {
    try { chimney(g, { ...c, material: "bricks" }); } catch (e) { console.warn("chimney", c.wall, e.message); }
  }
  // flights (the headroom under the upper floor is open in the shell: the owner's hole at (86, 6, 13))
  for (const f of [
    { from: [26, 2, 13], facing: "east", to: 6, material: "spruce" },
    { from: [86, 2, 14], facing: "north", to: 6, material: "spruce" },
  ]) {
    try { const r = flight(g, f); if (r.notes?.length) console.warn("flight", r.notes); } catch (e) { console.warn("flight", e.message); }
  }
  // ladders
  ladder(g, 2, 1, 6, 15, "east");
  ladder(g, 52, 9, 15, 11, "north");
  ladder(g, 55, 2, 7, 16, "west");
  ladder(g, 64, 1, 9, 14, "east");
  // the corn crib's hatch sits two above the yard: a ladder from the landing (74, 2, 8) up to the bin floor
  ladder(g, 74, 2, 2, 8, "north");
  // job sites
  jobSite(g, "cartography_table", [21, 2, 16], { facing: "north" });
  jobSite(g, "smithing_table", [43, 1, 14], { facing: "west" });
  jobSite(g, "anvil", [42, 1, 12], { facing: "north" });
  jobSite(g, "lectern", [52, 2, 16], { facing: "north" });
  jobSite(g, "composter", [78, 2, 15], { facing: "north" });
  // forge quench
  g.set(41, 1, 14, "water_cauldron", { level: "3" });
}

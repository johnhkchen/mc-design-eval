// Test for vocab/h4.mjs: each helper, called once on an empty grid, places blocks only inside its footprint, and
// writes only into air. Run: node vocab/test-h4.mjs
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import * as h4 from "./h4.mjs";

let fails = 0;
const check = (name, ok, detail = "") => {
  if (!ok) fails++;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${detail ? `  ${detail}` : ""}`);
};

// box = [x0, y0, z0, x1, y1, z1]: every block the helper placed must lie inside it, and nothing may be skipped
function footprint(name, box, run) {
  const g = new Grid([34, 9, 34]);
  const r = run(g);
  const solids = g.solids();
  const outside = solids.filter((c) => !c.pos.every((v, i) => v >= box[i] && v <= box[i + 3]));
  check(name, solids.length > 0 && outside.length === 0 && r.skipped.length === 0,
    `placed ${solids.length}${outside.length ? `; outside: ${outside.map((c) => c.pos.join(",")).join(" ")}` : ""}${r.skipped.length ? `; skipped ${r.skipped.length}` : ""}`);
}

footprint("glass_bay along x", [22, 2, 25, 24, 4, 25], (g) => h4.glass_bay(g, 22, 24, 25, 2, 4));
footprint("glass_bay along z (gable clerestory)", [10, 6, 14, 10, 6, 19], (g) => h4.glass_bay(g, 14, 19, 10, 6, 6, { axis: "z" }));
footprint("ledgestone_wall", [11, 1, 7, 17, 5, 7], (g) => h4.ledgestone_wall(g, 11, 17));
footprint("carport", [0, 1, 7, 9, 5, 21], (g) => h4.carport(g, 0, 7));
footprint("car_50s", [3, 1, 1, 5, 2, 7], (g) => h4.car_50s(g, 3, 1));
footprint("mailbox", [9, 1, 1, 9, 2, 1], (g) => h4.mailbox(g, 9, 1));
footprint("garden_lamp", [20, 1, 4, 20, 3, 4], (g) => h4.garden_lamp(g, 20, 4));
footprint("sofa_low", [11, 2, 9, 15, 2, 10], (g) => h4.sofa_low(g, 12, 10, 3, "x", "south"));
footprint("conversation_pit", [13, 1, 20, 17, 2, 23], (g) => h4.conversation_pit(g, 13, 20, 17, 23));
footprint("bed_double", [26, 2, 18, 28, 3, 20], (g) => h4.bed_double(g, 26, 19, "east", "orange"));

// air only: a built cell inside the footprint is skipped, not overwritten
{
  const g = new Grid([34, 9, 34]);
  g.set(23, 2, 25, "stone");
  const r = h4.glass_bay(g, 22, 24, 25, 2, 4);
  check("glass_bay leaves a built cell alone", g.blockAt(23, 2, 25) === "minecraft:stone" && r.skipped.some((p) => p.join() === "23,2,25"),
    `skipped ${JSON.stringify(r.skipped)}`);
}

// nothing below y=0 is stored: a carport with the floor asked for counts the ground cells instead of throwing
{
  const g = new Grid([34, 9, 34]);
  const r = h4.carport(g, 0, 7, { floor: true });
  check("carport floor option writes y=0 over the ground", g.blockAt(5, 0, 14) === "minecraft:smooth_stone" && r.below === 0);
}

console.log(fails ? `${fails} FAILED` : "all h4 checks passed");
process.exit(fails ? 1 : 0);

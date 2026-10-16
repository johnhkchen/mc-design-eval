// Calls every h4 helper once on a small grid and checks that each placed block lies inside the footprint it was given,
// plus one check that a helper never writes over an existing block.
import { Grid } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pier_line, window, bracket, stair_run, stove, dresser, swing_seat, water_tank, pavilion_posts, quoin_corner } from "./h4.mjs";

const fails = [];
const inside = (box, [x, y, z]) => x >= box[0] && y >= box[1] && z >= box[2] && x <= box[3] && y <= box[4] && z <= box[5];

function check(name, box, call) {
  const g = new Grid([14, 12, 14], { dataVersion: 5023 });
  const out = call(g);
  const cells = g.solids();
  const bad = cells.filter((c) => !inside(box, c.pos));
  if (!cells.length) fails.push(`${name}: placed nothing`);
  if (bad.length) fails.push(`${name}: ${bad.length} block(s) outside footprint [${box}]: ${bad.map((c) => c.pos).join(" ")}`);
  console.log(`${name}: ${cells.length} blocks in [${box}], ${out.refused.length} refused`);
}

check("pier_line", [2, 1, 3, 8, 1, 3], (g) => pier_line(g, 2, 3, 8, 3, "bricks", "birch_trapdoor"));
check("window", [3, 2, 4, 4, 4, 5], (g) => window(g, 3, 3, 5, "north", 2, 2, { sill: "birch" }));
check("bracket", [6, 5, 3, 6, 5, 3], (g) => bracket(g, 6, 5, 3, "north", "birch"));
check("stair_run", [2, 1, 5, 3, 4, 8], (g) => stair_run(g, [2, 1, 8], "north", 4, "jungle", 2));
check("stove", [4, 3, 10, 4, 4, 10], (g) => stove(g, 4, 3, 10, "north"));
check("dresser", [7, 3, 12, 8, 4, 12], (g) => dresser(g, 7, 3, 12, "north"));
check("swing_seat", [10, 3, 6, 11, 5, 6], (g) => swing_seat(g, 10, 11, 3, 6));
check("water_tank", [2, 1, 2, 5, 9, 5], (g) => water_tank(g, 2, 2));
check("pavilion_posts", [1, 1, 7, 8, 4, 11], (g) => pavilion_posts(g, 1, 8, 7, 11));
check("quoin_corner", [12, 1, 3, 12, 4, 3], (g) => quoin_corner(g, 12, 3, { y0: 1, y1: 4, field: "bricks" }));

// never writes over an existing block: the bricks at (3,1,3) stay, and the skirt cell there is refused
{
  const g = new Grid([14, 12, 14], { dataVersion: 5023 });
  g.set(3, 1, 3, "bricks");
  const out = pier_line(g, 2, 3, 8, 3, "bricks", "birch_trapdoor");
  if (g.blockAt(3, 1, 3) !== "minecraft:bricks" || !out.refused.some(([x, y, z]) => x === 3 && y === 1 && z === 3)) fails.push("pier_line overwrote an existing block");
}

if (fails.length) {
  console.error(fails.join("\n"));
  process.exit(1);
}
console.log("h4 ok");

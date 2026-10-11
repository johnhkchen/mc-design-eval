// v3 revision of the ROXY cinema: small street-level details (awnings over exits, lamp posts, planters).
// Run: node edit2.mjs  (v2.nbt -> build.nbt). Form, relief and palette untouched.
import { load, B } from "../../../../../../minecraft-design/tools/src/build.mjs";
const HERE = new URL(".", import.meta.url).pathname;
const g = load(HERE + "v2.nbt");
const X0 = 2, X1 = 28, Z1 = 33;

const lamp = (x, z) => { for (let y = 1; y <= 4; y++) g.set(x, y, z, ...B.fence("nether_brick")); g.set(x, 5, z, ...B.lantern(false)); };
const bed = (x, z, flower) => { g.set(x, 1, z, "polished_blackstone_bricks"); g.set(x, 2, z, flower); };
const flora = ["azalea", "flowering_azalea", "allium", "azalea"];

// 1. awnings over the side exit doors: blackstone stair roof against the wall, cream top-slab fringe, a hanging lantern at each end
for (const [px, ox, face] of [[X0, -1, "east"], [X1, 1, "west"]]) {
  const z = 28, a = px + ox, b = px + 2 * ox;
  g.set(a, 4, z, "air");                                              // the old standing lantern gives way to the awning
  for (let dz = -1; dz <= 1; dz++) {
    g.set(a, 4, z + dz, ...B.stairs("polished_blackstone", face === "east" ? "west" : "east", "bottom"));
    g.set(b, 4, z + dz, ...B.slab("smooth_quartz", "top"));
  }
  g.set(b, 3, z - 1, ...B.lantern(true)); g.set(b, 3, z + 1, ...B.lantern(true));
}

// 2. the side street: lamp posts and planter beds on the pavement, in the bays between the fins
for (const pc of [0, 30]) {
  lamp(pc, 12); lamp(pc, 20);
  bed(pc, 16, flora[pc ? 1 : 0]); bed(pc, 24, flora[pc ? 3 : 2]);
}

// 3. the back lane: lamps and beds beside the exits, clear of the doors
for (const x of [10, 20]) lamp(x, Z1 + 2);
[3, 9, 15, 21, 27].forEach((x, i) => bed(x, Z1 + 2, flora[i % 4]));

// 4. two more lamps at the front corners (the side blade signs spill off the grid and orphan, so they are left out)
lamp(1, 3); lamp(29, 3);
g.save(HERE + "build.nbt");
console.log("saved build.nbt");

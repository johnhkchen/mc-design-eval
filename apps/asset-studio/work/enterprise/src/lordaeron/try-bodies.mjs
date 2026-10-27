import fs from "node:fs";
import { compose, layoutOf, metaOf } from "./compose.mjs";
for (const [name, p] of [["house_10x10", { W: 10, D: 10, storeys: 3, roof: "gable_x", trade: "any" }], ["house_13x7", { W: 13, D: 7, storeys: 3, roof: "gable_x", shop: true, beds: 3 }], ["house_10x10_2", { W: 10, D: 10, storeys: 2, roof: "gable_z" }]]) {
  const L = layoutOf(p), g = compose(L), m = metaOf(L);
  g.save(`out/bodies/${name}.nbt`);
  fs.writeFileSync(`out/bodies/${name}.json`, JSON.stringify({ footprint: [g.size[0], g.size[2]], ground: 2, entrances: [m.entrance], beds: m.beds, workstations: m.workstations, lockers: [], markers: [], entities: [] }));
}

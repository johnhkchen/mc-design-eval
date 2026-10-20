// Middle shells (plan.md ## MASSES rows 3, 3a, 4): the blue body, the blue bridge over the monorail and the red
// west-middle form, from the merged form field (parts/forms.mjs). Built after the north shells, before the south.
import { writeForms } from "./forms.mjs";

export function build(g) {
  // 3, 3a, 4. BLUE body, its bridge over the monorail (soffit y18) and RED, from the merged form field (leaning,
  // rolled crowns, seam courses, creases where they meet)
  writeForms(g, ["blue", "red", "bridge"]);

  // the soffit glass strip over the train (plan OPENINGS: x44..50, z70..87, y18)
  for (let x = 44; x <= 50; x++) for (let z = 70; z <= 87; z++) if (!g.isAir(x, 18, z)) g.set(x, 18, z, "glass");
  // the gallery windows: a glass band y22..24 over x40..52 in the bridge's north and south faces (the first skin cell)
  for (let x = 40; x <= 52; x++) for (let y = 22; y <= 24; y++)
    for (const [from, step] of [[62, 1], [94, -1]])
      for (let z = from; z !== 78; z += step) if (!g.isAir(x, y, z)) { g.set(x, y, z, "glass_pane"); break; }
}

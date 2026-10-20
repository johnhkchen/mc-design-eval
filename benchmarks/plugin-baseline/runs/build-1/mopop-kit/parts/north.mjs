// North shells: Purple, Silver A, hood (one leaning, merged field: parts/forms.mjs) and the silver fin.
import { fin } from "../vocab.mjs";
import { writeForms } from "./forms.mjs";

export function build(g) {
  // 1-3. Purple, Silver A and its hood: leaning, rolled-over crowns, seam-course cladding, creases where they meet
  writeForms(g, ["purple", "silverA", "hood"]);

  // Purple slot window: a glass band x70..76, y30..32 in the first purple skin cell from the north
  for (let x = 70; x <= 76; x++) for (let y = 30; y <= 32; y++)
    for (let z = 0; z <= 40; z++) if (!g.isAir(x, y, z)) { g.set(x, y, z, "glass_pane"); break; }

  // 4. Fin
  fin(g, { x0: 20, x1: 27, z0: 16, z1: 21, y0: 1, yTop: 20 });
}

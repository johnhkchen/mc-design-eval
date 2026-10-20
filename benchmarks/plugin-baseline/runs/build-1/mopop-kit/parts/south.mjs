// South shells: Gold (SW), Magenta (SE), Silver B (S), from the merged form field (parts/forms.mjs).
import { writeForms } from "./forms.mjs";

export function build(g) {
  writeForms(g, ["gold", "magenta", "silverB"]);
}

// Extract the FIRST balanced-brace JSON object from a model reply (T-198-01, shared in T-200-01). The naive
// `slice(firstBrace, lastBrace)` form crashes when a model emits TWO objects (or an object + trailing prose) —
// the slice spans both → "Unexpected non-whitespace character after JSON", which crashed the climb mid-run and
// lost the trajectory. This scans for the first complete `{…}` (string/escape aware so a `}` inside a string or
// after an escape does not terminate early) and ignores anything after it. PURE: `(string) → object`; throws on
// no-object / unbalanced. Single source for both climb runners (picture-climb.mjs, autonomy-loop.mjs) so the two
// can never drift.
export function parseFirstJsonObject(t) {
  const str = String(t);
  const s = str.indexOf("{");
  if (s < 0) throw new Error(`no JSON object in reply: ${str.slice(0, 120)}`);
  let depth = 0, inStr = false, esc = false;
  for (let i = s; i < str.length; i++) {
    const c = str[i];
    if (inStr) { if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false; }
    else if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return JSON.parse(str.slice(s, i + 1));
  }
  throw new Error(`unbalanced JSON object in reply: ${str.slice(s, s + 120)}`);
}

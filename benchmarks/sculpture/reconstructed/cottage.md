# Reconstructed milestone — cottage (T-107-01, E-27 terminal)

Chain: `styled-milestone.mjs` → gated; gate: **FAIL**; kit presence: **PASS**

Instrument: **frozen (zero diffs)** vs committed pre-run gate record; judge claude-opus-4-8

## Verdicts per azimuth

| azimuth | verdict | gaps (region/attribute, severity) |
|---|---|---|
| +x+z 45° | drifted | roof versus walls overall/massing (major); upper timber-framed storey/material zoning (minor); roof slopes and ridge/form (minor) |
| +x-z 135° | same object | roof eaves overhang on the near side/massing (minor); chimney atop the roof/form (minor) |
| -x-z 225° | same object | roof ridge and slopes/form (minor); upper-storey timber framing/material zoning (minor) |
| -x+z 315° | drifted | roof across the whole upper mass/form (major); overall building outline / eaves/massing (major); stone ground storey base/material zoning (minor) |

## Metrics before/after

| metric | E-26 baseline | reconstructed | source |
|---|---|---|---|
| protrusions (≥4/6 faces) | 265 | 86 | benchmarks/sculpture/styled/cottage/artifact.json@5574d70 → styled/cottage/artifact.json |
| ragged columns | 144/663 (21.7%) | 42/661 (6.3%) | same |
| roof fit | — | accepted: 2 gables, pitch by {"glb":3,"voxel":1}, glb rejected on 1 (divergence ≤ 5.59) | roof record |
| cage steps | — | 2 accepted / 0 rolled back | regularize record |

Sheets: before `pr/assets/frames/reconstructed-cottage-before.png`, after `pr/assets/frames/reconstructed-cottage-after.png`, gate `pr/assets/frames/multi-angle-cottage-styled.png`

Milestone record: `benchmarks/sculpture/styled/cottage.json`; shas `{"base":null,"shell":"33b1ca02f2589f49dd8c678e2416bf81196be41bf91451c4c9e351baf24c0afd","reconstructed":"477399990e7c8b68e8980349f1627b240bd36fbfc1cd402d45ccd65f528046d6","skinFinal":"9bf220364ece6e1b8806b35241441d278fff550eb2614c13c9830473a197996e","grammarFinal":"2ddf360850512d8cc8b50d2ced4a81194b501208305a20eb2df10aa9e2f0146b","styled":"33ffd0c825a04eeb481740a22268386249a95581fe0af712d20cbb9232d4a48f"}`

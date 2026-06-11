# Reconstructed milestone — gatehouse (T-107-01, E-27 terminal)

Chain: `styled-milestone.mjs` → gated; gate: **FAIL**; kit presence: **PASS**

Instrument: **frozen (zero diffs)** vs committed pre-run gate record; judge claude-opus-4-8

## Verdicts per azimuth

| azimuth | verdict | gaps (region/attribute, severity) |
|---|---|---|
| +x+z 45° | drifted | roof — the build's roof is broken, stepped and lumpy with protruding blocks instead of one clean ridge-to-eave pitch/form (major); right end / overall outline — extra protruding masses and a ragged outline break the clean single rectangular box of the references/massing (major); front archway — the dark door/arch reads but is partly obscured and less centered than the concept/material zoning (minor) |
| +x-z 135° | drifted | roof/form (major); walls/palette (major); overall building mass/massing (minor) |
| -x-z 225° | drifted | roof across the whole top/form (major); right-hand end of the building/massing (major); walls and roof stonework/palette (minor) |
| -x+z 315° | drifted | overall roof and walls/form (major); roof ridge and eaves/massing (major); top corners and parapet/form (minor) |

## Metrics before/after

| metric | E-26 baseline | reconstructed | source |
|---|---|---|---|
| protrusions (≥4/6 faces) | 118 | 43 | benchmarks/sculpture/styled/gatehouse/artifact.json@2201052 → styled/gatehouse/artifact.json |
| ragged columns | 96/679 (14.1%) | 55/679 (8.1%) | same |
| roof fit | — | accepted: 2 gables, pitch by {"glb":2,"voxel":1,"unknown":1} | roof record |
| cage steps | — | 2 accepted / 0 rolled back | regularize record |

Sheets: before `pr/assets/frames/reconstructed-gatehouse-before.png`, after `pr/assets/frames/reconstructed-gatehouse-after.png`, gate `pr/assets/frames/multi-angle-gatehouse-styled.png`

Milestone record: `benchmarks/sculpture/styled/gatehouse.json`; shas `{"base":null,"shell":"b6c899187d50efeef411279640837f6b42e960975c76378edb8747073975e20c","reconstructed":"463ce9e25ace7ca3e787c918504933bfa4fd031fc7b458caa30c4ade9eedfd82","skinFinal":"0719a638254798928a4b7cbad8cbc3bed6910f0323f2dc72516df60ed654c60b","grammarFinal":"e350000c955a815468b7ad8fc3114897411ada50816835a95ebde1852ce0d817","styled":"a8b4c58e3571d86e5edaa2130a04ab604ff6a940884b1a644bb2c0653567d90e"}`

# Reconstructed milestone — gatehouse (T-107-01, E-27 terminal)

Chain: `styled-milestone.mjs` → gated; gate: **FAIL**; kit presence: **PASS**

Instrument: **frozen (zero diffs)** vs committed pre-run gate record; judge claude-opus-4-8

## Verdicts per azimuth

| azimuth | verdict | gaps (region/attribute, severity) |
|---|---|---|
| +x+z 45° | drifted | roof — ridge line and slopes/form (major); upper roof edges and chimney-like protrusions/massing (major); front doorway / arch opening/form (minor) |
| +x-z 135° | drifted | roof and upper edges/form (major); overall silhouette / wall tops/massing (minor); stone walls and dark roof / wood trim/palette (minor) |
| -x-z 225° | drifted | roof / upper massing/form (major); overall silhouette vs mesh/massing (major); front facade and doorway/form (minor) |
| -x+z 315° | same object | roof ridge, upper-left/form (minor); corner pilasters / wall surface/form (minor) |

## Metrics before/after

| metric | E-26 baseline | reconstructed | source |
|---|---|---|---|
| protrusions (≥4/6 faces) | 118 | 25 | benchmarks/sculpture/styled/gatehouse/artifact.json@2201052 → styled/gatehouse/artifact.json |
| ragged columns | 96/679 (14.1%) | 67/679 (9.9%) | same |
| roof fit | — | accepted: 2 gables, pitch by {"glb":2,"voxel":1,"unknown":1} | roof record |
| cage steps | — | 2 accepted / 0 rolled back | regularize record |

Sheets: before `pr/assets/frames/reconstructed-gatehouse-before.png`, after `pr/assets/frames/reconstructed-gatehouse-after.png`, gate `pr/assets/frames/multi-angle-gatehouse-styled.png`

Milestone record: `benchmarks/sculpture/styled/gatehouse.json`; shas `{"base":null,"shell":"b6c899187d50efeef411279640837f6b42e960975c76378edb8747073975e20c","reconstructed":"33305fce57339c50c5f67c04b1fe3183662203ca59af112dabf6f39274f3143e","skinFinal":"4a1add05dc2d5a295f59865bf05ab4bae363e7bcc441c9396cd4206f8ab9273a","grammarFinal":"f9c0a3068649d564d0b6afcaca6053bf52a5c80c673ef6ad0ecb73dca59e7c47","styled":"e3b89444f3a5365b4fb4cff655dfc57574ff397d104fd5674e962ad207ac2b8e"}`

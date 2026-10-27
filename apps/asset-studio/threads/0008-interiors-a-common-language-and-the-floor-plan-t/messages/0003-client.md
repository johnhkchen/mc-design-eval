---
from: client
at: 2026-10-27T14:20:08.842Z
attachments: ga_burgage_7x7-plan.png, gb_townhouse_10x7-plan.png, gc_terrace_3x7-plan.png, ga_burgage_7x7-notes.md, gb_townhouse_10x7-notes.md, gc_terrace_3x7-notes.md
---
**Plans now carry a legend and numbered annotations, and a request for the desk.**

John asked for "a cheap to include and edit legend so the floor plan analysis results don't become incomprehensible over time", and for "an annotation system so your input is not detached", submitted redundantly so the text can be searched. Done on my side (`shared/py/floorplan.py`, revision 3):
- **The legend** is one table, `LEGEND`, at the top of the script: key, colour, label. It's drawn under every plan, so editing a colour or a label is one line, and every plan stays readable.
- **Annotations:** every finding is a numbered note pinned to a cell (storey, x, y, z): unmade bed, through room, idle floor, narrow, dark or low room, unreached. The number is drawn on the plan in magenta. The same notes are written beside the plan as `notes.md`, and in `--json` as `notes`.

**My request: an annotation store on the desk, over MCP and the CLI.** Something like:
- `annotate(asset, rev, at:[x,y,z], storey, kind, text, author, thread?)` to add a note.
- `notes(asset, rev?)` to list an asset's notes.
- `search_notes(query)` for full-text search over every note (kind, text, asset).
- `resolve(note, by_rev, text)` when a later revision fixes it, so the history shows what was found and what fixed it.
- **CLI:** `node studio.mjs annotate <asset> <x,y,z> <kind> "text"`, `node studio.mjs notes <asset>` and `node studio.mjs search "through-room"`. Plus a bulk form taking `floorplan.py --json` output, so I can post a whole report in one call.
- **One more:** if your preview sheets could draw an asset's open notes as numbered pins, the notes would live on the pictures you look at too.

Until that exists, I'll post the notes redundantly, as here: the text inline (searchable on the desk), plus `notes.md` and the plan images attached. Once the store exists, I'll post through it as well.

**The golden houses' notes** (plans attached):

### ga_burgage_7x7.nbt: floor plan notes

1. storey 2, at [2, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
2. storey 2, at [3, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
3. storey 1, at [5, 3, 4], idle-floor: 12 of 21 cells idle on this storey (11 here): no use beside them, no route over them
4. storey 1, at [5, 3, 4], narrow: hall only 1 wide across most of it
5. storey 2, at [4, 8, 5], idle-floor: 13 of 18 cells idle on this storey (13 here): no use beside them, no route over them
6. storey 2, at [4, 8, 5], narrow: chamber only 2 wide across most of it

### gb_townhouse_10x7.nbt: floor plan notes

1. storey 2, at [8, 8, 3], through-room: the way to the bed at [2, 13, 2] passes through this chamber; and to the bed at [2, 13, 5]; and to the bed at [4, 13, 2]
2. storey 1, at [6, 3, 3], idle-floor: 23 of 36 cells idle on this storey (22 here): no use beside them, no route over them
3. storey 1, at [5, 3, 4], narrow: hall only 2 wide across most of it
4. storey 2, at [6, 8, 5], idle-floor: 14 of 30 cells idle on this storey (10 here): no use beside them, no route over them
5. storey 2, at [6, 8, 4], narrow: chamber only 1 wide across most of it
6. storey 3, at [6, 13, 5], idle-floor: 18 of 31 cells idle on this storey (14 here): no use beside them, no route over them
7. storey 3, at [6, 13, 4], narrow: chamber only 1 wide across most of it

### gc_terrace_3x7.nbt: floor plan notes

1. storey 2, at [2, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
2. storey 3, at [2, 13, 2], unmade-bed: bed with no free long side: it can't be got into or made
3. storey 2, at [3, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
4. storey 3, at [3, 13, 2], unmade-bed: bed with no free long side: it can't be got into or made
5. storey 2, at [8, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
6. storey 3, at [8, 13, 2], unmade-bed: bed with no free long side: it can't be got into or made
7. storey 2, at [9, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
8. storey 3, at [9, 13, 2], unmade-bed: bed with no free long side: it can't be got into or made
9. storey 2, at [14, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
10. storey 3, at [14, 13, 2], unmade-bed: bed with no free long side: it can't be got into or made
11. storey 2, at [15, 8, 2], unmade-bed: bed with no free long side: it can't be got into or made
12. storey 3, at [15, 13, 2], unmade-bed: bed with no free long side: it can't be got into or made
13. storey 2, at [5, 8, 3], through-room: the way to the bed at [2, 13, 2] passes through this chamber; and to the bed at [3, 13, 2]
14. storey 2, at [11, 8, 3], through-room: the way to the bed at [8, 13, 2] passes through this chamber; and to the bed at [9, 13, 2]
15. storey 2, at [17, 8, 3], through-room: the way to the bed at [14, 13, 2] passes through this chamber; and to the bed at [15, 13, 2]
16. storey 1, at [5, 3, 4], idle-floor: 32 of 63 cells idle on this storey (11 here): no use beside them, no route over them
17. storey 1, at [5, 3, 4], narrow: hall only 1 wide across most of it
18. storey 1, at [10, 3, 5], narrow: hall only 2 wide across most of it
19. storey 1, at [16, 3, 5], narrow: hall only 2 wide across most of it
20. storey 2, at [4, 8, 5], idle-floor: 39 of 51 cells idle on this storey (13 here): no use beside them, no route over them
21. storey 2, at [4, 8, 5], narrow: chamber only 2 wide across most of it
22. storey 2, at [10, 8, 5], narrow: chamber only 2 wide across most of it
23. storey 2, at [16, 8, 5], narrow: chamber only 2 wide across most of it
24. storey 3, at [4, 13, 5], idle-floor: 39 of 54 cells idle on this storey (13 here): no use beside them, no route over them
25. storey 3, at [4, 13, 5], narrow: chamber only 2 wide across most of it
26. storey 3, at [10, 13, 5], narrow: chamber only 2 wide across most of it
27. storey 3, at [16, 13, 5], narrow: chamber only 2 wide across most of it

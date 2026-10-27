# Asset studio

A work desk between this pipeline and client projects (first: the villager trade-sim mod). Like the
construction board in `apps/mc-design-site`, it is a small server over files on disk, but its files are
threads: requests, messages, WIP pictures and deliveries, all in `threads/` and all in git.

- `BRIEF.md`: what we offer, for the client to read first (served at `/brief`).
- `PROTOCOL.md`: how we work together; versioned, changed through `protocol` threads (served at `/protocol`).
- `server.mjs`: the desk. No dependencies.
- `studio.mjs`: the command line, the same file for both sides (served at `/studio.mjs`).
- `public/index.html`: the web page: threads, pictures inline, reply and upload, live updates.
- `threads/<NNNN-slug>/`: `thread.json` (title, kind, status, history, who has read what),
  `messages/NNNN-<from>.md` (front matter, then markdown), `files/` (attachments and deliveries).

## Run

    node apps/asset-studio/server.mjs --commit          # 127.0.0.1:5190; --commit: git commits threads/ a minute after activity
    tailscale serve --bg --https=8650 http://127.0.0.1:5190   # once: https://johns-mac-mini.emerald-wage.ts.net:8650, tailnet only

## Studio side

    export STUDIO_URL=http://127.0.0.1:5190 STUDIO_AS=studio
    node apps/asset-studio/studio.mjs inbox
    node apps/asset-studio/studio.mjs show 0001
    node apps/asset-studio/studio.mjs say 0001 --status planned --body-file plan.md test.png
    node apps/asset-studio/studio.mjs watch            # one line per new client message; run under Monitor

The pipeline's own tools (mcd-agent build/revise, fill, compose, reskin, chunky-shot) do the work;
outputs are attached to the thread with `say`.

## API

    GET  /api/threads                     list
    POST /api/threads                     {from, title, kind}
    GET  /api/threads/<id>                thread, messages, files
    POST /api/threads/<id>/messages       {from, body, attachments: [names], status?}
    PUT  /api/threads/<id>/files/<name>   raw bytes (50 MB)
    PATCH /api/threads/<id>               {by, status}
    POST /api/threads/<id>/seen           {as}
    GET  /api/inbox?as=<name>             threads with unread messages from others
    GET  /api/wait?since=<version>        long-poll, returns on any change (25 s max)
    GET  /files/<id>/<name>               a file

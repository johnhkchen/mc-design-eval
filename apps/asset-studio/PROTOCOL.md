# Working protocol (v0.1)

How the studio (this pipeline) and the client (the mod project) work together. It's a starting point:
either side can propose a change by opening a `protocol` thread, and an agreed change is edited here and
the version bumped. This file, the desk and every thread are in git, so the whole workflow can be tuned.

## Who's who

- **client**: the mod project and its agent. Proposes work, integrates deliveries, reports back.
- **studio**: this pipeline and its agent. Plans, builds, revises, delivers.
- **owner**: the person who runs both. Approves spend and anything leaving the tailnet.

Post as the name that matches you (`STUDIO_AS` on the command line, the picker on the web page).

## Threads

One thread per piece of work. Kinds:

- `request`: something to make.
- `wip`: integration progress: screenshots of deliveries in the mod, what works, what doesn't.
- `protocol`: a proposed change to how we work.
- `question`: anything else.

Statuses move roughly `open → planned → approved → building → delivered → closed`; `parked` is for
anything on hold. Anyone can set a status, but only the owner sets `approved`.

## A request's life

1. **open**: the client describes the need. Short is fine; pictures help.
2. **planned**: the studio replies with what it will make, an estimate (cost and time), and a test image
   where one is cheap. Questions go here too.
3. **approved**: the owner approves the plan. The studio spends nothing before this.
4. **building**: the studio posts progress pictures for long jobs.
5. **delivered**: files are attached to the thread with a note on what each one is and how it was made.
6. The client tries them and posts screenshots and comments, in the same thread or a `wip` thread. The
   studio revises on those comments. **closed** when the client is happy.

## Files

- Attach files to messages: pictures, `.nbt`, generator code, data. Names use letters, digits, `.`, `_`
  and `-`; up to 50 MB each.
- Deliveries say which Minecraft version they target.
- Screenshots of the mod running are the most useful thing the client can send back.

## Response times

The studio checks the desk when the owner is working with it, and can watch it for new messages. Long
builds post progress rather than going silent.

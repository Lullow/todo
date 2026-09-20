# Tasks

A task list that lives in the project as plain markdown files, so that both you
and Claude Code can read and change it. The VS Code panel renders the directory
and updates itself when the files change — no matter who changed them.

## Why not Todo Tree

Todo Tree is a read-only scanner over `TODO:` comments in source code. It has no
state of its own, so it cannot hold a status, and it removed its file watcher in
version 0.0.224 in favour of polling that is disabled by default. The latest
release is from April 2023.

What was needed here was something the agent can *write* to, and that shows up
immediately when it does.

## The format

One file per task in `.claude/todos/`:

```markdown
---
id: fix-the-ripgrep-path
status: open
created: 2026-09-19
---

Set todo-tree.ripgrep.ripgrep to /usr/bin/rg.
```

Three fields, and the title is the first line of the body. `status` is `open`,
`doing` or `done`.

The format is deliberately small. Anything that can be written with a
single-line `Edit` can be changed by the agent without touching the rest of the
file, and anything readable in a diff can be reviewed in a commit.

## Building

Requires Node 24.

```bash
npm install
npm run deploy      # compiles, packages and installs
```

Then reload the window: **Developer: Reload Window**.

F5 does not work in this setup, and there is no `launch.json`. The host window is
a WSL remote window that starts without a folder; neither a bare path nor
`--folder-uri` got it to open the project, and without a project root the panel
has nothing to read. The configuration was removed because a broken one with a
hardcoded home path is worse than none at all.

## Not there yet

- No mirroring of Claude Code's live TodoWrite list. That depends on the format
  of the session JSONL, which is undocumented and easy to parse wrong. It waits
  until the foundation has proven itself.
- No way to set `doing` from the panel. The agent sets it; you check it off.
- No sorting or priority beyond "oldest first".

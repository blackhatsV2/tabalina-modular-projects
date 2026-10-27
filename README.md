# tabalina-modular-projects

A monorepo containing multiple independent projects, each in its own top-level folder.

## Structure

Each project lives in its own directory at the root of this repo, with its own code, dependencies, and configuration:

```
tabalina-modular-projects/
├── project-a/
├── project-b/
├── project-c/
└── README.md
```

Projects are independent of each other. Adding a new project means adding a new top-level folder.

## Branching

- `main` is the shared trunk for all projects.
- Branches are short-lived and scoped to a single change, prefixed with the project they touch, e.g. `project-a/add-login`.
- Changes that affect multiple projects get their own clearly-labeled branch.

## Projects

| Folder | What it is |
|---|---|
| `budget-app/` | Budget Buddy: offline-first personal budget app (React + TypeScript + Vite, Capacitor for Android, optional Supabase sync, Vercel deploy). See `budget-app/CLAUDE.md`. |

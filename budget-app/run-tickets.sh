#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

for f in .scratch/budget-engine-core/issues/*.md; do
  if grep -Eqi 'Status:\**\s*done' "$f"; then continue; fi
  echo "=== Working on $f"
  claude -p "/implement Implement exactly one ticket: $f. First read .scratch/budget-engine-core/spec.md, CLAUDE.md, GLOSSARY.md and docs/adr. Write tests first. Run npm run typecheck and npm test until both pass. Then set this ticket's Status to done and git commit. Do not push. If you can't make it pass, set Status to blocked with a short note why, commit, and stop." \
    --permission-mode auto --permission-prompts none
  if grep -Eqi 'Status:\**\s*blocked' "$f"; then
    echo "Blocked on $f. Stopping so you can look."; exit 1
  fi
done
echo "All tickets done."
git push

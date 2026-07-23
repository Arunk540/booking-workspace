#!/bin/sh
# One-call agent boot: root + resolver + lessons + pins in ONE terminal call,
# replacing 6-8 separate discovery round-trips (each one is a billed model turn).
# Usage: sh .contmark/boot.sh "<key nouns from the task>"
d="$(pwd)"
while [ "$d" != "/" ]; do
  [ -f "$d/.contmark/workspace.yml" ] && break
  d="$(dirname "$d")"
done
if [ "$d" = "/" ]; then echo "NO_CONTMARK"; exit 1; fi
echo "ROOT: $d"
echo "== RESOLVER =="
node "$d/.contmark/resolve-task.js" "$d" "$*" 2>&1 | head -60
echo "== WORKSPACE LESSONS (first 40 lines) =="
sed -n '1,40p' "$d/.contmark/lessons.md" 2>/dev/null
for r in "$d"/.contmark/repos/*/; do
  n="$(basename "$r")"
  if [ -f "$r/lessons.md" ]; then echo "== LESSONS $n (first 25) =="; sed -n '1,25p' "$r/lessons.md"; fi
  if [ -f "$r/_pins.yml" ]; then echo "== PINS $n (first 30) =="; sed -n '1,30p' "$r/_pins.yml"; fi
done

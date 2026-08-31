#!/usr/bin/env bash
# Running score against the pre-registered thresholds in README.md.
# Counts only "yes" on each marker line, ignoring the template itself.
set -euo pipefail
cd "$(dirname "$0")"

# Note the `|| true` on every counter: with no logs yet the globs match
# nothing and grep exits non-zero, which under `set -e` would kill the script
# before it could tell you that you have done zero interviews.
logs=$(find . -maxdepth 1 -name '[0-9]*.md' | sort)
total=$(printf '%s' "$logs" | grep -c . || true)
count() {
  [ -z "$logs" ] && { echo 0; return; }
  # shellcheck disable=SC2086
  grep -h "^\`$1:" $logs 2>/dev/null | grep -ci "yes" || true
}

q4=$(count Q4_ACTS)
q2=$(count NAMED_COST)
q3n=$(count NOTHING_WRITTEN)
q3b=$(count BOTHERED)
q5=$(count WRITEUP_OVER_5MIN)
liab=$(count ENDORSEMENT_LIABILITY)
seam=$(count SEAMLESS_ALREADY)
try=$(count WOULD_TRY)

verdict() { # value threshold
  if [ "$1" -ge "$2" ]; then echo "PASS"; else echo "fail"; fi
}

echo "CFI discovery — $total of 20 conversations logged"
echo
printf '  %-46s %2s/%-3s  %s\n' "Q4 cross-instructor finding drives action" "$q4" "8"  "$(verdict "$q4" 8)"
printf '  %-46s %2s/%-3s  %s\n' "Q2 named a student and a cost"             "$q2" "6"  "$(verdict "$q2" 6)"
printf '  %-46s %2s/%-3s  %s\n' "Q3 nothing written down"                   "$q3n" "-" ""
printf '  %-46s %2s/%-3s  %s\n' "Q3 ...and bothered by it"                  "$q3b" "8"  "$(verdict "$q3b" 8)"
printf '  %-46s %2s/%-3s  %s\n' "Q5 write-up over 5 min/flight"             "$q5" "10" "$(verdict "$q5" 10)"
echo
echo "  Counter-signals (high numbers here are bad news):"
printf '    %-44s %2s\n' "flies regardless — endorsement liability" "$liab"
printf '    %-44s %2s\n' "handoffs already seamless, records good"  "$seam"
echo
printf '  %-46s %2s\n' "would try it" "$try"
echo
if [ "$total" -lt 20 ]; then
  echo "  Not done yet. Do not read the score as a result until all 20 are in --"
  echo "  the first few calls are the ones you are worst at running."
fi

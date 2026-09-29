#!/usr/bin/env bash
# Uses a new simulator, synthetic values and the same app sources as release builds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUTPUT="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/hverdagsoss-native-qa"
mkdir -p "$OUTPUT"
python3 scripts/prepare-ios-native-qa.py
SELECTION="$(python3 - <<'PY'
import json, subprocess
runtime_data = json.loads(subprocess.check_output(['xcrun','simctl','list','runtimes','-j'], timeout=30))
runtimes = [r for r in runtime_data['runtimes'] if r.get('isAvailable') and '.iOS-' in r['identifier']]
if not runtimes:
    raise SystemExit('No installed iOS Simulator runtime; do not mark native QA as passed.')
runtime = max(runtimes, key=lambda r: tuple(int(x) for x in r['version'].split('.')))
types = json.loads(subprocess.check_output(['xcrun','simctl','list','devicetypes','-j'], timeout=30))['devicetypes']
by_name = {t['name']: t['identifier'] for t in types}
for name in ('iPhone 17', 'iPhone 16', 'iPhone 15'):
    if name in by_name:
        print(by_name[name], runtime['identifier'])
        break
else:
    raise SystemExit('No supported iPhone simulator type found.')
PY
)"
read -r DEVICE_TYPE RUNTIME <<< "$SELECTION"
SIMULATOR="$(xcrun simctl create "HverdagsOss-QA-${GITHUB_RUN_ID:-local}" "$DEVICE_TYPE" "$RUNTIME")"
cleanup() {
  xcrun simctl shutdown "$SIMULATOR" >/dev/null 2>&1 || true
  xcrun simctl delete "$SIMULATOR" >/dev/null 2>&1 || true
}
trap cleanup EXIT
xcrun simctl boot "$SIMULATOR"
python3 - "$SIMULATOR" <<'PY'
import subprocess, sys
subprocess.run(['xcrun', 'simctl', 'bootstatus', sys.argv[1], '-b'], check=True, timeout=240)
PY
RESULT="$OUTPUT/NativeQA-${GITHUB_RUN_ATTEMPT:-1}-$(date +%s).xcresult"
set +e
xcodebuild test \
  -project ios/App/App.xcodeproj \
  -scheme NativeQA \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$SIMULATOR" \
  -derivedDataPath "$OUTPUT/DerivedData" \
  -resultBundlePath "$RESULT" \
  -parallel-testing-enabled NO \
  -maximum-concurrent-test-simulator-destinations 1 \
  -test-timeouts-enabled YES \
  -default-test-execution-time-allowance 90 \
  -maximum-test-execution-time-allowance 120 \
  CODE_SIGNING_ALLOWED=NO 2>&1 | tee "$OUTPUT/xcode-test.log"
STATUS=${PIPESTATUS[0]}
set -e
if [ "$STATUS" -ne 0 ]; then
  xcrun simctl io "$SIMULATOR" screenshot "$OUTPUT/failure.png" >/dev/null 2>&1 || true
fi
exit "$STATUS"

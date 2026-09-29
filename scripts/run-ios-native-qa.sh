#!/usr/bin/env bash
# Uses a new simulator, synthetic values and the same app sources as release builds.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUTPUT="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/hverdagsoss-native-qa"
mkdir -p "$OUTPUT"
# Preserve setup/boot failures too, including failures before an xcresult exists.
exec > >(tee "$OUTPUT/runner.log") 2>&1
bounded() {
  python3 -S - "$@" <<'PY'
import subprocess, sys
seconds = int(sys.argv[1])
if not 0 < seconds <= 900:
    raise SystemExit('Command timeout must be between 1 and 900 seconds')
try:
    result = subprocess.run(sys.argv[2:], timeout=seconds)
except subprocess.TimeoutExpired:
    print(f'Native QA command timed out after {seconds}s: {sys.argv[2:]}', file=sys.stderr, flush=True)
    raise SystemExit(124)
raise SystemExit(result.returncode if result.returncode >= 0 else 128 - result.returncode)
PY
}
SIMULATOR=""
cleanup() {
  local status=$?
  trap - EXIT
  set +e
  if [ -n "$SIMULATOR" ]; then
    if [ "$status" -ne 0 ]; then
      bounded 20 xcrun simctl list devices -j > "$OUTPUT/simulator-state.json" 2> "$OUTPUT/simulator-state.log"
      bounded 20 xcrun simctl io "$SIMULATOR" screenshot "$OUTPUT/failure.png"
    fi
    # Only touch this run's disposable simulator; preserve the original failure.
    bounded 30 xcrun simctl shutdown "$SIMULATOR"
    bounded 30 xcrun simctl delete "$SIMULATOR"
  fi
  echo "Native QA finished with exit status $status"
  exit "$status"
}
trap cleanup EXIT
python3 -S scripts/prepare-ios-native-qa.py
SELECTION="$(python3 -S - <<'PY'
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
echo "Native QA device: $DEVICE_TYPE; runtime: $RUNTIME"
SIMULATOR="$(bounded 30 xcrun simctl create "HverdagsOss-QA-${GITHUB_RUN_ID:-local}" "$DEVICE_TYPE" "$RUNTIME")"
bounded 60 xcrun simctl boot "$SIMULATOR"
# A new iOS runtime may spend more than four minutes on first-boot migration.
# Keep a finite setup deadline; do not retry or relax the actual app assertions.
bounded "${NATIVE_QA_BOOT_TIMEOUT_SECONDS:-600}" xcrun simctl bootstatus "$SIMULATOR" -b
RESULT="$OUTPUT/NativeQA-${GITHUB_RUN_ATTEMPT:-1}-$(date +%s).xcresult"
# Reuse the exact App dependencies already resolved in this DerivedData.
RESOLUTION_ARGS=()
if [ -f ios/App/App.xcodeproj/project.xcworkspace/xcshareddata/swiftpm/Package.resolved ]; then
  RESOLUTION_ARGS=(-disableAutomaticPackageResolution)
fi
# The simulator requires application-identifier entitlements for real Keychain
# access. Local ad-hoc signing supplies them without a team, certificate or account.
# This is not device provisioning or App Store signing.
set +e
xcodebuild test \
  -project ios/App/App.xcodeproj \
  -scheme NativeQA \
  -configuration Debug \
  -destination "platform=iOS Simulator,id=$SIMULATOR" \
  -derivedDataPath "$OUTPUT/DerivedData" \
  -resultBundlePath "$RESULT" \
  "${RESOLUTION_ARGS[@]}" \
  -parallel-testing-enabled NO \
  -maximum-concurrent-test-simulator-destinations 1 \
  -test-timeouts-enabled YES \
  -default-test-execution-time-allowance 90 \
  -maximum-test-execution-time-allowance 120 \
  CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- DEVELOPMENT_TEAM= \
  2>&1 | tee "$OUTPUT/xcode-test.log"
STATUSES=("${PIPESTATUS[@]}")
STATUS=${STATUSES[0]}
if [ "$STATUS" -eq 0 ] && [ "${STATUSES[1]}" -ne 0 ]; then STATUS=${STATUSES[1]}; fi
set -e
exit "$STATUS"

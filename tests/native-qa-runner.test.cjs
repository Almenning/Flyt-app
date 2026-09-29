const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const source = path.join(__dirname, '../scripts/run-ios-native-qa.sh');

// Exercise the real runner on Linux/macOS with fake platform commands, not accounts.
function exercise(scenario, verify) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'native-runner-'));
  try {
    const scripts = path.join(temp, 'scripts'), bin = path.join(temp, 'bin');
    fs.mkdirSync(scripts); fs.mkdirSync(bin);
    const runner = path.join(scripts, 'run-ios-native-qa.sh');
    fs.copyFileSync(source, runner);
    fs.writeFileSync(path.join(scripts, 'prepare-ios-native-qa.py'),
      `import sys\nprint('QA setup started', flush=True)\nsys.exit(${scenario === 'setup-failure' ? 43 : 0})\n`);
    const fake = `#!/usr/bin/env -S python3 -S
import json, os, pathlib, sys, time
args = sys.argv[1:]
name = pathlib.Path(sys.argv[0]).name
scenario = os.environ['QA_SCENARIO']
with open(os.environ['QA_CALLS'], 'a') as out:
    out.write(json.dumps([name] + args) + '\\n')
if name == 'xcodebuild':
    print('Synthetic test command executed', flush=True)
    sys.exit(65 if scenario in ('test-failure', 'test-and-cleanup-failure') else 0)
if args[:3] == ['simctl', 'list', 'runtimes']:
    print(json.dumps({'runtimes': [] if scenario == 'missing-runtime' else [
        {'identifier': 'com.apple.CoreSimulator.SimRuntime.iOS-26-5', 'version': '26.5', 'isAvailable': True}]}))
elif args[:3] == ['simctl', 'list', 'devicetypes']:
    print(json.dumps({'devicetypes': [{'name': 'iPhone 17', 'identifier': 'synthetic-iphone'}]}))
elif args[:3] == ['simctl', 'list', 'devices']:
    print(json.dumps({'devices': {}}))
elif args[:2] == ['simctl', 'create']:
    if scenario == 'create-failure': sys.exit(44)
    print('SYNTHETIC-RUN-SIMULATOR')
elif args[:2] == ['simctl', 'boot'] and scenario == 'boot-failure':
    sys.exit(42)
elif args[:2] == ['simctl', 'bootstatus']:
    print('Synthetic boot migration in progress', flush=True)
    if scenario == 'boot-timeout': time.sleep(10)
elif args[:2] == ['simctl', 'io']:
    pathlib.Path(args[-1]).write_text('synthetic screenshot')
elif args[1:2] in (['shutdown'], ['delete']) and scenario in ('cleanup-failure', 'test-and-cleanup-failure'):
    sys.exit(45)
`;
    for (const name of ['xcrun', 'xcodebuild']) fs.writeFileSync(path.join(bin, name), fake, { mode: 0o755 });
    const callsFile = path.join(temp, 'calls.jsonl');
    const result = spawnSync('bash', [runner], {
      encoding: 'utf8', timeout: 15000,
      env: { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, RUNNER_TEMP: temp,
        QA_CALLS: callsFile, QA_SCENARIO: scenario, NATIVE_QA_BOOT_TIMEOUT_SECONDS: '1' }
    });
    assert.equal(result.error, undefined, result.error?.message);
    const calls = fs.existsSync(callsFile) ? fs.readFileSync(callsFile, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse) : [];
    const output = path.join(temp, 'hverdagsoss-native-qa');
    verify({ result, calls, output, log: fs.readFileSync(path.join(output, 'runner.log'), 'utf8') });
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
}
const commands = h => h.calls.filter(c => c[0] === 'xcrun').map(c => c[2]);
const tested = h => h.calls.some(c => c[0] === 'xcodebuild' && c[1] === 'test');
function cleaned(h) {
  for (const action of ['shutdown', 'delete']) {
    const calls = h.calls.filter(c => c[0] === 'xcrun' && c[2] === action);
    assert.equal(calls.length, 1);
    assert.equal(calls[0][3], 'SYNTHETIC-RUN-SIMULATOR');
    assert.equal(calls[0].includes('all'), false);
  }
}

test('native runner waits for boot, executes tests and cleans only its own simulator', () => {
  exercise('success', h => {
    assert.equal(h.result.status, 0, h.result.stdout + h.result.stderr);
    assert.equal(tested(h), true); cleaned(h);
    const boot = h.calls.findIndex(c => c[2] === 'bootstatus');
    assert.ok(boot < h.calls.findIndex(c => c[0] === 'xcodebuild'));
    assert.match(h.log, /Synthetic boot migration/);
  });
});
test('a boot timeout stays failed, retains evidence and never runs app tests', () => {
  exercise('boot-timeout', h => {
    assert.equal(h.result.status, 124); assert.equal(tested(h), false); cleaned(h);
    assert.match(h.log, /timed out after 1s/);
    assert.ok(fs.existsSync(path.join(h.output, 'simulator-state.json')));
    assert.ok(fs.existsSync(path.join(h.output, 'failure.png')));
  });
});
test('a boot command failure retains its exit status and diagnostics', () => {
  exercise('boot-failure', h => {
    assert.equal(h.result.status, 42); assert.equal(tested(h), false); cleaned(h);
    assert.equal(commands(h).includes('bootstatus'), false);
    assert.ok(fs.existsSync(path.join(h.output, 'simulator-state.json')));
  });
});
test('an actual test failure is not masked by tee or successful cleanup', () => {
  exercise('test-failure', h => {
    assert.equal(h.result.status, 65); assert.equal(tested(h), true); cleaned(h);
    assert.match(fs.readFileSync(path.join(h.output, 'xcode-test.log'), 'utf8'), /Synthetic test command/);
  });
});
test('setup failure is logged even before a simulator or xcresult exists', () => {
  exercise('setup-failure', h => {
    assert.equal(h.result.status, 43); assert.equal(h.calls.length, 0);
    assert.match(h.log, /QA setup started/);
  });
});
test('missing runtime is a failure, never a skipped green native check', () => {
  exercise('missing-runtime', h => {
    assert.notEqual(h.result.status, 0); assert.equal(tested(h), false);
    assert.match(h.log, /No installed iOS Simulator runtime/);
  });
});
test('simulator creation failure does not attempt to delete another device', () => {
  exercise('create-failure', h => {
    assert.equal(h.result.status, 44); assert.equal(tested(h), false);
    assert.equal(commands(h).includes('delete'), false);
  });
});
test('cleanup errors cannot hide test failure or turn passed app assertions red', () => {
  exercise('test-and-cleanup-failure', h => { assert.equal(h.result.status, 65); cleaned(h); });
  exercise('cleanup-failure', h => { assert.equal(h.result.status, 0); cleaned(h); });
});

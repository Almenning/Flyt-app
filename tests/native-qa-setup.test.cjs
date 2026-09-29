const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.join(__dirname, '..');

test('native QA target preparation is repeatable and leaves the shipping app source list intact', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'hverdagsoss-qa-'));
  try {
    fs.mkdirSync(path.join(temp, 'scripts'), { recursive: true });
    fs.mkdirSync(path.join(temp, 'ios/App/App.xcodeproj'), { recursive: true });
    const script = path.join(temp, 'scripts/prepare-ios-native-qa.py');
    const project = path.join(temp, 'ios/App/App.xcodeproj/project.pbxproj');
    fs.copyFileSync(path.join(root, 'scripts/prepare-ios-native-qa.py'), script);
    const original = fs.readFileSync(path.join(root, 'ios/App/App.xcodeproj/project.pbxproj'), 'utf8');
    fs.writeFileSync(project, original);
    const run = () => {
      const result = spawnSync('python3', [script], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      return fs.readFileSync(project, 'utf8');
    };
    const first = run();
    assert.equal(run(), first, 'a second preparation must not duplicate targets or objects');
    assert.match(first, /NativeRuntimeTests/);
    assert.match(first, /NativeFlowUITests/);
    assert.match(first, /bundle\.unit-test/);
    assert.match(first, /bundle\.ui-testing/);
    const sources = /\/\* Begin PBXSourcesBuildPhase section \*\/[\s\S]*?\/\* End PBXSourcesBuildPhase section \*\//;
    assert.equal(first.match(sources)?.[0], original.match(sources)?.[0], 'production sources must not gain test code');
    const scheme = fs.readFileSync(path.join(temp, 'ios/App/App.xcodeproj/xcshareddata/xcschemes/NativeQA.xcscheme'), 'utf8');
    assert.equal((scheme.match(/<TestableReference /g) || []).length, 2);
    assert.doesNotMatch(scheme, /skipped="YES"/);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('native QA is a required runtime step with short-lived evidence and no production test entry point', () => {
  const workflow = fs.readFileSync(path.join(root, '.github/workflows/ios-native-build.yml'), 'utf8');
  const scene = fs.readFileSync(path.join(root, 'ios/App/App/SceneDelegate.swift'), 'utf8');
  const runner = fs.readFileSync(path.join(root, 'scripts/run-ios-native-qa.sh'), 'utf8');
  assert.match(workflow, /run: bash scripts\/run-ios-native-qa\.sh/);
  assert.doesNotMatch(workflow, /continue-on-error/);
  assert.match(workflow, /retention-days: 7/);
  assert.match(runner, /xcodebuild test/);
  assert.match(runner, /simctl create/);
  assert.match(runner, /exit "\$STATUS"/);
  assert.doesNotMatch(scene, /NativeRuntimeTests|NativeFlowUITests|native-qa/);
});

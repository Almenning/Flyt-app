const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'capacitor.config.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const copy = fs.readFileSync(path.join(root, 'scripts', 'copy-capacitor-web-assets.mjs'), 'utf8');
const platform = fs.readFileSync(path.join(root, 'native-platform.js'), 'utf8');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const polish = fs.readFileSync(path.join(root, 'buyer-polish-ui.js'), 'utf8');
const ios = path.join(root, 'ios', 'App');

assert.equal(config.appId, 'no.adspire.hverdagsoss');
assert.equal(config.appName, 'HverdagsOss');
assert.equal(config.webDir, 'www');
assert.equal(config.server?.url, undefined, 'native builds must not wrap GitHub Pages');
assert.ok(pkg.dependencies['@capacitor/core']);
assert.ok(pkg.dependencies['@capacitor/ios']);
assert.ok(pkg.devDependencies['@capacitor/cli']);
assert.match(pkg.scripts['cap:sync'], /cap sync ios/);
assert.match(copy, /staticExtensions/);
assert.match(copy, /'icons', 'vendor'/);
assert.match(platform, /isNativePlatform/);
assert.match(index, /native-platform\.js/);
assert.match(polish, /FlytPlatform\?\.isNative/);
assert.ok(fs.existsSync(path.join(ios, 'App.xcodeproj', 'project.pbxproj')), 'the iOS Xcode project must be included');
assert.match(copy, /join\(output, entry\.name\)/, 'the copy step must package local root web assets');

console.log('ok - Capacitor uses local web assets and preserves web PWA behavior');

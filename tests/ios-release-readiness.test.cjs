const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const plist=read('ios/App/App/Info.plist');
const privacy=read('ios/App/App/PrivacyInfo.xcprivacy');
const pbx=read('ios/App/App.xcodeproj/project.pbxproj');
const launch=read('ios/App/App/Base.lproj/LaunchScreen.storyboard');
const icon=JSON.parse(read('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json'));
const workflow=read('.github/workflows/ios-native-build.yml');

assert.match(plist,/CFBundleDisplayName[\s\S]*HverdagsOss/);
assert.match(plist,/UIStatusBarStyleDarkContent/);
assert.match(plist,/UIUserInterfaceStyle[\s\S]*Light/);
assert.match(plist,/UISupportedInterfaceOrientations[\s\S]*UIInterfaceOrientationPortrait/);
const phoneOrientations=plist.match(/<key>UISupportedInterfaceOrientations<\/key>[\s\S]*?<\/array>/)?.[0]||'';
assert.doesNotMatch(phoneOrientations,/Landscape/,'iPhone launch surface is intentionally portrait-only');
assert.doesNotMatch(plist,/armv7/,'obsolete armv7 capability must not constrain modern devices');

assert.match(launch,/HverdagsOss/);
assert.match(launch,/For hverdagen dere deler/);
assert.doesNotMatch(launch,/image="Splash"/,'launch screen must not depend on the old generic raster splash');

assert.equal(icon.images?.[0]?.size,'1024x1024');
assert.equal(icon.images?.[0]?.platform,'ios');
assert.ok(fs.existsSync(path.join(root,'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')));

assert.match(privacy,/NSPrivacyTracking[\s\S]*<false\/>/);
for(const type of [
  'NSPrivacyCollectedDataTypeName',
  'NSPrivacyCollectedDataTypeEmailAddress',
  'NSPrivacyCollectedDataTypeUserID',
  'NSPrivacyCollectedDataTypeOtherUserContent',
  'NSPrivacyCollectedDataTypeProductInteraction',
  'NSPrivacyCollectedDataTypeSensitiveInfo'
]) assert.match(privacy,new RegExp(type),`missing privacy declaration: ${type}`);
assert.match(privacy,/NSPrivacyCollectedDataTypePurposeAppFunctionality/);
assert.match(privacy,/NSPrivacyAccessedAPITypes[\s\S]*<array\/>/);
assert.match(pbx,/PrivacyInfo\.xcprivacy in Resources/,'privacy manifest must be packaged in the app bundle');

assert.match(workflow,/runs-on: macos-26/);
assert.match(workflow,/npm run cap:sync/);
assert.match(workflow,/xcodebuild -version/);
assert.match(workflow,/generic\/platform=iOS Simulator/);
assert.match(workflow,/CODE_SIGNING_ALLOWED=NO/);

console.log('ok - iOS release surface, privacy manifest and Xcode build gate are present');

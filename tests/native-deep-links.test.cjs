const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const platform=fs.readFileSync(path.join(root,'native-platform.js'),'utf8');
const sync=fs.readFileSync(path.join(root,'sync.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const plist=fs.readFileSync(path.join(root,'ios/App/App/Info.plist'),'utf8');
const invite=fs.readFileSync(path.join(root,'invite.html'),'utf8');
const copy=fs.readFileSync(path.join(root,'scripts/copy-capacitor-web-assets.mjs'),'utf8');

assert.match(plist,/CFBundleURLTypes/);
assert.match(plist,/no\.adspire\.hverdagsoss\.invite/);
assert.match(plist,/<string>hverdagsoss<\/string>/);

assert.match(platform,/addListener\('appUrlOpen'/);
assert.match(platform,/plugin\.getLaunchUrl\(\)/);
assert.match(platform,/addUrlOpenListener/);
assert.match(platform,/getLaunchUrl/);

assert.match(sync,/const INVITE_WEB_URL='https:\/\/almenning\.github\.io\/Flyt-app\/invite\.html'/);
assert.match(sync,/const INVITE_SCHEME='hverdagsoss:'/);
assert.match(sync,/function inviteCodeFromUrl\(rawUrl\)/);
assert.match(sync,/function handleIncomingInviteUrl\(rawUrl/);
assert.match(sync,/async function installNativeDeepLinks\(\)/);
assert.match(sync,/window\.FlytPlatform\.addUrlOpenListener/);
assert.match(sync,/window\.FlytPlatform\.getLaunchUrl/);
assert.match(sync,/pendingInviteCode/);
assert.match(sync,/join\.value=pendingInviteCode/);
assert.match(sync,/data|Bli med i husholdning/);
assert.match(sync,/function shareInviteLink\(code\)/);
assert.match(sync,/navigator\.share/);
assert.match(sync,/invitationWebUrl\(code\)/);
assert.match(sync,/pendingInviteCode='';await loadContext\(\)/,'successful join must clear the pending invite');
assert.doesNotMatch(sync,/handleIncomingInviteUrl[^\n]*joinHouse\(/,'opening a link must never auto-accept a household');

assert.match(invite,/hverdagsoss:\/\/invite\//);
assert.match(invite,/\.\/\?invite=/);
assert.match(invite,/Ingenting kobles sammen før du selv trykker/);
assert.match(copy,/staticExtensions/,'root html files including invite.html must be copied into native web assets');
assert.match(index,/native-platform\.js\?v=20260926-native-deeplink1/);
assert.match(index,/sync\.js\?v=20260926-native-deeplink1/);

console.log('ok - partner invite links open native or web and still require explicit acceptance');

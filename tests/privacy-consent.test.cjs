const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const read=name=>fs.readFileSync(path.join(__dirname,'..',name),'utf8');
const account=read('account-ui.js');
const sync=read('sync.js');
const index=read('index.html');
const oss=read('oss.js');
const privacy=read('privacy.html');
const rewards=read('rewards-goals-core.js');

assert.match(account,/accept_privacy_terms/,'general privacy acceptance must have its own RPC');
assert.match(account,/accept_sensitive_consent/,'sensitive consent must be separate and explicit');
assert.match(account,/withdraw_sensitive_consent/,'sensitive consent must be independently withdrawable');
assert.match(account,/Du trenger ikke samtykke til intime opplysninger for å bruke Hjem, Gjøre, vanlig dagsform, Sett eller Belønning/);
assert.doesNotMatch(sync,/areas:\{[^}]*sex:true/,'new cloud households must not enable sex by default');
assert.doesNotMatch(index,/function fresh\(\)[^\n]*sex:true/,'new local state must not enable sex by default');
assert.doesNotMatch(sync,/status:\{\[who\]:\{[^}]*desire/,'starter status must not contain intimate defaults');
assert.match(oss,/data-oss-enable-sensitive/,'the intimate relationship check-in must have an explicit opt-in entry');
assert.match(oss,/hasSensitiveConsent/,'the intimate relationship UI must be gated by sensitive consent');
assert.doesNotMatch(rewards,/Object\.freeze\(\['Massasje','Sexy undertøy'/,'explicit sexual presets must not be offered by default');
assert.match(privacy,/Kjerneproduktet krever ikke at du registrerer opplysninger om intimitet eller seksualliv/);
assert.match(privacy,/Partnerens egne data slettes ikke/);

console.log('ok - core product is independent from optional sensitive consent');

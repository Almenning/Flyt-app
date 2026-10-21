"""Prepare a fixed, reviewed release patch. Never change any remote reference."""
import base64
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.request

REPO = 'Almenning/Flyt-app'
MAIN = 'c7a6f38818175c2d27a49710ad5ab12eb190b419'
VERSION = '20261021-gangemagi-release1'
SUFFIX = '-gangemagi-premium-20261021-release1'
LOG = 'docs/LARIA-GANGEMAGI-PREMIUM-ARBEIDSLOGG-2026-10-18.md'
WORKFLOW = '.github/workflows/laria-discovery-globe-phase1.yml'
EPHEMERAL = ['.github/workflows/laria-prepare-gangemagi-release.yml', 'scripts/laria-prepare-gangemagi-release.py', 'tests/fixtures/laria-release-cache.cjs.txt']
ALLOW = set(EPHEMERAL + [LOG, WORKFLOW, 'tests/laria-gangemagi-release-cache.test.cjs',
 'docs/LARIA-FINN-ORDENE-DRA-OG-FINN-2026-10-19.md',
 'docs/LARIA-OPPDAGELSESGLOBE-ARBEIDSLOGG-2026-10-17.md',
 'docs/LARIA-SUPERKLODE-PREMIUM-ART-2026-10-18.md',
 'laer-litt-mer/discovery-globe-phase1.js', 'laer-litt-mer/discovery-globe-view-v1.css',
 'laer-litt-mer/find-the-words.css', 'laer-litt-mer/find-the-words.js',
 'laer-litt-mer/index.html', 'laer-litt-mer/sw.js',
 'tests/laria-discovery-globe-phase1-static.js', 'tests/laria-discovery-globe-phase1.playwright.js',
 'tests/laria-find-the-words.playwright.js'])
OUT = Path('/tmp/laria-release-review')

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

def blob(data):
    return hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()

def replace_one(text, old, new):
    if text.count(old) != 1:
        raise RuntimeError('Patch anchor is not unique: ' + old)
    return text.replace(old, new)

def prepare():
    if git('status', '--porcelain'):
        raise RuntimeError('Checkout is not clean')
    expected = {'laer-litt-mer/index.html': '030e395f108c6f14264ad3b9372ef0ca92eb1a7d',
                'laer-litt-mer/sw.js': 'adcffe096c2ada80f96efe8c1e2431687dcc2244'}
    for name, sha in expected.items():
        if blob(Path(name).read_bytes()) != sha:
            raise RuntimeError('Unexpected original blob: ' + name)
    # Use the actual Git merge algorithm, never overwrite entire files from main.
    subprocess.run(['git','-c','user.name=Laria QA','-c','user.email=qa@users.noreply.github.com',
                    'merge','--no-commit','--no-ff',MAIN], check=True)
    index = Path('laer-litt-mer/index.html')
    text = index.read_text()
    for asset, old in [('multiplication-gangemagi-v1.css','20261017-livegroups1'),
                       ('gangemagi-dagens-oppdrag-v1.css','20261019-premium-botanical1'),
                       ('multiplication-gangemagi-v1.js','20261019-premium-main3')]:
        text = replace_one(text, './'+asset+'?v='+old, './'+asset+'?v='+VERSION)
    index.write_text(text)
    sw = Path('laer-litt-mer/sw.js')
    text = sw.read_text()
    match = re.match(r"const CACHE='([^']+)';", text)
    if not match or match.group(1).endswith(SUFFIX):
        raise RuntimeError('Unexpected service-worker cache')
    sw.write_text(text[:match.end()-2] + SUFFIX + text[match.end()-2:])
    # The full source archive served its diagnostic purpose; do not upload it forever.
    workflow = Path(WORKFLOW)
    text = workflow.read_text()
    start = text.index('      - name: Preserve exact source for reproducible browser failures\n')
    end = text.index('      - uses: actions/setup-node@v4\n', start)
    workflow.write_text(text[:start] + text[end:])
    Path('tests/laria-gangemagi-release-cache.test.cjs').write_bytes(Path(EPHEMERAL[2]).read_bytes())
    log = Path(LOG)
    log.write_text(log.read_text() + '\n\n## 21. oktober 2026: Safari-cache og faktisk main-integrasjon\n\n'
      '- Tre endrede Gangemagi-ressurser har nye versjonerte adresser. SW-cache roteres med eget Gangemagi-suffiks.\n'
      '- Ny Node-regresjon kontrollerer ressursversjoner, oppdatering fra gammel cache og bevaring av andre appcacher.\n'
      '- Integrert main c7a6f388 med ekte Git-merge, inkludert nyere Finn ordene og SuperKlode. Ingen manuell overskriving av hele filer.\n'
      '- Den tidligere globustesten har passert med uendret appkode og utvidet diagnostikk; den opprinnelige tidsavbruddsårsaken er ikke endelig bevist.\n'
      '- Engangsverktøyet oppretter bare et uflettet commit-objekt. Grenflytting, samlet CI og eventuell publisering må verifiseres separat.\n')
    for name in EPHEMERAL:
        subprocess.run(['git','rm','--',name], check=True)
    subprocess.run(['git','add','--', 'laer-litt-mer/index.html','laer-litt-mer/sw.js', WORKFLOW, LOG,
                    'tests/laria-gangemagi-release-cache.test.cjs'], check=True)
    changed = git('diff','--cached','--name-only','HEAD').splitlines()
    if not changed or not set(changed).issubset(ALLOW):
        raise RuntimeError('Unexpected changed paths: ' + repr(changed))
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT/'patch.diff').write_text(git('diff','--cached','HEAD','--'))
    entries = []
    for name in changed:
        path = Path(name)
        data = path.read_bytes() if path.exists() else None
        entries.append({'path':name, 'data':base64.b64encode(data).decode() if data is not None else None,
                        'sha':blob(data) if data is not None else None})
    (OUT/'payload.json').write_text(json.dumps({'parent':git('rev-parse','HEAD'),
       'main':MAIN, 'base_tree':git('rev-parse','HEAD^{tree}'), 'entries':entries}))
    print('PREPARED_PATCH', json.dumps({'parent':git('rev-parse','HEAD'), 'main':MAIN, 'paths':changed}))

def stage():
    if os.environ.get('GITHUB_REPOSITORY') != REPO:
        raise RuntimeError('Wrong repository')
    payload = json.loads((OUT/'payload.json').read_text())
    if payload['parent'] != os.environ['SOURCE_HEAD'] or payload['main'] != MAIN:
        raise RuntimeError('Wrong parent commit')
    token = os.environ['GH_TOKEN']
    def post(endpoint, data):
        if endpoint not in ('blobs','trees','commits'):
            raise RuntimeError('Only unreferenced Git objects may be created')
        req = urllib.request.Request('https://api.github.com/repos/'+REPO+'/git/'+endpoint,
          data=json.dumps(data).encode(), method='POST', headers={'Authorization':'Bearer '+token,
          'Accept':'application/vnd.github+json','Content-Type':'application/json',
          'X-GitHub-Api-Version':'2022-11-28'})
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.load(response)
    entries = []
    for item in payload['entries']:
        if item['path'] not in ALLOW:
            raise RuntimeError('Unexpected path')
        sha = None
        if item['data'] is not None:
            created = post('blobs',{'content':item['data'],'encoding':'base64'})
            sha = created['sha']
            if sha != item['sha']:
                raise RuntimeError('Created blob hash mismatch')
        entries.append({'path':item['path'],'mode':'100644','type':'blob','sha':sha})
    tree = post('trees',{'base_tree':payload['base_tree'],'tree':entries})['sha']
    commit = post('commits',{'message':'fix(gangemagi): version release assets and integrate latest main',
      'tree':tree, 'parents':[payload['parent'],MAIN]})['sha']
    manifest = {'repository':REPO,'parent':payload['parent'],'main':MAIN,'commit':commit,
       'tree':tree,'paths':[item['path'] for item in entries], 'remote_refs_changed':False}
    (OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    (OUT/'payload.json').unlink()
    print('UNREFERENCED_RELEASE_COMMIT', json.dumps(manifest))

if __name__ == '__main__':
    if sys.argv[1] == 'prepare':
        prepare()
    elif sys.argv[1] == 'stage':
        stage()
    else:
        raise RuntimeError('Unknown operation')

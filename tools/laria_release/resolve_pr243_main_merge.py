#!/usr/bin/env python3
"""Conservative PR #243 conflict resolver: preserve published main Kinn rules
and the proven Premium iPad scene; NEVER merge/publish the draft PR itself.
Runs ONLY after an intentional git merge --no-commit of origin/main.
"""
from pathlib import Path
import json, re, subprocess, sys

ROOT=Path(__file__).resolve().parents[2]
POLICY={
 'laer-litt-mer/index.html':['ours'],
 'laer-litt-mer/kinnaklova.js':['ours','ours'],
 'laer-litt-mer/laria-kinnaklova-unified-v1.css':['ours','ours'],
 'laer-litt-mer/sw.js':['ours'],
 'tests/laria-journey-integrated-ux.playwright.js':['theirs'],
 'tests/laria-journey-progress-recovery.playwright.js':['theirs'],
 'tests/laria-kinnaklova-contract.test.cjs':['ours','ours','ours','ours'],
 'tests/laria-locked-persistence.playwright.js':['theirs']
}
PATTERN=re.compile(r'^<<<<<<< HEAD\n(.*?)^=======\n(.*?)^>>>>>>> origin/main\n',re.MULTILINE|re.DOTALL)

def resolve(path, choices):
    target=ROOT/path
    raw=target.read_text(encoding='utf8')
    hunks=PATTERN.findall(raw)
    if len(hunks)!=len(choices):
        raise RuntimeError(f'{path}: expected {len(choices)} conflicts; got {len(hunks)}')
    counter=iter(choices)
    def pick(m):
        selected=next(counter)
        return m.group(1 if selected=='ours' else 2)
    clean=PATTERN.sub(pick,raw)
    if any(token in clean for token in ('<<<<<<<','=======\n','>>>>>>> origin/main')):
        raise RuntimeError(f'{path}: unresolved conflict marker')
    if path=='laer-litt-mer/index.html':
        source='<link rel="stylesheet" href="./kinnaklova.css?v=20261107-premium-signrail-reading2">'
        insertion=(source+'\n'
          '<link rel="stylesheet" href="./kinnaklova-standalone-v1.css?v=20261115-main-live-integration2">')
        if clean.count(source)!=1 or 'kinnaklova-standalone-v1.css' in clean:
            raise RuntimeError('Kinnaklova main stylesheet integration anchor changed')
        clean=clean.replace(source,insertion,1)
        source='<script src="./kinnaklova.js?v=20261115-locked-kinn-seamless-live3" defer></script>'
        insertion=('<script src="./kinnaklova-standalone-v1.js?v=20261115-main-live-integration2" defer></script>\n'+source)
        if clean.count(source)!=1 or 'kinnaklova-standalone-v1.js' in clean:
            raise RuntimeError('Kinnaklova main adapter integration anchor changed')
        clean=clean.replace(source,insertion,1)
    if path=='laer-litt-mer/kinnaklova.js':
        old='const UI_FREE_ART_VISUAL_SIGNOFF=true;\n  const PREMIUM_CLEAN_ART_APPROVED=UI_FREE_ART_VISUAL_SIGNOFF&&'
        new='const UI_FREE_ART_TECHNICALLY_VERIFIED=true;\n  const PREMIUM_CLEAN_ART_APPROVED=UI_FREE_ART_TECHNICALLY_VERIFIED&&'
        if clean.count(old)!=1: raise RuntimeError('Kinn art integrity approval flag changed')
        clean=clean.replace(old,new,1)
        old="window.LARIA_SCENE_UI?.enhance?.(host,'english');"
        new=("""
// The complete Premium UI adapter supports both iPad and phone.
    // Keep the separately published standalone Kinnaklova adapter available
    // as a fallback; never run both adapters on the same sign host.
    if(window.LARIA_SCENE_UI?.enhance)
      window.LARIA_SCENE_UI.enhance(host,'english');
    else window.LARIA_KINN_PREMIUM?.enhance?.(host);""").strip()
        if clean.count(old)!=1: raise RuntimeError('Kinn adapter integration anchor changed')
        clean=clean.replace(old,new,1)
    if path=='laer-litt-mer/sw.js':
        # Network-first executable files are a hard prerequisite for iPad
        # and future children to see fresh HTML/CSS after an app update.
        if "const FRESH_CODE=/\\.(?:js|css|html|json|webmanifest)$/i;" not in clean:
            raise RuntimeError('Network-first cache policy absent after resolving SW')
        clean=clean.replace("sha-hidefix1';","sha-hidefix1-main-kinn-merge1';",1)
    if path=='tests/laria-kinnaklova-contract.test.cjs':
        old='const UI_FREE_ART_VISUAL_SIGNOFF=true'
        if old not in clean: raise RuntimeError('Expected PR art flag test missing')
        clean=clean.replace(old,'const UI_FREE_ART_TECHNICALLY_VERIFIED=true')
        if 'const UI_FREE_ART_TECHNICALLY_VERIFIED=true' not in (ROOT/'laer-litt-mer/kinnaklova.js').read_text():
            raise RuntimeError('Kinn test must follow main technical, not owner art flag')
    target.write_text(clean,encoding='utf8')
    return {'file':path,'conflicts':len(hunks),'choices':choices,'bytes':len(clean)}

def main():
    unmerged=subprocess.check_output(['git','diff','--name-only','--diff-filter=U'],cwd=ROOT,text=True).splitlines()
    if set(unmerged)!=set(POLICY):raise RuntimeError(f'Unexpected main conflicts: {unmerged}')
    report=[]
    # Resolve Kinn JS ahead of contract's explicit integrity assertion.
    ordered=sorted(POLICY,key=lambda p:(0 if p.endswith('/kinnaklova.js') else 1,p))
    for filename in ordered:
        report.append(resolve(filename,POLICY[filename]))
    subprocess.check_call(['git','add',*POLICY.keys()],cwd=ROOT)
    unresolved=subprocess.check_output(['git','ls-files','-u'],cwd=ROOT,text=True)
    if unresolved:raise RuntimeError('Unresolved index conflicts remain')
    for file in ('laer-litt-mer/index.html','laer-litt-mer/sw.js','laer-litt-mer/kinnaklova.js'):
        if any(x in (ROOT/file).read_text() for x in ('<<<<<<< HEAD','>>>>>>> origin/main')):
            raise RuntimeError(file+' contains merge markers')
    print(json.dumps({'safe_resolution_candidate':True,'merge_not_published':True,'files':report},indent=2))
    Path('/tmp/laria-pr243-merge-candidate.json').write_text(json.dumps(report,indent=2)+'\n')
if __name__=='__main__':
    main()

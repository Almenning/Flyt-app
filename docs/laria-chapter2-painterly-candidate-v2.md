# Læria: isolerte illustrasjonskandidater for kapittel 2 (v2)

Dato: 17. oktober 2026. PR #169. **Intern kunsttest, ingen lanseringsgodkjenning.**

## Formål
Setningshavna og Kontinentseilasen skal bli like inviterende og gjennomarbeidede som Lærias fire låste originalreiser. Tidligere flate SVG-kart beholdes som trygg standard inntil en bedre illustrasjon har bestått faktisk visuell kontroll og er uttrykkelig godkjent.

## Nye, separate filer
- `laer-litt-mer/english-sentence-harbor-art-candidate-v2.svg`: originalt viderearbeid fra kapittel-2-havnekartet. Stående 800×1000. Flere kystbymotiver, varme brygger, teksturlag, bokmotiver, seilbåt og historiefyr. Ingen innbakte stedsnavn, tall eller standardrev.
- `laer-litt-mer/geography-continent-voyage-art-candidate-v2.svg`: originalt viderearbeid fra kapittel-2-fantasihavet. Stående 800×1000. Utforskbare øyer med kompass, reisedokumenter, havpassasje, naturøy og fyrtårn. Dette er **ikke et geografisk kart**; den geografisk korrekte kloden er uendret.
- Det opprinnelige `*-storybook-v1.svg`-materialet er **ikke overskrevet**. Ingen av de fire låste kapittel-1-illustrasjonene eller deres SHA-256-identiteter er endret.

## Interne prøvelenker
Bruk appens ordinære `?app=laria`-parameter sammen med **begge** flaggene for det aktuelle faget:

- Engelsk: `?app=laria&english-chapter2-preview=1&english-chapter2-art-v2=1`
- Geografi: `?app=laria&geography-chapter2-preview=1&geography-chapter2-art-v2=1`

Kun `*-art-v2=1` åpner **ikke** et nytt kapittel; selve kapittelet må fremdeles være i utviklervisning. Uten kunstflagget fortsetter eksisterende default-SVG som før.

## Kontrakt for kartstopp og personlig rev
- Maleriene er **bakgrunner**, mens alle fem stedsmarkørene er eksisterende HTML-knapper. Ingen handling flyttes inn i raster/SVG-kunst, og ingen steds-ID endres.
- Engelsk: Hilsenkaia 27/24, Ordbrygga 75/38, Setningsverkstedet 28/55, Samtalebåten 74/71, Historiefyret 45/87.
- Geografi: Kompassholmen 27/24, Passbrygga 75/39, Havpassasjen 28/55, Naturøya 74/71, Reisefyret 45/86.
- Barnets eksisterende valgte personlige rev vises gjennom appens ordinære revekomponent. Illustrasjonene inneholder ingen fast rev.
- Oppgavelogikk, progresjon, repetisjon og det låste kapittel 1 er uendret.

## CI og kvalitetssperrer
- Egen Playwright/WebKit-kontroll i fagtestene åpner intern v2 på iPhone stående og iPad liggende, kontrollerer at faktiske SVG-bildebytes kan dekodes som 800×1000, at fem treffområder er minst 44 px, og at et kartstopp fortsatt åpner aktivitet.
- Skjermbilder lagres som ekte nettleserartifakter med suffiks `-art-v2-candidate`.
- Full bredere iPhone/iPad-responsivitet og manuell visuell sammenligning mot de fire låste originalreisene må kontrolleres før kunstgodkjenning.
- Om en kandidat feiler, fjernes flagget eller filen uten å røre dagens fungerende standardkart.
- Behold `published:false` og `artApproved:false`. Ingen PR-sammenslåing eller publisering. Kvalitet på v2 er **ikke** fastslått av at SVG lastes og knapper fungerer.

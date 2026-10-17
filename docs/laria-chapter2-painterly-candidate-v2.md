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


## Sikker tilbakefallsflyt og illustrasjonsgodkjenning

Kunst er en utskiftbar dekorativ ressurs. På intern `art-v2`-visning kontrolleres bildefeil og det faktiske deklarerte bildeformatet. Hvis ressursen mangler, feiler under nedlasting eller gir feil dimensjoner, settes `data-*-art-variant="fallback-v1"` og den sist testede `*-storybook-v1.svg` vises igjen. Fem klikkbare HTML-stopp, barnets personlige rev og eksisterende progresjon påvirkes ikke. I ordinær visning brukes alltid standardillustrasjonen.

WebKit-testene fremprovoserer nå en ekte nedlastingsfeil for v2-bildet på både iPhone og iPad, krever automatisk fallback og kontrollerer at alle fem stopp fortsatt er trykkbare og åpner en oppgave. Dette testes i tillegg til normal lasting av korrekt 800 × 1000 SVG. Nye faktiske skjermbilder får suffikset `art-v2-fallback`.

**Viktig illustrasjonskriterium:** AI-genererte hele UI-skjermer med ferdigtegnet rev, bokser, knapper eller ord er ubrukelige som kartbakgrunn og skal ikke integreres. Neste premiumkunst må leveres som **to rene, helmaleriske landskapsbilder uten tekst og grensesnitt**, tilpasset det låste eventyruniverset. Nye rasterbilder krever en separat sikker import, manuell visuell inspeksjon og WebKit-kontroll før en endring i standardressurs eller `artApproved`. Verken eksisterende vektorillustrasjoner eller genererte UI-konseptbilder skal feilaktig omtales som maleriske produksjonsillustrasjoner.

## Kontroll av feilaktig format
Den nye feilhåndteringen kontrolleres nå på *to ulike måter* i hver fagpilot på WebKit iPhone og iPad: (1) nettverksfeil ved nedlasting og (2) HTTP 200 med en syntaktisk gyldig SVG som bare er 32 × 32 i stedet for de forventede 800 × 1000. Begge skal automatisk falle tilbake til det eksisterende kartet med `data-*-art-variant="fallback-v1"`, vise fem kartstopp og kunne åpne en faktisk oppgave. Nytt skjermbilde-artifakt: `*-art-v2-wrong-size-fallback.png`.

Ingen test av bildeinnlasting eller geometri er i seg selv en illustrasjonsgodkjenning. Godkjent produksjonskunst krever egen vurdering mot de fire låste originalreisene.

## Sluttkontroll og åpne sperrer (17. oktober 2026)
- Den siste komplette tekniske testpakken før reservekart-testutvidelsen hadde **16 av 16 bestått**. Dette er ikke en release-godkjenning for ny illustrasjon.
- Første utvidede test med nettverksfeil for kandidatbildet avdekket en timeout på WebKit iPhone i geografi. Testen er instrumentert med bildekilde, kandidatstatus og naturalWidth/naturalHeight for å identifisere rotårsak. Ny CI på etterfølgende commit må bestå på eksakt tree før kvalitetskravet kan lukkes.
- Det finnes nå et eget malerisk bildeutkast i Figma: https://www.figma.com/design/t5aNOJe18rbdsKDVet9d48 (internt arbeidsmateriale). Den genererte bildefilen er ennå **ikke sikkert eksportert til versjonert GitHub-ressurs** og er heller ikke visuelt godkjent. Ingen midlertidig Figma-URL legges inn i produksjonskode.
- En annen generering leverte hele UI-mockups med innbakt rev, titler og knapper; disse ble avvist. Verken disse mockupene eller v2-SVG skal merkes som godkjent malerisk produksjonskunst.
- **Publisering er sperret** inntil originale og godkjente bakgrunnsbilder foreligger, riktige kartmarkører er visuelt kontrollert på ekte WebKit-skjermbilder iPhone/iPad, og siste fullstendige testmatrise er grønn.
- Behold `published:false`, `artApproved:false` og Draft PR. Beskytt nylig publiserte Ordjakt, Gangemagi og Mitt eventyrsted fra urelaterte endringer.

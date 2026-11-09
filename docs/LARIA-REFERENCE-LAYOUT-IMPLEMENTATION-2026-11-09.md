# Læria Premium – referanseoppsett (9. november 2026)

**Status:** Kodet som testbar iPad-variant i eksisterende PR #243. Ingen visuell sluttgodkjenning, merge eller publisering.

Brukerens femskjermsbilde er layoutreferanse: Læria øverst, felles Hjem/Norsk/Matte/Engelsk/Geografi på treskilt til venstre, ett valgt levende troll, tydelig sted-/fagplakett, fullskjerms landskap. Bildets nye fjell og karakterer er **ikke** godkjent som erstatning for låste aktiva.

## Faktisk implementert
- Felles, tilgjengelig femskiltsnavigasjon og stor fag-/stedsplakett i rene Norsk/Eggenipa, Matte/Tallvika og Geografi/Nordlysleiren.
- De tre eksisterende *ekte* aktivitetsskiltene flyttes visuelt som én gruppe til høyre; knapper, handlers, oppgaver og lagret progresjon beholdes.
- Originalt godkjent og valgt skogstroll forblir en separat interaktiv TrollActor, ikke en innmalt figur.
- Testbryter på iPad: `?app=laria&lariaReferenceLayout=1`. Den ordinære appen er uendret frem til iPad-bildene er visuelt godkjent.
- Egen GitHub Actions-jobb tar ekte appbilder i Chromium og WebKit, iPad liggende og stående, og kontrollerer trykkflater, navigasjonsgruppe og valgt troll.

## Kjente og ufravikelige sperrer
- **Hjem/Grovanova:** Låst original har innmalt gammel logo, gamle fagkort og statiske figurer. Ren, originaltro og godkjent 4:3-variant mangler.
- **Engelsk/Kinnaklova:** Låst original har innmalte gamle aktivitetskilt og logo. Kan ikke overlappes med nye skilt uten godkjent ren variant.
- **Geografi:** Lavere oppløsning enn Norsk og Matte; ikke bytt til gammel høyoppløst rev-scene.
- Visuell iPad-godkjenning først, så øvrige enheter og regresjon, deretter privat barnebeta. Aldri godkjenn release på grunnlag av grønn kode alene.

Ingen kildemaster, trolloriginal, barneprogresjon eller release-godkjenningsflag er endret.

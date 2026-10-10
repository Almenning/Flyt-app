# Originale, låste reisekart (10. oktober 2026)

**Disse filene skal være eksakte originaler.** Illustrasjonene er fasit, ikke inspirasjon.
Det er ikke tillatt å regenerere, illustrere på nytt, beskære, strekke eller bruke de eldre
`*-verden.png`-filene i stedet.

## Bildefiler som skal ligge i denne mappen

| Målfil i GitHub | Original i prosjektbiblioteket | Opprinnelig størrelse | Bildeflate |
| --- | --- | ---: | --- |
| `bokskogen-locked-20261010.png` | `image-gen-2(20261010-113506).png` | 3 308 204 byte | 941 × 1672 |
| `tallenga-locked-20261010.png` | `image-gen-3(20261010-113511).png` | 3 220 364 byte | 941 × 1672 |
| `ordlandsbyen-locked-20261010.png` | `image-gen-4(20261010-113516).png` | 3 284 439 byte | 941 × 1672 |
| `nordlysleiren-locked-20261010.png` | `image-gen-5(3).png` | 3 224 987 byte | 941 × 1672 |

Overordnet referanse, **kun for kvalitetssikring**:
`image-gen-1(20261010-113502).png` (3 381 817 byte, 1122 × 1402).
Dette er fire reisekart samlet i ett oversiktsbilde; bruk de separate filene i appen.

## Kodekontrakt

- `../locked-journey-contract.js` eier de fem låste stedsnavnene,
  originalformatet 941 × 1672 og hotspot-koordinatene.
- `../locked-journey-renderer.js` bruker eksisterende oppdrags-/progresjonsmodeller
  og viser kun originalen når nettleseren bekrefter forventet bredde/høyde.
- Dersom et bilde mangler eller har feil størrelse, brukes **eksisterende fungerende
  reisekart**, ikke et midlertidig opptegnet etterligningskart.
- **Viktig:** I `../locked-journey-renderer.js` står `ORIGINAL_SOURCE_IMAGES_VERIFIED=false` inntil alle fire originale bildefiler er lastet inn og visuelt kvalitetssikret. Den skal ikke settes til `true` bare fordi det finnes bildefiler med riktige navn. Uten dette forsøker ikke appen å hente manglende originaler og produserer ingen 404-støy.
- Oppdrags-ID-er, lagret progresjon, læringsmotor, klassetrinn og oppgaver er uendret.
- Tekst og dekor fra bildet skal ikke tegnes dobbelt opp; de fem merkede skiltene
  er klikkbare via transparente treffsoner med tilgjengelige navn.
- Bruk fortsatt gamle kart for 3.–10. klasse til en egen godkjent referanse er låst
  for disse aldersgruppene.

## Ferdigkriterier, bevis som fortsatt kreves

1. Originalfilenes bytes og dimensjoner er kontrollert etter GitHub-opplasting.
2. Hver av 20 hotspot-er treffer det tilsvarende skiltet ved faktisk PNG-visning.
3. Skjermbilder fra **ekte originale PNG-er** er sammenlignet med de låste bildene;
   ikke bland sammen geometrisjekken med en visuell referansetest.
4. iPhone stående/liggende, liten iPhone, iPad stående/liggende i Safari/WebKit
   har ingen overlapp, forvrengning eller utilgjengelige oppdragssteder.
5. Trykk, frivillig repetisjon, oppgaver, tilbakeknapp, klassetrinnvalg og fortsatt
   læringsprogresjon er verifisert ende-til-ende med eksisterende datamodeller.
6. Ingen implementeringsfase lukkes dersom originalgrafikken mangler.

Dette dokumentet bevarer filidentiteten. **Originale binærfiler kan ikke skapes
ved å skrive inn en fil med tilsvarende navn.**

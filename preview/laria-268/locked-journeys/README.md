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

## Verifiserte SHA-256-identiteter

| Fil | SHA-256 |
| --- | --- |
| `image-gen-1(20261010-113502).png` | `a02e331f7df5fcd0df3e4ed9238c4ef04dcac1bfd26bb7f56190f20594a400f8` |
| `bokskogen-locked-20261010.png` | `5fc16c5e4d7dfc397ac8d6e7883ad111443ce33df6acfd2dacab776936ef5506` |
| `tallenga-locked-20261010.png` | `68f595b2bfb2a37206b23200ec3854feb9b6134a112bab3957e5df21098d8879` |
| `ordlandsbyen-locked-20261010.png` | `c03e1f9abbdb582aa55d6473167e86ced8dce0b07196d810a2fb88bd77dd6da9` |
| `nordlysleiren-locked-20261010.png` | `7f6ddd6649d813601e9c1bef8e2373e779ee97469ca5392be0e6dd146f38f32f` |

## Kodekontrakt

- `../locked-journey-contract.js` eier de fem låste stedsnavnene,
  originalformatet 941 × 1672 og hotspot-koordinatene.
- `../locked-journey-renderer.js` bruker eksisterende oppdrags-/progresjonsmodeller
  og viser kun originalen når nettleseren bekrefter forventet bredde/høyde.
- Dersom et bilde mangler eller har feil størrelse, brukes **eksisterende fungerende
  reisekart**, ikke et midlertidig opptegnet etterligningskart.
- `ORIGINAL_SOURCE_IMAGES_VERIFIED=true` ble først satt etter byte-/SHA-256-kontroll og den ekte Chromium/WebKit-matrisen i GitHub Actions-kjøring `38070595602`. Rastergjenvinning, 20 trykkflater, navigasjon og de fem avtalte skjermformatene besto. Ved manglende eller ugyldig bilde faller runtime fortsatt tilbake til eksisterende fungerende kart.
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
6. De originale referansebildene viser en illustrert avatar og tallet **127**
   i toppfeltet. Dette er **bildepiksler**, ikke ekte brukerdata. Før utgivelse
   dekkes de av et separat dynamisk UI-lag med barnets lokalt valgte figur og
   den faktiske reiseprogresjonen. Originalfilen endres ikke. En hardkodet
   127-poengstatus publiseres aldri som om barnet faktisk har tjent den.
7. Reiser uten nok kjerneoppdrag beholder de fem illustrerte reisemålene,
   men tomme steder får **ingen fabrikkert oppgave**. Fremtidige reisemål
   tilbyr den eksisterende progresjonsnøytrale `Sniktitt`-funksjonen.
8. Ingen implementeringsfase lukkes dersom originalgrafikken mangler.

Dette dokumentet bevarer filidentiteten. **Originale binærfiler kan ikke skapes
ved å skrive inn en fil med tilsvarende navn.**

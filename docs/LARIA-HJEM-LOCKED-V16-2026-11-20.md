# Læria Hjem v16 – godkjent designlås 20.11.2026

**Status:** Produkteier har eksplisitt godkjent de to siste viste illustrasjonene og bedt om å låse og implementere dem. Denne dokumentasjonen gjelder konkret visualisering, ikke automatisk godkjenning av produksjonskvalitet eller merge.

## To eksakte visuelle mastere

| Retning | Fil | Piksler | SHA-256 |
| --- | --- | ---: | --- |
| Stående iPad 3:4 | `assets/home-v15/laria-grovanova-v16-portrait.webp` | 2048 × 2732 | `c842e8e901300d1506594ef6e39929611743fc64ff1eb02254b8643059963421` |
| Liggende iPad 4:3 | `assets/home-v15/laria-grovanova-v16-landscape.webp` | 2048 × 1536 | `c39d374c8d9972a389d120ab15a1c81352158dc78a716fc7259fc31f95ce035e` |

Originalgenereringer beholdes utenfor appens aktive kilder med SHA-256 dokumentert i det lokale kildebeviset. Eksportene er oppskalert fra 1086×1448 og 1448×1086; dette skaper ikke mer opprinnelig detalj. Ikke generer nye varianter med løst landskapsmotiv uten ny tillatelse.

## Visuell og funksjonell lås

- Behold **nøyaktig de to sist godkjente bildene**. Fullskjerm på stående og liggende iPad.
- **Læria-logo** og **fire fagsskilt** til venstre er synlige i bildet. Fagene heter **Norsk, Matte, Engelsk, Geografi**, ingen oppdiktede fag eller endringer i fagløp.
- **Reisen** er et **eget** skilt, og **Fortsett reisen** ligger som egen grønn handlingsknapp under.
- Bunnmenyen har **fire** handlinger: **Hjem, Utforsk, Samlebok, Mine troll**. Det er ingen Reisen-knapp i bunnmenyen eller dobbelt toppmeny.
- Reiserute og Fortsett reisen skal ha **ulike** handlinger. Reisen åpner valg av de fire eksisterende fagreisene, mens Fortsett reisen bruker Basecamps eksisterende fortsett/résumé-rute.
- Alle tegnede knapper/skilt skal ha **faktiske semantiske DOM-trykkflater** med minst 44×44 CSS-piksler, fokusmarkør og eksisterende funksjoner. De skal ikke tegnes dobbelt oppå motiver med innmalte knapper.
- Velkomsthilsenen skal være dynamisk fra barneprofilen. Bildenes innmalte `Testbarn` skal dekkes av samme profils egen tekst, ikke vises som fast barnenavn.
- **TrollActor** forblir separat og valgbart. De tre låste trollene skal **ikke** bakes inn i illustrasjonen. Tidligere to trebåter med gamle vannankre skal ikke gjenbrukes ukritisk.
- Vokseninngang og barnets progresjon beholdes funksjonelle. HverdagsOss er et helt separat produkt.

## Viktig teknisk forskjell fra PR #255

Dette er **malte UI-bilder**, ikke UI-frie kunstmastere. Den tidligere, åpne PR #255 er et eget, umerget UI-fritt eksperiment som **ikke** skal aktiveres eller merges som del av denne låsen. En frisk separat PR har derfor blitt brukt for å unngå at de to gjensidig ulike konseptene blandes.

## Sikkerhet og kvalitetsport

- Gamle originale bilder forblir uendret som fallback, og en v16-master brukes bare etter SHA-256 og dimensjonskontroll.
- Den nye koden gjelder **kun iPad** og bare unge klassetrinn. iPhone, øvrige fag og progresjonslagring skal ikke endres.
- Kontroll må vise faktiske skjermbilder i WebKit og Chromium for stående/liggende iPad, inklusive 820×1180, 1024×1366, 1024×768 og 1180×820. Særlig skal bakgrunnen fylle hele skjermen uten sidefelt og skilt ha komplette trykksoner.
- **Utkast/ikke publisert** til nøyaktig PR-head har bestått relevant QA, og visuell appskjerm er kontrollert. Overordnet Læria release-readiness er separat og omfatter ytterligere kunst- og barnetestkrav.

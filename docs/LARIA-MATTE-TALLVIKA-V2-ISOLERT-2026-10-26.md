# Læria – Matte/Tallvika V2 (isolert fra Norsk)

Dato: 26.10.2026. Utgangspunkt: main `e48affa95a` etter flettet PR #226 (Norsk/Eggenipa).

## Formål
Viderefør den testede visuelle Tallvika V2 og eksplisitt én-trykks ruting mellom Tallvika, Gangemagi, Brøklab og Gangetabellen fra draft PR #223, uten å ta med Norsk/Bokskogen eller utilsiktet overskrive integrert Eggenipa.

## Implementert
- Tallvika med godkjent fjordillustrasjon, tre låste originaltroll som valg, lesbare aktivitetsskilt/-kort og tydelig frilek. Ingen nye figurvarianter.
- Tallvika sitt direkte 10×10 Gangetabellen-inngang går til bordet, ikke Gangemagi eller et ekstra startsjikt.
- Gangemagi, Brøklab og Gangetabellen har eksplisitt parent/return-kontekst til Tallvika, inkludert korrekt fokus/scroll og opprydding hvis barnet forlater aktiviteten en annen vei. Barnets progresjon forblir hos eksisterende motor.
- Tallvika UI-versjoner oppdatert i **den nåværende main-HTML**, uten å fjerne `eggenipa.css` eller `eggenipa.js` fra Norsk. Serviceworker-cache beholder `eggenipa-touchback1` og får en ny Tallvika-versjon.
- Relevante matematikkontrakter og Chromium/WebKit-testene er overtatt fra PR #223. Den eldre testens utdatert frilek-entry er korrigert.

## Avgrensning og kvalitetsport
- Ikke endre Bokskogen, Norsk, Eggenipa, hjemmet eller trollanimasjons-piloten.
- Den tidligere PR #223 er ikke sammenslåingsklar etter Norsk-merge. Denne isolerte grenen er etterfølger for **kun** matematikkarbeid. Behold PR #223 som historisk referanse til erstatteren er validert.
- Mattekontrakten, egen Tallvika WebKit+Chromium QA, Brøklab/Gangemagi, regresjon og iOS må være grønne på eksakt ny commit. Ny bred QA kan avdekke feil utenfor Matte; disse må identifiseres og ikke skjules, men håndteres i rett tråd.
- *Ikke* merge/publiser uten nødvendige kontroller og faktisk visuell godkjenning. Statiske troll er ikke premiumanimasjon og inngår i separat PR #224.


## iPad liggende: helhetlig eventyrscene, 26.10.2026

**Funn i faktisk WebKit 1194×834:** Tallvika-verdenen var ca. 778×438 px i et todelt layout, mens bunnen av skjermen stod ubrukt. De tre illustrerte aktivitetene sto i en høy, smal kolonne på høyre side. Dette er verken en god bruk av iPad-landskap eller en tydelig prioritering av det låste fjordmotivet.

**Løsning, kun Matte:** På nettbrett i liggende format (1000–1400 CSS-px bredde, høyde minst 720) går siden over til et vertikalt komponert oppslag. Hele originalbildet beholdes i 1672:941, men vokser etter tilgjengelig skjermhøyde. Under følger en kort, synlig oppdragsrad: de tre eksisterende illustrerte portalene og det frivillige neste oppdraget. Ingen ekstra aktiviteter, ny kunst, dataendringer eller scrollkrav for å nå de tre valgene. iPad portrett, iPhone og øvrig desktop beholder sine eksisterende løsninger.

**Test:** Den eksisterende Playwright WebKit/Chromium-matrisen utvides med håndfaste første-skjerm-målinger: bildet må være minst 76 % av viewportbredden, ha uendret kildeaspekt, aktivitetene skal ligge på én rad under landskapet og oppdraget skal være synlig på første skjerm. Ved feil skal testen feile, ikke akseptere en kosmetisk CSS-override. Skjermbilder samles fra eksakt commit. Kvalitetsgodkjenning følger etter faktisk gjennomsyn, ikke bare kodeendring.


### Kortlesbarhet i iPad liggende – kontroll mot første skjermbilde

Et faktisk Chromium-bilde fra den nye 1194×834-komposisjonen viste at de to første aktivitetsbeskrivelsene la de siste ordene for tett inntil den overlappende pilknappen. Avviket skyldtes at kortenes tekstkolonne ikke reserverte plass til den absoluttposisjonerte pilen, ikke feil i bildet. Matte-spesifikk rotkorrigering: gi tekstkolonnen styrt fleksbredde og null minimumsbredde, reserver 14px høyresone i beskrivelsen og løft tekststørrelsen til 13px. Ny Playwright-kontroll måler faktisk høyresikker sone og hindrer både tekst-/piloverlapp og klipping ved line-wrap. Ingen spillmotorer, kunst eller andre fag berøres.

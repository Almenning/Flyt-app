# Mønsterhagen: malerisk intern kartkandidat

- Lokal kilde: `laer-litt-mer/math-pattern-haven-painted-candidate-v2.avif`. Det er en original, 768 × 1152 pikslers malerisk kandidat; SVG-kartet beholdes uendret som vanlig utviklervisning og reserveformat.
- Kun internt med **begge** URL-flaggene `math-chapter2-preview=1&math-chapter2-painted=1`. Verken `published` eller `artApproved` er endret fra `false`.
- Fem DOM-baserte stopp for barnets trykk: Formstien 35/87 (steinsti), Mønsterbekken 65/65 (strøm), Speildammen 58/46 (speilvann), Tallbroen 69/24 (bro), Stjernelunden 61/10 (glødende lund). Maleriet inneholder ingen hardkodet tekst eller rev.
- Playwright tester på Chromium, 320/390 px WebKit og liggende iPad kontrollerer at **den faktiske AVIF-filen** lastes, at det finnes fem individuelle knapper med minst 44 px treffområde og ingen overlapp/klipping, og at oppgaver starter normalt etter trykk.
- Den originale første reisen Tallenga, øvrige kapitler, personlig rev og progresjon skal forbli uendret.
- Dette er ikke premiumgodkjenning. Barnas ordinære innganger er sperret til skriftlig godkjenning av original kunst, faktisk visuell QA og full CI på eksakt head.
- Den første malerikandidaten hadde feilaktig innhugget «3» på begge steinpanelene ved Tallbroen, mens stedsnummeret i appen er 4. En isolert bildekorrigering har fjernet disse tallene fra steinflaten, uten å flytte noen av de fem landemerkene eller legge inn tekst/rev i rasterbildet. Endringen krever ny faktisk WebKit-skjermbildekontroll før eventuell kvalitetsgodkjenning.

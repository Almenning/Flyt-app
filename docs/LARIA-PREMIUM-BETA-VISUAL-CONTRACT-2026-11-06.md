# Læria Premium Beta – visuell kontrakt

Dato: 2026-11-06

Denne kontrakten styrer premium-beta-oppryddingen. Den skal brukes som beslutningsfilter for alle visuelle endringer.

## 1. Hjem er låst

Grovanova/Kjøsnesfjorden er Lærias Home-master.

- Ikke regenerer fjellet.
- Ikke bytt Home-motiv.
- Ikke legg en ekstra karakter oppå den låste Home-komposisjonen.
- Navigasjon og interaksjon kan forbedres uten å endre den godkjente masteren.

## 2. Ett visuelt språk

Premium-beta skal oppleves som ett produkt, ikke som flere historiske prototyper.

Prioriter:
- illustrert scene fremfor pålimte dashboard-kort
- få, tydelige interaktive flater
- konsekvent typografi, dybde, skygger og bevegelse
- samme karakterlogikk i alle fag og aktiviteter
- ingen parallelle gamle/nyere navigasjonslag

Legacy-DOM kan beholdes midlertidig for kompatibilitet, men skal ikke være synlig dersom det bryter premium-uttrykket.

## 3. Reven er pensjonert

Ingen synlig rev skal være del av premium-betaens identitet.

- Gamle revefiler kan ligge midlertidig i repoet mens avhengigheter migreres.
- Gamle CSS-klassenavn kan leve midlertidig som strukturelle ankere.
- Brukeren skal ikke se rev, «Min rev», revegarderobe eller revebaserte hint/companions i premium-betaen.
- Fjerning skal skje uten å miste progresjon, læringsdata eller fungerende aktiviteter.

## 4. TrollActor, ikke klistremerke

Valgt skogstroll er barnets levende følgesvenn.

TrollActor skal:
- bruke lagret valg: storesøster, lillesøster eller lillebror
- være fysisk forankret i scenen, med føttene på bakken/stien
- skalere med scenedybde der dette er relevant
- aldri ligge som en tilfeldig avatar over viktige knapper
- ha subtil idle-bevegelse
- kunne vinke, gå, tenke, gi hint, støtte og juble
- bruke korte kontekstuelle talebobler
- reagere på læringshendelser uten å gi svaret
- respektere reduced-motion
- ha samme ansikt, hår, klær og proporsjoner på tvers av appen

Bevegelse skal være rolig og premium. Ingen kontinuerlig spretting, blinkende effekter eller spillmaskot-støy.

## 5. Enheter er en release-gate

En skjerm er ikke ferdig før den fungerer på:

- desktop 1920×1080
- Mac/laptop 1440×900
- iPad stående
- iPad liggende
- iPhone stående
- iPhone liggende
- liten iPhone stående

Kontroller både Chromium og WebKit der praktisk mulig.

Krav:
- ingen horisontal scrolling
- ingen blanke sidefelt i immersive scener
- ingen deformerte illustrasjoner
- ingen kuttede figurer
- ingen figur over primære trykkflater
- minst 44×44 px for nødvendige touch targets
- landskap på liten iPhone skal ikke bli en komprimert desktopside
- portrett skal ikke miste sentrale motiv

## 6. Arbeidsrekkefølge

1. Behold Grovanova.
2. Etabler TrollActor og pensjoner synlig rev.
3. Fjern gamle parallelle UI-/prototype-lag.
4. Gi hvert fag en ren, egen premium-scene.
5. Integrer TrollActor i fagscener og aktiviteter.
6. Kjør full enhetsmatrise og regresjon.
7. Først deretter vurderes premium-beta som release candidate.

## 7. Sikkerhetsregel

- Ingen merge eller publisering uten eksplisitt godkjenning.
- Små commits.
- Bevar progresjon og læringsdata.
- Hvis en visuell beslutning er subjektiv og ikke følger av denne kontrakten, ikke improviser en ny stil. Dokumenter den og gå videre med annet trygt arbeid.

# Læria fagsider v16 – utprøving, ingen kunstgodkjenning

Dette er en **opt-in, reversibel kodeutprøving**. Slås på ved å legge til `?laria-subject-v16-preview=1` i URL-en (eller `&laria-subject-v16-preview=1` hvis URL-en allerede har et spørsmålstegn).

## Implementert
- Felles venstremeny i treskiltstil på **Norsk, Matte og Engelsk**, koblet til appens **eksisterende, faktiske aktivitetsknapper**. Oppgave- og progresjonsmotoren forblir urørt.
- Under prøveflagget skjules separate aktivitetskort i Norsk og Engelsk og de gamle usynlige klikksonene i hovedillustrasjonene.
- Engelsk viser kun den **valgte** originale trollfiguren; ingen ny figur genereres.
- Ved normal URL uten prøveflagg blir dagens app uendret.

## Ikke ferdig – release blockers
1. **Gamle aktivitetsnavn og figurer er innbakt i pikslene i de låste illustrasjonene.** Dette kan ikke fjernes med bare CSS. For Norsk og Tallvika må det lages nye, lokalt rensede **avledede** bilder med kontrollert fjerning av innbakt tekst/skilt og faste troll, mens fjell, bygninger og øvrige godkjente detaljer bevares. Ingen av originalene må overskrives. Ikke regenerer hele motivet.
2. Engelsk har en ren figur-fri original i repoet, men opprinnelige malte aktivitetsknapper må også fjernes for å unngå dobbeltmerking. Det eksisterende SHA-256-godkjenningskravet må respekteres.
3. **Geografi** benytter fortsatt Nordlysleiren som en vertikal reisekartillustrasjon. Den gamle reven er allerede dekket av et separat reparasjonslag. Et nytt fagmeny-design må lages uten å fjerne progresjonskartets reelle stopp eller skjule dem; det er ikke implementert i dette forsøket.
4. Stående og liggende visning på Mac, iPad og iPhone må inspiseres med faktiske skjermbilder. Treskilt må ikke dekke viktige landskapsmotiver. Layout er foreløpig en skisse.
5. Kjør Chromium/WebKit, relevante regresjonstester og hashkontroll før kunstgodkjenning.
6. Ikke merge eller publiser uten uttrykkelig godkjenning fra bruker.

## Bruk
Preview er ment for designkontroll, ikke produksjon. Tre-skiltmenyen er foreløpig et selvstendig HTML/CSS-lag, ikke en ferdig redigering av bildefilene. Eksakt originalbakgrunn forblir tilgjengelig for kontroll.

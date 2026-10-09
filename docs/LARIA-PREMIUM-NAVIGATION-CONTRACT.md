# Læria – premium navigasjonskontrakt

Dette er den felles kontrakten for Hjem, Reisen, Utforsk, Samlingen og oppgavescenene. Den styrer presentasjon og flyt; progresjon, læringsinnhold og lagrede brukerdata beholdes i eksisterende motorer.

## Produktregel

- Ett valg skal være tydeligst på Hjem: **Fortsett reisen**. Det åpner barnets anbefalte neste oppdrag direkte.
- **Reisen** er en bevisst fagvelger: Norsk/Bokskogen, Matte/Tallenga, Engelsk/Ordlandsbyen og Geografi/Nordlysleiren. Barnet kan alltid gå tilbake til tidligere eller mestrede steder.
- **Utforsk** er fri lek, ikke en alternativ læringssti: Kloden, Ordjakt, Brøklab og Gangetabell.
- **Samlingen** viser spor etter arbeid uten å låse eller skjule innhold.
- Det finnes ingen ekstra startskjerm mellom et valgt sted og dets eksisterende fagreise eller aktivitet.

## Skjermer og ansvar

| Flate | Jobb for barnet | Visuelt ansvar | Funksjonelt ansvar |
| --- | --- | --- | --- |
| Hjem | Fortsett, velg Reis/Utforsk eller åpne Samlingen | `home-basecamp-v12` | Eksisterende anbefaling, siste aktivitet og lagret progresjon |
| Reisen | Velg én av fire fagverdener | Basecampens 2,5D-scene med integrert fagvelger | `openSubject`, geografi-reisen og eksisterende reisekart |
| Utforsk | Velg en åpen aktivitet og lek | Basecampens 2,5D-scene med integrerte aktivitetsmål | Eksisterende åpning av Kloden, Ordjakt, Brøklab og Gangetabell |
| Samlingen | Se hva som er oppdaget | Samme basecamp/detaljnivå | Eksisterende besøks- og trofédata |
| Reisekart | Se neste oppdrag, fremdrift og tidligere steder | Fagets egen eventyrverden, felles HUD- og tilbakeprinsipp | Eksisterende progresjonsmotor |
| Oppgavescene | Løs oppgave, få mild respons, fortsett eller gå tilbake | Felles Læria Oppgavescene | Eksisterende oppgavemotor og resultatlagring |

## Navigasjonskontrakt

1. Hovednavigasjonen har nøyaktig fire valg: Hjem, Reisen, Utforsk og Samlingen.
2. Hjem → Fortsett reisen går direkte til det anbefalte oppdraget. Hjem → Reisen eller Utforsk åpner et visuelt integrert valg i samme scene.
3. Reisekart → oppdrag → tilbakemelding → neste oppdrag skjer uten å miste kontekst. Avslutter barnet, går det tilbake til samme fagreise.
4. Går barnet inn fra Basecamp til en fri aktivitet, fører tilbakeknappen tilbake til samme Basecamp-visning. Vanlige innganger utenfor Basecamp beholder sin opprinnelige returflyt.
5. Synlige mål må ha minst 44 × 44 CSS-piksler, fungere med trykk/tastatur og ikke bli skjult av safe areas eller stående iPad/iPhone.

## Beskyttede løsninger

- Kloden eies av `globe-v24.css` og `globe-v25-renderer.js`; bakgrunn, kartinteraksjon og moduser endres ikke av navigasjonsarbeid.
- Brøklab og Gangetabell beholder låst materiale, interaksjon og innhold.
- Reisekartene beholder egne illustrasjoner og progresjonsmotorer. Harmonisering betyr felles navigasjonsatferd og hierarki, ikke at fagverdenene flates ut til samme grafikk.

## Godkjenningsport per fase

En fase kan lukkes først når:

1. Berørt flyt er testet i Chromium og WebKit ved iPhone- og iPad-størrelser.
2. Faktiske skjermbilder er kontrollert mot denne kontrakten og låst 2,5D-retning.
3. Ingen berørt knapp mangler handling, og tilbakeflyt/progresjon er kontrollert.
4. Berørte automatiske regresjonstester er grønne.

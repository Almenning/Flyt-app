# Forslag: felles Premium-designsystem

Dette er målrettet konsolidering, ikke redesign.

## Byggesteiner

1. **AppShell** – bakgrunnsfit, safe areas, null hvit overscroll, sceneovergang.
2. **TopUtilityBar** – klasse, profil og innstillinger med fast prioritet og responsiv kollaps.
3. **LariaBackControl** – én semantisk returkomponent; illustrerte hotspots er en skinnvariant, ikke en ny flyt.
4. **SceneNavRail** – venstrestilt to-stolpe-skilt med fagtokens og felles hit-target/fokus.
5. **TaskShell** – felles kort, oppgavetittel, hint, feedback, belønning og avslutning.
6. **TrollHost** – separat figur, fast safe-zone-kontrakt, valgt figur og reduced-motion.
7. **FeedbackSystem** – riktige/feile/hint/ferdig med samme varme tone og visuelle språk.
8. **Design tokens** – typografi, tre/gull, papir, skygge, radius, fokus, spacing og z-indeks.

## Bevar lokalt

- Tallvikas regnelek, Gangemagis marked, Brøklabs kakeinteraksjon.
- Bokskogens narrativ og Lesekroken.
- Kinnaklovas tre særskilte læringsinnganger.
- Klodens kart- og oppdagelsesfunksjoner.

## Teknisk konsolidering

Prioriter ett nytt lag over eksisterende moduler. Ikke gjør «stor omskriving». Fjern først dobbelt ansvar: historisk Basecamp-versjonering, gjentatte returregler og CSS som må oppheves med `!important`. Hver fase må la lærings- og progresjonskontrakter stå urørt.

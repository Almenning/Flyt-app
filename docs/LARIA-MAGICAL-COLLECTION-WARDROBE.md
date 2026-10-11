# Læria: Magisk samlebok og Min rev – fase 2A

Status: **Samlekatalog og synlig minnerute i Samlingen under test. Garderobe ikke ferdig og PR-en er ikke klar for merge.**

## Produktretning

Læria har **én felles samlebok** på tvers av Bokskogen (norsk), Tallenga (matte), Ordlandsbyen (engelsk) og Nordlysleiren (geografi). Det skal ikke finnes fire konkurrerende beholdninger. Barnets lagrede revevalg (revegutt eller revejente) og allerede innlærte ferdigheter må overleve alle utvidelser.

Samleboken skal etter hvert inneholde minner/skatter fra de fire verdenene, nye venner, tilbehør og klær til barnets egen rev og et personlig eventyrsted. Disse utvidelsene krever egne avklarte illustrasjoner og kvalitetskontroll. Antall samleobjekter er ikke et mål i seg selv.

## Fase 2A – implementert på denne arbeidsgrenen

- `laria-collection-core.js`: katalog, normalisering, deterministiske opptjeningsregler, idempotent tildeling og lovlige garderobespor (`head`, `neck`, `back`, `cape`).
- `state.collectibles` legges som et valgfritt, bakoverkompatibelt felt i eksisterende lokal lagring `laerlittmer-v2`. Verken profil, avatar, progresjonsmodell, oppgaver eller eksisterende lagring flyttes.
- Gamle læringsdata kan gi allerede opptjente samleobjekter ved innlasting. Nye gjennomførte økter oppdaterer samlingen sammen med annen progresjon.
- Intern `LARIA_COLLECTION_STORE` tilbyr `snapshot`, `refresh`, `equip` og `unequip` til kommende UI. Et plagg kan bare velges når det er opptjent; samme tildeling gjentas aldri. Gjenstander blir ikke borte når barnet går videre i klassetrinn.
- Repetisjon innen ett favorittfag kan også låse opp klær. Noen fagspesifikke minner oppmuntrer til utforskning, men ingen klær krever at barnet forlater faget det liker.
- Ingen tilfeldige kister, kjøp, tidspress, rangering eller krav om daglige innlogginger.
- Eksisterende Basecamp-åpning **Samlingen** viser de fire fagminnene, med tydelig skille mellom funnet og uoppdaget. Eksisterende fremgangsteller bevares. Ingen klær fremstilles som påkledd.
- Statisk og nettleserbasert test på begge revevalg, iPhone, iPad, Safari og lagring; skjermbilder brukes til visuell kontroll.

**NB:** Denne fasen har en enkel synlig samlebok med fire fagminner, men bevisst ingen synlig garderobe, ingen falske «Bruk»-knapper og ingen påkledning av portretter. Det er ikke forsvarlig å kalle et plagg «på» før det faktisk vises på rett figur i alle sammenhenger.

## Fase 2B – gjenstår før synlig utgivelse

1. Lag/velg **to gjenkjennelige, transparente fullkroppsrever**, én for hver allerede godkjente avatar. De må bruke samme påkledningsgeometri og være egnet for stående mobil, liggende iPad og store kart.
2. Lag sammenfallende klær og utstyr i separate transparente lag med navngitte festepunkter. Barnet skal se faktisk påkledning på egen rev, ikke et dekorativt klistremerke.
3. Implementer `Samlingen → Min rev → Garderoben` med tydelig skille mellom *funnet*, *eid* og *i bruk*. Tilpass yngre og eldre klassetrinn.
4. Vis relevant utstyr på reven gjennom Hjem, oppgaver og reisemål. Unngå dobbel figur i de fire **låste originale bakgrunnsillustrasjonene**. Lås eventuelt den generiske reven som en navngitt NPC, ikke barnets figur.
5. La barnet åpne samleboken med samleminner fra de fire fagene og et personlig eventyrsted. Nye aktiviteter legges ikke til før grunnappen holder nødvendig kvalitet.
6. Legg til test for to ulike profiler, gjenoppretting av lagring, tildeling én gang per oppnåelse, påkledning i alle berørte skjermbilder og korrekte interaktive trykkflater.

## Viktige invariants

- Skole-/læreplanmål skal sikre faglig verdi, ikke tvinge barnet bort fra aktiviteter det liker.
- Mestring åpner innhold, men fjerner aldri tidligere innhold.
- Ingen belønning skal lokke barnet til overdreven skjermtid eller innlogging hver dag. Både forsøk, riktige svar og fullførte repetisjonsøkter kan være meningsfull innsats, uten at Lærias eksisterende mestrings- og dagsmålslogikk endres.
- De fire låste kartillustrasjonene og de åtte premiumkortene endres ikke i fase 2A.
- Ingen automatiske merges fra denne fasen før ekte garderobegrafikk og UI er godkjent.

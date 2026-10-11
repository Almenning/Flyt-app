# Læria: Magisk samlebok og Min rev – fase 2A

Status: **Interaktiv samlebok, to samlefaner, garderobe, fem hovedinnganger og lagret påkledning er implementert på PR #90. Full siste-commit verifisering og visuell Safari/iPad QA kreves før merge.**

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

**Historikk:** Den tidlige fase 2A manglet garderobe, men dette er nå erstattet av den interaktive førsteversjonen. Ingen illustrasjoner er endelig låst.

## Fase 2B – status og kvalitetskrav før synlig utgivelse

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


## 11. oktober – arbeidsstatus (på PR #90)

- Garderobens knapp og fungerende valg «Ta på» / «I bruk» er implementert. Låste klær kan ikke velges. Tilbakeknappen returnerer til samme samlebok.
- En felles SVG-komposisjonsmotor `laria-fox-wardrobe.js` bruker eksisterende bilde av den valgte reven og legger utstyr over det. Originale reisebakgrunner og faginnhold er uendret.
- Figurkomponenten kobles til Hjem, oppgavescener, reisekart og de relevante lekaktivitetene, med beholdt originalbilde i DOM av hensyn til eksisterende navigasjon og tester.
- **Kvalitetsmerknad:** Figuren bruker foreløpig en kodet silhuett/klippbane av de godkjente portrettene, og påkledningen bruker skalerbare SVG-lag. Dette er en reell funksjonell førsteversjon, men ikke en kunstnerisk godkjent, transparent fullkroppsillustrasjon med nøyaktig geometri. Den skal ikke omtales som endelig premiumgrafikk.
- Verifisering krever vellykket siste-commit QA, iOS, smoke, Safari/iPad, visuell kontroll av kroppsklipp og at eventuelle overlegg ikke hindrer klikk eller dekker andre grensesnittelementer.

## 11. oktober: skjermbildebasert rettelse

En gjennomgang av faktisk WebKit-/iPhone-skjermbilde fra Actions-artifakten avslørte at hard kodet SVG-klippbane fjernet ansikt, ører, hale og sko. Portrettkildene er **200×272**, mens den tidligere komposisjonen feilaktig antok 200×200. Renderer er endret til full høyde og myk oval kantmaske, uten den skadelige klippbanen. Dette bruker fortsatt de originale valgte reveportrettene, ingen ny figur er funnet på. Resultatet forblir en illustrert portrettkomposisjon, ikke en godkjent, transparent fullkroppskarakter. Dennes visuelle kvalitet må kontrolleres i nye Safari-skjermbilder. Samleboken komprimeres noe på iPhone, så utstyrslenken blir lettere å finne.

Hovedgren #93 har en reell atlas-testrettelse etter at PR #90 ble opprettet. Den eksakte godkjente testfilen føres inn i arbeidsgrenens merge-commit sammen med ny renderer for å unngå en regresjon og en uavklart merge-konflikt.

# Læria Hjem v16 – kontrollert UI-fri kunstkandidat

**Status 22.11.2026: Kun maskekontrakt og kvalitetssperre. Ingen ren illustrasjon godkjent. Ingen endring i aktiv app eller i låst kunst.**

## Hvorfor egen kunstport
Home v16 er godkjent av produkteier med **innmalt** logo, fire fagskilt,
hilsen, Reisen, Fortsett reisen og bunnnavigasjon i både stående og liggende
iPad-format. En ny `LariaWoodenSign` over disse pikslene vil gi doble skilt.
Den gamle versjonen er ikke UI-fri. Å erstatte den med en løst regenerert
fjordillustrasjon er heller ikke tillatt: det endrer Grovanova/Kjøsnesfjorden-
motivets fjell, fjord, kirke, sol, perspektiv og øvrig låst landskap.

**Autoritativ kilde:** `docs/LARIA-HOME-V16-LOCK-2026-11-19.md`,
`laer-litt-mer/assets/home-v16/laria-grovanova-v16-approved.json`.

- **Liggende låst original:** `laria-grovanova-v16-landscape-original.png`,
  **1448×1086 native PNG**, SHA-256 `9019d2d7be86d0f96d59770c0d141b935b1c4195fecc4e1dcfbf531ce226e028`.
- **Stående låst original:** `laria-grovanova-v16-portrait-original.png`,
  **1086×1448 native PNG**, SHA-256 `ceb6331bb9ae45e3c6141dc74817262fc0f667ea0b0f82fcf85a60d99efbee55`.

De godkjente **app-WebP-eksportene** er separat skalert til
2048×1536 (liggende) og 2048×2732 (stående) med Lanczos. De har
egne, urørlige SHA-kontroller i v16-manifestet. Retusjkontrollen
sammenligner **originale PNG-piksler på native størrelse** før
en eventuell framtidig eksport. Oppskalering legger ikke til nye
malte detaljer, og er ikke grunn til å endre fjellformen.

Disse filene og appens v16-manifest skal **aldri** overskrives.
`status: approved` i manifestet betyr godkjent **malt** v16, ikke godkjent
UI-fri versjon.

## Det som faktisk er implementert

`tools/laria_art/grovanova_v16_clean_gate.py` gjør følgende:

1. Leser begge eksakte original-PNG-ene, verifiserer manifestets SHA-256 og
   riktig størrelse.
2. Bygger to binære redigeringsmasker i *opprinnelig PNG-oppløsning*; tillatte
   områder omfatter innmalt logo, hilsen, fire fagsskilt med stolper,
   Reisen, Fortsett reisen og innmalt bunnnavigasjon.
3. Kontrollerer at manifestets faktiske knappekoordinater ligger innenfor
   rett redigeringsmaske.
4. Reserverer egne ikke-redigerbare landemerker i fjell, fjord og kirke
   og **avviser** enhver mask som treffer disse.
5. Produserer fargekodede, faktiske maskeguider som automatisk CI-artefakt,
   uten å redigere bildene.
6. Har en valgfri kandidatkontroll som sammenligner hvert RGB-piksel i en
   kandidat mot originalen. **Alle endringer utenfor masken avvises.**
   Kandidaten må beholde eksakt oppløsning, ha full opasitet og faktisk
   endre piksler inne i masken.

Automatisert kildeverifikasjon **er ikke** godkjenning av bildeinnhold.
En kandidat kan fortsatt vise malte skilt, kunstig slør, smurte blomster,
kantfeil eller unaturlig tre/eng inne i masken og må derfor vurderes manuelt.

### Kjør kontrollen

```bash
python -m pip install Pillow==11.2.1
python tools/laria_art/grovanova_v16_clean_gate.py --self-test
python tools/laria_art/grovanova_v16_clean_gate.py --output-dir /tmp/laria-v16-art-review
```

Når en separat bildekandidat er laget, plasser den **ikke** i aktive app-assets.
Verifiser den som ekstern, ennå ikke godkjent PNG:

```bash
python tools/laria_art/grovanova_v16_clean_gate.py \
  --output-dir /tmp/laria-v16-art-review \
  --candidate-portrait /path/to/v16-portrait-UI-FREE-CANDIDATE.png \
  --candidate-landscape /path/to/v16-landscape-UI-FREE-CANDIDATE.png
```

Forventede artefakter i `/tmp/laria-v16-art-review` er
`v16-portrait-UI-EDIT-MASK.png`,
`v16-landscape-UI-EDIT-MASK.png`,
`v16-portrait-MASK-GUIDE-NOT-APPROVED.png`,
`v16-landscape-MASK-GUIDE-NOT-APPROVED.png` og
`REPORT-NOT-APPROVED.json`.

## Kunstproduksjon – krav til neste steg

- Utgangspunkt skal være akkurat de **låsede originalfilene**, ikke
  genererte skjermbilder eller etterligninger av motivet.
- Retusjer bare innmalt UI **innenfor** de godkjente maskene og komponer
  eksakte, uendrede originalpiksler tilbake over alt utenfor maskene.
- Kontroller at det nye, reparerte områdets landskap, tre, fjord og eng
  får naturlig kontinuitet uten kloning/repetisjon, blåsing eller strekk.
- IKKE fjern levende TrollActor. Den figuren er separat DOM, og er ikke
  en del av de to låste masterne. Vokseninngangen er også separat.
- Den malte UI-en må være **helt borte** før noe nytt DOM-skilt kan brukes.
- **Ingen** AI-generert ny fjellsilhuett, ny kirke, ny dalakse eller
  ny solretning er et gyldig alternativ selv om den er pen.
- Først etter godkjent bakgrunn kan Hjem få separate DOM-elementer for logo,
  riktig profilhilsen, fire fagsskilt, Reisen/Fortsett reisen og
  de fire bunnnavigasjonsknappene, uten duplikater.
- De nye venstrestilte skiltene skal følge den låste
  `laria-sign-master-v1.png` og beholde alle eksisterende faktiske ruter.
- Ingen endring av `laria-grovanova-v16.js` eller godkjent manifest før
  separat, uttrykkelig produkteiergodkjenning av begge retninger.

## Godkjenningsporter

1. **Mekanisk:** grønn kildekontroll og kandidatkontroll fra nøyaktig commit.
2. **Kunst:** faktisk før-/etter-par i full originaloppløsning uten dobbel
   skiltgrafikk, sømmer eller synlige retusjartifakter. Fjell/sjø/kirke
   må samsvare med låst master.
3. **Funksjon:** virkelige iPad-skjermbilder med separate nye skilt fra
   appen ved 820×1180, 1024×1366, 1180×820, 1024×768 og 1366×1024,
   i Chromium **og** WebKit. Behold berøring, tastatur, retur, progresjon,
   vokseninngang, ingen hvit overscroll og separat levende TrollActor.
4. **Produkteier:** uttrykkelig godkjenning av det faktiske resultatet
   i både stående og liggende iPad. Før det: **DRAFT, ingen merge/publisering**.

Denne kunstporten er bevisst en egen PR og skal ikke blandes inn i
[PR #272](https://github.com/Almenning/Flyt-app/pull/272), som gjelder
skiltkomponenten, eller PR #270 som gjelder navigasjonskontrakten.

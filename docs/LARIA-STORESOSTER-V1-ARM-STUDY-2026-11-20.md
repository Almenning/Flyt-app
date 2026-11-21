# Storesøster V1 – kildebasert armstudie (20. november 2026)

**Status: TECHNICAL ART STUDY / PORT A BLOCKED.** Dette er ikke en godkjent animasjonsrigg.

## Gjennomført

- Kilde: uendret, låst `laer-litt-mer/assets/gangemagi-troll/storesoster.webp` (512×1024 RGBA). SHA-256: `b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89`.
- Nytt reproduksjonsskript: `scripts/laria-storesoster-v1-arm-source-study.py`. Skriptet avviser alle andre originalbytes.
- Tre **omtrentlige, ikke-kunstnerisk bearbeidede kildemasker**: synlig bøyd arm på bildevensiden, lite synlig håndfragment på bildehøyresiden og resten av originalbildet. De er uten overlapp og har felles koordinatrom.
- Skriptet kan levere separate transparente 2048×2048 PNG-er, eksakt nøytral rekonstruksjon, visuell maskeoversikt, diagnostisk 8-bilders bevegelsesprøve og SHA-256 manifest.
- Testet lokalt på originalen: nøyaktig RGBA-identitet etter rekonstruksjon i 512×1024, ingen overlapp mellom maskene. Skriptet nekter bevisst å bruke endrede V1-bytes.
- En diagnostisk armrotasjon (+12°) etterlater **2 249** piksler av originalens silhuett uten underliggende maling; -12° etterlater **2 248**. Dette er en indikator på manglende skjult illustrasjon, ikke en ferdig kunstprøve.

## Hvorfor dette ikke er ferdig

Det som er skilt ut er **synlige kildepiksler**, ikke en komplett anatomisk arm. Den bøyde armen inneholder fremdeles kles-/kroppsoverlapp; motsatt arm er hovedsakelig skjult bak hår/veske. Skulder, underarm, torso, albue og skjult bekledning må etterillustreres. Hode, hår og ansiktsuttrykk har ikke fått egne lag.

Port A kan derfor ikke godkjennes:
```json
{
  "identity": "storesoster",
  "ownerApproved": false,
  "readyForRuntime": false,
  "artGate": "BLOCKED",
  "completeSecondArm": false,
  "hiddenAnatomyPainted": false,
  "headAndFaceSeparated": false
}
```

## Gjenstående operative leveranse

1. Kunstnerisk nøyaktig segmentering av V1s faktiske anatomi og klær.
2. Tegning av skjult kroppsoverflate og fullstendig arm nummer to, samme stil og identitet som originalen.
3. Framvisning av **sømløs** skulder/arm ved ±12° og ny nøytral rekonstruksjon.
4. Deretter selvstendige hode-/ansiktslag og seks reelle animasjoner, testet i appens iPad-grensesnitt.

## Kjøring

Skriptet krever Pillow; det er ikke aktiv produksjonskode:

```bash
python3 scripts/laria-storesoster-v1-arm-source-study.py \
  --source laer-litt-mer/assets/gangemagi-troll/storesoster.webp \
  --out out/laria/storesoster-v1-arm-source-study
```

**Beslutning:** V1 forblir aktiv. Ingen kandidatressurser lagt under `approved/`. PR #258 skal ikke merges eller publiseres. All fremdrift i denne runden er kildetro forberedelse og feilkartlegging, **ikke** ferdig animasjon.

## Underpaint-eksperiment: geometriske hull tettet, kunstport fortsatt stengt

Kildebasert utvidelse er nå implementert i `scripts/laria-storesoster-v1-underpaint-experiment.py`. Den bruker to eksplisitt **ikke-godkjente** OpenCV-metoder (Telea og Navier–Stokes) til å generere en skjult teksturflate som bare dekker hull når den venstre, synlige V1-armen roteres. Skriptet krever `Pillow`, `numpy` og `opencv-python-headless`, og endrer verken originalillustrasjonen eller runtime.

### Målte funn, original 512 × 1024

| Rotasjon | Uten underlag: manglende kildesilhuett | Med Telea-underlag | Med Navier–Stokes-underlag |
| --- | ---: | ---: | ---: |
| −12° | 2 248 | 0 | 0 |
| −6° | 1 164 | 0 | 0 |
| 0° | 0 | 0 | 0 |
| +6° | 1 169 | 0 | 0 |
| +12° | 2 249 | 0 | 0 |

Sammensatt nøytralpositur ble byteverifisert mot originalens RGBA-piksler med begge underlag. En skadet originalfil avvises av kildekontrollen. Alle outputfiler merkes `artGate: BLOCKED`, `ownerApproved: false` og `readyForRuntime: false`.

**Disse målingene sier bare at kildens tidligere synlige silhuett nå er tildekket**. De bekrefter *ikke* korrekte anatomi-/skulderskjøter, malestil eller velfungerende reell armbevegelse. Side-ved-side-prøver viser fortsatt feil ved skulder, hår og håndledd. Ingen overføring til `approved/` eller publisering er gjort. Originalens 512 × 1024 oppløsning setter dessuten en reell grense for hvor mye detaljert artikulasjon som kan avledes uten ny tegning.

**Neste obligatoriske kunstleveranse:** Manuelt tegnet skjult skulder, fullstendig andre arm og overmalte overganger for en kort, troverdig vinke-animasjon. Hvis kunstnerisk identitet ikke kan bevares, skal Port A forbli stengt. Ikke gjenta flere generiske inpainting-varianter og kalle dem ferdig animasjonskunst.

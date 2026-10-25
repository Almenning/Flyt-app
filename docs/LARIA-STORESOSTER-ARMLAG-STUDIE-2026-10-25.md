# Læria – Storesøster: kildefaste armlag og bevegelsesbarriere
**Dato:** 25.10.2026  
**Omfang:** Bare godkjent storesøster i Gangemagi, PR #208. Dette er en **art-studie, ikke live-kode**.

## Eksakt kilde
- Godkjent figur: `laer-litt-mer/assets/gangemagi-troll/storesoster.webp`
- 512 × 1024 piksler, RGBA, **SHA-256** `b98a5ee7f264d448da557636406080b5d8ee8aae23f32f0e41b66bf811beda89`.
- Bare flatt transparent rasterbilde tilgjengelig i repoet. Ingen separate Illustrator/PSD/Rive-lag.
- Ingen ny figur, ingen endringer i ansikt, hår, klær, proporsjoner eller kildepiksler er tillatt.

## Hva undersøkelsen faktisk har gjort
`tools/rigging/storesoster_arm_layer_study.py` isolerer en **foreløpig, håndmaskert synlig arm** direkte fra originalfilens kildepiksler. Det lager en bakgrunn uten arm der den manglende illustrasjonen **forblir et hull**, i stedet for at kode eller KI gjetter skjult anatomi.

Kjør lokalt med Python, Pillow og numpy:
```bash
python tools/rigging/storesoster_arm_layer_study.py \
  --source laer-litt-mer/assets/gangemagi-troll/storesoster.webp \
  --output /tmp/laria-storesoster-arm-study
```

Studien verifiserer låst kildehash og at nøytral sammensetting er *pikselidentisk* med originalen. Rotasjonene bruker skulderpunkt rundt `(177,397)` i originalens 512 × 1024-koordinatsystem. Masken er **ikke et ferdig produksjonslag** og er bare et gjennomførbarhetsforsøk.

| Armvinkel | Eksponerte piksler uten underlagsillustrasjon |
|---|---:|
| 0° | 0 |
| −12° | 2 413 |
| +12° | 2 402 |
| −25° | 4 771 |
| +25° | 4 774 |

Disse tallene viser manglende **kildeflatelag**, ikke feilprosent i den eksisterende Gangemagi-appen. Rosa felt i lokalt kontaktark markerer manglende bakgrunn/stoff/armfeste ved kunstig rotasjon, og skal aldri vises til barn i produksjon.

**Funn:** Det er ikke mulig å løfte den avbildede bøyde armen naturlig med den eksisterende kilden alene. Den er malt med hånden plassert ved beltet. Ved rotasjon av bare synlig arm kommer skjult kropp, hår og stoff til syne som ikke eksisterer i kildebildet. Dette er en kunstressursbarriere og kan ikke løses kvalitetsmessig med CSS-skygger eller stadig bredere `clip-path`-polygoner.

## Animerbare lag som trengs fra originaltro illustratørarbeid
1. Godkjent intakt referanse som *fasit* for neutral pose og karakteridentitet.
2. Bakre hår og kropp, inkludert gjenopptegnede tidligere skjulte områder ved venstre skulder og midje.
3. Venstre overarm/erme, underarm/armbånd og hånd med naturlig sammenfallende rotasjonspunkter.
4. Godkjent stoff og skygger bak bevegelige ledd, uten at originale synlige piksler endres.
5. Deretter egne øyelokk/øyne og hårseksjoner, hvis de kan gi mer naturlige uttrykk enn dagens forsiktige pilot.

Rive eller tilsvarende 2D-rigging kan kobles på *etter* at disse lagene er rekonstruert og visuelt godkjent. Hvert nytt lag må kunne kontrolleres mot låst WebP.

## Godkjenningsporter
- Uendret 0°-komposisjon, godkjente ansikter/hår/klær og ingen synlig søm.
- 0 eksponerte hull i alle tilsiktede armpositurer, pluss håndkontroll av skulder og hånd på faktiske opptak.
- Chromium og WebKit på iPhone/iPad begge orienteringer, inkludert redusert bevegelse; kontroll på fysiske iOS-enheter er fortsatt separat.
- Gangemagis matematikk, troll→kurv og lagret fremgang bevares.
- **Ingen** riggutvidelse/utrulling til andre troll, merge eller publisering før brukerens uttrykkelige visuelle godkjenning.

Dagens aktive `source-bones-v2` beholdes som **begrenset, eksisterende pilot** mens art-lagene forberedes. Studien er ikke integrert som en ny animasjon i spillet. All animasjonskvalitet bedømmes fra faktisk render og video, ikke AI-genererte statusillustrasjoner.

# MotoMatch dataset expansion — agent brief

You are adding motorcycles to a structured dataset for a motorcycle recommendation site.
Everything below is mandatory.

## Deliverables (two things)

1. **A JSON file** at `data-drops/<your-agent-name>.json` (you will be told the name) containing an
   array with one object per assigned bike, following the schema below exactly.
2. **Two photographs per bike** downloaded into `images-src/` in the project root:
   - `<id>-hero.<ext>` — environmental/riding/beauty press shot, landscape, min 1200px wide (prefer ≥1900px)
   - `<id>-studio.<ext>` — clean studio/product shot (side or 3/4 profile) if one exists
   Keep original format; the extension must match the actual file type. Do NOT convert to webp —
   a separate pipeline handles that. Do NOT write anything into `public/`.

## Non-negotiable rules

- **Specs come from manufacturer or official importer published figures.** Use WebSearch/WebFetch to
  find the manufacturer product page or press kit for the current European model (2025/2026 model year).
  Never invent numbers. If a figure is not published, omit the optional field.
- **Images must show the exact model and generation.** After downloading, use the Read tool to LOOK
  at each image and confirm the model (badges, bodywork). Reject renderings, wrong generations,
  heavily watermarked shots, or images of a sibling model. Record what you saw in `imageMeta.visualDescription`.
- Image sources, in priority order: manufacturer press/media portals and product-page CDNs,
  official importer sites, Wikimedia Commons via API (record author + license), reputable publications last.
  Useful patterns that are known to work:
  - Yamaha: product pages on yamaha-motor.eu; og:image + CDN `cdn2.yamaha-motor.eu` with predictable
    `2025-Yamaha-<CODE>-EU-<Colour>-{Action|Studio}-001-03.jpg` names.
  - Honda: hondanews.eu press kits; image CDN `/image/motorcycles/{thumb|low|high}/<mediaId>/...` — `high` is full-res.
  - KTM: press.ktm.com; BMW: press.bmwgroup.com (often JS-gated — product-page CDN may be easier, but avoid CGI renders);
    Triumph/Royal Enfield/Kawasaki/Suzuki/Aprilia: product page CDNs and media/press sections.
  - Download with: `curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36" -o <file> --max-time 60 "<url>"`
  - Validate with `file` and `sips -g pixelWidth -g pixelHeight`.
- Prices: indicative European list price in EUR, `confidence: "approximate"`, with a `note` saying
  which market's list price it is based on. Romanian importer price preferred when findable.
- A2: `a2Compatible` is true only if the bike is ≤35 kW natively or an official restricted version
  exists (explain in `a2Note`).
- E-Clutch is NEVER `fullyAutomatic: true`. CVT/DCT/Y-AMT are fully automatic.

## Schema (one object per bike; follow field names exactly)

```json
{
  "id": "kebab-case-id-you-were-given",
  "manufacturer": "Yamaha",
  "model": "Ténéré 700",
  "variant": null,
  "year": 2026,
  "category": "sport | naked | cruiser | adventure | touring | retro | scooter | dual-sport",
  "vehicleType": "motorcycle",
  "engine": { "displacement": 689, "cylinders": 2, "horsepower": 73, "torque": 68, "powerNote": "optional" },
  "dimensions": { "weight": 205, "seatHeight": 875, "fuelCapacity": 16 },
  "transmission": { "type": "manual | dct | y-amt | cvt | e-clutch", "fullyAutomatic": false, "manualOverride": true, "clutchLever": true },
  "performance": { "topSpeed": 180, "fuelConsumption": 4.3 },
  "chassis": { "drive": "chain | belt | shaft", "brakes": "…", "suspension": "…" },
  "price": { "eur": 11000, "country": "EU", "confidence": "approximate", "note": "…" },
  "a2Compatible": false,
  "a2Note": "optional",
  "beginnerRating": 6,
  "beginnerNote": "1–2 sentences: honest editorial judgement of first-bike suitability and why.",
  "ridingStyles": ["city", "commuting", "weekend", "touring", "mountain", "sport", "offroad", "cruising"],
  "passengerSuitability": 6,
  "practicality": 7,
  "performanceLevel": 6,
  "whoFor": "1–2 sentences: the rider this bike genuinely suits.",
  "notFor": "1 sentence: 'Maybe not for you if …'",
  "about": "2–3 factual sentences describing the bike's character — what it is, how it rides, what stands out.",
  "pros": ["3–5 short concrete items"],
  "cons": ["2–4 short concrete items"],
  "sources": ["Plain-language provenance, e.g. 'Yamaha Europe specifications for the 2026 Ténéré 700'"],
  "lastVerified": "August 2026",
  "imageMeta": {
    "sourceUrl": "page the photos came from",
    "sourceName": "Yamaha Motor Europe",
    "license": "press/product photo | CC BY-SA 4.0 (author)",
    "alt": "one factual sentence describing the hero photograph",
    "visualDescription": "what you verified in the images",
    "files": ["images-src/<id>-hero.jpg", "images-src/<id>-studio.jpg"]
  }
}
```

Rating guidance (1–10, be honest and differentiated):
- `beginnerRating`: 9–10 nearly foolproof; 5–6 demanding first bike; ≤4 not a first bike.
- `passengerSuitability`: pillion seat + ergonomics + power reserve (a supersport ≈ 2–3, big tourer ≈ 9).
- `practicality`: storage, wind protection, range, luggage options, everyday usability.
- `performanceLevel`: 1–3 relaxed commuters, 4–6 mid-size fun, 7–8 genuinely fast, 9–10 flagship performance.
- `ridingStyles`: only styles the bike is genuinely good at (2–5 entries).

Work bike by bike. If a bike cannot be verified or photographed after exhausting the sources,
say so in your report rather than filling gaps with guesses.

Return value: a short summary plus any caveats. The JSON file is the primary deliverable.

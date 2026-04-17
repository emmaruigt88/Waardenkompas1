# 🧭 Waardenkompas

Een reflectie- en besluitvormingsapp die gebruikers helpt hun eigen waarden, voorkeuren en identiteit te ontdekken, vast te leggen en toe te passen in keuzes.

**Live:** [Deploy op Vercel →](#deployment)

---

## Kernprincipe

Gebruikers hebben vaak wel een eigen gevoel, maar dat is vluchtig en snel overschreven door anderen. Waardenkompas helpt dit eerste signaal **vangen**, **versterken** en **toepassen** in keuzes.

## Features

### Reflectiemodules
- **Vrij van invloed** (18-jaar perspectief) — loskomen van aangeleerde keuzes
- **Sporen van jezelf** (verleden) — authentieke patronen terugvinden
- **Kompas in het nu** — actuele richting bepalen op basis van energie

### AI-powered (Anthropic Claude)
- **Eerste Impuls Capture** — vang je gevoel met AI-patroonreflectie
- **Dual View** — visualiseer eigen gevoel vs. externe invloed
- **Beslis-kompas** — AI analyseert patronen uit al je reflecties bij een keuze
- **AI Verkenningsgesprek** — chat-interface voor diepere patroonverkenning
- **AI Waardenprofiel** — dynamisch profiel met energiebronnen, nieuwsgierigheid, groeirichting

### Overig
- **Leren door doen** — kleine experimenten met reflectie
- **Tijdlijn** — je ontwikkeling in de tijd
- **Export** — download je waardenprofiel als tekst
- **Privacy-first** — alle data lokaal in localStorage

---

## Tech Stack

| Laag | Technologie |
|------|------------|
| Framework | React 18 + Vite 6 |
| AI | Anthropic Claude API (Sonnet 4) |
| Styling | Inline styles + CSS variables |
| Fonts | Source Serif 4 + DM Sans (Google Fonts) |
| Storage | localStorage (client-side) |
| Deploy | Vercel / GitHub Pages / Netlify |

---

## Projectstructuur

```
waardenkompas/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx            # Hoofdcomponent met alle pagina's
│   ├── data/
│   │   └── modules.js     # Vraagmodules en kompas-vragen
│   └── lib/
│       ├── ai.js          # Anthropic API service layer
│       ├── context.js     # Context builder voor AI-prompts
│       ├── storage.js     # localStorage wrapper
│       └── theme.js       # Design tokens (kleuren, fonts)
├── index.html             # HTML entry met meta tags & fonts
├── vite.config.js         # Vite configuratie
├── vercel.json            # Vercel SPA routing
├── package.json
├── .env.example           # Template voor environment variables
├── .gitignore
└── README.md
```

---

## Snel starten

### Vereisten
- Node.js 18+
- npm of yarn
- Anthropic API key (voor AI-features)

### Installatie

```bash
# Clone de repository
git clone https://github.com/jouw-username/waardenkompas.git
cd waardenkompas

# Installeer dependencies
npm install

# Kopieer environment variables
cp .env.example .env.local

# Vul je Anthropic API key in
# Open .env.local en vervang 'your_api_key_here'
```

### Development

```bash
npm run dev
# → http://localhost:3000
```

### Build

```bash
npm run build
npm run preview
```

---

## Deployment

### Vercel (aanbevolen)

1. Push naar GitHub
2. Ga naar [vercel.com](https://vercel.com) en importeer het project
3. Voeg environment variable toe:
   - `VITE_ANTHROPIC_API_KEY` = je Anthropic API key
4. Deploy!

Vercel detecteert automatisch het Vite-project en configureert de build.

### Netlify

```bash
# Build command: npm run build
# Publish directory: dist
```

Voeg een `_redirects` file toe aan `public/`:
```
/*    /index.html   200
```

### GitHub Pages

Pas `vite.config.js` aan:
```js
export default defineConfig({
  base: '/waardenkompas/',
  // ...rest
})
```

---

## AI-integratie: productie-setup

De huidige setup gebruikt `anthropic-dangerous-direct-browser-access` voor development. **Voor productie is een backend proxy vereist:**

### Optie 1: Vercel Edge Function

Maak `api/chat.js`:

```js
export const config = { runtime: 'edge' };

export default async function handler(req) {
  const body = await req.json();

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  return new Response(response.body, {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

Pas `src/lib/ai.js` aan om `/api/chat` als endpoint te gebruiken.

### Optie 2: Cloudflare Worker

Vergelijkbare setup met Cloudflare Workers of Pages Functions.

---

## Uitbreidingsmogelijkheden

- [ ] Backend proxy voor veilige API-key opslag
- [ ] Spraak-invoer voor snellere impuls capture
- [ ] Push notifications voor weekelijkse reflectie-reminders
- [ ] Gedeeld profiel (optioneel, met coach of therapeut)
- [ ] Thema-verdiepingen (relaties, werk, gezondheid)
- [ ] PWA met offline support
- [ ] Supabase/Firebase backend voor cross-device sync
- [ ] Meerdere talen (Engels, Duits)

---

## Design

De app voelt als een rustige, veilige plek. Zonder oordeel, zonder "goed/fout". De gebruiker is zelf de autoriteit.

**Kleurenpalet:** aardtinten (crème, groen, amber, blauw)  
**Typografie:** Source Serif 4 (inhoud) + DM Sans (UI)  
**Toon:** empathisch, helder, introspectief

---

## Licentie

MIT

## LearnFlow (MVP)

Instant learning playlists powered by YouTube + Gemini.

### Setup

1) Create a `.env.local` with:

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
YT_API_KEY=your_youtube_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

2) Install deps and run dev

```bash
npm i
npm run dev
```

Open http://localhost:3000

### How it works

- Home: search topic or use Learn Random
- API `/api/learn`: tries a relevant YouTube playlist; if none, curates top videos via Gemini
- Playlist page: embeds found playlist or AI-curated sequence, plus AI Tips

### Notes

- Free tiers recommended. Limit ~10 videos per plan.
- No accounts, no payments.

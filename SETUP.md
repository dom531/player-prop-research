# Complete Setup Guide

## Step 1: Create Supabase Account & Database

1. Go to [supabase.com](https://supabase.com) and sign up
2. Create a new project
3. Wait for the database to provision (2-3 minutes)
4. Go to **SQL Editor** in the left sidebar
5. Copy the contents of `database/schema.sql` and run it
6. You should see: "Success. No rows returned"

## Step 2: Get Your Supabase Credentials

1. In Supabase, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## Step 3: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** section
4. Click **Create new secret key**
5. Copy the key (starts with `sk-...`)
6. **Note**: You'll need to add billing info and credits (~$5 minimum)

## Step 4: Get The Odds API Key

1. Go to [the-odds-api.com](https://the-odds-api.com)
2. Sign up for free account
3. You get **500 free requests/month**
4. Copy your API key from the dashboard

## Step 5: Configure Environment Variables

1. In your project root, create `.env.local`:

```bash
# Copy the template
cp .env.local.template .env.local
```

2. Open `.env.local` and fill in your values:

```env
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGc..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGc..."

# AI (OpenAI)
OPENAI_API_KEY="sk-..."

# Market Data (The Odds API)
THE_ODDS_API_KEY="your-odds-api-key"
```

## Step 6: Prepare Historical Data (CSV)

You need a CSV file with historical player stats. Format:

```csv
Player,Team,Date,Opp,Location,MP,PTS,TRB,AST,USG_PCT
LeBron James,LAL,2024-01-15,GSW,@,38,28,8,7,31.2
Stephen Curry,GSW,2024-01-15,LAL,,35,32,5,6,29.8
```

**Column Definitions:**
- `Player` - Full player name
- `Team` - Team abbreviation
- `Date` - Game date (YYYY-MM-DD)
- `Opp` - Opponent team abbreviation
- `Location` - Leave empty for home, `@` for away
- `MP` - Minutes played
- `PTS` - Points scored
- `TRB` - Total rebounds
- `AST` - Assists
- `USG_PCT` - Usage percentage

**Where to get data:**
- [Basketball Reference](https://www.basketball-reference.com) - Download game logs
- [NBA Stats](https://stats.nba.com) - Export player data
- Manual CSV creation for testing

Save this file as: `data/player_stats_export.csv`

## Step 7: Seed the Database

```bash
npm run seed
```

You should see:
```
🚀 Starting seed from ./data/player_stats_export.csv...
✅ Parsed 150 rows. Uploading...
✅ Uploaded batch 0 to 150
🏁 Seeding complete.
```

## Step 8: Enable Real Data in the App

Currently using mock data. Let's switch to real data:

Open `app/page.tsx` and replace the mock `setTimeout` with the actual API call:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  try {
    const analysis = await getPlayerResearch(playerName)
    setResult(analysis)
  } catch (error) {
    console.error('Analysis failed:', error)
    alert('Failed to analyze. Check console for details.')
  } finally {
    setLoading(false)
  }
}
```

## Step 9: Test the Application

```bash
npm run dev
```

1. Open http://localhost:3002
2. Enter a player name that exists in your CSV (e.g., "LeBron James")
3. Click "Analyze Performance"
4. You should see:
   - Historical game data from Supabase
   - Real betting line from The Odds API
   - AI analysis from OpenAI

## Troubleshooting

### "No data found for this player"
- Check if player name in database matches exactly
- Try case-insensitive search (already implemented)
- Verify seeding completed successfully

### "Odds API Failed"
- Check API key is correct
- Verify you haven't exceeded 500 requests/month
- The Odds API may not have lines for all players

### "OpenAI API Error"
- Verify API key is correct
- Check you have credits in your OpenAI account
- Ensure billing is set up

### Database Connection Error
- Double-check Supabase URL and keys
- Ensure you're using the correct keys (public vs service_role)
- Check Supabase project is active

## Cost Breakdown

**Free Tier:**
- Supabase: Free (up to 500MB database)
- The Odds API: Free (500 requests/month)
- OpenAI: **Paid** (~$0.002 per analysis = $1 for 500 analyses)

**Total**: ~$1-5/month depending on usage

## Production Deployment

Once everything works locally:

```bash
# Deploy to Vercel
npm run build
vercel deploy
```

Add all environment variables in Vercel dashboard.

## Next Steps

1. Add more players to your CSV
2. Set up automatic data updates (cron job)
3. Add user authentication (Supabase Auth)
4. Track analysis history
5. Add more sports/prop types

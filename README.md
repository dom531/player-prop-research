# 🎰 Baccarat Boyz Terminal

**Professional-grade NBA player prop betting research platform powered by AI and advanced analytics.**

![Version](https://img.shields.io/badge/version-2.0.0-00ff41.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)
![License](https://img.shields.io/badge/license-MIT-00ff41.svg)

## ✨ Features

### 🎯 Core Analytics
- **Real-time Betting Lines**: Live odds from multiple sportsbooks via The Odds API
- **Advanced Metrics**: Consistency scores, volatility analysis, trend detection, momentum indicators
- **AI-Powered Analysis**: GPT-4 powered insights with structured edge analysis
- **Matchup Intelligence**: Opponent defensive rankings, pace analysis, positional matchups
- **Risk Assessment**: Automated risk scoring (0-100) with multi-factor analysis

### 📊 Visualizations & UI
- **Performance Charts**: Interactive line chart with hit/miss indicators and trend visualization
- **Comparison View**: Side-by-side player analysis for up to multiple players
- **Advanced Metrics Dashboard**: Consistency, volatility, trend direction, recent form
- **Loading Skeletons**: Professional loading states for better UX
- **Toast Notifications**: Real-time feedback for user actions
- **Error Boundaries**: Graceful error handling with recovery options

### 🔧 Professional Tools
- **Export Functionality**: Download analysis as Markdown, CSV, or JSON
- **Line Shopping**: Compare lines across all available sportsbooks
- **Quick Search**: Recent searches history and star player shortcuts
- **Advanced Filters**: Home/away splits, time periods, blowout exclusions
- **Mobile Responsive**: Optimized for all screen sizes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- The Odds API key (free tier: 500 requests/month)
- OpenAI API key (optional, for AI analysis)

### Installation

1. **Clone and install**
   ```bash
   cd player-prop-research
   npm install
   ```

2. **Set up environment variables**

   Create `.env.local` in the root directory:
   ```env
   # Supabase (Required)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # The Odds API (Required for betting lines)
   THE_ODDS_API_KEY=your_odds_api_key

   # OpenAI (Optional - for AI analysis)
   OPENAI_API_KEY=your_openai_api_key
   ```

3. **Set up Supabase database**

   Create a table in your Supabase project:
   ```sql
   CREATE TABLE player_performance (
     id BIGSERIAL PRIMARY KEY,
     player_name TEXT NOT NULL,
     team TEXT,
     game_date DATE NOT NULL,
     opponent TEXT NOT NULL,
     is_home BOOLEAN DEFAULT false,
     minutes_played INTEGER DEFAULT 0,
     points INTEGER DEFAULT 0,
     rebounds INTEGER DEFAULT 0,
     assists INTEGER DEFAULT 0,
     usage_rate DECIMAL DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );

   CREATE INDEX idx_player_name ON player_performance(player_name);
   CREATE INDEX idx_game_date ON player_performance(game_date DESC);
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Basic Search
1. Enter player name (e.g., "LeBron James") or use quick search chips
2. Select prop type (Points, Rebounds, or Assists)
3. Click "Analyze Performance"
4. View comprehensive analytics, charts, and AI analysis

### Advanced Features

#### Player Comparison
1. Search for a player
2. Click "Add to Comparison" button below the dashboard
3. Search for another player and add to comparison
4. Click "Compare" view toggle in header
5. View side-by-side metrics table and cards

#### Export Analysis
1. Complete a player search
2. Click the "Export" button in the top right
3. Choose format:
   - **Markdown Report**: Full formatted analysis with all metrics
   - **CSV Stats**: Game-by-game data for Excel/Sheets
   - **JSON Data**: Raw data for custom analysis tools

#### Advanced Filters
1. Click "Show Advanced Filters" in search panel
2. Configure:
   - Minimum games threshold
   - Time period (last 10/20 games, season, 30 days)
   - Home games only toggle
   - Exclude blowouts checkbox

#### Understanding the Metrics

**Consistency Score (0-100%)**
- 80-100%: Highly reliable, low variance ✅
- 60-79%: Moderate reliability ⚠️
- 0-59%: High volatility, risky ❌

**Trend Direction**
- ↗ Trending Up: Recent games > previous average
- → Stable: Consistent performance
- ↘ Trending Down: Recent decline

**Risk Score (0-100)**
- **Low** (0-39): Favorable conditions
- **Medium** (40-69): Standard risk
- **High** (70-100): Multiple risk factors

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4o
- **APIs**: NBA Stats API, The Odds API

### Project Structure
```
player-prop-research/
├── app/
│   ├── actions/
│   │   ├── research.ts       # Main analysis engine
│   │   ├── nba-stats.ts      # NBA data fetching
│   │   └── matchup-data.ts   # Matchup intelligence
│   ├── page.tsx              # Main UI with state management
│   ├── layout.tsx            # Root layout with providers
│   └── globals.css           # Global styles & animations
├── components/
│   ├── AnalysisDashboard.tsx # Main dashboard view
│   ├── PlayerComparison.tsx  # Comparison interface
│   ├── PerformanceChart.tsx  # Interactive chart
│   ├── PlayerSearch.tsx      # Enhanced search UI
│   ├── ExportButton.tsx      # Export dropdown
│   ├── LoadingSkeleton.tsx   # Loading states
│   ├── Toast.tsx             # Notification system
│   └── ErrorBoundary.tsx     # Error handling
└── public/                   # Static assets
```

### Key Components

**Research Engine** (`research.ts`)
- Player stats from Supabase + NBA API
- Live odds from The Odds API
- Advanced metrics calculation
- AI prompt engineering
- Risk assessment algorithm

**Matchup Intelligence** (`matchup-data.ts`)
- Opponent defensive rankings from NBA Stats API
- Team pace analysis
- Defense vs position data
- Contextual interpretation

**Performance Chart** (`PerformanceChart.tsx`)
- SVG-based line chart
- Hit/miss visual indicators
- Average and target line overlays
- Responsive scaling

## 📊 Advanced Metrics Explained

### Consistency Score
Measures performance reliability using standard deviation:
```
consistency = max(0, 100 - (stdDev / average * 100))
```
- Accounts for variance relative to output level
- Higher scores = more predictable

### Volatility
Standard deviation as percentage of average:
```
volatility = (stdDev / average) * 100
```
- Lower = steadier performance
- Higher = boom-or-bust potential

### Risk Score Algorithm
Multi-factor scoring (0-100):
1. **Consistency**: +3 points if <60%, +1 if <75%
2. **Hit Rate**: +3 if <40%, -1 if >70%
3. **Recent Form**: +2 if cold, -1 if hot
4. **Sample Size**: +2 if <5 games
5. **Matchup**: +2 if elite defense (top 10)

Normalized to 0-100 scale with risk levels.

## 🔑 API Keys & Limits

### The Odds API
- **Free Tier**: 500 requests/month
- **Pro**: $99/month for 10,000 requests
- **Sign up**: [theoddsapi.com](https://the-odds-api.com)
- **Note**: Each search uses 1-30 requests depending on games

### OpenAI API
- **Model**: GPT-4o
- **Cost**: ~$0.01-0.03 per analysis
- **Sign up**: [platform.openai.com](https://platform.openai.com)
- **Optional**: App works without it (shows manual stats)

### NBA Stats API
- **Limit**: Unofficial API, use responsibly
- **Cost**: Free
- **Headers Required**: User-Agent, Referer, Origin
- **Rate Limiting**: Built-in delays (1s between requests)

## 🚀 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

**Configure in Vercel Dashboard:**
1. Add all environment variables
2. Set Node.js version to 18+
3. Enable edge functions if needed

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

```bash
docker build -t player-prop-research .
docker run -p 3000:3000 --env-file .env.local player-prop-research
```

## 🛠️ Development

### Available Scripts
```bash
npm run dev        # Development server with Turbopack
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint check
npm run type-check # TypeScript validation
```

### Code Style
- ESLint + Prettier
- TypeScript strict mode
- Tailwind CSS utility-first
- Server Actions for data fetching

## 📱 Mobile Optimization

- Responsive grid layouts (1/2/3/4 columns)
- Touch-friendly buttons (min 44x44px)
- Optimized charts for small screens
- Hamburger menu patterns
- Reduced data on mobile

## 🐛 Troubleshooting

### "No data available for player"
✅ Solutions:
- Check spelling (case-insensitive)
- Use full name: "LeBron James" not "Lebron"
- Ensure player active in current season
- Check Supabase connection

### "No betting lines available"
✅ Solutions:
- Check closer to game time (lines post ~24h before)
- Verify THE_ODDS_API_KEY is set
- Check API quota (500/month free tier)
- Try different player

### Slow Performance
✅ Solutions:
- Check API rate limits
- Clear localStorage (`localStorage.clear()` in console)
- Reduce games analyzed in filters
- Check network throttling

### Build Errors
✅ Solutions:
```bash
rm -rf .next node_modules
npm install
npm run build
```

## 🤝 Contributing

Contributions welcome! Guidelines:
1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Setup
```bash
git clone <your-fork>
cd player-prop-research
npm install
cp .env.local.template .env.local
# Add your API keys
npm run dev
```

## 📝 License

MIT License - see LICENSE file for details

## ⚠️ Disclaimer

**This tool is for research and educational purposes only.**

- Sports betting involves financial risk
- Past performance doesn't guarantee future results
- Always gamble responsibly and within your means
- Consult local laws regarding sports betting
- The creators are not responsible for betting losses

## 🎯 Roadmap

- [ ] MLB player props
- [ ] NFL player props
- [ ] Live in-game analysis
- [ ] Bet tracking/journal
- [ ] Historical edge tracking
- [ ] Telegram/Discord alerts
- [ ] Custom alerts for line movements

## 📧 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/player-prop-research/issues)
- **Documentation**: This README + inline code comments
- **API Docs**: Links to NBA Stats API, The Odds API, OpenAI API

---

**Built with ❤️ for sharp bettors and data enthusiasts**

*Last Updated: January 2026*

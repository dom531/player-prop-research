'use client'

import React from 'react'
import { Search, Plus, X, Filter } from 'lucide-react'

interface PlayerSearchProps {
  onSearch: (playerName: string, propType: string) => void
  isLoading?: boolean
  recentSearches?: Array<{ name: string; propType: string }>
}

export default function PlayerSearch({ onSearch, isLoading, recentSearches = [] }: PlayerSearchProps) {
  const [playerName, setPlayerName] = React.useState('')
  const [propType, setPropType] = React.useState('points')
  const [showFilters, setShowFilters] = React.useState(false)

  // Autocomplete state
  const [allPlayers, setAllPlayers] = React.useState<Array<{id: string, name: string, team: string}>>([])
  const [filteredPlayers, setFilteredPlayers] = React.useState<Array<{id: string, name: string, team: string}>>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1)
  const [recentSearchesList, setRecentSearchesList] = React.useState<Array<{ name: string; propType: string }>>([])

  // Load recent searches on mount
  React.useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearchesList(recent.slice(0, 6)) // Limit to 6
  }, [])

  // Load player list on mount for autocomplete
  React.useEffect(() => {
    async function loadPlayers() {
      try {
        const { getPlayerList } = await import('../app/actions/player-cache')
        const players = await getPlayerList()
        setAllPlayers(players)
      } catch (error) {
        console.error('Failed to load player list:', error)
      }
    }
    loadPlayers()
  }, [])

  // Filter players as user types
  React.useEffect(() => {
    if (playerName.length >= 2) {
      const query = playerName.toLowerCase()
      const scored = allPlayers
        .map((player) => {
          const name = player.name.toLowerCase()
          const tokens = name.split(' ')
          let score = -1

          if (name.startsWith(query)) score = 300
          else if (tokens.some((token) => token.startsWith(query))) score = 200
          else if (name.includes(query)) score = 100

          return { player, score }
        })
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.player.name.localeCompare(b.player.name))
      setFilteredPlayers(scored.slice(0, 12).map((entry) => entry.player))
      setHighlightedIndex(-1)
    } else {
      setFilteredPlayers([])
      setHighlightedIndex(-1)
    }
  }, [playerName, allPlayers])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (playerName.trim()) {
      setShowSuggestions(false)
      onSearch(playerName.trim(), propType)

      // Save to recent searches and update state
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      const newSearch = { name: playerName.trim(), propType, date: new Date().toISOString() }
      const updated = [newSearch, ...recent.filter((s: any) => s.name !== playerName.trim())].slice(0, 6)
      localStorage.setItem('recentSearches', JSON.stringify(updated))
      setRecentSearchesList(updated) // Update state immediately
    }
  }

  // Default popular players if no recent searches
  const defaultPlayers = [
    'LeBron James',
    'Stephen Curry',
    'Giannis Antetokounmpo',
    'Luka Doncic',
    'Kevin Durant',
    'Nikola Jokic'
  ]

  const quickSearchPlayers = recentSearchesList.length > 0
    ? recentSearchesList.map(s => s.name).slice(0, 6)
    : defaultPlayers

  return (
    <div className="glass-card p-6 space-y-6">
      {/* Main Search Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Player Name Input with Autocomplete */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-dim z-10" />
            <input
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value)
                setShowSuggestions(true)
                setHighlightedIndex(-1)
              }}
              onKeyDown={(e) => {
                if (!showSuggestions || filteredPlayers.length === 0) return

                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setHighlightedIndex((prev) => (prev + 1) % filteredPlayers.length)
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setHighlightedIndex((prev) =>
                    prev <= 0 ? filteredPlayers.length - 1 : prev - 1
                  )
                } else if (e.key === 'Enter') {
                  if (highlightedIndex >= 0 && filteredPlayers[highlightedIndex]) {
                    e.preventDefault()
                    const selected = filteredPlayers[highlightedIndex]
                    setPlayerName(selected.name)
                    setShowSuggestions(false)
                  }
                } else if (e.key === 'Escape') {
                  setShowSuggestions(false)
                  setHighlightedIndex(-1)
                }
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Enter player name..."
              className="glass-input w-full pl-12"
              disabled={isLoading}
              autoComplete="off"
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && filteredPlayers.length > 0 && playerName.length >= 2 && (
              <div className="absolute z-50 w-full mt-1 bg-bg-card border-2 border-primary-dim max-h-72 overflow-y-auto shadow-lg shadow-primary/20">
                {filteredPlayers.map(player => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      setPlayerName(player.name)
                      setShowSuggestions(false)
                      setHighlightedIndex(-1)
                    }}
                    className={`w-full px-4 py-3 text-left border-b border-primary-dim/30 transition-colors group ${
                      filteredPlayers[highlightedIndex]?.id === player.id
                        ? 'bg-bg-tertiary'
                        : 'hover:bg-bg-tertiary'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-text-primary font-mono group-hover:text-primary">
                        {player.name}
                      </span>
                      <span className="text-xs text-text-dim font-mono">
                        {player.team}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Prop Type Selector */}
          <div className="md:w-48">
            <select
              value={propType}
              onChange={(e) => setPropType(e.target.value)}
              className="glass-input w-full cursor-pointer"
              disabled={isLoading}
            >
              <option value="points">Points</option>
              <option value="rebounds">Rebounds</option>
              <option value="assists">Assists</option>
              <option value="pra">PRA (Pts+Reb+Ast)</option>
              <option value="pr">PR (Pts+Reb)</option>
              <option value="pa">PA (Pts+Ast)</option>
              <option value="ra">RA (Reb+Ast)</option>
            </select>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            disabled={isLoading || !playerName.trim()}
            className="premium-button flex items-center justify-center gap-2 min-w-[140px]"
          >
            {isLoading ? (
              <>
                <span className="terminal-spinner"></span>
                Analyzing
              </>
            ) : (
              <>
                Analyze
              </>
            )}
          </button>
        </div>

        {/* Advanced Filters Toggle */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 text-sm text-text-dim hover:text-primary transition-colors font-mono"
        >
          <Filter className="w-4 h-4" />
          [{showFilters ? 'HIDE' : 'SHOW'}] Advanced Filters
        </button>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-slate-300 mb-3">Advanced Options</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-2">Minimum Games</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  defaultValue="10"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Time Period</label>
                <select className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-emerald-400 cursor-pointer">
                  <option>Last 10 games</option>
                  <option>Last 20 games</option>
                  <option>Season</option>
                  <option>Last 30 days</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="homeOnly"
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
              />
              <label htmlFor="homeOnly" className="text-sm text-slate-300">
                Home games only
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="excludeBlowouts"
                className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-400"
              />
              <label htmlFor="excludeBlowouts" className="text-sm text-slate-300">
                Exclude blowouts (20+ point differential)
              </label>
            </div>
          </div>
        )}
      </form>

      {/* Quick Search Chips */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-text-dim mb-3 font-mono">
          [QUICK_SEARCH]
        </h4>
        <div className="flex flex-wrap gap-2">
          {quickSearchPlayers.map((player) => (
            <button
              key={player}
              onClick={() => {
                setPlayerName(player)
                onSearch(player, propType)
              }}
              disabled={isLoading}
              className="px-3 py-1.5 bg-bg-secondary hover:bg-bg-tertiary border border-primary-dim hover:border-primary text-text-secondary hover:text-primary text-sm transition-all disabled:opacity-50 font-mono"
            >
              {player}
            </button>
          ))}
        </div>
      </div>

    </div>
  )
}

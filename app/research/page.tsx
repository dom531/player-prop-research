'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { getPlayerResearch } from '../actions/research'
import type { ResearchResult } from '../actions/research'
import AnalysisDashboard from '@/components/AnalysisDashboard'
import PlayerSearch from '@/components/PlayerSearch'
import { DashboardSkeleton } from '@/components/LoadingSkeleton'
import { ErrorDisplay } from '@/components/ErrorBoundary'
import { useToast } from '@/components/Toast'
import HomepageNav from '@/components/HomepageNav'

export default function Home() {
  const searchParams = useSearchParams()
  const didAutoSearch = useRef(false)
  const [playerName, setPlayerName] = useState('')
  const [propType, setPropType] = useState('points')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ResearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentSearches, setRecentSearches] = useState<Array<{ name: string; propType: string }>>([])
  const { showToast} = useToast()

  // Load recent searches on mount
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
    setRecentSearches(recent)
  }, [])

  useEffect(() => {
    if (didAutoSearch.current) return

    const player = searchParams.get('player')
    const prop = searchParams.get('prop') || 'points'

    if (player) {
      didAutoSearch.current = true
      handleSearch(player, prop)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSearch = async (name: string, type: string) => {
    setPlayerName(name)
    setPropType(type)
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      showToast(`Analyzing ${name}...`, 'info', 3000)
      const analysis = await getPlayerResearch(name, type)
      setResult(analysis)

      // Check if player has active props
      if (analysis.hasActiveProp) {
        showToast(`✓ Found betting lines for ${name}`, 'success')
      } else {
        showToast(`No active props found for ${name}`, 'warning')
      }

      // Update recent searches
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]')
      setRecentSearches(recent)
    } catch (error) {
      console.error('Analysis failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze player'
      setError(errorMessage)
      showToast(`Error: ${errorMessage}`, 'error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <main className="min-h-screen">
      <HomepageNav />
      <div className="container mx-auto max-w-6xl p-6 md:p-12">

        {/* Terminal Header */}
        <div className="mb-12 border-b-2 border-primary-dim pb-6">
          <pre className="text-primary text-xs mb-4 opacity-60 hidden md:block" style={{ lineHeight: '1.2' }}>
{`██████╗  █████╗  ██████╗ ██████╗ █████╗ ██████╗  █████╗ ████████╗    ██████╗  ██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔════╝██╔════╝██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝    ██╔══██╗██╔═══██╗╚██╗ ██╔╝╚══███╔╝
██████╔╝███████║██║     ██║     ███████║██████╔╝███████║   ██║       ██████╔╝██║   ██║ ╚████╔╝   ███╔╝
██╔══██╗██╔══██║██║     ██║     ██╔══██║██╔══██╗██╔══██║   ██║       ██╔══██╗██║   ██║  ╚██╔╝   ███╔╝
██████╔╝██║  ██║╚██████╗╚██████╗██║  ██║██║  ██║██║  ██║   ██║       ██████╔╝╚██████╔╝   ██║   ███████╗
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝       ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝

████████╗███████╗██████╗ ███╗   ███╗██╗███╗   ██╗ █████╗ ██╗
╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██║████╗  ██║██╔══██╗██║
   ██║   █████╗  ██████╔╝██╔████╔██║██║██╔██╗ ██║███████║██║
   ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║██║╚██╗██║██╔══██║██║
   ██║   ███████╗██║  ██║██║ ╚═╝ ██║██║██║ ╚████║██║  ██║███████╗
   ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝╚══════╝`}
          </pre>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-mono">
                <span className="text-primary">$</span> <span className="text-text-secondary">AI-powered NBA prop analysis terminal v2.0</span>
              </p>
              <p className="text-xs text-text-dim mt-1 font-mono">
                [SYSTEM READY] Type player name to begin analysis...
              </p>
            </div>

          </div>
        </div>

        {/* Search Card */}
        <div className="mb-12">
          <PlayerSearch
            onSearch={handleSearch}
            isLoading={loading}
            recentSearches={recentSearches}
          />
        </div>

        {/* Loading State */}
        {loading && <DashboardSkeleton />}

        {/* Error State */}
        {error && !loading && (
          <ErrorDisplay
            message={error}
            onRetry={() => handleSearch(playerName, propType)}
          />
        )}

        {/* Results */}
        {!loading && !error && result && (
          <div className="fade-in space-y-6">
            <AnalysisDashboard data={result} playerName={playerName} />
          </div>
        )}
      </div>
    </main>
  )
}

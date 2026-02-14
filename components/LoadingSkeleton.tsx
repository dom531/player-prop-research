'use client'

import React from 'react'

const SILLY_LOADING_MESSAGES = [
  // Bribery & Espionage
  '> Bribing the refs for insider info...',
  '> Hacking into coach\'s clipboard...',
  '> Interrogating the mascot...',
  '> Bribing ball boy for intel...',
  '> Tapping the locker room phones...',

  // Supernatural/Mystical
  '> Asking Magic 8-Ball for confirmation...',
  '> Consulting the basketball gods...',
  '> Reading tea leaves and stat sheets...',
  '> Checking moon phase for optimal performance...',
  '> Sacrificing a basketball to the algorithm...',
  '> Summoning the ghost of Wilt Chamberlain...',

  // Personal Life Stalking
  '> Checking if player had breakfast...',
  '> Stalking player on Instagram...',
  '> Checking if player\'s mom is in attendance...',
  '> Analyzing pregame outfit choices...',
  '> Reviewing player\'s Spotify playlist...',
  '> Checking player\'s Uber rating...',
  '> Investigating player\'s sleep schedule...',

  // Pseudoscience
  '> Analyzing sweat patterns...',
  '> Counting how many times player ties shoes...',
  '> Measuring arena temperature and humidity...',
  '> Calculating planetary alignments...',
  '> Testing arena floor bounce coefficient...',
  '> Analyzing referee\'s zodiac sign...',

  // Over-the-Top Analysis
  '> Decoding coach\'s hand signals...',
  '> Studying film from player\'s high school days...',
  '> Cross-referencing with ancient prophecies...',
  '> Running player through AI lie detector...',
  '> Checking if sneakers are tied correctly...',
  '> Measuring player\'s lucky sock effectiveness...',

  // Absurd
  '> Asking ChatGPT to predict the future...',
  '> Checking if Mercury is in retrograde...',
  '> Consulting my grandma\'s gut feeling...',
  '> Rolling dice for good measure...',
  '> Flipping a coin (heads = over, tails = under)...',
  '> Checking if player wore lucky underwear...',

  // Gambling Culture
  '> Confirming Vegas doesn\'t know about this...',
  '> Making sure oddsmakers aren\'t watching...',
  '> Checking if bookies left the back door open...',
  '> Verifying this isn\'t a trap game...',

  // Self-Aware/Meta
  '> Pretending to work while algorithms do the job...',
  '> Running calculations that probably don\'t matter...',
  '> Making this loading screen feel important...',
  '> Stalling for dramatic effect...',
  '> Adding unnecessary loading time for suspense...'
]

export function DashboardSkeleton() {
  // Pick 5 random messages
  const getRandomMessages = () => {
    const shuffled = [...SILLY_LOADING_MESSAGES].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5)
  }

  const [messages] = React.useState(getRandomMessages())

  return (
    <div className="w-full space-y-6">
      <div className="glass-card p-8">
        <pre className="text-primary text-sm font-mono">
{`
${messages.map(msg => msg + '\n').join('')}
[`}<span className="terminal-spinner"></span>{`] PROCESSING...
`}
        </pre>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SearchSkeleton() {
  return (
    <div className="glass-card p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 h-12 bg-slate-700 rounded-lg" />
          <div className="w-48 h-12 bg-slate-700 rounded-lg" />
          <div className="w-32 h-12 bg-slate-700 rounded-lg" />
        </div>
        <div className="h-8 bg-slate-700 rounded w-48" />
      </div>
    </div>
  )
}

export function ComparisonSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-8 bg-slate-700 rounded w-48" />
        <div className="h-6 bg-slate-700 rounded w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6">
            <div className="h-6 bg-slate-700 rounded w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-16 bg-slate-800/50 rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

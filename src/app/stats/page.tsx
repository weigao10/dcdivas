'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { computeStats } from '@/lib/stats'
import StatsCharts from '@/components/StatsCharts'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { Game, Player, Play } from '@/lib/types'

export default function StatsPage() {
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [plays, setPlays] = useState<Play[]>([])
  const [gameFilter, setGameFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const load = useCallback(async () => {
    const [{ data: g }, { data: pl }, { data: py }] = await Promise.all([
      supabase.from('games').select('*').order('date', { ascending: false }),
      supabase.from('players').select('*').order('number', { ascending: true, nullsFirst: false }),
      supabase.from('plays').select('*'),
    ])
    setGames(g ?? [])
    setPlayers(pl ?? [])
    setPlays(py ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  const filteredPlays = useMemo(
    () => (gameFilter === 'all' ? plays : plays.filter(p => p.game_id === gameFilter)),
    [plays, gameFilter]
  )

  const stats = useMemo(() => computeStats(filteredPlays, players), [filteredPlays, players])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="space-y-1">
          <Label className="text-xs text-slate-500">Filter by Game</Label>
          <Select value={gameFilter} onValueChange={v => setGameFilter(v ?? 'all')}>
            <SelectTrigger className="w-56">
              <span>
                {gameFilter === 'all'
                  ? 'All Games'
                  : (games.find(g => g.id === gameFilter)?.name ?? 'Select...')}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              {games.map(g => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!loading && (
          <p className="text-sm text-slate-500 mt-5">
            {filteredPlays.length} plays · {stats.length} players with targets
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : (
        <StatsCharts stats={stats} />
      )}
    </div>
  )
}

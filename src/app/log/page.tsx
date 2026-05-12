'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PlayForm from '@/components/PlayForm'
import PlayList from '@/components/PlayList'
import NewGameDialog from '@/components/NewGameDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import type { Game, Player, Play } from '@/lib/types'

export default function LogPage() {
  const supabase = useMemo(() => createClient(), [])
  const [games, setGames] = useState<Game[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [plays, setPlays] = useState<Play[]>([])
  const [selectedGameId, setSelectedGameId] = useState<string>('')
  const [possessionNumber, setPossessionNumber] = useState(1)
  const [playNumber, setPlayNumber] = useState(1)
  const [latestPlayId, setLatestPlayId] = useState<string | null>(null)
  const [editingPlay, setEditingPlay] = useState<Play | null>(null)
  const [showNewGame, setShowNewGame] = useState(false)
  const [confirmDeleteGame, setConfirmDeleteGame] = useState(false)
  const [loading, setLoading] = useState(true)

  // Stores the counter position before entering edit mode so we can restore it on cancel.
  const priorPosition = useRef<{ possession: number; play: number } | null>(null)

  const loadPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('number', { ascending: true, nullsFirst: false })
    setPlayers(data ?? [])
  }, [supabase])

  const loadGames = useCallback(async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('date', { ascending: false })
    return data ?? []
  }, [supabase])

  const loadPlays = useCallback(async (gameId: string) => {
    if (!gameId) { setPlays([]); return [] }
    const { data } = await supabase
      .from('plays')
      .select('*')
      .eq('game_id', gameId)
      .order('possession_number', { ascending: true })
      .order('play_number', { ascending: true, nullsFirst: false })
    setPlays(data ?? [])
    return data ?? []
  }, [supabase])

  const syncPosition = useCallback((plays: Play[]) => {
    if (plays.length === 0) {
      setPossessionNumber(1)
      setPlayNumber(1)
    } else {
      const last = plays[plays.length - 1]
      setPossessionNumber(last.possession_number)
      setPlayNumber((last.play_number ?? 0) + 1)
    }
  }, [])

  useEffect(() => {
    async function init() {
      const [fetchedGames] = await Promise.all([loadGames(), loadPlayers()])
      setGames(fetchedGames)
      if (fetchedGames.length > 0) {
        const firstGameId = fetchedGames[0].id
        setSelectedGameId(firstGameId)
        const fetchedPlays = await loadPlays(firstGameId)
        syncPosition(fetchedPlays)
      }
      setLoading(false)
    }
    init()
  }, [loadGames, loadPlayers, loadPlays, syncPosition])

  function exitEditMode() {
    setEditingPlay(null)
    if (priorPosition.current) {
      setPossessionNumber(priorPosition.current.possession)
      setPlayNumber(priorPosition.current.play)
      priorPosition.current = null
    }
  }

  async function handleGameChange(gameId: string) {
    setSelectedGameId(gameId)
    setLatestPlayId(null)
    exitEditMode()
    const fetchedPlays = await loadPlays(gameId)
    syncPosition(fetchedPlays)
  }

  async function handlePlaySaved(playId: string) {
    await loadPlays(selectedGameId)
    setLatestPlayId(playId)
    if (editingPlay) {
      exitEditMode()
    } else {
      setPlayNumber(n => n + 1)
    }
  }

  function handleEditPlay(play: Play) {
    if (editingPlay?.id === play.id) {
      exitEditMode()
      return
    }
    priorPosition.current = { possession: possessionNumber, play: playNumber }
    setEditingPlay(play)
    setPossessionNumber(play.possession_number)
    setPlayNumber(play.play_number ?? 1)
    setLatestPlayId(null)
  }

  function handleNewPossession() {
    exitEditMode()
    setPossessionNumber(n => n + 1)
    setPlayNumber(1)
  }

  function handleGameCreated(game: Game) {
    setGames(prev => [game, ...prev])
    setSelectedGameId(game.id)
    setPlays([])
    setPossessionNumber(1)
    setPlayNumber(1)
    setLatestPlayId(null)
    exitEditMode()
  }

  async function handleDeleteGame() {
    if (!selectedGameId) return
    const { error } = await supabase.from('games').delete().eq('id', selectedGameId)
    setConfirmDeleteGame(false)
    if (error) {
      toast.error('Failed to delete game')
    } else {
      toast.success(`${selectedGame?.name ?? 'Game'} deleted`)
      const remaining = games.filter(g => g.id !== selectedGameId)
      setGames(remaining)
      if (remaining.length > 0) {
        await handleGameChange(remaining[0].id)
      } else {
        setSelectedGameId('')
        setPlays([])
        setPossessionNumber(1)
        setPlayNumber(1)
      }
    }
  }

  const selectedGame = useMemo(
    () => games.find(g => g.id === selectedGameId),
    [games, selectedGameId]
  )

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Select value={selectedGameId} onValueChange={v => handleGameChange(v ?? '')}>
                <SelectTrigger className="flex-1">
                  <span className={selectedGame ? '' : 'text-muted-foreground'}>
                    {selectedGame?.name ?? 'Select a game...'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {games.map(g => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setShowNewGame(true)}>
                + New Game
              </Button>
              {selectedGameId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDeleteGame(true)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  Delete
                </Button>
              )}
            </div>

            {selectedGameId && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-500">Possession</span>
                <input
                  type="number"
                  value={possessionNumber}
                  min={1}
                  onChange={e => { exitEditMode(); setPossessionNumber(Math.max(1, parseInt(e.target.value) || 1)) }}
                  className="w-10 text-center font-bold border rounded px-1 py-0.5 focus:outline-none focus:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ borderColor: '#5A1414', color: '#5A1414' }}
                />
                <span className="text-slate-500">· Play</span>
                <input
                  type="number"
                  value={playNumber}
                  min={1}
                  onChange={e => { exitEditMode(); setPlayNumber(Math.max(1, parseInt(e.target.value) || 1)) }}
                  className="w-10 text-center font-bold border rounded px-1 py-0.5 focus:outline-none focus:ring-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ borderColor: '#5A1414', color: '#5A1414' }}
                />
                <Button variant="outline" size="sm" onClick={handleNewPossession}>
                  New Possession →
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-slate-400">Loading...</p>
      ) : !selectedGameId ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Create or select a game above to start logging plays.
        </p>
      ) : players.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Add players to your roster before logging plays.
        </p>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500 font-medium">
              {editingPlay
                ? `Editing — Possession ${editingPlay.possession_number} · Play ${editingPlay.play_number ?? '?'}`
                : `New Play — Possession ${possessionNumber} · Play ${playNumber}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PlayForm
              gameId={selectedGameId}
              players={players}
              possessionNumber={possessionNumber}
              playNumber={playNumber}
              editingPlay={editingPlay}
              onSaved={handlePlaySaved}
              onCancel={exitEditMode}
            />
          </CardContent>
        </Card>
      )}

      {selectedGameId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>{selectedGame?.name ?? 'Play Log'}</span>
              <span className="text-xs font-normal text-slate-400">
                {plays.length} {plays.length === 1 ? 'play' : 'plays'} · click a row to edit
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PlayList
              plays={plays}
              players={players}
              latestPlayId={latestPlayId}
              editingPlayId={editingPlay?.id ?? null}
              onEditPlay={handleEditPlay}
            />
          </CardContent>
        </Card>
      )}

      <NewGameDialog
        open={showNewGame}
        onClose={() => setShowNewGame(false)}
        onCreated={handleGameCreated}
      />

      <AlertDialog open={confirmDeleteGame} onOpenChange={setConfirmDeleteGame}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedGame?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the game and all {plays.length} play
              {plays.length !== 1 ? 's' : ''} logged for it. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGame}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete Game
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

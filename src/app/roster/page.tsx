'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import PlayerForm from '@/components/PlayerForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
import type { Player } from '@/lib/types'

export default function RosterPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null)
  const supabase = useMemo(() => createClient(), [])

  const loadPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('players')
      .select('*')
      .order('position')
      .order('number', { ascending: true, nullsFirst: false })
    setPlayers(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { loadPlayers() }, [loadPlayers])

  async function handleDeletePlayer() {
    if (!deletingPlayer) return
    const { error } = await supabase.from('players').delete().eq('id', deletingPlayer.id)
    if (error) {
      toast.error('Failed to remove player')
    } else {
      toast.success(`${deletingPlayer.name} removed from roster`)
      setPlayers(prev => prev.filter(p => p.id !== deletingPlayer.id))
    }
    setDeletingPlayer(null)
  }

  const byPosition = players.reduce<Record<string, Player[]>>((acc, p) => {
    acc[p.position] = acc[p.position] ?? []
    acc[p.position].push(p)
    return acc
  }, {})

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1">
        <PlayerForm onSaved={loadPlayers} />
      </div>
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Roster</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-400">Loading...</p>
            ) : players.length === 0 ? (
              <p className="text-sm text-slate-400">No players added yet.</p>
            ) : (
              <div className="flex flex-col gap-6">
                {Object.entries(byPosition).map(([pos, group]) => (
                  <div key={pos}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{pos}</Badge>
                      <Separator className="flex-1" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.map(p => (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-white group"
                        >
                          <span className="text-lg font-bold text-slate-300 w-8 text-center">
                            {p.number ?? '—'}
                          </span>
                          <span className="font-medium flex-1">{p.name}</span>
                          <button
                            onClick={() => setDeletingPlayer(p)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500 text-lg leading-none px-1"
                            title="Remove player"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deletingPlayer} onOpenChange={open => !open && setDeletingPlayer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deletingPlayer?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {deletingPlayer?.name} from the roster. Any plays they were targeted
              in will remain but will no longer show their name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlayer}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

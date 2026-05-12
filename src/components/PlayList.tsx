'use client'

import { useMemo } from 'react'
import { playerLabel } from '@/lib/utils'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Play, Player, PlayResult } from '@/lib/types'

interface Props {
  plays: Play[]
  players: Player[]
  latestPlayId: string | null
  editingPlayId: string | null
  onEditPlay: (play: Play) => void
}

const RESULT_COLOR: Record<PlayResult, string> = {
  completion: 'bg-green-100 text-green-800',
  drop: 'bg-red-100 text-red-800',
  incompletion: 'bg-yellow-100 text-yellow-800',
  turnover: 'bg-orange-100 text-orange-800',
}

function rowClass(isEditing: boolean, isNew: boolean) {
  if (isEditing) return 'bg-blue-50 border-l-2 border-l-blue-400'
  if (isNew) return 'play-highlight'
  return 'hover:bg-slate-50'
}

export default function PlayList({ plays, players, latestPlayId, editingPlayId, onEditPlay }: Props) {
  const playerMap = Object.fromEntries(players.map(p => [p.id, p]))
  const reversed = useMemo(() => [...plays].reverse(), [plays])

  if (plays.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-6 text-center">
        No plays logged yet — log the first play above.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pos</TableHead>
          <TableHead>Play</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Targeted</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Yds</TableHead>
          <TableHead>YAC</TableHead>
          <TableHead>On Line</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reversed.map(play => {
          const targeted = play.wr_targeted ? playerMap[play.wr_targeted] : null
          const isEditing = play.id === editingPlayId
          const isNew = play.id === latestPlayId && !isEditing

          return (
            <TableRow
              key={play.id}
              onClick={() => onEditPlay(play)}
              className={`cursor-pointer ${rowClass(isEditing, isNew)}`}
            >
              <TableCell className="font-medium">{play.possession_number}</TableCell>
              <TableCell className="text-slate-500">{play.play_number ?? '—'}</TableCell>
              <TableCell>
                <span className={`capitalize font-medium ${play.play_type === 'pass' ? 'text-red-900' : 'text-yellow-700'}`}>
                  {play.play_type}
                </span>
              </TableCell>
              <TableCell>{targeted ? playerLabel(targeted) : '—'}</TableCell>
              <TableCell>
                {play.result ? (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${RESULT_COLOR[play.result]}`}>
                    {play.result}
                  </span>
                ) : '—'}
              </TableCell>
              <TableCell>{play.yards_gained ?? '—'}</TableCell>
              <TableCell>{play.yards_after_catch ?? '—'}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {play.receivers_on_line.map(id =>
                    playerMap[id] ? (
                      <span key={id} className="inline-flex items-center px-1.5 py-0.5 rounded border text-xs">
                        {playerLabel(playerMap[id])}
                      </span>
                    ) : null
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { playerLabel } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import type { Player, Play, PlayType, PlayResult } from '@/lib/types'

interface Props {
  gameId: string
  players: Player[]
  possessionNumber: number
  playNumber: number
  editingPlay: Play | null
  onSaved: (playId: string) => void
  onCancel: () => void
}

const defaultState = {
  playType: 'pass' as PlayType,
  receiversOnLine: [] as string[],
  wrTargeted: '',
  result: '' as PlayResult | '',
  yardsGained: '',
  yardsAfterCatch: '',
  notes: '',
}

export default function PlayForm({
  gameId, players, possessionNumber, playNumber, editingPlay, onSaved, onCancel,
}: Props) {
  const [form, setForm] = useState(defaultState)
  const [saving, setSaving] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (editingPlay) {
      setForm({
        playType: editingPlay.play_type,
        receiversOnLine: editingPlay.receivers_on_line,
        wrTargeted: editingPlay.wr_targeted ?? '',
        result: editingPlay.result ?? '',
        yardsGained: editingPlay.yards_gained?.toString() ?? '',
        yardsAfterCatch: editingPlay.yards_after_catch?.toString() ?? '',
        notes: editingPlay.notes ?? '',
      })
    } else {
      setForm(defaultState)
    }
  }, [editingPlay])

  function toggleReceiver(id: string) {
    setForm(f => {
      const removing = f.receiversOnLine.includes(id)
      return {
        ...f,
        receiversOnLine: removing
          ? f.receiversOnLine.filter(r => r !== id)
          : [...f.receiversOnLine, id],
        wrTargeted: removing && f.wrTargeted === id ? '' : f.wrTargeted,
      }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gameId) { toast.error('Select a game first'); return }
    setSaving(true)

    const isPass = form.playType === 'pass'
    const payload = {
      game_id: gameId,
      possession_number: possessionNumber,
      play_number: playNumber,
      play_type: form.playType,
      receivers_on_line: form.receiversOnLine,
      wr_targeted: isPass && form.wrTargeted ? form.wrTargeted : null,
      result: isPass && form.result ? form.result : null,
      yards_gained: form.yardsGained ? parseInt(form.yardsGained) : null,
      yards_after_catch: isPass && form.yardsAfterCatch ? parseInt(form.yardsAfterCatch) : null,
      notes: form.notes.trim() || null,
    }

    if (editingPlay) {
      const { error } = await supabase.from('plays').update(payload).eq('id', editingPlay.id)
      setSaving(false)
      if (error) {
        toast.error('Failed to update play')
      } else {
        toast.success('Play updated')
        onSaved(editingPlay.id)
      }
    } else {
      const { data, error } = await supabase.from('plays').insert(payload).select('id').single()
      setSaving(false)
      if (error || !data) {
        toast.error('Failed to save play')
      } else {
        toast.success(`Pos ${possessionNumber} · Play ${playNumber} logged`)
        setForm(f => ({ ...defaultState, playType: f.playType }))
        onSaved(data.id)
      }
    }
  }

  const isPass = form.playType === 'pass'
  const targetedPlayer = players.find(p => p.id === form.wrTargeted)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {(['pass', 'run'] as PlayType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setForm(f => ({ ...f, playType: t, result: '', wrTargeted: '', yardsAfterCatch: '' }))}
            style={form.playType === t ? { backgroundColor: '#5A1414', borderColor: '#5A1414' } : undefined}
            className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors capitalize ${
              form.playType === t ? 'text-white' : 'border-slate-200 hover:border-stone-300 hover:bg-stone-50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-slate-500 uppercase tracking-wide">Receivers on Line</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {players.map(p => (
            <label key={p.id} className="flex items-center gap-1.5 cursor-pointer">
              <Checkbox
                checked={form.receiversOnLine.includes(p.id)}
                onCheckedChange={() => toggleReceiver(p.id)}
              />
              <span className="text-sm">{playerLabel(p)}</span>
            </label>
          ))}
        </div>
      </div>

      {isPass && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>WR Targeted</Label>
            <Select value={form.wrTargeted} onValueChange={v => setForm(f => ({ ...f, wrTargeted: v ?? '' }))}>
              <SelectTrigger>
                <span className={targetedPlayer ? '' : 'text-muted-foreground'}>
                  {targetedPlayer ? playerLabel(targetedPlayer) : 'Select WR...'}
                </span>
              </SelectTrigger>
              <SelectContent>
                {players.filter(p => form.receiversOnLine.includes(p.id)).map(p => (
                  <SelectItem key={p.id} value={p.id}>{playerLabel(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Result</Label>
            <Select
              value={form.result}
              onValueChange={v => setForm(f => ({ ...f, result: (v ?? '') as PlayResult }))}
            >
              <SelectTrigger>
                <span className={form.result ? '' : 'text-muted-foreground'}>
                  {form.result
                    ? form.result.charAt(0).toUpperCase() + form.result.slice(1)
                    : 'Select...'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completion">Completion</SelectItem>
                <SelectItem value="drop">Drop</SelectItem>
                <SelectItem value="incompletion">Incompletion</SelectItem>
                <SelectItem value="turnover">Turnover</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{isPass ? 'Yards Gained' : 'Rush Yards'}</Label>
          <Input
            type="number"
            value={form.yardsGained}
            onChange={e => setForm(f => ({ ...f, yardsGained: e.target.value }))}
            placeholder="0"
          />
        </div>
        {isPass && (
          <div className="space-y-1">
            <Label>Yards After Catch</Label>
            <Input
              type="number"
              value={form.yardsAfterCatch}
              onChange={e => setForm(f => ({ ...f, yardsAfterCatch: e.target.value }))}
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Input
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Optional..."
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={saving || !gameId} className="flex-1">
          {saving ? 'Saving...' : editingPlay ? 'Update Play' : 'Log Play'}
        </Button>
        {editingPlay && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

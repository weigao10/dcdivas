'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Game } from '@/lib/types'

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (game: Game) => void
}

export default function NewGameDialog({ open, onClose, onCreated }: Props) {
  const [opponent, setOpponent] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    const name = opponent.trim()
      ? `vs ${opponent.trim()} — ${formattedDate}`
      : formattedDate

    const { data, error } = await supabase
      .from('games')
      .insert({ name, date, opponent: opponent.trim() || null })
      .select()
      .single()

    setSaving(false)
    if (error || !data) {
      toast.error('Failed to create game')
    } else {
      toast.success(`${name} created`)
      setOpponent('')
      onCreated(data)
      onClose()
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Game / Session</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="space-y-1">
            <Label>Opponent</Label>
            <Input
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              placeholder="Eagles, Practice, Film Review..."
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

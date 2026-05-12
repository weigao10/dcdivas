'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { Position } from '@/lib/types'

interface Props {
  onSaved: () => void
}

export default function PlayerForm({ onSaved }: Props) {
  const [name, setName] = useState('')
  const [number, setNumber] = useState('')
  const [position, setPosition] = useState<Position>('WR')
  const [saving, setSaving] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const { error } = await supabase.from('players').insert({
      name: name.trim(),
      number: number ? parseInt(number) : null,
      position,
    })
    setSaving(false)
    if (error) {
      toast.error('Failed to save player')
    } else {
      toast.success(`${name} added to roster`)
      setName('')
      setNumber('')
      setPosition('WR')
      onSaved()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Add Player</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Justin Jefferson"
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Jersey #</Label>
              <Input
                type="number"
                value={number}
                onChange={e => setNumber(e.target.value)}
                placeholder="18"
                min={0}
                max={99}
              />
            </div>
            <div className="space-y-1">
              <Label>Position</Label>
              <Select value={position} onValueChange={v => setPosition((v ?? 'WR') as Position)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WR">WR</SelectItem>
                  <SelectItem value="TE">TE</SelectItem>
                  <SelectItem value="RB">RB</SelectItem>
                  <SelectItem value="FB">FB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Saving...' : 'Add Player'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

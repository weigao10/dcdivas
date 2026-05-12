export type Position = 'WR' | 'TE' | 'RB' | 'FB'
export type PlayType = 'run' | 'pass'
export type PlayResult = 'completion' | 'drop' | 'incompletion' | 'turnover'

export interface Player {
  id: string
  name: string
  number: number | null
  position: Position
  created_at: string
}

export interface Game {
  id: string
  name: string
  date: string
  opponent: string | null
  created_at: string
}

export interface Play {
  id: string
  game_id: string
  possession_number: number
  play_number: number | null
  play_type: PlayType
  receivers_on_line: string[]
  wr_targeted: string | null
  result: PlayResult | null
  yards_gained: number | null
  yards_after_catch: number | null
  notes: string | null
  created_at: string
}

export interface PlayWithRelations extends Play {
  games: Game
  players: Player | null
}

export interface PlayerStats {
  player: Player
  playsOn: number
  targets: number
  completions: number
  drops: number
  incompletions: number
  turnovers: number
  totalYards: number
  totalYac: number
  catchPercent: number
  yardsPerTarget: number
  yardsPerCatch: number
}

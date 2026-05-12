import type { Play, Player, PlayerStats } from './types'

export function computeStats(plays: Play[], players: Player[]): PlayerStats[] {
  return players
    .map(player => {
      const playsOn = plays.filter(p => p.receivers_on_line.includes(player.id)).length
      const targeted = plays.filter(p => p.play_type === 'pass' && p.wr_targeted === player.id)
      const completions = targeted.filter(p => p.result === 'completion')
      const drops = targeted.filter(p => p.result === 'drop')
      const incompletions = targeted.filter(p => p.result === 'incompletion')
      const turnovers = targeted.filter(p => p.result === 'turnover')
      const yardsPlays = [...completions, ...turnovers]
      const totalYards = yardsPlays.reduce((s, p) => s + (p.yards_gained ?? 0), 0)
      const totalYac = completions.reduce((s, p) => s + (p.yards_after_catch ?? 0), 0)
      const targets = targeted.length
      const catches = completions.length + turnovers.length
      return {
        player,
        playsOn,
        targets,
        completions: completions.length,
        drops: drops.length,
        incompletions: incompletions.length,
        turnovers: turnovers.length,
        totalYards,
        totalYac,
        catchPercent: targets > 0 ? (catches / targets) * 100 : 0,
        yardsPerTarget: targets > 0 ? totalYards / targets : 0,
        yardsPerCatch: catches > 0 ? totalYards / catches : 0,
      }
    })
    .filter(s => s.targets > 0)
    .sort((a, b) => b.targets - a.targets)
}

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { playerLabel } from '@/lib/utils'
import type { PlayerStats } from '@/lib/types'

interface Props {
  stats: PlayerStats[]
}

const COLORS = ['#5A1414', '#FFB612', '#7a1c1c', '#d99a0a', '#9b2c2c', '#fbbf24']

export default function StatsCharts({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-slate-400 py-12 text-center">
        No play data yet. Log some plays to see stats.
      </p>
    )
  }

  const targetData = stats.map(s => ({
    name: playerLabel(s.player),
    Completions: s.completions,
    Turnovers: s.turnovers,
    Drops: s.drops,
    Incompletions: s.incompletions,
  }))

  const yardsData = stats.map(s => ({
    name: playerLabel(s.player),
    'Total Yards': s.totalYards,
    'Yards After Catch': s.totalYac,
  }))

  const efficiencyData = stats.map(s => ({
    name: playerLabel(s.player),
    'Catch %': parseFloat(s.catchPercent.toFixed(1)),
    'Yds/Target': parseFloat(s.yardsPerTarget.toFixed(1)),
    'Yds/Catch': parseFloat(s.yardsPerCatch.toFixed(1)),
  }))

  const radarData = [
    { metric: 'Targets', fullMark: Math.max(...stats.map(s => s.targets)) },
    { metric: 'Completions', fullMark: Math.max(...stats.map(s => s.completions)) },
    { metric: 'Total Yards', fullMark: Math.max(...stats.map(s => s.totalYards)) },
    { metric: 'YAC', fullMark: Math.max(...stats.map(s => s.totalYac)) },
    { metric: 'Catch %', fullMark: 100 },
  ].map(row => {
    const out: Record<string, number | string> = { metric: row.metric, fullMark: row.fullMark }
    stats.forEach(s => {
      const key = playerLabel(s.player)
      if (row.metric === 'Targets') out[key] = s.targets
      else if (row.metric === 'Completions') out[key] = s.completions
      else if (row.metric === 'Total Yards') out[key] = s.totalYards
      else if (row.metric === 'YAC') out[key] = s.totalYac
      else if (row.metric === 'Catch %') out[key] = parseFloat(s.catchPercent.toFixed(1))
    })
    return out
  })

  return (
    <div className="flex flex-col gap-8">
      {/* Target Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Target Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={targetData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Completions" fill="#5A1414" stackId="a" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Turnovers" fill="#f97316" stackId="a" />
              <Bar dataKey="Drops" fill="#ef4444" stackId="a" />
              <Bar dataKey="Incompletions" fill="#FFB612" stackId="a" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Yards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Receiving Yards</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={yardsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Total Yards" fill="#5A1414" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Yards After Catch" fill="#FFB612" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Efficiency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Efficiency Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={efficiencyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Catch %" fill="#5A1414" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Yds/Target" fill="#FFB612" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Yds/Catch" fill="#7a1c1c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Radar — only show if multiple players */}
      {stats.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Player Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                {stats.map((s, i) => (
                  <Radar
                    key={s.player.id}
                    name={playerLabel(s.player)}
                    dataKey={playerLabel(s.player)}
                    stroke={COLORS[i % COLORS.length]}
                    fill={COLORS[i % COLORS.length]}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-player stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <Card key={s.player.id} style={{ borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{playerLabel(s.player)}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs">Plays On</dt>
                  <dd className="font-semibold">{s.playsOn}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Targets</dt>
                  <dd className="font-semibold">{s.targets}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Catch %</dt>
                  <dd className="font-semibold">{s.catchPercent.toFixed(0)}%</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Completions</dt>
                  <dd className="font-semibold text-green-700">{s.completions}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Drops</dt>
                  <dd className="font-semibold text-red-600">{s.drops}</dd>
                </div>
                {s.turnovers > 0 && (
                  <div className="col-span-2">
                    <dt className="text-slate-500 text-xs">Turnovers</dt>
                    <dd className="font-semibold text-orange-600">{s.turnovers}</dd>
                  </div>
                )}
                <div className="col-span-2">
                  <dt className="text-slate-500 text-xs">Total Yards</dt>
                  <dd className="font-semibold">
                    {s.totalYards}
                    {s.totalYac > 0 && (
                      <span className="text-slate-400 font-normal text-xs ml-1">
                        ({s.totalYac} YAC)
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Yds/Target</dt>
                  <dd className="font-semibold">{s.yardsPerTarget.toFixed(1)}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs">Yds/Catch</dt>
                  <dd className="font-semibold">{s.yardsPerCatch.toFixed(1)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

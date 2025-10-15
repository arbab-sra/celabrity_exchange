'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

interface VolumeChartProps {
  data: Array<{ timestamp: number; volume: number }>
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl">
        <p className="text-gray-500">No volume data available</p>
      </div>
    )
  }

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5" />
        Trading Volume
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
          <XAxis dataKey="timestamp" tickFormatter={formatXAxis} stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} tokens`, 'Volume']}
            labelFormatter={(timestamp) => new Date(timestamp * 1000).toLocaleString()}
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff',
            }}
          />
          <Bar dataKey="volume" fill="#9333ea" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

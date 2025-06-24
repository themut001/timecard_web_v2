import React from 'react'
import { LiquidCard, CardHeader, CardContent } from '@/components/ui/LiquidCard'

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <LiquidCard>
        <CardHeader>
          <h1 className="text-2xl font-bold text-gradient-primary">設定</h1>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600">設定機能は実装中です。</p>
        </CardContent>
      </LiquidCard>
    </div>
  )
}
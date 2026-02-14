import { NextResponse } from 'next/server'
import { getInjuries } from '@/app/actions/injuries'

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getInjuries({ forceRefresh: true })

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      count: result.data.length,
      source: result.source,
      stale: result.stale,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

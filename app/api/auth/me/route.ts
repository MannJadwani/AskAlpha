// App Router example: app/api/auth/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const token = request.cookies.get('token')?.value

  if (!token) {
    console.log('No token found')
    return NextResponse.json({ user: null }, { status: 401 })
  }

  try {
    const user = await verifyToken(token)
    return NextResponse.json({ user })
  } catch (err) {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}

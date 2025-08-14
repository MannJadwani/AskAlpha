import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json(
    { success: true, message: 'Signed out successfully' }
  )

  // Remove the token cookie by setting it with maxAge: 0
  response.cookies.set('token', '', {
    httpOnly: true,
    secure: true,
    path: '/',
    maxAge: 0, // expires immediately
  })

  return response
}

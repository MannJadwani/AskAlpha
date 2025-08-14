// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  console.log('Token in middleware:', token)
  console.log('Visiting path:', request.nextUrl.pathname);

  // Allow public access to the homepage
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  if (!token) {
    console.log('No token found, redirecting to /sign-in')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  try {
    const extractedData = await verifyToken(token)
    console.log('Token verified ✅', extractedData)
    return NextResponse.next()
  } catch (error) {
    console.error('Invalid token ❌, redirecting to /sign-in')
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
}

export const config = {
  matcher: ['/company-report','/my-reports','/recommendation','/analytics','/pricing'],
}

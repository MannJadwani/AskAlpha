// lib/auth.ts
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

const secret = new TextEncoder().encode('your_jwt_secret')

// Sign a JWT
export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret)
}

// Verify a JWT
export async function verifyToken(token: string) {
  const { payload } = await jwtVerify(token, secret)
  return payload
}

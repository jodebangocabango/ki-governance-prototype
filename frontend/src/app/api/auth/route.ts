import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { code } = await request.json()
  const accessCode = process.env.ACCESS_CODE

  if (!accessCode) {
    // No access code configured — allow all access
    const res = NextResponse.json({ ok: true })
    res.cookies.set('access_granted', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    })
    return res
  }

  if (code === accessCode) {
    const res = NextResponse.json({ ok: true })
    res.cookies.set('access_granted', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    return res
  }

  return NextResponse.json({ ok: false, error: 'Invalid access code' }, { status: 401 })
}

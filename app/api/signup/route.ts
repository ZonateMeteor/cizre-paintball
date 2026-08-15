import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { usernameToEmail } from '@/lib/supabase/config'

export async function POST(req: Request) {
  const admin = getSupabaseAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Supabase yapılandırılmamış.' }, { status: 500 })
  }

  let body: { username?: string; password?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const username = (body.username ?? '').trim()
  const password = body.password ?? ''

  if (username.length < 3) {
    return NextResponse.json({ error: 'Kullanıcı adı en az 3 karakter olmalı.' }, { status: 400 })
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return NextResponse.json(
      { error: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.' },
      { status: 400 },
    )
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı.' }, { status: 400 })
  }

  // Kullanıcı adı benzersiz mi?
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Bu kullanıcı adı zaten alınmış.' }, { status: 409 })
  }

  // Kullanıcıyı oluştur (e-posta otomatik onaylı).
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: usernameToEmail(username),
    password,
    email_confirm: true,
    user_metadata: { username },
  })
  if (createErr || !created.user) {
    const msg = createErr?.message ?? 'Kayıt oluşturulamadı.'
    const conflict = /already|registered|exist/i.test(msg)
    return NextResponse.json(
      { error: conflict ? 'Bu kullanıcı adı zaten alınmış.' : msg },
      { status: conflict ? 409 : 400 },
    )
  }

  // Profili oluştur (RLS'i service_role atlar).
  const { error: profileErr } = await admin.from('profiles').insert({
    id: created.user.id,
    username,
    money: 800,
  })
  if (profileErr) {
    // Profil oluşmazsa auth kullanıcısını geri al.
    await admin.auth.admin.deleteUser(created.user.id)
    return NextResponse.json({ error: profileErr.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

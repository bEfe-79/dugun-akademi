// src/app/api/admin/users/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return false;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  const adminClient = getAdminClient();
  const { data: profile } = await adminClient
    .from("profiles").select("role").eq("id", user.id).maybeSingle();
  return profile?.role === "admin";
}

// GET - tum kullanicilari listele (auth.users email dahil)
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }
  const adminClient = getAdminClient();

  // Profiles + auth users'dan email cek
  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("*")
    .order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { users: authUsers } } = await adminClient.auth.admin.listUsers();
  const emailMap = Object.fromEntries(authUsers.map(u => [u.id, u.email]));

  const result = (profiles ?? []).map(p => ({ ...p, email: emailMap[p.id] ?? "" }));
  return NextResponse.json(result);
}

// POST - yeni kullanici olustur
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }
  const body = await request.json();
  const { email, password, first_name, last_name, role, monthly_target, phone, team_name } = body;

  if (!email || !password || !first_name) {
    return NextResponse.json({ error: "E-posta, şifre ve ad zorunludur" }, { status: 400 });
  }

  const full_name = `${first_name} ${last_name ?? ""}`.trim();
  const adminClient = getAdminClient();

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, first_name, last_name },
  });

  if (authError) {
    let msg = authError.message;
    if (msg.includes("already been registered") || msg.includes("already exists")) {
      msg = "Bu e-posta adresiyle zaten bir kullanıcı kayıtlı.";
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { error: profileError } = await adminClient.from("profiles").upsert({
    id: authData.user.id,
    full_name,
    first_name: first_name ?? "",
    last_name: last_name ?? "",
    role: role ?? "staff",
    monthly_target: monthly_target ?? 0,
    current_sales: 0,
    phone: phone ?? null,
    team_name: team_name ?? null,
  });

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  return NextResponse.json({ success: true, userId: authData.user.id }, { status: 201 });
}

// PATCH - kullanici guncelle
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }
  const body = await request.json();
  const { id, first_name, last_name, role, monthly_target, current_sales, password, phone, team_name, team_logo_url, avatar_url } = body;
  if (!id) return NextResponse.json({ error: "ID zorunludur" }, { status: 400 });

  const adminClient = getAdminClient();
  const updates: Record<string, unknown> = {};

  if (first_name !== undefined) { updates.first_name = first_name; updates.full_name = `${first_name} ${last_name ?? ""}`.trim(); }
  if (last_name !== undefined)  { updates.last_name = last_name; }
  if (role !== undefined)              updates.role = role;
  if (monthly_target !== undefined)    updates.monthly_target = monthly_target;
  if (current_sales !== undefined)     updates.current_sales = current_sales;
  if (phone !== undefined)             updates.phone = phone;
  if (team_name !== undefined)         updates.team_name = team_name;
  if (team_logo_url !== undefined)     updates.team_logo_url = team_logo_url;
  if (avatar_url !== undefined)        updates.avatar_url = avatar_url;

  if (Object.keys(updates).length > 0) {
    const { error } = await adminClient.from("profiles").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (password) {
    const { error } = await adminClient.auth.admin.updateUserById(id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE - kullanici sil
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID zorunludur" }, { status: 400 });

  const adminClient = getAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

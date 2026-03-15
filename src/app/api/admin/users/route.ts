// src/app/api/admin/users/route.ts
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Service role client - sadece server'da calisir
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// Anon client ile caller'in admin olup olmadigini dogrula
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

// GET /api/admin/users - tum kullanicilari listele
export async function GET(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 403 });
  }
  const adminClient = getAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, full_name, role, monthly_target, current_sales, last_login, created_at")
    .order("full_name");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST /api/admin/users - yeni kullanici olustur
export async function POST(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 403 });
  }
  const { email, password, full_name, role, monthly_target } = await request.json();
  if (!email || !password || !full_name) {
    return NextResponse.json({ error: "Email, sifre ve isim zorunludur" }, { status: 400 });
  }
  const adminClient = getAdminClient();

  // Auth'da kullanici olustur
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });

  // Profile guncelle
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: authData.user.id,
      full_name,
      role: role ?? "staff",
      monthly_target: monthly_target ?? 0,
      current_sales: 0,
    });
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  return NextResponse.json({ success: true, userId: authData.user.id }, { status: 201 });
}

// PATCH /api/admin/users - kullanici guncelle
export async function PATCH(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 403 });
  }
  const { id, full_name, role, monthly_target, current_sales, password } = await request.json();
  if (!id) return NextResponse.json({ error: "ID zorunludur" }, { status: 400 });

  const adminClient = getAdminClient();

  // Profil guncelle
  const updates: Record<string, unknown> = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (role !== undefined) updates.role = role;
  if (monthly_target !== undefined) updates.monthly_target = monthly_target;
  if (current_sales !== undefined) updates.current_sales = current_sales;

  if (Object.keys(updates).length > 0) {
    const { error } = await adminClient.from("profiles").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sifre guncelle
  if (password) {
    const { error } = await adminClient.auth.admin.updateUserById(id, { password });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users - kullanici sil
export async function DELETE(request: NextRequest) {
  if (!(await verifyAdmin(request))) {
    return NextResponse.json({ error: "Yetkisiz erisim" }, { status: 403 });
  }
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "ID zorunludur" }, { status: 400 });

  const adminClient = getAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}

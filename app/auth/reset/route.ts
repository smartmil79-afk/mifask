import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabaseServer().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}/reset`);
  }
  return NextResponse.redirect(`${origin}/forgot?expired=1`);
}

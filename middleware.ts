import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function middleware(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let res = NextResponse.next({ request: req });
  if (!url || !key) return res;
  try {
    const s = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (l) => {
          l.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          l.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    });
    await s.auth.getUser();
  } catch {}
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
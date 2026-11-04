import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
const OPEN = ["/login", "/auth", "/forgot", "/reset"];
export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const headers = new Headers(req.headers); headers.set("x-pathname", path);
  let res = NextResponse.next({ request: { headers } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return res;
  try {
    const s = createServerClient(url, key, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (l: any) => {
          l.forEach(({ name, value }: any) => req.cookies.set(name, value));
          headers.set("cookie", req.cookies.toString());
          res = NextResponse.next({ request: { headers } });
          l.forEach(({ name, value, options }: any) => res.cookies.set(name, value, options));
        },
      },
    });
    const { data: { user } } = await s.auth.getUser();
    if (user && !OPEN.some((p) => path.startsWith(p))) {
      const { data: a } = await s.auth.mfa.getAuthenticatorAssuranceLevel();
      if (a && a.nextLevel === "aal2" && a.currentLevel !== "aal2") return NextResponse.redirect(new URL("/login", req.url));
    }
  } catch {}
  return res;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|placeholders/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };

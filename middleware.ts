import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  
  // Guard clause to protect Edge routing from crashing on server boots
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res;
  }

  try {
    const s = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      cookies: { 
        getAll: () => {
          try { return req.cookies.getAll(); } catch { return []; }
        }, 
        setAll: (l: any) => { 
          try {
            l.forEach(({ name, value }: any) => req.cookies.set(name, value)); 
            res = NextResponse.next({ request: req }); 
            l.forEach(({ name, value, options }: any) => res.cookies.set(name, value, options)); 
          } catch {}
        } 
      },
    });
    await s.auth.getUser();
  } catch (e) {
    console.error("Middleware Auth Intercept Exception:", e);
  }
  
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { getServerEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/?auth=missing_code`);
  }

  const env = getServerEnv();
  const response = NextResponse.redirect(`${origin}${next}`);

  // IMPORTANT: Route Handlers must set auth cookies on the response.
  // Using the Server Components cookies() helper can silently fail to persist cookies.
  const supabase = createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const fallback = `/dashboard?auth_error=${encodeURIComponent(error.message)}`;
    return NextResponse.redirect(`${origin}${fallback}`);
  }

  return response;
}

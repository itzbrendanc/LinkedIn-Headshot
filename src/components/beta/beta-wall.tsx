import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/env";
import { requireBetaAccess } from "@/lib/beta-access";
import { BetaGate } from "@/components/beta/beta-gate";
import { SignInCard } from "@/components/auth/sign-in-card";
import { Container } from "@/components/site/container";

export async function BetaWall({
  children,
  nextPath,
}: {
  children: React.ReactNode;
  nextPath: string;
}) {
  const env = getServerEnv();
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!env.BETA_ACCESS_ENABLED) return <>{children}</>;

  if (!auth.user) {
    return (
      <main className="bg-black">
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-lg">
            <SignInCard nextPath={nextPath} />
          </div>
        </Container>
      </main>
    );
  }

  const gate = await requireBetaAccess({
    supabase,
    userId: auth.user.id,
    userEmail: auth.user.email,
  });

  if (!gate.ok) {
    return (
      <main className="bg-black">
        <Container className="py-12 sm:py-16">
          <div className="mx-auto max-w-lg">
            <BetaGate supportEmail={env.SUPPORT_EMAIL} />
          </div>
        </Container>
      </main>
    );
  }

  return <>{children}</>;
}


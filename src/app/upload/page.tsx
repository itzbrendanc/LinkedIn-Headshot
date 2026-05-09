import { redirect } from "next/navigation";

import { BetaWall } from "@/components/beta/beta-wall";
import { Container } from "@/components/site/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadFlow } from "@/components/upload/upload-flow";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function UploadPage() {
  return (
    <BetaWall nextPath="/upload">
      <UploadInner />
    </BetaWall>
  );
}

async function UploadInner() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  // Upload requires auth so we can store privately per-user.
  if (!data.user) redirect("/dashboard");

  return (
    <main className="bg-black">
      <Container className="py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">
          <div className="grid gap-6">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Upload your photos</h1>
              <p className="mt-2 text-white/65">
                We’ll use your references to preserve identity and generate LinkedIn-ready headshots.
              </p>
            </div>
            <UploadFlow />
          </div>
          <div className="grid gap-4">
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white text-base">Requirements</CardTitle>
                <CardDescription className="text-white/60">
                  For best results, follow these guidelines.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-white/65">
                Upload 10–20 close-up photos of you. Avoid group photos, sunglasses, heavy filters, and extreme lighting.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white text-base">Privacy note</CardTitle>
                <CardDescription className="text-white/60">
                  Your photos are private and used only to generate your headshots.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-white/65">
                We recommend uploading only photos you’re comfortable using for identity training. Inputs are deleted after 30 days by default.
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-black/30">
              <CardHeader>
                <CardTitle className="text-white text-base">Not allowed</CardTitle>
                <CardDescription className="text-white/60">
                  No celebrity or impersonation use.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-white/65">
                Don’t upload photos of anyone else (including public figures). Abusive jobs may be deleted.
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}

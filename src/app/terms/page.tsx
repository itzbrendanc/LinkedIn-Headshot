import { Container } from "@/components/site/container";

export default function TermsPage() {
  return (
    <main className="bg-black">
      <Container className="py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-4 max-w-3xl text-white/65">
          Placeholder terms. You must own or have permission to use uploaded photos. No
          minors, no celebrity impersonation, and no deceptive uses. Abuse may be removed
          by admins.
        </p>
      </Container>
    </main>
  );
}


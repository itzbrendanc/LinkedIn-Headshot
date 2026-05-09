import { Container } from "@/components/site/container";

export default function PrivacyPage() {
  return (
    <main className="bg-black">
      <Container className="py-12 sm:py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 max-w-3xl text-white/65">
          Placeholder privacy policy. This app is designed to keep uploads and generated
          headshots private to the user. Training images are deleted after 30 days by
          default.
        </p>
      </Container>
    </main>
  );
}


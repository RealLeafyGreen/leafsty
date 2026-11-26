import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Leafsty",
  description: "How Leafsty handles account data, messages, and Google Sign-In.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen w-screen bg-[#071410] text-emerald-50 px-6 py-12">
      <div className="max-w-3xl mx-auto rounded-3xl bg-[#081914] border border-emerald-500/25 p-8 sm:p-10 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-emerald-500/15 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Leafsty Privacy Policy
            </h1>
            <p className="text-xs text-emerald-300/70 mt-1">
              Last updated: November 26, 2026
            </p>
          </div>
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
          >
            ← Back to Leafsty
          </Link>
        </div>

        <section className="space-y-2 text-sm text-emerald-100/85 leading-relaxed">
          <h2 className="text-base font-bold text-emerald-300">
            1. Information We Collect
          </h2>
          <p>
            When you create a Leafsty account or sign in using Google, we
            collect only the basic profile information needed to operate your
            workspace: your chosen username or display name, email address (when
            signing in with Google), and optional profile avatar.
          </p>
        </section>

        <section className="space-y-2 text-sm text-emerald-100/85 leading-relaxed">
          <h2 className="text-base font-bold text-emerald-300">
            2. How We Use Your Information
          </h2>
          <p>
            Your information is used strictly to authenticate your session,
            display your profile to people you chat with, and deliver real-time
            messages, voice notes, and calls within Leafsty. We do not sell,
            rent, or trade your personal information or Google user data to
            third parties.
          </p>
        </section>

        <section className="space-y-2 text-sm text-emerald-100/85 leading-relaxed">
          <h2 className="text-base font-bold text-emerald-300">
            3. Google Sign-In Data
          </h2>
          <p>
            If you choose to sign in with Google, Leafsty requests only basic
            OpenID profile scopes (name, email address, and profile picture) to
            create or match your Leafsty account. Leafsty does not access your
            Google Drive, Gmail messages, contacts, or other Google services.
          </p>
        </section>

        <section className="space-y-2 text-sm text-emerald-100/85 leading-relaxed">
          <h2 className="text-base font-bold text-emerald-300">
            4. Data Storage & Security
          </h2>
          <p>
            Real-time messaging and media infrastructure are powered by Stream
            with encrypted transport (HTTPS/WSS) and client-side end-to-end
            encryption features. You may log out or clear your local session at
            any time from Leafsty Settings.
          </p>
        </section>

        <section className="space-y-2 text-sm text-emerald-100/85 leading-relaxed">
          <h2 className="text-base font-bold text-emerald-300">5. Contact</h2>
          <p>
            If you have questions about your privacy or wish to request account
            or data deletion, contact the Leafsty administrator through your
            workspace or developer support email listed on the sign-in screen.
          </p>
        </section>
      </div>
    </main>
  );
}

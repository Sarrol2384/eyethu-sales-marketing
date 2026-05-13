import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy notice",
  description:
    "How Eyethu Property Group collects, uses and protects your personal information under POPIA.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6">
      <article className="prose prose-neutral max-w-none dark:prose-invert">
        <h1>Privacy notice</h1>
        <p className="text-sm text-muted-foreground">
          Last updated: 12 May 2026
        </p>

        <p>
          Eyethu Property Group (&quot;Eyethu PG&quot;, &quot;we&quot;,
          &quot;us&quot;) respects your privacy and complies with the
          Protection of Personal Information Act, 2013 (POPIA). This notice
          explains what personal information we collect when you use our
          website, why we collect it, and what we do with it.
        </p>

        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Enquiry details</strong> when you submit a lead form: your
            name, phone number, optional email, optional message, whether
            you&apos;re a first-time buyer, your move timeline, and the
            property you enquired about.
          </li>
          <li>
            <strong>Page analytics</strong>: the property pages you visit,
            referrer, and basic UTM tracking — used to measure listing
            performance.
          </li>
          <li>
            <strong>Cookies</strong> for authentication (admin users only).
          </li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To contact you about properties you&apos;ve enquired about.</li>
          <li>
            To share suitable matching listings with you, if you opt in.
          </li>
          <li>
            To improve our website and understand which listings are popular.
          </li>
          <li>
            With your consent, to send you occasional emails about new
            listings or first-time-buyer information (FLISP, bond tips). You
            can unsubscribe at any time.
          </li>
        </ul>

        <h2>Who we share it with</h2>
        <ul>
          <li>
            <strong>Brevo</strong> — our email and SMS service provider —
            processes your contact details on our behalf.
          </li>
          <li>
            <strong>Anthropic</strong> — only the property details (NOT your
            personal information) are sent to generate listing copy.
          </li>
        </ul>
        <p>
          We don&apos;t sell your information. We don&apos;t share it with
          third parties for advertising.
        </p>

        <h2>Your rights</h2>
        <p>Under POPIA you have the right to:</p>
        <ul>
          <li>Request a copy of the personal information we hold about you.</li>
          <li>Ask us to correct or delete your information.</li>
          <li>Object to direct marketing — we&apos;ll remove you immediately.</li>
          <li>
            Lodge a complaint with the Information Regulator if you believe
            we&apos;ve mishandled your information.
          </li>
        </ul>

        <h2>How to contact us</h2>
        <p>
          Email{" "}
          <a href="mailto:hello@eyethu.example">hello@eyethu.example</a> with
          any privacy questions or requests.
        </p>
      </article>
    </main>
  );
}

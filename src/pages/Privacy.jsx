import { NCMark } from "../components/nc/Brand";
import { NC } from "../theme/tokens";
import { navigateTo } from "../lib/routing";
import { PRICING } from "../lib/subscription";
import { siteH1, siteH2, siteLink, siteNav, sitePage, siteWrap } from "./siteStyles";

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={siteH2}>{title}</h2>
      <div style={{ fontSize: 15, lineHeight: 1.75, color: NC.inkSoft }}>{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div style={sitePage}>
      <div style={siteWrap}>
        <nav style={siteNav}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <NCMark size={32} />
            <span style={{ fontFamily: NC.serif, fontSize: 20 }}>neurochat</span>
          </div>
          <button type="button" style={siteLink} onClick={() => navigateTo("/")}>
            Back to home
          </button>
        </nav>

        <h1 style={{ ...siteH1, marginBottom: 8 }}>Privacy policy</h1>
        <p style={{ fontSize: 14, color: NC.inkMute, marginBottom: 32 }}>Last updated: May 2026 · Plain language summary</p>

        <Section title="Who we are">
          <p>
            NeuroChat provides conversation practice for neurodivergent adults. If you have questions about this policy, contact us at{" "}
            <a href={`mailto:${PRICING.contactEmail}`} style={{ color: NC.teal }}>
              {PRICING.contactEmail}
            </a>
            .
          </p>
        </Section>

        <Section title="What we collect">
          <ul style={{ paddingLeft: 18 }}>
            <li>
              <strong>Account data:</strong> email address and profile settings if you create an account (via Supabase Auth).
            </li>
            <li>
              <strong>Practice data:</strong> scenarios you complete, conversation transcripts, AI feedback, mood check-ins, badges, and preferences — stored to save your progress.
            </li>
            <li>
              <strong>Technical data:</strong> basic logs needed to run the service (e.g. errors, device/browser type). We do not sell your data.
            </li>
          </ul>
          <p>Guest mode stores some data locally on your device only until you clear it or sign in.</p>
        </Section>

        <Section title="Why we use it (lawful bases)">
          <p>Under UK GDPR we rely on:</p>
          <ul style={{ paddingLeft: 18 }}>
            <li>
              <strong>Contract</strong> — to provide the app you signed up for.
            </li>
            <li>
              <strong>Legitimate interests</strong> — to improve reliability and security, in ways that respect your rights.
            </li>
            <li>
              <strong>Consent</strong> — where we ask clearly (e.g. optional emails). You can withdraw consent anytime.
            </li>
          </ul>
        </Section>

        <Section title="Who we share with">
          <p>We use trusted processors to run NeuroChat:</p>
          <ul style={{ paddingLeft: 18 }}>
            <li>Supabase (authentication and database)</li>
            <li>Anthropic (AI conversation and feedback — message content is sent to generate responses)</li>
            <li>Vercel (hosting)</li>
          </ul>
          <p>They process data only on our instructions. We do not share your private mood history or full transcripts with schools or employers unless you choose institutional features that say otherwise.</p>
        </Section>

        <Section title="How long we keep data">
          <p>We keep account and practice data while your account is active. You can delete your data from Settings (“Delete all my data”) or email us. Backups may take up to 30 days to clear fully.</p>
        </Section>

        <Section title="Your rights">
          <p>You can ask us to:</p>
          <ul style={{ paddingLeft: 18 }}>
            <li>Access a copy of your data</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data</li>
            <li>Restrict or object to certain processing</li>
            <li>Export your data (portability)</li>
            <li>Complain to the ICO (UK) if you are unhappy with how we handle your data</li>
          </ul>
          <p>
            Email{" "}
            <a href={`mailto:${PRICING.contactEmail}`} style={{ color: NC.teal }}>
              {PRICING.contactEmail}
            </a>{" "}
            and we will respond within one month.
          </p>
        </Section>

        <Section title="Children">
          <p>NeuroChat is designed for adults. We do not knowingly collect data from children under 16. Contact us if you believe a child has provided data.</p>
        </Section>

        <Section title="Security">
          <p>We use encryption in transit (HTTPS), access controls, and industry-standard hosting. No system is 100% secure — please use a strong, unique password.</p>
        </Section>

        <Section title="International transfers">
          <p>Some providers may process data outside the UK/EEA. Where they do, we use appropriate safeguards (such as standard contractual clauses).</p>
        </Section>

        <Section title="Changes">
          <p>We may update this policy. We will post the new version here with an updated date. Significant changes will be highlighted in the app where practical.</p>
        </Section>

        <footer style={{ borderTop: `1px solid ${NC.cardEdge}`, paddingTop: 20, fontSize: 13, color: NC.inkMute }}>
          <button type="button" style={siteLink} onClick={() => navigateTo("/app")}>
            Open NeuroChat
          </button>
        </footer>
      </div>
    </div>
  );
}

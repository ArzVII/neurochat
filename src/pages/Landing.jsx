import { NCMark } from "../components/nc/Brand";
import { NC } from "../theme/tokens";
import { navigateTo } from "../lib/routing";
import { PRICING } from "../lib/subscription";
import { siteCard, siteH1, siteH2, siteLink, siteNav, sitePage, siteWrap } from "./siteStyles";

const FEATURES_FREE = [
  "All 29 practice scenarios across work, social, everyday life, and more",
  "Full AI conversations — practise as much as you like",
  "Gentle feedback: strengths plus one area to explore",
  "Tips library and mood check-in",
  "Guest mode or account — your choice",
];

const FEATURES_PREMIUM = [
  "Detailed multi-section feedback with example phrasing",
  "Custom scenario builder from your real life",
  "Conversation history and review",
  "Prepare for Tomorrow planning",
  "Pacing controls and social cue explainer",
  "Bonus scenarios and advanced tip sets when earned",
];

function Nav() {
  return (
    <nav style={siteNav}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <NCMark size={36} />
        <span style={{ fontFamily: NC.serif, fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>neurochat</span>
      </div>
      <NavLinks />
    </nav>
  );
}

function NavLinks() {
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <button type="button" style={siteLink} onClick={() => navigateTo("/#features")}>
        Features
      </button>
      <button type="button" style={siteLink} onClick={() => navigateTo("/#pricing")}>
        Pricing
      </button>
      <button type="button" style={siteLink} onClick={() => navigateTo("/privacy")}>
        Privacy
      </button>
      <button
        type="button"
        onClick={() => navigateTo("/app")}
        style={{
          background: NC.ink,
          color: NC.paper,
          border: "none",
          borderRadius: 12,
          padding: "10px 18px",
          fontFamily: NC.sans,
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Open app
      </button>
    </div>
  );
}

export default function Landing() {
  return (
    <div style={sitePage}>
      <div style={siteWrap}>
        <Nav />

        <header style={{ padding: "32px 0 48px" }}>
          <p style={{ fontFamily: NC.mono, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: NC.inkMute, marginBottom: 12 }}>
            Conversation practice for neurodivergent adults
          </p>
          <h1 style={siteH1}>
            Practise hard conversations
            <br />
            in a space that&apos;s actually safe.
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.6, color: NC.inkSoft, maxWidth: 560, marginTop: 20 }}>
            NeuroChat helps you rehearse social situations with an AI partner, then reflects on what went well — strengths first, always. No scoring. No shame.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigateTo("/app")}
              style={{
                background: NC.teal,
                color: NC.paper,
                border: "none",
                borderRadius: 14,
                padding: "14px 24px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: NC.sans,
              }}
            >
              Start practising free
            </button>
            <button type="button" style={{ ...siteLink, fontSize: 16 }} onClick={() => navigateTo("/#pricing")}>
              See pricing
            </button>
          </div>
        </header>

        <section id="features" style={{ marginBottom: 56 }}>
          <h2 style={siteH2}>What you get</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={siteCard}>
              <h3 style={{ fontFamily: NC.serif, fontSize: 20, margin: "0 0 12px" }}>Free — generous by design</h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: NC.inkSoft, fontSize: 15 }}>
                {FEATURES_FREE.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div style={{ ...siteCard, background: NC.tealSoft }}>
              <h3 style={{ fontFamily: NC.serif, fontSize: 20, margin: "0 0 12px" }}>Premium — deeper tools</h3>
              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7, color: NC.inkSoft, fontSize: 15 }}>
                {FEATURES_PREMIUM.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
          <p style={{ fontSize: 14, color: NC.inkMute, marginTop: 16, lineHeight: 1.6 }}>
            Upgrade prompts are gentle and dismissable — we never block core practice or pressure you to pay.
          </p>
        </section>

        <section id="pricing" style={{ marginBottom: 56 }}>
          <h2 style={siteH2}>Pricing</h2>
          <p style={{ fontFamily: NC.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: NC.inkMute, margin: "0 0 12px" }}>
            Individual
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div style={siteCard}>
              <p style={{ fontFamily: NC.serif, fontSize: 28, margin: "0 0 8px" }}>Free</p>
              <p style={{ fontSize: 15, color: NC.inkSoft, margin: 0, lineHeight: 1.55 }}>
                Unlimited core practice — all 29 scenarios, full conversations, basic feedback, tips library, and mood check-in.
              </p>
            </div>
            <div style={{ ...siteCard, background: NC.tealSoft }}>
              <p style={{ fontFamily: NC.serif, fontSize: 28, margin: "0 0 4px" }}>
                Premium
              </p>
              <p style={{ fontFamily: NC.serif, fontSize: 22, margin: "0 0 8px", color: NC.ink }}>
                {PRICING.monthly}
                <span style={{ fontSize: 15, fontFamily: NC.sans, color: NC.inkMute }}>/month</span>
                <span style={{ fontSize: 15, fontFamily: NC.sans, color: NC.inkMute }}> or {PRICING.yearly}/year</span>
              </p>
              <p style={{ fontSize: 14, color: NC.inkSoft, margin: "0 0 8px", lineHeight: 1.55 }}>
                Detailed feedback, custom scenarios, conversation history, Prepare for Tomorrow, pacing controls, and bonus content.
              </p>
              <p style={{ fontSize: 13, color: NC.inkMute, margin: 0, lineHeight: 1.55 }}>
                Payments coming soon.
              </p>
            </div>
          </div>
          <p style={{ fontFamily: NC.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: NC.inkMute, margin: "0 0 12px" }}>
            Institutional
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            <div style={siteCard}>
              <p style={{ fontFamily: NC.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: NC.inkMute, margin: "0 0 8px" }}>
                Therapist licence
              </p>
              <p style={{ fontFamily: NC.serif, fontSize: 28, margin: "0 0 8px" }}>
                {PRICING.therapistYear}
                <span style={{ fontSize: 15, fontFamily: NC.sans, color: NC.inkMute }}>/year</span>
              </p>
              <p style={{ fontSize: 14, color: NC.inkSoft, lineHeight: 1.6 }}>Up to 20 users. Premium for everyone, anonymised admin dashboard, priority support.</p>
            </div>
            <div style={siteCard}>
              <p style={{ fontFamily: NC.mono, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: NC.inkMute, margin: "0 0 8px" }}>
                School licence
              </p>
              <p style={{ fontFamily: NC.serif, fontSize: 28, margin: "0 0 8px" }}>
                {PRICING.schoolYear}
                <span style={{ fontSize: 15, fontFamily: NC.sans, color: NC.inkMute }}>/year</span>
              </p>
              <p style={{ fontSize: 14, color: NC.inkSoft, lineHeight: 1.6 }}>Up to 100 users. Same premium features plus institutional reporting.</p>
              <p style={{ fontSize: 13, color: NC.inkMute, marginTop: 10 }}>Enterprise (100+ users): custom pricing — get in touch.</p>
            </div>
          </div>
          <p
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: NC.butterSoft,
              borderRadius: 12,
              fontSize: 14,
              color: NC.inkSoft,
              lineHeight: 1.6,
              border: `1px solid ${NC.cardEdge}`,
            }}
          >
            If cost is a barrier, get in touch — we&apos;ll sort something out. Email{" "}
            <a href={`mailto:${PRICING.contactEmail}`} style={{ color: NC.teal }}>
              {PRICING.contactEmail}
            </a>
            .
          </p>
        </section>

        <section id="contact" style={{ marginBottom: 48 }}>
          <h2 style={siteH2}>Contact</h2>
          <div style={siteCard}>
            <p style={{ fontSize: 15, lineHeight: 1.7, color: NC.inkSoft, margin: 0 }}>
              Questions about schools, therapists, accessibility, or partnerships? We&apos;d love to hear from you.
            </p>
            <p style={{ marginTop: 12, fontSize: 15 }}>
              <a href={`mailto:${PRICING.contactEmail}`} style={{ color: NC.teal, fontWeight: 600 }}>
                {PRICING.contactEmail}
              </a>
            </p>
          </div>
        </section>

        <footer style={{ borderTop: `1px solid ${NC.cardEdge}`, paddingTop: 24, fontSize: 13, color: NC.inkMute }}>
          <p style={{ margin: 0 }}>
            © {new Date().getFullYear()} NeuroChat ·{" "}
            <button type="button" style={siteLink} onClick={() => navigateTo("/privacy")}>
              Privacy policy
            </button>{" "}
            ·{" "}
            <button type="button" style={siteLink} onClick={() => navigateTo("/app")}>
              Open app
            </button>
          </p>
        </footer>
      </div>
    </div>
  );
}

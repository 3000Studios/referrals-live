import { Seo } from "@/components/seo/Seo";

export function Privacy() {
  return (
    <div className="prose prose-invert max-w-3xl">
      <Seo
        title="Privacy Policy — referrals.live"
        description="Privacy Policy for referrals.live — what we collect, cookies, advertising, and your choices."
        path="/privacy"
      />
      <h1 className="font-display text-4xl font-extrabold text-white">Privacy Policy</h1>
      <p className="text-sm text-muted">Last updated: September 27, 2026</p>
      <h2 className="font-display text-2xl font-bold text-white">What we collect</h2>
      <p className="text-muted">
        We collect as little as possible. If you use the contact form or sign up for the newsletter, we receive the details
        you provide (such as your name, email address, and message) and use them only to respond to you.
      </p>
      <p className="text-muted">
        Like most websites, our servers automatically receive technical data — your IP address, browser type, and the pages you
        visit — which we use for security and to keep the site running.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Cookies</h2>
      <p className="text-muted">
        We use essential cookies to make the site work, analytics cookies to understand aggregate usage, and advertising
        cookies. Google AdSense and its partners may use cookies — including the Google DART cookie — to serve ads based on
        your visits to this and other sites. You can opt out of personalized advertising in your Google Ads Settings.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Referral-link tracking</h2>
      <p className="text-muted">
        When you click a referral or affiliate link, the destination program applies its own tracking (such as cookies or
        referral codes) under its own privacy policy. We don&apos;t control their tracking.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">How we use data</h2>
      <p className="text-muted">
        We use the data we collect to operate and secure the site, respond to your messages, and send newsletters you&apos;ve
        subscribed to. Every newsletter email includes an unsubscribe link.
      </p>
      <h2 className="font-display text-2xl font-bold text-white">Retention and deletion</h2>
      <p className="text-muted">
        Contact messages are kept only as long as needed to handle your request, and deleted on request. To ask for access or
        deletion, use the Contact page.
      </p>
    </div>
  );
}

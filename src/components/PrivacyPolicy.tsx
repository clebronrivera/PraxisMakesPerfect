import { ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-amber-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <article className="prose prose-slate max-w-none prose-headings:font-serif prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-base prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm">
          <h1>Privacy Policy</h1>
          <p className="text-sm text-slate-500">Last updated: April 2026</p>

          <h2>1. Who We Are</h2>
          <p>
            PraxisMakesPerfect ("PraxisMakesPerfect," "we," "us," or "our") is an online study platform
            for candidates preparing for the Praxis series of educator certification examinations. The
            service is owned and operated by <strong>Dream Enterprises LLC</strong>, a Florida limited
            liability company.
          </p>
          <p>
            <strong>
              Praxis is a registered trademark of Educational Testing Service (ETS).
              PraxisMakesPerfect is not affiliated with, endorsed by, or sponsored by ETS. ETS has not
              reviewed or approved any content on this platform.
            </strong>
          </p>
          <p>
            If you have questions about this Privacy Policy, contact us at:{' '}
            <a href="mailto:dreamenterprisesllc@outlook.com">dreamenterprisesllc@outlook.com</a>
          </p>

          <h2>2. Scope and Age Restriction</h2>
          <p>
            This Policy applies to your use of the PraxisMakesPerfect website, web application, and any
            related services (collectively, the "Service").
          </p>
          <p>
            <strong>The Service is intended exclusively for users 18 years of age or older.</strong> We do
            not knowingly collect personal information from anyone under 18. By creating an account, you
            represent that you are at least 18. If we learn that we have collected personal information
            from a person under 18, we will delete that information promptly. If you believe a minor has
            provided us with personal information, please contact us at the email above.
          </p>

          <h2>3. Information We Collect</h2>

          <h3>3.1 Information you provide directly</h3>
          <ul>
            <li>
              <strong>Account information:</strong> name, email address, password (stored only as a salted
              hash), and any optional profile details.
            </li>
            <li>
              <strong>Study inputs:</strong> answers you submit to practice questions, diagnostic
              responses, confidence ratings, and free-text inputs to interactive lessons or the AI Tutor.
            </li>
            <li>
              <strong>Communications:</strong> messages you send us through support channels.
            </li>
            <li>
              <strong>Payment information:</strong> if and when paid features are offered, payment is
              processed by a third-party payment processor. We do not store full card numbers, CVCs, or
              bank credentials on our servers.
            </li>
          </ul>

          <h3>3.2 Information collected automatically</h3>
          <ul>
            <li>
              <strong>Usage data:</strong> pages viewed, features used, time spent, response times to
              questions, and progress across skills.
            </li>
            <li>
              <strong>Device and log data:</strong> IP address, browser type, operating system, device
              identifiers, and timestamps.
            </li>
            <li>
              <strong>Cookies and local storage:</strong> used for authentication, session management, and
              remembering your preferences. See section 8.
            </li>
          </ul>

          <h2>4. How the AI Tutor Works</h2>
          <p>
            PraxisMakesPerfect includes an <strong>AI Tutor</strong> feature. When you interact with the
            AI Tutor, the text you submit — along with limited contextual information about the question
            or skill you are studying — is transmitted to a <strong>third-party large language model
            provider, Anthropic, PBC, via the Anthropic API</strong>. Anthropic processes that input to
            generate a response, which is returned to you through our Service.
          </p>
          <p>You should be aware that:</p>
          <ul>
            <li>
              <strong>Do not enter sensitive personal information</strong> (such as government ID numbers,
              financial account numbers, or health information) into the AI Tutor. The AI Tutor is
              designed for studying Praxis content, not for handling personal data.
            </li>
            <li>
              We may store your AI Tutor inputs and the responses generated for them in our database in
              order to provide history, debug issues, and improve the Service.
            </li>
            <li>
              Anthropic's handling of API inputs is governed by Anthropic's own terms and privacy
              commitments, which are separate from this Policy.
            </li>
            <li>
              AI-generated responses may be incorrect or incomplete and should not be relied on as a
              substitute for authoritative test-preparation materials or professional guidance.
            </li>
          </ul>

          <h2>5. How We Use Information</h2>
          <p>We use the information described above to:</p>
          <ul>
            <li>
              Provide, operate, and maintain the Service, including authenticating you and saving your
              progress;
            </li>
            <li>
              Personalize your study experience, including adaptive diagnostics and skill recommendations;
            </li>
            <li>Generate AI Tutor responses and interactive lesson content;</li>
            <li>
              Communicate with you about your account, updates, and support requests;
            </li>
            <li>
              Monitor and improve the quality of our content and the performance of the platform;
            </li>
            <li>
              Detect, prevent, and address fraud, abuse, security incidents, and violations of our Terms;
            </li>
            <li>Comply with legal obligations.</li>
          </ul>
          <p>
            We do not sell your personal information, and we do not use your study data to train
            third-party AI models for purposes unrelated to providing the Service to you.
          </p>

          <h2>6. How We Share Information</h2>
          <p>We share personal information only as follows:</p>
          <ul>
            <li>
              <strong>Service providers (subprocessors):</strong> vendors that host or operate parts of
              the Service on our behalf, including:
              <ul>
                <li><strong>Supabase (Supabase Inc.)</strong> — database and authentication</li>
                <li><strong>Netlify</strong> — application hosting and serverless functions</li>
                <li><strong>Anthropic, PBC</strong> — AI Tutor language model processing</li>
                <li>
                  <strong>Sentry (Functional Software, Inc.)</strong> — error monitoring and crash
                  reporting. When the application encounters an error, we send diagnostic data
                  (error stack traces, user ID, page URL, and browser environment) to Sentry to help
                  us diagnose and fix problems. Sentry's handling of this data is governed by its
                  own privacy commitments, available at{' '}
                  <a href="https://sentry.io/privacy/" target="_blank" rel="noreferrer">
                    https://sentry.io/privacy/
                  </a>.
                </li>
              </ul>
            </li>
            <li>
              <strong>Legal and safety:</strong> when required by law, subpoena, or legal process, or
              when we believe disclosure is necessary to protect the rights, property, or safety of
              PraxisMakesPerfect, our users, or others.
            </li>
            <li>
              <strong>Business transfers:</strong> in connection with a merger, acquisition, financing, or
              sale of assets, subject to standard confidentiality protections.
            </li>
            <li>
              <strong>With your consent:</strong> for any other purpose disclosed to you at the time.
            </li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>
            We retain personal information for as long as your account is active or as needed to provide
            the Service. When you delete your account, we will delete or de-identify your personal
            information within <strong>90 days</strong>, except where retention is required for legal,
            accounting, fraud-prevention, or dispute-resolution purposes.
          </p>

          <h2>8. Cookies</h2>
          <p>
            We use cookies and similar technologies for essential functionality (keeping you signed in,
            remembering preferences) and basic analytics. You can control cookies through your browser
            settings; disabling essential cookies may impair the Service.
          </p>

          <h2>9. Security</h2>
          <p>
            We use commercially reasonable administrative, technical, and physical safeguards to protect
            personal information, including HTTPS in transit, hashed passwords, and access controls on
            backend systems. <strong>No system is perfectly secure.</strong> We cannot guarantee absolute
            security and you use the Service at your own risk.
          </p>

          <h2>10. Your Rights</h2>
          <p>
            Depending on where you live, you may have rights to access, correct, delete, port, or
            restrict processing of your personal information.
          </p>
          <ul>
            <li>
              <strong>California residents (CCPA/CPRA):</strong> You have the right to know what personal
              information we collect, request deletion, correct inaccurate information, and opt out of any
              "sale" or "sharing" of personal information. We do not sell personal information.
            </li>
            <li>
              <strong>EU/UK residents (GDPR/UK GDPR):</strong> You have rights of access, rectification,
              erasure, restriction, portability, and objection. Our legal bases for processing are
              performance of a contract (providing the Service), legitimate interests (improving and
              securing the Service), and consent where applicable.
            </li>
            <li>
              <strong>Other US states (Virginia, Colorado, Connecticut, Texas, etc.):</strong> Similar
              rights may apply under state law.
            </li>
          </ul>
          <p>
            To exercise any right, email us at the address listed in section 1. We will verify your
            identity before acting on any request.
          </p>

          <h2>11. International Users</h2>
          <p>
            The Service is operated from the United States. If you access it from outside the US, your
            information will be transferred to and processed in the US, which may have data-protection
            laws different from those in your country.
          </p>

          <h2>12. Changes to This Policy</h2>
          <p>
            We may update this Policy from time to time. Material changes will be communicated by posting
            the updated Policy with a new "Last Updated" date and, where appropriate, by email or
            in-product notice.
          </p>

          <h2>13. Contact</h2>
          <p>
            Dream Enterprises LLC — PraxisMakesPerfect
            <br />
            Email:{' '}
            <a href="mailto:dreamenterprisesllc@outlook.com">dreamenterprisesllc@outlook.com</a>
          </p>
        </article>
      </div>
    </div>
  );
}

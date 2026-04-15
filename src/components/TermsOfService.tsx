import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
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

        <article className="prose prose-slate max-w-none prose-headings:font-serif prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm">
          <h1>Terms of Service</h1>
          <p className="text-sm text-slate-500">Last updated: April 2026</p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            These terms apply to beta access. They may be updated before general release.
          </p>

          <h2>1. Acceptance</h2>
          <p>
            By creating an account or using PraxisMakesPerfect (the "Service"), you agree to these Terms
            of Service ("Terms") and our{' '}
            <button
              onClick={() => {
                window.location.hash = 'privacy';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }}
              className="font-medium text-amber-700 underline hover:text-amber-800"
            >
              Privacy Policy
            </button>
            . If you do not agree, do not use the Service.
          </p>

          <h2>2. Eligibility</h2>
          <p>
            You must be at least 18 years old to use the Service. By creating an account, you represent
            and warrant that you meet this requirement.
          </p>

          <h2>3. The Service</h2>
          <p>
            PraxisMakesPerfect provides study tools, practice questions, adaptive diagnostics, AI-powered
            tutoring, and progress tracking for candidates preparing for the Praxis series of
            educator certification examinations. The Service is owned and operated by{' '}
            <strong>Dream Enterprises LLC</strong>, a Florida limited liability company.
          </p>
          <p>
            <strong>
              Praxis is a registered trademark of Educational Testing Service (ETS).
              PraxisMakesPerfect is not affiliated with, endorsed by, or sponsored by ETS.
            </strong>
          </p>

          <h2>4. Account Responsibilities</h2>
          <ul>
            <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
            <li>You agree to provide accurate information when creating your account.</li>
            <li>
              You must notify us promptly if you suspect unauthorized access to your account.
            </li>
          </ul>

          <h2>5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul>
            <li>
              Use the Service for any unlawful purpose or in violation of any applicable laws;
            </li>
            <li>
              Share, redistribute, or commercially exploit the question content, study materials, or
              AI-generated outputs from the Service;
            </li>
            <li>
              Attempt to reverse-engineer, scrape, or extract data from the Service through automated
              means;
            </li>
            <li>
              Impersonate another person or misrepresent your affiliation with any entity;
            </li>
            <li>
              Interfere with or disrupt the integrity or performance of the Service.
            </li>
          </ul>

          <h2>6. AI-Generated Content</h2>
          <p>
            The Service uses artificial intelligence (provided by Anthropic, PBC) to generate tutoring
            responses, study plans, and other content. AI-generated outputs:
          </p>
          <ul>
            <li>May contain errors, omissions, or inaccuracies;</li>
            <li>
              Should not be relied upon as a substitute for authoritative study materials, professional
              guidance, or official ETS preparation resources;
            </li>
            <li>
              Are provided "as is" without warranties of accuracy, completeness, or fitness for any
              particular purpose.
            </li>
          </ul>

          <h2>7. Intellectual Property</h2>
          <p>
            All content in the Service — including questions, explanations, design, code, and AI prompts —
            is the property of Dream Enterprises LLC or its licensors. You may not copy, modify,
            distribute, or create derivative works from the Service's content without prior written
            permission.
          </p>

          <h2>8. Disclaimers</h2>
          <p>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
            PURPOSE, AND NON-INFRINGEMENT.
          </p>
          <p>
            We do not guarantee that the Service will be uninterrupted, error-free, or secure, or that
            using the Service will result in any particular exam score or certification outcome.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DREAM ENTERPRISES LLC AND ITS OFFICERS, DIRECTORS,
            EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
            CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
          </p>

          <h2>10. Termination</h2>
          <p>
            We may suspend or terminate your account at any time for any reason, including violation of
            these Terms. You may delete your account at any time by contacting us. Upon termination,
            your right to use the Service ceases immediately.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of Florida, without regard to its conflict
            of law provisions. Any disputes arising under these Terms shall be resolved in the courts
            located in Florida.
          </p>

          <h2>12. Changes to These Terms</h2>
          <p>
            We may update these Terms from time to time. Material changes will be communicated by posting
            the updated Terms with a new "Last Updated" date and, where appropriate, by email or
            in-product notice. Continued use of the Service after changes constitutes acceptance of the
            revised Terms.
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

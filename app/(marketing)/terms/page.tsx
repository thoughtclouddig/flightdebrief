import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "Terms of Service — AfterFlight",
  description: "The terms that govern your use of AfterFlight.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/terms` } : undefined,
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 16, 2026">
      <LegalSection title="Acceptance of Terms">
        <p>
          These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of AfterFlight&rsquo;s website
          and application (the &ldquo;Service&rdquo;). By creating an account or using the Service, you agree to be
          bound by these Terms. If you do not agree, do not use the Service.
        </p>
      </LegalSection>

      <LegalSection title="Description of Service">
        <p>
          AfterFlight helps students and flight instructors capture and structure post-flight debriefs, connect
          feedback to FAA Airman Certification Standards, and prepare for future lessons. AfterFlight is a training
          record and communication tool&mdash;it does not provide flight instruction, does not certify proficiency
          or safety, and does not replace the judgment of a certificated flight instructor.
        </p>
      </LegalSection>

      <LegalSection title="Accounts & Eligibility">
        <p>
          You must provide accurate information when creating an account and are responsible for keeping your
          login credentials secure. Accounts created on behalf of a flight school or organization are subject to
          that organization&rsquo;s administration, including which members can view or manage certain records.
        </p>
      </LegalSection>

      <LegalSection title="Subscriptions, Billing & Cancellation">
        <p>
          Paid plans are billed on the schedule shown at signup (monthly or annual, depending on the plan). You can
          cancel a paid plan at any time; cancellation takes effect at the end of the current billing period. Fees
          are non-refundable except where required by law.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable Use">
        <p>You agree not to:</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>Use the Service for any unlawful purpose or in violation of any applicable regulation.</li>
          <li>Attempt to access accounts, data, or systems you&rsquo;re not authorized to access.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          <li>Misrepresent training records or debrief content.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Instructor & Student Content">
        <p>
          Debrief notes, observations, and related training content you submit remain yours. By submitting content,
          you grant AfterFlight a license to store, structure, and display it back to you and to the other people
          your account or organization gives access to, solely to provide the Service.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property">
        <p>
          The Service, including its design, software, and branding, is owned by AfterFlight and protected by
          applicable intellectual property laws. These Terms do not grant you any rights to AfterFlight&rsquo;s
          trademarks or branding.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <p>
          The Service is provided &ldquo;as is&rdquo; without warranties of any kind. AfterFlight does not guarantee
          that debrief content, ACS connections, or study recommendations are complete or error-free, and nothing in
          the Service should be treated as a substitute for the judgment of a certificated flight instructor or
          for compliance with applicable FAA regulations.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, AfterFlight will not be liable for any indirect, incidental, or
          consequential damages arising from your use of the Service. Our total liability for any claim relating to
          the Service is limited to the amount you paid us in the twelve months before the claim arose.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using the Service and close your account at any time. We may suspend or terminate access to
          the Service if these Terms are violated or if we reasonably believe the Service is being misused.
        </p>
      </LegalSection>

      <LegalSection title="Governing Law">
        <p>These Terms are governed by the laws of the State of Arizona, without regard to conflict-of-law principles.</p>
      </LegalSection>

      <LegalSection title="Changes to These Terms">
        <p>
          We may update these Terms from time to time. Continued use of the Service after a change becomes
          effective means you accept the updated Terms.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
        <p>
          Questions about these Terms can be sent to{" "}
          <a href="mailto:legal@afterflight.app" className="font-semibold text-brand hover:underline">
            legal@afterflight.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

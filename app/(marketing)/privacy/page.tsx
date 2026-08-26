import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/marketing/legal-page";
import { appOrigin } from "@/lib/email";

export const metadata: Metadata = {
  title: "Privacy Policy — AfterFlight",
  description: "How AfterFlight collects, uses, and protects your information.",
  alternates: appOrigin() ? { canonical: `${appOrigin()}/privacy` } : undefined,
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 16, 2026">
      <LegalSection title="Introduction">
        <p>
          This Privacy Policy explains how AfterFlight (&ldquo;AfterFlight,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;) collects, uses, and shares information when you use our website and application
          (together, the &ldquo;Service&rdquo;). By using the Service, you agree to the collection and use of
          information in accordance with this policy.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect">
        <p>We collect information you provide directly, including:</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>Account information, such as your name, email address, and role (student, CFI, or school admin).</li>
          <li>Flight and training information you or your instructor enter, including debrief notes, instructor observations, and lesson records.</li>
          <li>Payment information, processed securely by our payment provider (AfterFlight does not store full card numbers).</li>
          <li>Communications you send us, such as support requests.</li>
        </ul>
        <p>
          We also collect limited technical information automatically, such as device type, browser, and general
          usage patterns, to keep the Service reliable and secure.
        </p>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <p>We use the information we collect to:</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>Provide, maintain, and improve the Service.</li>
          <li>Structure and connect debrief content&mdash;observations, action items, and ACS references&mdash;to a student&rsquo;s training record.</li>
          <li>Communicate with you about your account, billing, and product updates.</li>
          <li>Maintain the security and integrity of the Service.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Flight & Training Data">
        <p>
          Debrief content is created by, and belongs to, the student and instructor who took part in the flight.
          Instructors remain the authority on their students&rsquo; training&mdash;AfterFlight structures and stores
          what an instructor observes; it does not generate or alter training assessments on its own. A student can
          typically see their own training records; instructors can see records for students they train; and school
          administrators can see records for their school, consistent with the permissions of their account.
        </p>
      </LegalSection>

      <LegalSection title="Data Sharing">
        <p>We do not sell your personal information. We share information only:</p>
        <ul className="ml-5 flex list-disc flex-col gap-1.5">
          <li>With service providers who help us operate the Service (for example, hosting and payment processing), under confidentiality obligations.</li>
          <li>Within your flight school or organization, according to the roles and permissions your organization sets.</li>
          <li>When required by law, or to protect the rights, safety, or property of AfterFlight or our users.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Data Retention & Security">
        <p>
          We retain account and training data for as long as your account is active, or as needed to provide the
          Service. We use industry-standard safeguards to protect your information, though no method of
          transmission or storage is completely secure.
        </p>
      </LegalSection>

      <LegalSection title="Your Rights & Choices">
        <p>
          You may access, update, or request deletion of your personal information at any time by contacting us. If
          your account is part of a school or organization, some records may be retained by that organization as
          part of its training records.
        </p>
      </LegalSection>

      <LegalSection title="Children's Privacy">
        <p>
          The Service is intended for flight students, instructors, and school staff, and is not directed at
          children under 13. We do not knowingly collect personal information from children under 13.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. If we make material changes, we will notify you by
          updating the date at the top of this page or through other reasonable means.
        </p>
      </LegalSection>

      <LegalSection title="Contact Us">
        <p>
          Questions about this Privacy Policy can be sent to{" "}
          <a href="mailto:privacy@afterflight.app" className="font-semibold text-brand hover:underline">
            privacy@afterflight.app
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}

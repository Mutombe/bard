"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bard Global Finance Institute (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, mobile applications, and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>

            <h3 className="text-lg font-medium mt-6 mb-3">Personal Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may collect personal information that you voluntarily provide, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Name and email address</li>
              <li>Phone number</li>
              <li>Billing information and payment details</li>
              <li>Profile information and preferences</li>
              <li>Communications you send to us</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Automatically Collected Information</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              When you access our Services, we automatically collect:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Device information (type, operating system, unique identifiers)</li>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>Clickstream data and search queries</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use the collected information for various purposes:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process transactions and send related information</li>
              <li>Send newsletters, marketing communications, and promotional materials</li>
              <li>Respond to your comments, questions, and requests</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues and fraud</li>
              <li>Personalize your experience and deliver relevant content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Information Sharing</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We may share your information in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Service Providers:</strong> With third parties who perform services on our behalf</li>
              <li><strong>Business Transfers:</strong> In connection with any merger, sale, or acquisition</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>With Your Consent:</strong> When you have given us permission to share</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We do not sell your personal information to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to collect information about your browsing activities. You can control cookies through your browser settings, but disabling them may limit your ability to use certain features.
            </p>
            <div className="bg-terminal-bg-secondary rounded-lg border border-terminal-border p-4 mt-4">
              <p className="font-medium mb-2">Types of cookies we use:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 text-sm">
                <li>Essential cookies for site functionality</li>
                <li>Analytics cookies to understand usage patterns</li>
                <li>Preference cookies to remember your settings</li>
                <li>Marketing cookies for relevant advertising</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your information, we will securely delete or anonymize it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Your Rights</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Access and receive a copy of your data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your data</li>
              <li>Object to or restrict processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              To exercise these rights, please contact us at privacy@Bard Global Finance Institute.com.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our Services are not directed to children under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="mt-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
              <p className="text-foreground">Bard Global Finance Institute Privacy Team</p>
              <p className="text-muted-foreground">Email: privacy@Bard Global Finance Institute.com</p>
              <p className="text-muted-foreground">The Towers, Sandton, Johannesburg, South Africa</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-terminal-border">
          <Link href="/" className="text-brand-orange hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}

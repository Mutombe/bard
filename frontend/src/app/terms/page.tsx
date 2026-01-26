"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";

export default function TermsPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: January 2025</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using the Bardiq Journal website, mobile applications, APIs, or any other products or services (collectively, the &quot;Services&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">2. Description of Services</h2>
            <p className="text-muted-foreground leading-relaxed">
              Bardiq Journal provides financial news, market data, analysis, and related content focused on African markets. Our Services include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-4">
              <li>Financial news articles and analysis</li>
              <li>Real-time and delayed market data</li>
              <li>Portfolio tracking and watchlist tools</li>
              <li>Newsletters and podcasts</li>
              <li>Research reports and economic analysis</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To access certain features of our Services, you may need to create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">4. Subscription and Payment</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Some of our Services require a paid subscription. By subscribing, you agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Pay the applicable subscription fees</li>
              <li>Provide valid payment information</li>
              <li>Automatic renewal unless cancelled before the renewal date</li>
              <li>Price changes with reasonable notice</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Refunds are available within 14 days of initial subscription if you are not satisfied with our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              All content on Bardiq Journal, including text, graphics, logos, images, data, and software, is the property of Bardiq Journal or its content suppliers and is protected by copyright, trademark, and other intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">6. Disclaimer of Investment Advice</h2>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-400 font-medium mb-2">Important Notice</p>
              <p className="text-muted-foreground">
                The information provided through our Services is for informational purposes only and does not constitute investment advice, financial advice, trading advice, or any other sort of advice. You should not treat any of the content as such. Bardiq Journal does not recommend that any securities or financial products should be bought, sold, or held by you. Always conduct your own due diligence and consult a licensed financial advisor before making any investment decisions.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">7. Market Data</h2>
            <p className="text-muted-foreground leading-relaxed">
              Market data provided through our Services may be delayed by 15 minutes or more unless otherwise indicated. While we strive to provide accurate data, we do not guarantee the accuracy, completeness, or timeliness of any market data. You acknowledge that trading decisions based on our data are at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Bardiq Journal shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from your use of our Services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">9. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of South Africa, without regard to its conflict of law provisions. Any disputes arising from these Terms shall be resolved in the courts of Johannesburg, South Africa.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes via email or through our Services. Your continued use of our Services after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">11. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us at:
            </p>
            <div className="mt-4 p-4 bg-terminal-bg-secondary rounded-lg border border-terminal-border">
              <p className="text-foreground">Bardiq Journal Legal Department</p>
              <p className="text-muted-foreground">Email: legal@Bardiq Journal.com</p>
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

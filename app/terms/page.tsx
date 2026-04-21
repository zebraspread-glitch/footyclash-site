export default function TermsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl">
        
        <h1 className="text-4xl font-black tracking-tight">
          Terms of Use
        </h1>

        <div className="mt-6 space-y-5 text-base leading-7 text-white/70">

          <p>
            By accessing and using FootyClash ("we", "our", or "us"), you agree to these Terms of Use. 
            If you do not agree, please do not use the site.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            1. Use of the Website
          </h2>
          <p>
            FootyClash is provided for entertainment purposes only. You agree to use the site 
            lawfully and not engage in any activity that could harm, disrupt, or exploit the platform.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            2. Game Features
          </h2>
          <p>
            Our games may include scoring systems, leaderboards, and competitive modes. 
            We do not guarantee accuracy of stats or fairness of gameplay at all times, 
            and features may change or be removed without notice.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            3. Intellectual Property
          </h2>
          <p>
            All content on FootyClash, including design, branding, and code, is owned by us 
            unless otherwise stated. You may not copy, reproduce, or distribute any part 
            of the site without permission.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            4. User Conduct
          </h2>
          <p>
            You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Exploit bugs or manipulate game results</li>
            <li>Attempt to hack or disrupt the site</li>
            <li>Use automated systems or bots to gain an advantage</li>
            <li>Engage in abusive or harmful behavior</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            5. Third-Party Services
          </h2>
          <p>
            We may use third-party services such as analytics and advertising providers. 
            We are not responsible for their content or practices.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            6. Disclaimer
          </h2>
          <p>
            FootyClash is provided "as is" without warranties of any kind. We do not guarantee 
            that the site will always be available, error-free, or secure.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            7. Limitation of Liability
          </h2>
          <p>
            To the fullest extent permitted by law, we are not liable for any damages arising 
            from your use of the site.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            8. Changes to These Terms
          </h2>
          <p>
            We may update these Terms at any time. Continued use of the site means you accept 
            any changes.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            9. Contact
          </h2>
          <p>
            If you have any questions about these Terms, you can contact us at:
          </p>
          <p className="text-blue-400 font-semibold">
            foopyapp@gmail.com
          </p>

          <p className="text-sm text-white/40 mt-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

        </div>
      </div>
    </main>
  );
}
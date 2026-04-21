export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl">
        
        <h1 className="text-4xl font-black tracking-tight">
          Privacy Policy
        </h1>

        <div className="mt-6 space-y-5 text-base leading-7 text-white/70">

          <p>
            This Privacy Policy explains how FootyClash ("we", "our", or "us") 
            collects, uses, and protects your information when you use our website.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            1. Information We Collect
          </h2>
          <p>
            We do not require users to create an account to play. However, we may collect 
            limited non-personal information such as:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Browser type and device information</li>
            <li>Pages visited and time spent on the site</li>
            <li>Game scores stored locally on your device</li>
          </ul>

          <h2 className="text-xl font-semibold text-white mt-6">
            2. Cookies
          </h2>
          <p>
            We may use cookies or similar technologies to improve your experience. 
            These help remember your preferences and track basic usage data.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            3. Google AdSense
          </h2>
          <p>
            We may display ads using Google AdSense. Google uses cookies to show ads 
            based on your visits to this and other websites.
          </p>
          <p>
            You can learn more about how Google uses data here:{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              className="text-blue-400 hover:underline"
            >
              Google Ads Policy
            </a>
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            4. Analytics
          </h2>
          <p>
            We may use analytics tools (such as Vercel Analytics) to understand how 
            users interact with the site. This helps us improve performance and features.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            5. Data Storage
          </h2>
          <p>
            Some game data (such as scores or progress) may be stored locally in your 
            browser. We do not sell or share your personal data with third parties.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            6. Third-Party Links
          </h2>
          <p>
            Our site may contain links to other websites. We are not responsible for 
            the privacy practices of those sites.
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            7. Contact
          </h2>
          <p>
            If you have any questions about this Privacy Policy, you can contact us at:
          </p>
          <p className="text-blue-400 font-semibold">
            foopyapp@gmail.com
          </p>

          <h2 className="text-xl font-semibold text-white mt-6">
            8. Updates
          </h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be 
            posted on this page with an updated effective date.
          </p>

          <p className="text-sm text-white/40 mt-6">
            Last updated: {new Date().toLocaleDateString()}
          </p>

        </div>
      </div>
    </main>
  );
}
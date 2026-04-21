export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl">
        
        <h1 className="text-4xl font-black tracking-tight">
          Contact
        </h1>

        <p className="mt-5 text-base leading-7 text-white/70">
          Got a question, bug report, or suggestion? I’d love to hear from you.
        </p>

        <p className="mt-3 text-base leading-7 text-white/70">
          Whether it’s feedback about the game, issues with stats, or ideas for new modes — feel free to reach out anytime.
        </p>

        {/* EMAIL BOX */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-white/50">
            Email
          </p>

          <a
            href="mailto:foopyapp@gmail.com"
            className="mt-2 block text-lg font-semibold text-blue-400 hover:text-blue-300 transition"
          >
            foopyapp@gmail.com
          </a>
        </div>

        {/* EXTRA INFO */}
        <div className="mt-8 space-y-3 text-sm text-white/50">
          <p>• Response time is usually within 24–48 hours</p>
          <p>• For fastest help, include screenshots if reporting a bug</p>
          <p>• Make sure you're on the latest version of the site</p>
        </div>

      </div>
    </main>
  );
}
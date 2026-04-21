export default function AboutPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl">
        <h1 className="text-4xl font-black tracking-tight">About FootyClash</h1>

        <div className="mt-6 space-y-5 text-base leading-7 text-white/70">
          <p>
            FootyClash is a footy game website built for fans who want something fast,
            competitive, and fun to replay.
          </p>

          <p>
            The site is focused on draft-style gameplay, player knowledge, and simple
            head-to-head modes that are easy to jump into but hard to master.
          </p>

          <p>
            Whether you are playing solo, against a friend, or testing yourself in
            different game modes, FootyClash is designed to make every round feel quick,
            clean, and competitive.
          </p>

          <h2 className="pt-2 text-xl font-semibold text-white">What FootyClash offers</h2>
          <ul className="list-disc space-y-1 pl-5 text-white/70">
            <li>Fast and replayable footy game modes</li>
            <li>Competitive draft-style gameplay</li>
            <li>Simple, clean, mobile-friendly design</li>
            <li>Regular updates and improvements</li>
          </ul>

          <h2 className="pt-2 text-xl font-semibold text-white">Our goal</h2>
          <p>
            The goal of FootyClash is to create a fun and polished footy experience
            that feels modern, competitive, and easy for anyone to enjoy.
          </p>

          <p>
            If you have feedback, ideas, or find an issue on the site, you can get in
            touch anytime at{" "}
            <a
              href="mailto:foopyapp@gmail.com"
              className="font-semibold text-blue-400 transition hover:text-blue-300"
            >
              foopyapp@gmail.com
            </a>
            .
          </p>

          <p className="pt-2 text-sm text-white/40">
            Thanks for playing FootyClash.
          </p>
        </div>
      </div>
    </main>
  );
}
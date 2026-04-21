export default function HowToPlayPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl">
        
        <h1 className="text-4xl font-black tracking-tight">
          How to Play
        </h1>

        <p className="mt-5 text-base leading-7 text-white/70">
          Pick a mode, draft your team, and try to score higher than your opponent.
          Each mode offers a different way to play.
        </p>

        {/* SOLO */}
        <div className="mt-8 rounded-2xl bg-blue-600/90 p-6">
          <h2 className="text-2xl font-bold">Solo</h2>
          <p className="mt-2 text-white/90">
            Play by yourself and try to beat your best score.
          </p>
          <ul className="mt-3 list-disc pl-5 text-white/90">
            <li>Draft a full team</li>
            <li>Score as many points as possible</li>
            <li>Keep replaying to improve</li>
          </ul>
        </div>

        {/* LOCAL */}
        <div className="mt-6 rounded-2xl bg-purple-600/90 p-6">
          <h2 className="text-2xl font-bold">Local</h2>
          <p className="mt-2 text-white/90">
            Play against a friend on the same device.
          </p>
          <ul className="mt-3 list-disc pl-5 text-white/90">
            <li>Take turns drafting players</li>
            <li>Build your teams side-by-side</li>
            <li>Highest score wins</li>
          </ul>
        </div>

        {/* AI */}
        <div className="mt-6 rounded-2xl bg-orange-500/90 p-6">
          <h2 className="text-2xl font-bold">AI</h2>
          <p className="mt-2 text-white/90">
            Play against the computer in a draft battle.
          </p>
          <ul className="mt-3 list-disc pl-5 text-white/90">
            <li>The AI picks players automatically</li>
            <li>Try to out-draft it</li>
            <li>Higher score wins</li>
          </ul>
        </div>

        {/* ONLINE */}
        <div className="mt-6 rounded-2xl bg-green-600/90 p-6">
          <h2 className="text-2xl font-bold">Online</h2>
          <p className="mt-2 text-white/90">
            Play against other players in live matches.
          </p>
          <ul className="mt-3 list-disc pl-5 text-white/90">
            <li>Join or create a game</li>
            <li>Draft in real time</li>
            <li>Beat real opponents</li>
          </ul>
        </div>

        {/* HOW TO WIN */}
        <div className="mt-10 text-white/70">
          <h2 className="text-xl font-semibold text-white">How to Win</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1">
            <li>Pick the best players available</li>
            <li>Think ahead during drafts</li>
            <li>Adapt to the mode you are playing</li>
          </ul>
        </div>

      </div>
    </main>
  );
}
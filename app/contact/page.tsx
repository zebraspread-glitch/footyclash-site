import Image from "next/image";
import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 text-white sm:px-8 lg:px-12">
      <div className="rounded-3xl border border-white/10 bg-[#0D0D0D] p-8 shadow-2xl">
        <h1 className="text-4xl font-black tracking-tight">Contact</h1>

        <p className="mt-5 text-base leading-7 text-white/70">
          Got a question, bug report, or suggestion? I’d love to hear from you.
        </p>

        <p className="mt-3 text-base leading-7 text-white/70">
          Whether it’s feedback about the game, issues with stats, or ideas for
          new modes — feel free to reach out anytime.
        </p>

        <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-6 text-center">
          <p className="text-sm uppercase tracking-wide text-white/50">Email</p>

          <a
            href="mailto:foopyapp@gmail.com"
            className="mt-2 block text-lg font-semibold text-blue-400 transition hover:text-blue-300"
          >
            foopyapp@gmail.com
          </a>
        </div>

        <div className="mt-10 flex justify-center">
          <Link href="/fnd" className="block w-full max-w-md">
            <div className="group relative h-32 w-full overflow-hidden rounded-[40px] border border-white/10 bg-black/40 transition hover:border-white/20">
              <Image
                src="/dalts.jpg"
                alt="Hidden"
                fill
                className="object-cover opacity-80 transition duration-300 group-hover:scale-105 group-hover:opacity-100"
                sizes="(max-width: 768px) 100vw, 448px"
                priority
              />
              <div className="absolute inset-0 bg-black/30 transition group-hover:bg-black/20" />
            </div>
          </Link>
        </div>

        <div className="mt-8 space-y-3 text-sm text-white/50">
          <p>• Response time is usually within 24–48 hours</p>
          <p>• For fastest help, include screenshots if reporting a bug</p>
          <p>• Make sure you&apos;re on the latest version of the site</p>
        </div>
      </div>
    </main>
  );
}
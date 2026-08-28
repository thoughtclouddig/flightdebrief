import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "AfterFlight",
  robots: { index: false, follow: false },
};

export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f5f6] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Image
          src="/brand/afterflight-lockup-dark.svg"
          alt="AfterFlight"
          width={166}
          height={26}
          priority
          className="mx-auto h-6 w-auto"
        />
        <p className="mt-6 text-sm text-[#56636f]">This site is private. Enter the access code to continue.</p>

        <form action="/api/gate" method="POST" className="mt-6 flex flex-col gap-3">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <input
            type="password"
            name="code"
            autoFocus
            autoComplete="off"
            placeholder="Access code"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-center text-sm text-[#101727] outline-none focus:border-brand"
          />
          {error ? <p className="text-sm font-medium text-[#c0362b]">That code isn&rsquo;t right. Try again.</p> : null}
          <button
            type="submit"
            className="rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-bright"
          >
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

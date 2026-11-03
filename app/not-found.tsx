import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page flex max-w-3xl flex-col items-center pt-24 text-center">
      <h1 className="text-[36px] font-[350] leading-none tracking-[-0.04em]">Page not found</h1>
      <Link href="/" className="mt-5 text-sm text-t3 underline decoration-line-strong underline-offset-4 hover:text-foreground">Back to the rich list</Link>
    </div>
  );
}

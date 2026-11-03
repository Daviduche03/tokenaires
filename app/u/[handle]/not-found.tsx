import Link from "next/link";
import { InstallCommand } from "@/components/home/install-command";

export default function ProfileNotFound() {
  return (
    <div className="page flex max-w-3xl flex-col items-center pt-24 text-center">
      <h1 className="text-[36px] font-[350] leading-none tracking-[-0.04em]">Not on the list yet</h1>
      <p className="mt-3 max-w-sm text-sm text-t3">This developer has not synced any usage. If it is you, run the command and you will show up here.</p>
      <InstallCommand className="mt-6" />
      <Link href="/" className="mt-6 text-sm text-t3 underline decoration-line-strong underline-offset-4 hover:text-foreground">Back to the rich list</Link>
    </div>
  );
}

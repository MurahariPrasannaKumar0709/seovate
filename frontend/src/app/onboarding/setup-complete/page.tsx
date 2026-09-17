import { LinkButton } from "@/components/ui/Button";
import { SketchBox } from "@/components/ui/SketchBox";
import { IconCheck, IconSpinner } from "@/components/ui/Icons";
import { CUSTOMER } from "@/lib/mockData";

export default function SetupCompletePage() {
  return (
    <main className="flex flex-1 flex-col items-center bg-paper px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-accent-soft">
        <IconCheck size={30} />
      </div>
      <h1 className="mt-6 text-[30px] font-bold">You&apos;re all set, {CUSTOMER.ownerFirstName}.</h1>
      <p className="mt-3 max-w-[560px] text-muted">
        Seovate is now watching {CUSTOMER.domain}. No dashboard to check — we&apos;ll email you
        every week, and you can see everything live in your public activity log.
      </p>

      <SketchBox className="mt-8 w-full max-w-[560px] p-6 text-left">
        <h2 className="font-bold">Connected</h2>
        <ul className="mt-4 flex flex-col gap-3 text-sm">
          <li className="flex items-center gap-2">
            <IconCheck size={16} /> Website — {CUSTOMER.domain}
          </li>
          <li className="flex items-center gap-2">
            <IconCheck size={16} /> Google Search Console
          </li>
        </ul>
        <div className="my-4 h-px bg-[#eeece2]" />
        <div className="flex items-center gap-2 text-sm text-muted">
          <IconSpinner size={16} />
          First full site scan running — usually done within 48 hours
        </div>
      </SketchBox>

      <div className="mt-8 flex items-center gap-4">
        <LinkButton href="/activity">View activity log</LinkButton>
        <LinkButton href="/settings/integrations" variant="ghost">
          Go to settings
        </LinkButton>
      </div>
    </main>
  );
}

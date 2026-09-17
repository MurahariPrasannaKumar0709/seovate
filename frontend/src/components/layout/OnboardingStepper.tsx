import Logo from "@/components/ui/Logo";

const STEPS = [
  { n: 1, title: "Connect your website", sub: "Verify your domain" },
  { n: 2, title: "Connect integrations", sub: "Search Console, Analytics, GBP, GitHub" },
  { n: 3, title: "Business profile", sub: "Services, locations, a few questions" },
  { n: 4, title: "Setup complete", sub: "First scan starts automatically" },
];

export default function OnboardingStepper({ activeStep }: { activeStep: number }) {
  return (
    <aside className="w-full shrink-0 lg:w-[280px]">
      <Logo />
      <ol className="mt-10 flex flex-col">
        {STEPS.map((step, i) => {
          const isActive = step.n === activeStep;
          const isDone = step.n < activeStep;
          return (
            <li key={step.n} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isActive || isDone
                      ? "bg-accent text-white"
                      : "border-2 border-[#c9c7ba] text-[#c9c7ba]"
                  }`}
                >
                  {step.n}
                </div>
                {i !== STEPS.length - 1 && (
                  <div className="my-1 h-10 w-[2px] bg-[#d8d6ca]" />
                )}
              </div>
              <div className={`pb-8 ${isActive ? "" : "opacity-60"}`}>
                <div className="font-bold">{step.title}</div>
                <div className="text-sm text-muted">{step.sub}</div>
              </div>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
      <div className="h-64 rounded-[2rem] bg-slate-200 dark:bg-white/10" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => <div key={item} className="h-32 rounded-3xl bg-slate-200 dark:bg-white/10" />)}
      </div>
    </div>
  );
}


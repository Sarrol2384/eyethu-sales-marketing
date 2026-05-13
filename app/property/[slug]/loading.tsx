import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyLoading() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4 sm:px-6 sm:pt-6">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="aspect-[4/3] w-full sm:aspect-[16/9]" />
      <div className="mt-6 flex flex-wrap gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </main>
  );
}

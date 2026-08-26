import { Skeleton, KpiSkeletonRow } from "@/components/comun/Skeleton";

export default function DashboardLoading() {
  return (
    <>
      <div className="mb-10 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <KpiSkeletonRow />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-[400px] rounded-2xl lg:col-span-1" />
        <Skeleton className="h-[400px] rounded-2xl lg:col-span-2" />
      </div>
    </>
  );
}

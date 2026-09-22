import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
    return (
        <div aria-busy="true" aria-label="Cargando" className="w-full space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-72" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map(index => <Skeleton key={index} className="h-28 rounded-xl" />)}
            </div>

            <Skeleton className="h-72 rounded-xl" />
        </div>
    );
}

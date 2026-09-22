"use client";

import { usePathname } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

function HeaderSkeleton({ action = false }: { action?: boolean }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div className="space-y-2"><Skeleton className="h-8 w-44 sm:w-56"/><Skeleton className="h-4 w-64 max-w-[80vw] sm:w-80"/></div>{action&&<Skeleton className="h-10 w-full rounded-xl sm:w-36"/>}</div>;
}

function QuickActionsSkeleton({ count = 4 }: { count?: number }) {
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:count}).map((_,i)=><div key={i} className="rounded-2xl bg-card p-4 shadow-sm"><div className="flex items-start justify-between"><Skeleton className="size-10 rounded-xl"/><Skeleton className="size-4"/></div><Skeleton className="mt-4 h-4 w-28"/><Skeleton className="mt-2 h-3 w-40 max-w-full"/></div>)}</div>;
}

function TableSkeleton({ rows = 7, columns = 6, search = false, action = false }: { rows?: number; columns?: number; search?: boolean; action?: boolean }) {
  return <div className="space-y-6"><HeaderSkeleton action={action}/>{search&&<Skeleton className="h-10 w-full max-w-xl rounded-xl"/>}<div className="overflow-hidden rounded-2xl bg-card shadow-sm"><div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid gap-4 bg-muted/35 px-5 py-4" style={{gridTemplateColumns:`repeat(${columns},minmax(90px,1fr))`}}>{Array.from({length:columns}).map((_,i)=><Skeleton key={i} className="h-3 w-20"/>)}</div>{Array.from({length:rows}).map((_,r)=><div key={r} className="grid gap-4 px-5 py-4" style={{gridTemplateColumns:`repeat(${columns},minmax(90px,1fr))`}}>{Array.from({length:columns}).map((_,c)=><Skeleton key={c} className={`h-4 ${c===0?"w-28":"w-20"}`}/>)}</div>)}</div></div></div></div>;
}

function ModuleTableSkeleton({ actions = 4, columns = 6, search = false }: { actions?: number; columns?: number; search?: boolean }) {
  return <div className="w-full space-y-6"><HeaderSkeleton/><QuickActionsSkeleton count={actions}/>{search&&<Skeleton className="h-10 w-full max-w-xl rounded-xl"/>}<div className="overflow-hidden rounded-2xl bg-card shadow-sm"><div className="overflow-x-auto"><div className="min-w-[760px]"><div className="grid gap-4 bg-muted/35 px-5 py-4" style={{gridTemplateColumns:`repeat(${columns},minmax(90px,1fr))`}}>{Array.from({length:columns}).map((_,i)=><Skeleton key={i} className="h-3 w-20"/>)}</div>{Array.from({length:6}).map((_,r)=><div key={r} className="grid gap-4 px-5 py-4" style={{gridTemplateColumns:`repeat(${columns},minmax(90px,1fr))`}}>{Array.from({length:columns}).map((_,c)=><Skeleton key={c} className="h-4 w-20"/>)}</div>)}</div></div></div></div>;
}

function FormSkeleton({ sections = 2 }: { sections?: number }) {
  return <div className="w-full space-y-6"><HeaderSkeleton/>{Array.from({length:sections}).map((_,s)=><div key={s} className="rounded-2xl bg-card p-4 shadow-sm sm:p-6"><Skeleton className="h-5 w-40"/><Skeleton className="mt-2 h-3 w-64 max-w-full"/><div className="mt-6 grid gap-4 sm:grid-cols-2">{Array.from({length:6}).map((_,i)=><div key={i} className={i===5?"sm:col-span-2":""}><Skeleton className="mb-2 h-3 w-24"/><Skeleton className="h-10 w-full rounded-xl"/></div>)}</div></div>)}</div>;
}

function ReportsSkeleton() {
  return <div className="w-full space-y-6"><HeaderSkeleton/><div className="grid gap-4 sm:grid-cols-3">{Array.from({length:3}).map((_,i)=><div key={i} className="rounded-2xl bg-card p-5 shadow-sm"><div className="flex justify-between gap-3"><div className="space-y-3"><Skeleton className="h-4 w-20"/><Skeleton className="h-8 w-32"/><Skeleton className="h-3 w-36"/></div><Skeleton className="size-9 rounded-lg"/></div></div>)}</div><Skeleton className="h-4 w-full max-w-2xl"/></div>;
}

function ImportSkeleton() {
  return <div className="w-full space-y-6"><HeaderSkeleton action/><div className="rounded-2xl bg-card p-4 shadow-sm sm:p-6"><Skeleton className="h-5 w-52"/><Skeleton className="mt-2 h-4 w-72 max-w-full"/><Skeleton className="mt-6 h-64 w-full rounded-2xl"/></div></div>;
}

function PosSkeleton() {
  return <div className="w-full space-y-6"><HeaderSkeleton/><div className="grid gap-5 xl:grid-cols-[.8fr_1.4fr_.9fr]"><div className="space-y-4"><Skeleton className="h-11 w-full rounded-xl"/><Skeleton className="h-10 w-full rounded-xl"/>{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-20 w-full rounded-xl"/>)}</div><Skeleton className="min-h-[420px] rounded-2xl"/><Skeleton className="min-h-[460px] rounded-2xl"/></div></div>;
}

export default function Loading() {
  const path=usePathname();
  if(path==="/sales") return <ModuleTableSkeleton actions={4} columns={6}/>;
  if(path==="/purchases") return <ModuleTableSkeleton actions={2} columns={5}/>;
  if(path==="/products") return <ModuleTableSkeleton actions={5} columns={5} search/>;
  if(path==="/pos") return <PosSkeleton/>;
  if(path==="/reports") return <ReportsSkeleton/>;
  if(path==="/imports") return <ImportSkeleton/>;
  if(path==="/settings"||path==="/profile") return <FormSkeleton sections={2}/>;
  if(path==="/sales/new"||path==="/purchases/new"||path==="/products/new"||path.startsWith("/products/")) return <FormSkeleton sections={2}/>;
  if(path==="/audit") return <TableSkeleton columns={6}/>;
  if(path==="/inventory"||path==="/credits"||path==="/expenses"||path==="/users"||path.startsWith("/manage/")) return <TableSkeleton columns={6} search action/>;
  if(path==="/finance"||path==="/management") return <div className="w-full space-y-6"><HeaderSkeleton/><QuickActionsSkeleton count={4}/></div>;
  if(path==="/cash"||path==="/operations") return <FormSkeleton sections={2}/>;
  if(path==="/dashboard") return <div className="w-full space-y-6"><HeaderSkeleton/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-28 rounded-2xl"/>)}</div><div className="grid gap-4 xl:grid-cols-2"><Skeleton className="h-80 rounded-2xl"/><Skeleton className="h-80 rounded-2xl"/></div></div>;
  return <div className="w-full space-y-6"><HeaderSkeleton/><Skeleton className="h-72 rounded-2xl"/></div>;
}

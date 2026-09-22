import { VerifyForm } from "@/components/verify-form";
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { const { token } = await searchParams; return <VerifyForm token={token ?? ""}/>; }

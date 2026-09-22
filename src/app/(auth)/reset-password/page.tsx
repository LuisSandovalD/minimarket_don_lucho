import { RecoveryForm } from "@/components/recovery-form";

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
    const { token } = await searchParams;

    return <div className="flex w-full items-center justify-center">
        {token ? <RecoveryForm token={token} /> : <div className="w-full max-w-sm text-center">
            <p className="text-sm text-muted-foreground">Falta el enlace de recuperación.</p>
        </div>}
    </div>;
}
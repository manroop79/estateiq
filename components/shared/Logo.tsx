export function Logo(){
    return (
        <div className="flex items-center gap-2">
            <div
                className="h-7 w-7 rounded-lg"
                style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-2))" }}
            />
            <div className="leading-tight">
                <span className="font-semibold">EstateIQ</span>
                <div className="text-xs text-[var(--muted)]">KYC & Legal</div>
            </div>
            {/* End of inner content */}
        </div>
    );
}
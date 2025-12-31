interface PanelSectionProps {
    title: string;
    children: React.ReactNode;
    showDivider?: boolean;
}

export function PanelSection({ title, children, showDivider = true }: PanelSectionProps) {
    return (
        <>
            <div>
                <h3 className="text-[#F5F5F5] text-sm font-semibold mb-3 tracking-wide">{title}</h3>
                <div className="flex flex-col gap-2">{children}</div>
            </div>
            {showDivider && <div className="border-t border-[#F5F5F5]/10"></div>}
        </>
    );
}

interface ToolCardProps {
    name: string;
    description: string;
    status: 'Available' | 'Avalable' | 'Coming Soon';
    color: string;
    onClick?: () => void;
    disabled?: boolean;
}

export function ToolCard({
    name,
    description,
    status,
    color,
    onClick,
    disabled = false,
}: ToolCardProps) {
    const isDisabled = disabled || status === 'Coming Soon';

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`text-left p-6 border border-[#F5F5F5]/10 hover:border-[#F5F5F5]/20 transition-all group ${
                isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'
            }`}
            style={{
                background: `linear-gradient(135deg, ${color}15 0%, transparent 100%)`,
            }}
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                />
                <span className="text-[#F5F5F5]/30 text-xs font-medium tracking-wider">
                    {status.toUpperCase()}
                </span>
            </div>
            <h4 className="text-[#F5F5F5] text-base font-medium mb-2 group-hover:text-[#F5F5F5] transition-colors">
                {name}
            </h4>
            <p className="text-[#F5F5F5]/50 text-sm leading-relaxed">
                {description}
            </p>
        </button>
    );
}

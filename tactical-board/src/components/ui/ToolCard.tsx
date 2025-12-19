interface ToolCardProps {
    name: string;
    description: string;
    status: 'Available' | 'Avalable' | 'Coming Soon';
    color: string;
    onClick?: () => void;
    disabled?: boolean;
    isLiked?: boolean;
    onLikeToggle?: () => void;
    showLikeButton?: boolean;
}

export function ToolCard({
    name,
    description,
    status,
    color,
    onClick,
    disabled = false,
    isLiked = false,
    onLikeToggle,
    showLikeButton = false,
}: ToolCardProps) {
    const isDisabled = disabled || status === 'Coming Soon';

    const handleLikeClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering onClick
        if (onLikeToggle) {
            onLikeToggle();
        }
    };

    const handleCardClick = () => {
        if (!isDisabled && onClick) {
            onClick();
        }
    };

    return (
        <div
            onClick={handleCardClick}
            className={`relative w-full h-full text-left p-6 border border-[#F5F5F5]/10 hover:border-[#F5F5F5]/20 transition-all group flex flex-col ${
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
                <div className="flex items-center gap-3">
                    <span className="text-[#F5F5F5]/30 text-xs font-medium tracking-wider">
                        {status.toUpperCase()}
                    </span>
                    {showLikeButton && (
                        <button
                            onClick={handleLikeClick}
                            className="p-1 hover:scale-110 transition-transform z-10"
                            title={isLiked ? "Unlike this tool" : "Like this tool"}
                        >
                            {isLiked ? (
                                <svg className="w-4 h-4 text-[#F5F5F5] fill-current drop-shadow-lg" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4 text-[#F5F5F5]/30 hover:text-[#F5F5F5]/60 transition-colors" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </div>
            <h4 className="text-[#F5F5F5] text-base font-medium mb-2 group-hover:text-[#F5F5F5] transition-colors">
                {name}
            </h4>
            <p className="text-[#F5F5F5]/50 text-sm leading-relaxed flex-1">
                {description}
            </p>
        </div>
    );
}

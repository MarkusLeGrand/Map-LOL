interface TeamCardProps {
  name: string;
  tag?: string;
  description?: string;
  memberCount: number;
  maxMembers: string;
  color: string;
  createdAt: string;
  onRequestJoin?: () => void;
}

export function TeamCard({
  name,
  tag,
  description,
  memberCount,
  maxMembers,
  color,
  createdAt,
  onRequestJoin,
}: TeamCardProps) {
  return (
    <div className="group relative bg-[#1A1A1A] border border-[#F5F5F5]/10 p-6 hover:border-[#F5F5F5]/30 transition-all h-full flex flex-col"
    >
      {/* Tag Badge */}
      {tag && (
        <div className="absolute top-4 right-4">
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{
              color: color,
              backgroundColor: `${color}20`,
            }}
          >
            {tag}
          </span>
        </div>
      )}

      {/* Team Name */}
      <h3 className="text-[#F5F5F5] text-xl font-semibold mb-3 group-hover:text-[#3D7A5F] transition-colors pr-16">
        {name}
      </h3>

      {/* Description */}
      {description ? (
        <p className="text-[#F5F5F5]/60 text-sm mb-auto line-clamp-3">
          {description}
        </p>
      ) : (
        <p className="text-[#F5F5F5]/40 text-sm mb-auto italic">
          No description
        </p>
      )}

      {/* Stats Row */}
      <div className="mt-4 pt-4 border-t border-[#F5F5F5]/10">
        <div className="flex items-center justify-between text-sm mb-3">
          <div className="flex items-center gap-2 text-[#F5F5F5]/60">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span>{memberCount}/{maxMembers}</span>
          </div>
          <span className="text-[#F5F5F5]/40 text-xs">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        </div>

        {/* Join Request Button */}
        {onRequestJoin && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestJoin();
            }}
            className="w-full bg-[#3D7A5F] hover:bg-[#3D7A5F]/90 text-[#F5F5F5] font-medium py-2 px-4 transition-colors"
          >
            Request to Join
          </button>
        )}
      </div>
    </div>
  );
}

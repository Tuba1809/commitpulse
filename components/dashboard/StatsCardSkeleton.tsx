'use client';

export default function StatsCardSkeleton() {
  return (
    <div className="p-6 rounded-xl bg-[#0a0a0a] border border-[rgba(255,255,255,0.08)] overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-3">
          <div className="h-3 w-24 shimmer rounded" />
          <div className="h-8 w-32 shimmer rounded" />
          <div className="h-3 w-36 shimmer rounded" />
        </div>
        <div className="h-9 w-9 rounded-lg shimmer" />
      </div>

      <div className="w-full h-8 flex items-end justify-between gap-px opacity-30">
        {Array.from({ length: 12 }).map((_, i) => (
          <div 
            key={i} 
            className="flex-1 shimmer rounded-t-[1px]" 
            style={{ height: `${Math.random() * 60 + 10}%` }} 
          />
        ))}
      </div>
    </div>
  );
}
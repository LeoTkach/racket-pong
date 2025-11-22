import React from "react";

interface TournamentCardSkeletonProps {
    index?: number;
    delay?: number;
}

// Компонент скелетона с встроенной анимацией Tailwind (как в LeaderboardSkeleton)
const ShimmerSkeleton = ({ className, style, ...props }: React.ComponentProps<"div">) => {
    return (
        <div
            className={`rounded-md animate-pulse ${className}`}
            style={{
                backgroundColor: 'var(--muted-foreground)',
                opacity: 0.15,
                ...style
            }}
            {...props}
        />
    );
};

export function TournamentCardSkeleton({ index = 0, delay = 0 }: TournamentCardSkeletonProps) {
    return (
        <div
            className="group relative overflow-hidden rounded-2xl w-full bg-muted/50 border border-border"
            style={{
                height: '520px',
                minHeight: '520px',
                maxHeight: '520px',
            }}
        >
            {/* Status Badge Skeleton */}
            <ShimmerSkeleton
                className="absolute top-0 right-0"
                style={{
                    zIndex: 40,
                    width: '100px',
                    height: '32px',
                    borderBottomLeftRadius: '0.75rem',
                    borderTopLeftRadius: '0',
                    borderBottomRightRadius: '0'
                }}
            />

            {/* Content Area */}
            <div className="relative h-full flex flex-col justify-end p-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        {/* Badges Skeleton - два бейджа рядом */}
                        <div className="flex gap-2">
                            <ShimmerSkeleton
                                className="h-7 rounded"
                                style={{
                                    width: '90px',
                                    minWidth: '90px'
                                }}
                            />
                            <ShimmerSkeleton
                                className="h-7 rounded"
                                style={{
                                    width: '100px',
                                    minWidth: '100px'
                                }}
                            />
                        </div>

                        {/* Title Skeleton - название турнира (2 строки) */}
                        <div className="space-y-2">
                            <ShimmerSkeleton
                                className="h-7 rounded"
                                style={{
                                    width: '100%',
                                    minHeight: '28px'
                                }}
                            />
                            <ShimmerSkeleton
                                className="h-7 rounded"
                                style={{
                                    width: '75%',
                                    minHeight: '28px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Info Grid Skeleton - данные турнира */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Дата с иконкой */}
                        <div className="flex items-center gap-2">
                            <ShimmerSkeleton
                                className="w-4 h-4 rounded"
                            />
                            <ShimmerSkeleton
                                className="h-5 rounded flex-1"
                                style={{
                                    minWidth: '80px'
                                }}
                            />
                        </div>
                        {/* Время с иконкой */}
                        <div className="flex items-center gap-2">
                            <ShimmerSkeleton
                                className="w-4 h-4 rounded"
                            />
                            <ShimmerSkeleton
                                className="h-5 rounded flex-1"
                                style={{
                                    minWidth: '70px'
                                }}
                            />
                        </div>
                        {/* Локация с иконкой (на всю ширину) */}
                        <div className="flex items-center gap-2 col-span-2">
                            <ShimmerSkeleton
                                className="w-4 h-4 rounded"
                            />
                            <ShimmerSkeleton
                                className="h-5 rounded flex-1"
                                style={{
                                    minWidth: '120px'
                                }}
                            />
                        </div>
                    </div>

                    {/* Button Skeleton - кнопка View Details */}
                    <ShimmerSkeleton
                        className="w-full h-10 rounded-md"
                        style={{
                            minHeight: '40px'
                        }}
                    />
                </div>
            </div>
        </div>
    );
}

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../ui/card";
import { Skeleton } from "../../ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";

// Компонент скелетона с встроенной анимацией Tailwind
const ShimmerSkeleton = ({ className, ...props }: React.ComponentProps<"div">) => {
  return (
    <div
      className={`bg-muted/50 rounded-md animate-pulse ${className}`}
      {...props}
    />
  );
};

export function LeaderboardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Rankings
        </CardTitle>
        <CardDescription>
          Current player rankings based on rating and performance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto min-h-[600px]">
          <Table className="w-full" style={{ tableLayout: 'fixed' }}>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }}>
                  Rank
                </TableHead>
                <TableHead style={{ width: '192px', minWidth: '192px', maxWidth: '192px' }}>
                  Player
                </TableHead>
                <TableHead style={{ width: '96px', minWidth: '96px', maxWidth: '96px' }}>
                  Country
                </TableHead>
                <TableHead style={{ width: '64px', minWidth: '64px', maxWidth: '64px' }} className="text-center">
                  Games
                </TableHead>
                <TableHead style={{ width: '96px', minWidth: '96px', maxWidth: '96px' }} className="text-center">
                  Wins/Losses
                </TableHead>
                <TableHead style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                  Win Rate
                </TableHead>
                <TableHead style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }} className="text-right">
                  Rating
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }, (_, i) => (
                <TableRow key={i}>
                  {/* Rank */}
                  <TableCell className="font-medium">
                    <ShimmerSkeleton className="w-6 h-6" />
                  </TableCell>
                  
                  {/* Player */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                        <ShimmerSkeleton className="w-8 h-8 rounded-full" />
                      </div>
                      <div className="flex-1">
                        <ShimmerSkeleton className="w-24 h-4 mb-1" />
                        <ShimmerSkeleton className="w-16 h-3" />
                      </div>
                    </div>
                  </TableCell>
                  
                  {/* Country */}
                  <TableCell>
                    <ShimmerSkeleton className="w-16 h-6 rounded-md" />
                  </TableCell>
                  
                  {/* Games */}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <ShimmerSkeleton className="w-8 h-4" />
                    </div>
                  </TableCell>
                  
                  {/* Wins/Losses */}
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <ShimmerSkeleton className="w-12 h-4" />
                    </div>
                  </TableCell>
                  
                  {/* Win Rate */}
                  <TableCell>
                    <div className="inline-flex items-center px-2 py-1 rounded-md bg-muted/50">
                      <ShimmerSkeleton className="w-8 h-4" />
                    </div>
                  </TableCell>
                  
                  {/* Rating */}
                  <TableCell className="text-right font-mono">
                    <div className="flex justify-end">
                      <ShimmerSkeleton className="w-12 h-4" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Skeleton */}
        <div className="flex flex-col items-center gap-4 mt-6">
          {/* Showing X to Y of Z players skeleton */}
          <ShimmerSkeleton 
            className="w-48 h-6" 
            style={{ 
              width: '192px',
              height: '24px'
            }}
          />
          
          <div className="flex items-center gap-2">
            <ShimmerSkeleton className="w-16 h-8 rounded-md" />
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <ShimmerSkeleton key={i} className="w-8 h-8 rounded-md" />
              ))}
            </div>
            <ShimmerSkeleton className="w-16 h-8 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

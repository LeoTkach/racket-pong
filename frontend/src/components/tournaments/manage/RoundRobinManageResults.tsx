import React, { useState, useRef, useLayoutEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoundRobinTable } from "../RoundRobinTable";
import { GroupStandingsTable } from "../GroupStandingsTable";

interface RoundRobinManageResultsProps {
  tournamentId: number;
  tournament: any;
  participants: any[];
  matches: any[];
  matchFormat: "best-of-1" | "best-of-3" | "best-of-5";
  rrPlayers: string[];
  rrResults: { [key: string]: string };
  selectedRRPlayer: string | null;
  onUpdateResult: (player1: string, player2: string, score: string) => Promise<void>;
  onSelectedPlayerChange: (player: string | null) => void;
  recommendedMatchToSelect: { player1: string; player2: string } | null;
  onRecommendedMatchClick: (player1: string, player2: string) => void;
  onSidebarMatchHandled: () => void;
  sidebarCardRef: React.RefObject<HTMLDivElement>;
}

export function RoundRobinManageResults({
  tournament,
  participants,
  matchFormat,
  rrPlayers,
  rrResults,
  selectedRRPlayer,
  onUpdateResult,
  onSelectedPlayerChange,
  recommendedMatchToSelect,
  onRecommendedMatchClick,
  onSidebarMatchHandled,
  sidebarCardRef
}: RoundRobinManageResultsProps) {
  // Sync sidebar height with Results Table
  useLayoutEffect(() => {
    const syncHeight = () => {
      const resultsCard = document.getElementById("results-table-card");
      const sidebarCard = sidebarCardRef.current;
      
      if (resultsCard && sidebarCard) {
        const resultsRect = resultsCard.getBoundingClientRect();
        const resultsHeight = resultsRect.height;
        
        sidebarCard.style.height = `${resultsHeight}px`;
        sidebarCard.style.maxHeight = `${resultsHeight}px`;
        sidebarCard.style.minHeight = `${resultsHeight}px`;
        sidebarCard.style.boxSizing = 'border-box';
        sidebarCard.style.overflow = 'hidden';
        sidebarCard.style.display = 'flex';
        sidebarCard.style.alignSelf = 'stretch';
        
        const cardContent = sidebarCard.querySelector('[data-slot="card-content"]') as HTMLElement;
        const cardHeader = sidebarCard.querySelector('[data-slot="card-header"]') as HTMLElement;
        if (cardContent && cardHeader) {
          const headerRect = cardHeader.getBoundingClientRect();
          const headerHeight = headerRect.height;
          const cardGap = 24;
          const contentHeight = Math.max(0, resultsHeight - headerHeight - cardGap);
          cardContent.style.height = `${contentHeight}px`;
          cardContent.style.maxHeight = `${contentHeight}px`;
          cardContent.style.minHeight = '0';
          cardContent.style.overflow = 'hidden';
          cardContent.style.boxSizing = 'border-box';
        }
      }
    };
    
    syncHeight();
    window.addEventListener('resize', syncHeight);
    return () => window.removeEventListener('resize', syncHeight);
  }, [sidebarCardRef]);

  // Calculate recommended matches
  const matchesPlayed: { [key: string]: number } = {};
  rrPlayers.forEach(player => {
    matchesPlayed[player] = 0;
    rrPlayers.forEach(opponent => {
      if (player !== opponent) {
        const key = `${player}-${opponent}`;
        const reverseKey = `${opponent}-${player}`;
        if (rrResults[key] || rrResults[reverseKey]) {
          matchesPlayed[player]++;
        }
      }
    });
  });

  const allMatches: Array<{ player1: string; player2: string; priority: number }> = [];
  
  for (let i = 0; i < rrPlayers.length; i++) {
    for (let j = i + 1; j < rrPlayers.length; j++) {
      const player1 = rrPlayers[i];
      const player2 = rrPlayers[j];
      const key = `${player1}-${player2}`;
      const reverseKey = `${player2}-${player1}`;
      
      if (rrResults[key] || rrResults[reverseKey]) {
        continue;
      }
      
      const matchDiff = Math.abs(matchesPlayed[player1] - matchesPlayed[player2]);
      const totalMatches = matchesPlayed[player1] + matchesPlayed[player2];
      const priority = matchDiff * 1000 - totalMatches;
      
      allMatches.push({ player1, player2, priority });
    }
  }
  
  allMatches.sort((a, b) => a.priority - b.priority);
  const recommendedMatches = allMatches.slice(0, 10);

  if (participants.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No matches available. This tournament has no registered participants.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full flex flex-row gap-4 items-stretch">
      <Card className="flex-1 min-w-0 flex flex-col" id="results-table-card">
        <CardHeader className="flex-shrink-0">
          <CardTitle>Results Table</CardTitle>
          <CardDescription>Click on any cell to enter a match result</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <RoundRobinTable 
            players={rrPlayers}
            results={rrResults}
            onUpdateResult={onUpdateResult}
            editable={true}
            matchFormat={matchFormat}
            onRecommendedMatchClick={onRecommendedMatchClick}
            selectedMatchFromSidebar={recommendedMatchToSelect}
            onSidebarMatchHandled={onSidebarMatchHandled}
            selectedPlayer={selectedRRPlayer}
            onSelectedPlayerChange={onSelectedPlayerChange}
          />
        </CardContent>
        <CardContent className="pt-0 border-t">
          <GroupStandingsTable
            players={rrPlayers}
            results={rrResults}
            groupName="Tournament"
            playersPerGroupAdvance={0}
          />
        </CardContent>
      </Card>

      {/* Recommended Next Matches - справа */}
      <Card ref={sidebarCardRef} className="w-80 xl:w-96 flex-shrink-0 flex-grow-0 flex flex-col overflow-hidden">
        <CardHeader className="pb-3 flex-shrink-0" data-slot="card-header">
          <CardTitle className="text-base">Recommended Next Matches</CardTitle>
          <CardDescription className="text-xs">Click on a match to quickly enter results</CardDescription>
        </CardHeader>
        <CardContent className="pt-0 pb-0 px-6 overflow-hidden min-h-0 flex-1" data-slot="card-content">
          {recommendedMatches.length > 0 ? (
            <div className="space-y-2 h-full overflow-y-auto">
              {recommendedMatches.map((match) => (
                <div
                  key={`${match.player1}-${match.player2}`}
                  onClick={() => {
                    onRecommendedMatchClick(match.player1, match.player2);
                  }}
                  className="border rounded-lg p-3 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{match.player1}</div>
                      <div className="text-xs text-muted-foreground">vs</div>
                      <div className="font-medium text-sm">{match.player2}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              All matches completed!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


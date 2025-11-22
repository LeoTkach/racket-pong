import React from "react";

interface StandingsPlayer {
  player: string;
  wins: number;
  losses: number;
  games: number;
  points: number;
  pointDifference: number;
}

interface GroupStandingsTableProps {
  players: string[];
  results: { [key: string]: string };
  groupName: string;
  playersPerGroupAdvance?: number;
}

// Calculate standings from results
const calculateStandings = (players: string[], results: { [key: string]: string }): StandingsPlayer[] => {
  const standings = players.map(player => {
    let wins = 0;
    let losses = 0;
    let pointsFor = 0; // Total points scored by this player
    let pointsAgainst = 0; // Total points scored against this player
    
    // Track processed matches to avoid double counting
    // Each match appears twice in results: "player1-player2" and "player2-player1"
    const processedMatches = new Set<string>();
    
    Object.entries(results).forEach(([key, score]) => {
      const [p1, p2] = key.split("-");
      
      // Create a normalized match key (alphabetically sorted) to avoid processing same match twice
      const matchKey = [p1, p2].sort().join("-");
      if (processedMatches.has(matchKey)) {
        return; // Skip if we already processed this match
      }
      processedMatches.add(matchKey);
      
      const sets = score.split(",");
      let p1Wins = 0;
      let p2Wins = 0;
      sets.forEach(set => {
        const [s1, s2] = set.trim().split("-").map(Number);
        if (s1 > s2) p1Wins++;
        else if (s2 > s1) p2Wins++;
        
        // Accumulate points
        if (p1 === player) {
          pointsFor += s1;
          pointsAgainst += s2;
        } else if (p2 === player) {
          pointsFor += s2;
          pointsAgainst += s1;
        }
      });
      
      if (p1 === player) {
        if (p1Wins > p2Wins) wins++;
        else if (p2Wins > p1Wins) losses++;
      } else if (p2 === player) {
        if (p2Wins > p1Wins) wins++;
        else if (p1Wins > p2Wins) losses++;
      }
    });
    
    const pointDifference = pointsFor - pointsAgainst;
    const games = wins + losses; // Total games played
    
    return { player, wins, losses, games, points: wins * 3, pointDifference };
  });
  
  return standings.sort((a, b) => {
    // First sort by points
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // If points are equal, sort by point difference
    return b.pointDifference - a.pointDifference;
  });
};

export function GroupStandingsTable({ 
  players, 
  results, 
  groupName, 
  playersPerGroupAdvance = 2 
}: GroupStandingsTableProps) {
  const standings = calculateStandings(players, results);

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-3">{groupName === "Tournament" ? "Standings" : `${groupName} Standings`}</h4>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-2 font-semibold" style={{ width: '60px', minWidth: '60px', maxWidth: '60px' }}>Rank</th>
              <th className="text-left p-2 font-semibold" style={{ width: 'auto' }}>Player</th>
              <th className="text-center p-2 font-semibold" style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}>GP</th>
              <th className="text-center p-2 font-semibold" style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}>W</th>
              <th className="text-center p-2 font-semibold" style={{ width: '50px', minWidth: '50px', maxWidth: '50px' }}>L</th>
              <th className="text-center p-2 font-semibold" style={{ width: '90px', minWidth: '90px', maxWidth: '90px' }}>Score Diff</th>
              <th className="text-center p-2 font-semibold" style={{ width: '70px', minWidth: '70px', maxWidth: '70px' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((player, index) => (
              <tr 
                key={player.player} 
                className={`border-t ${index < playersPerGroupAdvance ? 'bg-primary/5' : ''}`}
              >
                <td className="p-2 font-medium">{index + 1}</td>
                <td className="p-2">{player.player}</td>
                <td className="p-2 text-center">{player.games || 0}</td>
                <td className="p-2 text-center">{player.wins}</td>
                <td className="p-2 text-center">{player.losses}</td>
                <td className="p-2 text-center font-mono">
                  <span className={player.pointDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {player.pointDifference > 0 ? '+' : ''}{player.pointDifference}
                  </span>
                </td>
                <td className="p-2 text-center font-semibold">{player.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


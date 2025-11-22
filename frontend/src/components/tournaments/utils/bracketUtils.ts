import { Match, Round } from "../types";

/**
 * Organize matches by rounds dynamically based on number of matches
 * Determines rounds structure by analyzing match data
 */
export function getRounds(matches: Match[]): Round[] {
  if (matches.length === 0) {
    return [];
  }
  
  // Count matches per round by analyzing round names or match structure
  const matchesByRound: { [key: string]: Match[] } = {};
  matches.forEach(match => {
    // Try to extract round info from match data
    // If matches have round info, use it; otherwise infer from position
    const roundKey = match.round || 'unknown';
    if (!matchesByRound[roundKey]) {
      matchesByRound[roundKey] = [];
    }
    matchesByRound[roundKey].push(match);
  });

  // If we have round information in matches, use it (only show rounds that have matches)
  const knownRounds = Object.keys(matchesByRound).filter(key => key !== 'unknown' && key !== '' && matchesByRound[key].length > 0);
  if (knownRounds.length > 0) {
    const roundOrder = ['Round of 32', 'Round of 16', 'Quarterfinals', 'Quarter-finals', 'Semifinals', 'Semi-finals', 'Finals', 'Final'];
    const sortedRounds = knownRounds.sort((a, b) => {
      const aIndex = roundOrder.findIndex(r => a.toLowerCase().includes(r.toLowerCase().replace(/[^a-z]/g, '')));
      const bIndex = roundOrder.findIndex(r => b.toLowerCase().includes(r.toLowerCase().replace(/[^a-z]/g, '')));
      return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
    });
    
    return sortedRounds.map(roundName => {
      // Format round name nicely
      let displayName = roundName;
      if (roundName.toLowerCase().includes('quarter')) {
        displayName = 'Quarter-finals';
      } else if (roundName.toLowerCase().includes('semi')) {
        displayName = 'Semi-finals';
      } else if (roundName.toLowerCase().includes('final') && !roundName.toLowerCase().includes('semi') && !roundName.toLowerCase().includes('quarter')) {
        displayName = 'Final';
      } else {
        displayName = roundName.charAt(0).toUpperCase() + roundName.slice(1);
      }
      return {
        name: displayName,
        matches: matchesByRound[roundName]
      };
    });
  }

  // Otherwise, infer from total match count
  // For 4 players: 2 semis + 1 final = 3 matches
  // For 8 players: 4 quarters + 2 semis + 1 final = 7 matches
  // For 16 players: 8 round of 16 + 4 quarters + 2 semis + 1 final = 15 matches
  
  if (matches.length === 3) {
    // 4 players: Semi-finals (2 matches) + Final (1 match)
    return [
      { name: "Semi-finals", matches: matches.slice(0, 2) },
      { name: "Final", matches: matches.slice(2, 3) },
    ];
  } else if (matches.length === 7) {
    // 8 players: Quarter-finals (4) + Semi-finals (2) + Final (1)
    return [
      { name: "Quarter-finals", matches: matches.slice(0, 4) },
      { name: "Semi-finals", matches: matches.slice(4, 6) },
      { name: "Final", matches: matches.slice(6, 7) },
    ];
  } else if (matches.length === 15) {
    // 16 players: Round of 16 (8) + Quarter-finals (4) + Semi-finals (2) + Final (1)
    return [
      { name: "Round of 16", matches: matches.slice(0, 8) },
      { name: "Quarter-finals", matches: matches.slice(8, 12) },
      { name: "Semi-finals", matches: matches.slice(12, 14) },
      { name: "Final", matches: matches.slice(14, 15) },
    ];
  } else if (matches.length === 4) {
    // 6 players: Quarter-finals (4 matches) - Semifinals and Final will be created later
    return [
      { name: "Quarter-finals", matches: matches },
    ];
  } else {
    // Fallback: try to infer rounds from positions
    // Assume last match is final, work backwards
    const finalMatch = matches[matches.length - 1];
    const semiFinals = matches.length >= 3 ? matches.slice(Math.max(0, matches.length - 3), matches.length - 1) : [];
    const quarterFinals = matches.length >= 7 ? matches.slice(0, matches.length - 3) : [];
    
    const rounds: Round[] = [];
    if (quarterFinals.length > 0) {
      rounds.push({ name: "Quarter-finals", matches: quarterFinals });
    }
    if (semiFinals.length > 0) {
      rounds.push({ name: "Semi-finals", matches: semiFinals });
    }
    if (finalMatch) {
      rounds.push({ name: "Final", matches: [finalMatch] });
    }
    return rounds;
  }
}

/**
 * Convert detailed score to set score (e.g., "11-9, 11-7, 11-5" -> "3-0")
 */
export function getSetScore(detailedScore: string | undefined): string | null {
  if (!detailedScore) return null;
  
  const sets = detailedScore.split(',').map(s => s.trim());
  let player1Sets = 0;
  let player2Sets = 0;
  
  sets.forEach(set => {
    const [p1, p2] = set.split('-').map(s => parseInt(s.trim()));
    if (!isNaN(p1) && !isNaN(p2)) {
      if (p1 > p2) player1Sets++;
      else player2Sets++;
    }
  });
  
  return `${player1Sets}-${player2Sets}`;
}


import React, { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction } from "../../ui/card";
import { typography } from "../../../utils/typography";
import { cn } from "../../ui/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  ReferenceLine
} from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface Match {
  id: string;
  startTime?: string;
  winnerId?: string | null;
  player1Id: string;
  player2Id: string;
  player1Rating?: number;
  player2Rating?: number;
}

interface RatingHistoryPoint {
  rating: number;
  recorded_at: string;
  match_id?: number;
  tournament_id?: number;
}

interface PointsHistoryChartProps {
  matches: Match[];
  currentRating: number;
  playerId: string;
  ratingHistory?: RatingHistoryPoint[];
}

export function PointsHistoryChart({
  matches,
  currentRating,
  playerId,
  ratingHistory
}: PointsHistoryChartProps) {
  
  // Отслеживаем изменения темы
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });
  
  useEffect(() => {
    const updateTheme = () => {
      const root = document.documentElement;
      setIsDark(!root.classList.contains('light'));
    };
    
    // Проверяем тему при монтировании
    updateTheme();
    
    // Отслеживаем изменения темы через MutationObserver
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Получаем цвета из CSS переменных для recharts
  const colors = useMemo(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      const primary = getComputedStyle(root).getPropertyValue('--primary').trim() || (isDark ? '#fbbf24' : '#f59e0b');
      const mutedForeground = getComputedStyle(root).getPropertyValue('--muted-foreground').trim() || (isDark ? '#8b9bb0' : '#78716c');
      const border = getComputedStyle(root).getPropertyValue('--border').trim() || (isDark ? '#1e3a5f' : '#fde68a');
      return { primary, mutedForeground, border, isDark };
    }
    return { primary: '#fbbf24', mutedForeground: '#8b9bb0', border: '#1e3a5f', isDark: true };
  }, [isDark]);
  
  // Вычисляем историю изменения рейтинга на основе данных из БД
  // Используем историю рейтинга из таблицы player_rating_history, если она есть
  const chartData: Array<{ date: string; points: number; change: number; label?: string; match_id?: number }> = useMemo(() => {
    console.log('[PointsHistoryChart] Props received:', {
      ratingHistoryLength: ratingHistory?.length || 0,
      ratingHistory: ratingHistory,
      ratingHistoryType: typeof ratingHistory,
      ratingHistoryIsArray: Array.isArray(ratingHistory),
      currentRating,
      playerId,
      matchesLength: matches?.length || 0
    });
    
    // Если есть история рейтинга из БД, используем её
    if (ratingHistory && Array.isArray(ratingHistory) && ratingHistory.length > 0) {
      console.log('[PointsHistoryChart] ========================================');
      console.log('[PointsHistoryChart] Using rating history from DB:', ratingHistory.length, 'points');
      console.log('[PointsHistoryChart] First point:', ratingHistory[0]);
      console.log('[PointsHistoryChart] Last point:', ratingHistory[ratingHistory.length - 1]);
      
      // Анализ tournament_id
      const tournamentIds = ratingHistory.map(p => p.tournament_id).filter(id => id != null);
      const uniqueTournamentIds = [...new Set(tournamentIds)];
      const nullTournamentCount = ratingHistory.filter(p => p.tournament_id == null).length;
      
      console.log('[PointsHistoryChart] Tournament analysis:');
      console.log('  Total points:', ratingHistory.length);
      console.log('  Points with tournament_id:', tournamentIds.length);
      console.log('  Points without tournament_id (null):', nullTournamentCount);
      console.log('  Unique tournament IDs:', uniqueTournamentIds);
      console.log('  Number of unique tournaments:', uniqueTournamentIds.length);
      
      // Группируем по tournament_id для детального анализа
      const byTournamentDetailed = new Map<number | null, RatingHistoryPoint[]>();
      ratingHistory.forEach(point => {
        const tourId = point.tournament_id ?? null;
        if (!byTournamentDetailed.has(tourId)) {
          byTournamentDetailed.set(tourId, []);
        }
        byTournamentDetailed.get(tourId)!.push(point);
      });
      
      console.log('[PointsHistoryChart] Points grouped by tournament_id:');
      byTournamentDetailed.forEach((points, tourId) => {
        const sorted = [...points].sort((a, b) => 
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
        console.log(`  Tournament ${tourId ?? 'null'}: ${points.length} points, ratings: ${sorted.map(p => p.rating).join(', ')}`);
      });
      
      console.log('[PointsHistoryChart] Sample points with tournament_id:', ratingHistory.slice(0, 5).map(p => ({ 
        rating: p.rating, 
        tournament_id: p.tournament_id,
        match_id: p.match_id,
        recorded_at: p.recorded_at
      })));
      
      // Сортируем по времени для правильного порядка
      const sortedHistory = [...ratingHistory].sort((a, b) => 
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
      );
      
      // Группируем точки по турнирам - для каждого турнира берем последнюю точку
      const finalHistory: RatingHistoryPoint[] = [];
      
      // Группируем по турнирам
      const byTournament = new Map<number | undefined, RatingHistoryPoint[]>();
      
      for (const point of sortedHistory) {
        const tournamentId = point.tournament_id;
        if (!byTournament.has(tournamentId)) {
          byTournament.set(tournamentId, []);
        }
        byTournament.get(tournamentId)!.push(point);
      }
      
      console.log('[PointsHistoryChart] Grouped by tournament:', byTournament.size, 'tournaments');
      byTournament.forEach((points, tourId) => {
        const sorted = [...points].sort((a, b) => 
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
        );
        const ratings = sorted.map(p => p.rating);
        console.log(`  Tournament ${tourId ?? 'null'}: ${points.length} points, ratings: [${ratings.join(', ')}], last: ${sorted[sorted.length - 1].rating}`);
      });
      
      // Для каждого турнира берем только последнюю точку
      const tournamentPoints: RatingHistoryPoint[] = [];
      for (const [tournamentId, points] of byTournament.entries()) {
        if (points.length > 0) {
          // Сортируем точки турнира по времени и берем последнюю
          const sortedPoints = [...points].sort((a, b) => 
            new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
          );
          const lastPoint = sortedPoints[sortedPoints.length - 1];
          console.log(`  Tournament ${tournamentId}: last point rating ${lastPoint.rating}`);
          tournamentPoints.push(lastPoint);
        }
      }
      
      // Сортируем точки турниров по времени (и по tournament_id для стабильности)
      tournamentPoints.sort((a, b) => {
        const timeA = new Date(a.recorded_at).getTime();
        const timeB = new Date(b.recorded_at).getTime();
        if (timeA !== timeB) {
          return timeA - timeB;
        }
        // Если время одинаковое, сортируем по tournament_id
        const tourA = a.tournament_id || 0;
        const tourB = b.tournament_id || 0;
        return tourA - tourB;
      });
      
      console.log('[PointsHistoryChart] Tournament points after filtering:', tournamentPoints.length);
      tournamentPoints.forEach((p, i) => {
        console.log(`  ${i+1}. Rating: ${p.rating}, Tournament: ${p.tournament_id}`);
      });
      
      // Добавляем начальную точку с рейтингом 1000
      const firstTournamentPoint = tournamentPoints[0];
      if (firstTournamentPoint && firstTournamentPoint.rating === 1000) {
        // Если первая точка турнира имеет рейтинг 1000, используем её как начальную
        console.log('[PointsHistoryChart] First tournament point has rating 1000, using it as initial');
        finalHistory.push(firstTournamentPoint);
        // Добавляем остальные точки турниров (начиная со второй)
        finalHistory.push(...tournamentPoints.slice(1));
      } else {
        // Создаем начальную точку за день до первого турнира
        console.log('[PointsHistoryChart] Creating initial point with rating 1000');
        const firstTournamentDate = firstTournamentPoint 
          ? new Date(firstTournamentPoint.recorded_at)
          : (sortedHistory[0] ? new Date(sortedHistory[0].recorded_at) : new Date());
        firstTournamentDate.setDate(firstTournamentDate.getDate() - 1);
        finalHistory.push({
          rating: 1000,
          recorded_at: firstTournamentDate.toISOString(),
          match_id: undefined,
          tournament_id: undefined
        });
        // Добавляем все точки турниров
        finalHistory.push(...tournamentPoints);
      }
      
      console.log('[PointsHistoryChart] Final history:', finalHistory.length, 'points (from', ratingHistory.length, 'original)');
      finalHistory.forEach((p, i) => {
        console.log(`  ${i+1}. Rating: ${p.rating}, Date: ${p.recorded_at}, Tournament: ${p.tournament_id}`);
      });
      
      // Проверяем, все ли рейтинги одинаковые
      const uniqueRatings = new Set(finalHistory.map(p => p.rating));
      console.log('[PointsHistoryChart] Final history:', finalHistory.length, 'points (from', ratingHistory.length, 'original)');
      console.log('[PointsHistoryChart] Final points:', finalHistory.map((p, i) => ({
        index: i,
        rating: p.rating,
        date: p.recorded_at,
        tournament_id: p.tournament_id
      })));
      console.log('[PointsHistoryChart] Unique ratings count:', uniqueRatings.size);
      if (finalHistory.length < ratingHistory.length) {
        console.log('[PointsHistoryChart] Filtered out', ratingHistory.length - finalHistory.length, 'points');
      }
      if (uniqueRatings.size === 1) {
        console.warn('[PointsHistoryChart] WARNING: All ratings are the same!', Array.from(uniqueRatings)[0]);
      }
      
      const result = finalHistory.map((point, index) => {
        const prevPoint = index > 0 ? finalHistory[index - 1] : null;
        const change = prevPoint ? point.rating - prevPoint.rating : 0;
        
        // Определяем label для точки
        let label: string | undefined = undefined;
        if (index === 0) {
          label = "Start";
        } else if (index === finalHistory.length - 1) {
          label = "Current";
        } else if (point.match_id) {
          // Для точек с матчами показываем изменение
          label = change !== 0 ? (change > 0 ? `+${change}` : `${change}`) : "Match";
        }
        
        return {
          date: point.recorded_at,
          points: point.rating,
          change: change,
          label: label,
          match_id: point.match_id
        };
      });
      
      // Проверяем, нужно ли добавить текущий рейтинг как новую точку
      const lastPoint = finalHistory.length > 0 ? finalHistory[finalHistory.length - 1] : null;
      if (lastPoint && result.length > 0) {
        const lastResultPoint = result[result.length - 1];
        const ratingDiff = Math.abs(lastResultPoint.points - currentRating);
        const lastPointDate = new Date(lastPoint.recorded_at);
        const daysSinceLastPoint = (Date.now() - lastPointDate.getTime()) / (1000 * 60 * 60 * 24);
        
        // Если разница слишком большая (>50 очков), не обновляем последнюю точку
        // Это предотвращает показ нереалистичных скачков рейтинга
        // Вместо этого добавляем новую точку только если прошло достаточно времени
        if (ratingDiff > 50) {
          // Если разница очень большая (>500), это явно проблема с данными
          // Не добавляем новую точку, чтобы не показывать нереалистичный скачок
          if (ratingDiff > 500) {
            console.warn('[PointsHistoryChart] Large rating difference detected:', ratingDiff, 
              'between last history point (', lastResultPoint.points, ') and current rating (', currentRating, ')');
            // Просто обновляем label, но не меняем значение
            lastResultPoint.label = "Current (data may be outdated)";
          } else if (daysSinceLastPoint > 7) {
            // Если прошло больше недели, добавляем новую точку
            result.push({
              date: new Date().toISOString(),
              points: currentRating,
              change: currentRating - lastResultPoint.points,
              label: "Current"
            });
          } else {
            // Если разница большая, но точка недавняя, просто обновляем label
            lastResultPoint.label = "Current";
          }
        } else if (ratingDiff > 5) {
          // Небольшое изменение - обновляем последнюю точку только если она недавняя
          if (daysSinceLastPoint < 1) {
            lastResultPoint.points = currentRating;
            // Пересчитываем изменение от предыдущей точки
            if (result.length > 1) {
              lastResultPoint.change = currentRating - result[result.length - 2].points;
            } else {
              lastResultPoint.change = currentRating - lastPoint.rating;
            }
            lastResultPoint.label = "Current";
          } else {
            // Если точка старая, добавляем новую
            result.push({
              date: new Date().toISOString(),
              points: currentRating,
              change: currentRating - lastResultPoint.points,
              label: "Current"
            });
            // Не меняем label старой точки
          }
        } else {
          // Если рейтинг совпадает, просто обновляем label
          lastResultPoint.label = "Current";
        }
      }
      
      console.log('[PointsHistoryChart] Result from rating history:', result.length, 'points');
      console.log('[PointsHistoryChart] Rating range:', Math.min(...result.map(r => r.points)), '-', Math.max(...result.map(r => r.points)));
      console.log('[PointsHistoryChart] First 3 points:', result.slice(0, 3).map(r => ({ date: r.date, points: r.points })));
      console.log('[PointsHistoryChart] Last 3 points:', result.slice(-3).map(r => ({ date: r.date, points: r.points })));
      return result;
    }
    
    // Если нет истории рейтинга, используем матчи и текущий рейтинг
    console.log('[PointsHistoryChart] No rating history available, falling back to matches');
    console.log('[PointsHistoryChart] ratingHistory:', ratingHistory);
    console.log('[PointsHistoryChart] matches:', matches);
    
    if (!matches || matches.length === 0) {
      // Если нет матчей, показываем только текущий рейтинг
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      return [
        {
          date: thirtyDaysAgo.toISOString(),
          points: currentRating,
          change: 0,
          label: "Start"
        },
        {
          date: now.toISOString(),
          points: currentRating,
          change: 0,
          label: "Current"
        }
      ];
    }

    // Сортируем матчи по дате (от старых к новым)
    const sortedMatches = [...matches]
      .filter(m => m.startTime && m.startTime !== undefined && m.startTime !== null && m.startTime !== '')
      .sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0;
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0;
        return timeA - timeB;
      });
    
    console.log('[PointsHistoryChart] Using matches, total:', matches.length);
    console.log('[PointsHistoryChart] Sorted matches:', sortedMatches.length);

    // Создаем точки на основе матчей
    // Используем текущий рейтинг для всех точек, так как в БД нет истории изменений
    const result: Array<{
      date: string;
      points: number;
      change: number;
      label?: string;
    }> = [];

    // Добавляем начальную точку (30 дней назад от первого матча или от текущей даты)
    const firstMatchDate = sortedMatches.length > 0 && sortedMatches[0].startTime
      ? new Date(sortedMatches[0].startTime)
      : new Date();
    const startDate = new Date(firstMatchDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    result.push({
      date: startDate.toISOString(),
      points: currentRating,
      change: 0,
      label: "Start"
    });

    // Добавляем точки для каждого матча с текущим рейтингом
    sortedMatches.forEach((match) => {
      if (match.startTime) {
        const isWinner = match.winnerId !== null && String(match.winnerId) === String(playerId);
        result.push({
          date: match.startTime,
          points: currentRating,
          change: 0,
          label: isWinner ? "Win" : "Loss"
        });
      }
    });

    // Добавляем текущую точку
    result.push({
      date: new Date().toISOString(),
      points: currentRating,
      change: 0,
      label: "Current"
    });

    console.log('[PointsHistoryChart] Result data points:', result.length);
    return result;
  }, [matches, currentRating, playerId, ratingHistory]);

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM dd");
    } catch {
      return dateStr;
    }
  };

  const formatTooltipDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return format(date, "MMM dd, yyyy");
    } catch {
      return dateStr;
    }
  };

  const minPoints = Math.min(...chartData.map(d => d.points));
  const maxPoints = Math.max(...chartData.map(d => d.points));
  const range = maxPoints - minPoints;
  const padding = Math.max(50, range * 0.1);
  
  // Генерируем тики для Y-оси, включая текущий рейтинг
  const generateYAxisTicks = () => {
    const numTicks = 5;
    const step = (maxPoints - minPoints + padding * 2) / (numTicks - 1);
    const ticks: number[] = [];
    
    // Генерируем основные тики
    for (let i = 0; i < numTicks; i++) {
      ticks.push(Math.round(minPoints - padding + step * i));
    }
    
    // Всегда добавляем текущий рейтинг
    if (!ticks.some(t => Math.abs(t - currentRating) < 5)) {
      ticks.push(currentRating);
    }
    
    // Удаляем дубликаты и сортируем
    const uniqueTicks = Array.from(new Set(ticks)).sort((a, b) => a - b);
    
    return uniqueTicks;
  };
  
  const yAxisTicks = generateYAxisTicks();

  // Генерируем тики для X-оси - показываем только несколько дат
  const generateXAxisTicks = () => {
    if (chartData.length === 0) return [];
    
    // Определяем количество дат для отображения (максимум 6-8)
    const maxTicks = 7;
    
    if (chartData.length <= maxTicks) {
      // Если данных мало, показываем все даты
      return chartData.map(d => d.date);
    }
    
    // Выбираем несколько дат: первую, последнюю и равномерно распределенные промежуточные
    const ticks: string[] = [];
    
    // Всегда добавляем первую дату
    ticks.push(chartData[0].date);
    
    // Добавляем промежуточные даты
    const step = Math.floor((chartData.length - 1) / (maxTicks - 1));
    for (let i = step; i < chartData.length - 1; i += step) {
      if (ticks.length < maxTicks - 1) {
        ticks.push(chartData[i].date);
      }
    }
    
    // Всегда добавляем последнюю дату
    if (ticks[ticks.length - 1] !== chartData[chartData.length - 1].date) {
      ticks.push(chartData[chartData.length - 1].date);
    }
    
    // Удаляем дубликаты
    return Array.from(new Set(ticks));
  };
  
  const xAxisTicks = generateXAxisTicks();

  // Отладка: проверяем данные и цвета
  useEffect(() => {
    console.log('[PointsHistoryChart] Debug info:', {
      chartDataLength: chartData.length,
      primaryColor: colors.primary,
      isDark: colors.isDark,
      firstPoint: chartData[0],
      lastPoint: chartData[chartData.length - 1]
    });
  }, [chartData, colors]);

  const averageChange = useMemo(() => {
    // Рассчитываем среднее изменение только для точек с матчами (не начальная точка)
    // Находим изменения между соседними точками, где есть реальное изменение рейтинга
    const changes: number[] = [];
    for (let i = 1; i < chartData.length; i++) {
      const change = chartData[i].points - chartData[i - 1].points;
      if (change !== 0) {
        changes.push(change);
      }
    }
    if (changes.length === 0) return 0;
    return changes.reduce((sum, change) => sum + change, 0) / changes.length;
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-1">{formatTooltipDate(label)}</p>
          <p className="text-lg font-bold text-primary">
            {Math.round(data.points)} points
          </p>
          {data.change !== 0 && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${
              data.change > 0 ? "text-green-500" : "text-red-500"
            }`}>
              {data.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {data.change > 0 ? "+" : ""}{data.change}
            </p>
          )}
          {data.label && (
            <p className="text-xs text-muted-foreground mt-1">{data.label}</p>
          )}
        </div>
      );
    }
    return null;
  };

  // Кастомный cursor - только от оси X до графика
  const CustomCursor = (props: any) => {
    const { points, height, coordinate } = props;
    if (!points || points.length === 0 || !coordinate) return null;
    
    const x = coordinate.x;
    // Находим минимальную Y координату среди всех точек (самая нижняя точка на графике)
    const minY = Math.min(...points.map((p: any) => p.y || height));
    const bottomY = height; // Нижняя точка (ось X)
    
    return (
      <line
        x1={x}
        y1={bottomY - 10} // Немного отступаем от края
        x2={x}
        y2={minY}
        stroke={colors.primary}
        strokeWidth={1}
        strokeDasharray="3 3"
        opacity={0.3}
      />
    );
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            Points History
          </CardTitle>
          <CardDescription>Rating changes over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn("text-center py-8", typography.profileBio)}>
            No match history available to calculate points progression
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Points History
        </CardTitle>
        <CardDescription>Rating changes over time</CardDescription>
        {averageChange !== 0 && (
          <CardAction>
            <div className={cn(
              "flex items-center gap-1 font-semibold",
              typography.infoText.replace("text-muted-foreground", averageChange > 0 ? "text-green-500" : "text-red-500")
            )}>
              {averageChange > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              Avg: {averageChange > 0 ? "+" : ""}{averageChange.toFixed(1)}
            </div>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            style={{ cursor: 'pointer' }}
          >
            <defs>
              <linearGradient id={`colorPoints-${playerId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.6} />
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={colors.border} 
              opacity={colors.isDark ? 0.2 : 0.3} 
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke={colors.mutedForeground}
              style={{ fontSize: "12px" }}
              angle={-45}
              textAnchor="end"
              height={60}
              ticks={xAxisTicks}
            />
            <YAxis
              domain={[minPoints - padding, maxPoints + padding]}
              stroke={colors.mutedForeground}
              style={{ fontSize: "12px" }}
              ticks={yAxisTicks}
              tickFormatter={(value) => {
                const rounded = Math.round(value);
                return rounded.toString();
              }}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={<CustomCursor />}
            />
            {/* Пунктирная линия рейтинга */}
            <ReferenceLine
              y={currentRating}
              stroke={colors.primary}
              strokeDasharray="3 3"
              strokeWidth={1.5}
              strokeOpacity={0.4}
            />
            {/* Градиентный фон - ПОД линией */}
            <Area
              type="monotone"
              dataKey="points"
              stroke="transparent"
              strokeWidth={0}
              fill={`url(#colorPoints-${playerId})`}
              dot={false}
              activeDot={false}
              isAnimationActive={true}
              animationDuration={2000}
              animationEasing="ease-out"
            />
            {/* Line для видимой кривой линии - в ComposedChart Line работает правильно */}
            <Line
              type="monotone"
              dataKey="points"
              stroke={colors.primary || '#fbbf24'}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              dot={false}
              activeDot={{ 
                r: 6, 
                fill: colors.primary || '#fbbf24', 
                strokeWidth: 0,
                stroke: 'transparent',
                style: colors.isDark
                  ? {
                      filter: `drop-shadow(0 0 8px ${colors.primary || '#fbbf24'}) drop-shadow(0 0 4px ${colors.primary || '#fbbf24'})`
                    }
                  : {}
              }}
              isAnimationActive={true}
              animationDuration={2000}
              animationEasing="ease-out"
              style={{
                filter: colors.isDark
                  ? `drop-shadow(0 0 4px ${colors.primary || '#fbbf24'}) drop-shadow(0 0 2px ${colors.primary || '#fbbf24'})`
                  : `drop-shadow(0 0 3px rgba(251, 191, 36, 0.25)) drop-shadow(0 0 1.5px rgba(251, 191, 36, 0.15))`
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}


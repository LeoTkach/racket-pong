import React, { useMemo, memo } from 'react';
import Ellipse20 from "./shapes/Ellipse20";
import Rectangle342 from "./shapes/Rectangle342";
import Rectangle343 from "./shapes/Rectangle343";
import Triangle from "./shapes/Triangle";
import Diamond from "./shapes/Diamond";
import Star from "./shapes/Star";

interface BackgroundParticlesProps {
  className?: string;
  seed?: number; // Seed для стабильной генерации позиций
}

interface ParticlePosition {
  top: number; // В vh (viewport height)
  left: number; // В процентах от ширины
  rotation: number;
  componentType: 'Star' | 'Ellipse20' | 'Diamond' | 'Triangle' | 'Rectangle342' | 'Rectangle343';
  opacity: number;
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Кэш для хранения сгенерированных позиций
const positionsCache = new Map<number, ParticlePosition[]>();

// Маппинг типов компонентов на сами компоненты
const COMPONENT_MAP: Record<ParticlePosition['componentType'], React.ComponentType<any>> = {
  Star,
  Ellipse20,
  Diamond,
  Triangle,
  Rectangle342,
  Rectangle343,
};

// Константы для генерации
const MIN_DISTANCE = 12;
const MAX_ATTEMPTS = 500;
const COMPONENT_TYPES: Array<ParticlePosition['componentType']> = [
  'Star',
  'Ellipse20',
  'Diamond',
  'Triangle',
  'Rectangle342',
  'Rectangle343',
];

// Зоны для генерации позиций (вынесены как константы)
const ZONES = [
  // ЭКРАН 1 (0-100vh)
  { topMin: 10, topMax: 25, leftMin: 5, leftMax: 35, name: 'screen1-top-left' },
  { topMin: 10, topMax: 25, leftMin: 65, leftMax: 95, name: 'screen1-top-right' },
  { topMin: 30, topMax: 50, leftMin: 5, leftMax: 35, name: 'screen1-middle-left' },
  { topMin: 30, topMax: 50, leftMin: 65, leftMax: 95, name: 'screen1-middle-right' },
  { topMin: 30, topMax: 50, leftMin: 40, leftMax: 60, name: 'screen1-middle-center' },
  { topMin: 55, topMax: 75, leftMin: 5, leftMax: 35, name: 'screen1-lower-left' },
  { topMin: 55, topMax: 75, leftMin: 65, leftMax: 95, name: 'screen1-lower-right' },
  { topMin: 75, topMax: 92, leftMin: 5, leftMax: 35, name: 'screen1-bottom-left' },
  { topMin: 75, topMax: 92, leftMin: 65, leftMax: 95, name: 'screen1-bottom-right' },
  { topMin: 85, topMax: 92, leftMin: 40, leftMax: 60, name: 'screen1-bottom-center' },
  // ЭКРАН 2 (100-200vh)
  { topMin: 110, topMax: 125, leftMin: 5, leftMax: 35, name: 'screen2-top-left' },
  { topMin: 110, topMax: 125, leftMin: 65, leftMax: 95, name: 'screen2-top-right' },
  { topMin: 130, topMax: 150, leftMin: 5, leftMax: 35, name: 'screen2-middle-left' },
  { topMin: 130, topMax: 150, leftMin: 65, leftMax: 95, name: 'screen2-middle-right' },
  { topMin: 130, topMax: 150, leftMin: 40, leftMax: 60, name: 'screen2-middle-center' },
  { topMin: 155, topMax: 175, leftMin: 5, leftMax: 35, name: 'screen2-lower-left' },
  { topMin: 155, topMax: 175, leftMin: 65, leftMax: 95, name: 'screen2-lower-right' },
  { topMin: 175, topMax: 192, leftMin: 5, leftMax: 35, name: 'screen2-bottom-left' },
  { topMin: 175, topMax: 192, leftMin: 65, leftMax: 95, name: 'screen2-bottom-right' },
  { topMin: 185, topMax: 192, leftMin: 40, leftMax: 60, name: 'screen2-bottom-center' },
  // ЭКРАН 3 (200-300vh)
  { topMin: 210, topMax: 225, leftMin: 5, leftMax: 35, name: 'screen3-top-left' },
  { topMin: 210, topMax: 225, leftMin: 65, leftMax: 95, name: 'screen3-top-right' },
  { topMin: 230, topMax: 250, leftMin: 5, leftMax: 35, name: 'screen3-middle-left' },
  { topMin: 230, topMax: 250, leftMin: 65, leftMax: 95, name: 'screen3-middle-right' },
  { topMin: 230, topMax: 250, leftMin: 40, leftMax: 60, name: 'screen3-middle-center' },
  { topMin: 255, topMax: 275, leftMin: 5, leftMax: 35, name: 'screen3-lower-left' },
  { topMin: 255, topMax: 275, leftMin: 65, leftMax: 95, name: 'screen3-lower-right' },
  { topMin: 275, topMax: 292, leftMin: 5, leftMax: 35, name: 'screen3-bottom-left' },
  { topMin: 275, topMax: 292, leftMin: 65, leftMax: 95, name: 'screen3-bottom-right' },
  { topMin: 285, topMax: 292, leftMin: 40, leftMax: 60, name: 'screen3-bottom-center' },
];

// Количество элементов для каждой зоны
const ELEMENTS_PER_ZONE: Record<string, number> = {
  'screen1-top-left': 2, 'screen1-top-right': 2, 'screen1-middle-left': 2, 'screen1-middle-right': 2,
  'screen1-middle-center': 1, 'screen1-lower-left': 2, 'screen1-lower-right': 2,
  'screen1-bottom-left': 2, 'screen1-bottom-right': 2, 'screen1-bottom-center': 1,
  'screen2-top-left': 2, 'screen2-top-right': 2, 'screen2-middle-left': 2, 'screen2-middle-right': 2,
  'screen2-middle-center': 1, 'screen2-lower-left': 2, 'screen2-lower-right': 2,
  'screen2-bottom-left': 2, 'screen2-bottom-right': 2, 'screen2-bottom-center': 1,
  'screen3-top-left': 2, 'screen3-top-right': 2, 'screen3-middle-left': 2, 'screen3-middle-right': 2,
  'screen3-middle-center': 1, 'screen3-lower-left': 2, 'screen3-lower-right': 2,
  'screen3-bottom-left': 2, 'screen3-bottom-right': 2, 'screen3-bottom-center': 1,
};

// Функция проверки расстояния между позициями
function isTooClose(newTop: number, newLeft: number, existing: ParticlePosition[]): boolean {
  return existing.some(pos => {
    const distance = Math.sqrt(
      Math.pow(newTop - pos.top, 2) + Math.pow(newLeft - pos.left, 2)
    );
    return distance < MIN_DISTANCE;
  });
}

// Функция генерации позиций (вынесена для переиспользования)
function generateParticlePositions(seed: number): ParticlePosition[] {
  // Проверяем кэш
  if (positionsCache.has(seed)) {
    return positionsCache.get(seed)!;
  }

  const positions: ParticlePosition[] = [];
  const rng = new SeededRandom(seed);
  
  // Генерируем элементы для каждой зоны в фиксированном порядке
  for (const zone of ZONES) {
    const targetCount = ELEMENTS_PER_ZONE[zone.name] || 3;
    let zoneElements = 0;
    let attempts = 0;
    
    while (zoneElements < targetCount && attempts < MAX_ATTEMPTS) {
      attempts++;
      
      const topVh = zone.topMin + rng.next() * (zone.topMax - zone.topMin);
      const leftPercent = zone.leftMin + rng.next() * (zone.leftMax - zone.leftMin);
      
      if (!isTooClose(topVh, leftPercent, positions)) {
        const componentType = COMPONENT_TYPES[Math.floor(rng.next() * COMPONENT_TYPES.length)];
        const rotation = (rng.next() - 0.5) * 60; // От -30 до +30 градусов
        const opacity = 13 + Math.floor(rng.next() * 4); // От 13 до 16
        
        positions.push({
          top: topVh,
          left: leftPercent,
          rotation,
          componentType,
          opacity
        });
        zoneElements++;
      }
    }
  }
  
  // Сохраняем в кэш
  positionsCache.set(seed, positions);
  return positions;
}

// Маппинг opacity для светлой темы
const LIGHT_THEME_OPACITY_MAP: Record<number, number> = {
  18: 0.7, 17: 0.7, 16: 0.65, 15: 0.6, 14: 0.55, 13: 0.5, 12: 0.45
};

// Базовые стили контейнера
const CONTAINER_STYLE: React.CSSProperties = {
  transform: 'translate3d(0, 0, 0)',
  willChange: 'auto',
  contain: 'layout style paint size',
  isolation: 'isolate',
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%',
  backfaceVisibility: 'hidden',
  perspective: '1000px'
};

// Компонент для отдельной частицы (мемоизирован для оптимизации)
const Particle = memo(({ pos, isLightTheme }: { pos: ParticlePosition; isLightTheme: boolean }) => {
  const Component = COMPONENT_MAP[pos.componentType] || Star;
  const opacity = isLightTheme 
    ? (LIGHT_THEME_OPACITY_MAP[pos.opacity] ?? pos.opacity / 100)
    : pos.opacity / 100;

  return (
    <div
      className="absolute w-10 h-10"
      style={{
        top: `${pos.top}vh`,
        left: `${pos.left}%`,
        transform: `translate3d(0, 0, 0) rotate(${pos.rotation}deg)`,
        willChange: 'transform',
        contain: 'layout style paint size',
        opacity
      }}
    >
      <Component />
    </div>
  );
});

Particle.displayName = 'Particle';

export const BackgroundParticles = memo(function BackgroundParticles({ 
  className = "", 
  seed = 12345 
}: BackgroundParticlesProps) {
  // Проверяем тему один раз при монтировании
  const isLightTheme = useMemo(
    () => !document.documentElement.classList.contains('dark'),
    []
  );

  // Генерация позиций с кэшированием
  const particlePositions = useMemo(
    () => generateParticlePositions(seed),
    [seed]
  );

  return (
    <div 
      className={`absolute top-0 left-0 right-0 bottom-0 overflow-visible pointer-events-none z-0 ${className}`}
      style={CONTAINER_STYLE}
    >
      {particlePositions.map((pos, index) => (
        <Particle 
          key={`${pos.top}-${pos.left}-${pos.rotation}-${pos.componentType}-${index}`}
          pos={pos}
          isLightTheme={isLightTheme}
        />
      ))}
    </div>
  );
});


import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useMotionValueEvent, animate } from 'framer-motion';
import { 
  Users, 
  FileCheck, 
  Search,
  TrendingUp,
  CalendarPlus
} from 'lucide-react';
import { HowItWorksStepCard } from './HowItWorksStepCard';
import { typography } from '../../../../utils/typography';
import { cn } from '../../../ui/utils';
import Aurora from '../../backgrounds/Aurora';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Create Your Account",
    description: "Create your free account or sign in if you already have one.",
    icon: Users,
    color: "blue"
  },
  {
    id: 2,
    title: "Browse Tournaments",
    description: "Explore upcoming tournaments and find the perfect competition for you.",
    icon: Search,
    color: "purple"
  },
  {
    id: 3,
    title: "Register & Compete",
    description: "Click on any tournament to view full details, check available spots, and register with one click.",
    icon: FileCheck,
    color: "red"
  },
  {
    id: 4,
    title: "Track Your Rankings",
    description: "Monitor your performance on the leaderboard and see how you rank among other players.",
    icon: TrendingUp,
    color: "yellow"
  },
  {
    id: 5,
    title: "Host Your Tournament",
    description: "Organize your own table tennis tournament. Set dates, locations, formats, and invite players to compete.",
    icon: CalendarPlus,
    color: "green"
  }
];

export function InteractiveHowItWorks() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return !document.documentElement.classList.contains('light');
    }
    return true;
  });

  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = !document.documentElement.classList.contains('light');
      setIsDark(isDarkMode);
    };

    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const sectionRef = useRef<HTMLDivElement>(null);
  const stepsContainerRef = useRef<HTMLDivElement>(null);
  const firstCircleRef = useRef<HTMLDivElement>(null);
  const lastCircleRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const circleRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const [lineStyle, setLineStyle] = useState<{ top: string; maxHeight: number }>({ top: '0', maxHeight: 0 });
  const [lineHeight, setLineHeight] = useState(0);
  const [arrowVisibility, setArrowVisibility] = useState<Record<number, boolean>>({});
  const maxHeightRef = useRef<number>(0);
  const stepPositionsRef = useRef<number[]>([]);
  const arrowPositionsRef = useRef<number[]>([]);
  const motionHeight = useMotionValue(0);

  // Функция для вычисления позиции линии и всех шагов
  const updateLinePosition = useCallback(() => {
    if (!firstCircleRef.current || !lastCircleRef.current || !stepsContainerRef.current || !lineRef.current) return;

    const containerRect = stepsContainerRef.current.getBoundingClientRect();
    const firstCircleRect = firstCircleRef.current.getBoundingClientRect();
    const lastCircleRect = lastCircleRef.current.getBoundingClientRect();

    // Центр первого кружка относительно контейнера
    const firstCircleCenter = firstCircleRect.top + firstCircleRect.height / 2 - containerRect.top;
    // Центр последнего кружка относительно контейнера
    const lastCircleCenter = lastCircleRect.top + lastCircleRect.height / 2 - containerRect.top;

    // Позиция линии: от центра первого до центра последнего
    const top = firstCircleCenter;
    const maxHeight = lastCircleCenter - firstCircleCenter;

    maxHeightRef.current = maxHeight;
    setLineStyle({
      top: `${top}px`,
      maxHeight: maxHeight
    });

    // Вычисляем позиции всех шагов (центры кружков) относительно начала линии
    const positions: number[] = [];
    const arrowPositions: number[] = [];
    circleRefs.current.forEach((circleRef, index) => {
      if (circleRef) {
        const circleRect = circleRef.getBoundingClientRect();
        const circleCenter = circleRect.top + circleRect.height / 2 - containerRect.top;
        const positionFromStart = circleCenter - firstCircleCenter;
        positions.push(positionFromStart);
        
        // Позиция стрелки - примерно 40px под центром кружка
        arrowPositions.push(positionFromStart + 40);
      }
    });
    stepPositionsRef.current = positions;
    arrowPositionsRef.current = arrowPositions;
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    let isSectionVisible = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isSectionVisible) {
            isSectionVisible = true;
            
            // Обновляем позицию линии перед началом анимации
            updateLinePosition();
            
            // Небольшая задержка для правильного расчета позиций
            setTimeout(() => {
              updateLinePosition();
              
              // Получаем актуальное значение максимальной высоты
              const currentMaxHeight = maxHeightRef.current;
              
              // Начинаем анимацию: первый шаг виден сразу, линия начинает расти
              setVisibleSteps(new Set([1]));
              motionHeight.set(0);
              
              // Плавно растем линию от 0 до полной высоты с линейной анимацией
              // Шаги и стрелки будут появляться автоматически через useMotionValueEvent
              setTimeout(() => {
                animate(motionHeight, currentMaxHeight, {
                  duration: 4.0,
                  ease: "linear"
                });
              }, 400);
            }, 200);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [updateLinePosition]);

  // Отслеживаем изменения motion value для обновления видимости шагов и стрелок
  useMotionValueEvent(motionHeight, "change", (latest) => {
    const stepPositions = stepPositionsRef.current;
    const arrowPositions = arrowPositionsRef.current;
    
    if (stepPositions.length === 0) return;
    
    // Обновляем lineHeight для синхронизации
    setLineHeight(latest);
    
    // Определяем, какие шаги и стрелки должны быть видны на основе текущей высоты линии
    const newVisibleSteps = new Set<number>();
    const newArrowVisibility: Record<number, boolean> = {};
    
    // Первый шаг всегда виден, когда линия начала расти
    if (latest > 0) {
      newVisibleSteps.add(1);
    }
    
    // Проверяем каждый последующий шаг
    for (let i = 1; i < stepPositions.length; i++) {
      const stepPosition = stepPositions[i];
      const arrowPosition = arrowPositions[i - 1];
      const previousStepPosition = i > 0 ? stepPositions[i - 1] : 0;
      const isLastStep = i === stepPositions.length - 1;
      
      // Вычисляем расстояние до шага
      const distanceToStep = stepPosition - previousStepPosition;
      // Показываем шаг, когда линия прошла определенный процент пути к нему
      // Для последнего шага показываем раньше (50%), для остальных - 70%
      const appearancePercentage = isLastStep ? 0.5 : 0.7;
      const stepAppearanceThreshold = previousStepPosition + distanceToStep * appearancePercentage;
      
      // Если линия дошла до порога пути к позиции шага, показываем шаг
      if (latest >= stepAppearanceThreshold) {
        newVisibleSteps.add(i + 1);
      }
      
      // Показываем стрелку, когда линия прошла 60% пути к следующему шагу
      // Для последней стрелки (перед последним шагом) показываем раньше (50%)
      const arrowAppearancePercentage = isLastStep ? 0.5 : 0.6;
      const arrowAppearanceThreshold = previousStepPosition + distanceToStep * arrowAppearancePercentage;
      if (latest >= arrowAppearanceThreshold) {
        newArrowVisibility[i - 1] = true;
      }
    }
    
    // Обновляем состояние
    setVisibleSteps(prev => {
      if (prev.size !== newVisibleSteps.size) {
        return newVisibleSteps;
      }
      for (const step of newVisibleSteps) {
        if (!prev.has(step)) {
          return newVisibleSteps;
        }
      }
      return prev;
    });
    
    setArrowVisibility(prev => {
      const prevKeys = Object.keys(prev).map(k => parseInt(k)).sort();
      const newKeys = Object.keys(newArrowVisibility).map(k => parseInt(k)).sort();
      if (prevKeys.length !== newKeys.length) {
        return newArrowVisibility;
      }
      for (let i = 0; i < prevKeys.length; i++) {
        if (prevKeys[i] !== newKeys[i] || prev[prevKeys[i]] !== newArrowVisibility[prevKeys[i]]) {
          return newArrowVisibility;
        }
      }
      return prev;
    });
  });

  // Обновляем позицию линии при загрузке и изменении размера
  useEffect(() => {
    const updatePosition = () => {
      // Задержка для того, чтобы элементы успели отрендериться и анимироваться
      setTimeout(() => {
        updateLinePosition();
      }, 100);
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [updateLinePosition]);

  // Получаем цвет фона секции для использования в градиентах
  // Темная тема: #0a1628 (rgb(10, 22, 40))
  // Светлая тема: #fffbf5 (rgb(255, 251, 245))
  const getSectionBgRgba = (opacity: number) => {
    if (isDark) {
      return `rgba(10, 22, 40, ${opacity})`;
    } else {
      return `rgba(255, 251, 245, ${opacity})`;
    }
  };

  const sectionBgSolid = getSectionBgRgba(1);
  const sectionBgColor = isDark ? '#0a1628' : '#fffbf5';

  return (
    <div 
      id="how-it-works" 
      className="py-20 relative overflow-hidden"
      style={{ backgroundColor: sectionBgColor }}
    >
      {/* Aurora effects with constrained vertical movement - элементы не подходят к краям */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Aurora с ограниченным вертикальным движением - плавный переход получается естественно */}
        <div className="absolute inset-0">
          <Aurora 
            key={`aurora-${isDark ? 'dark' : 'light'}`}
            isDarkTheme={isDark}
            amplitude={1.5}
            blend={0.8}
            speed={0.6}
            constrainVertical={true}
            verticalPaddingTop={38}
            verticalPaddingBottom={15}
          />
        </div>
        
        {/* Боковые маски для плавного перехода по горизонтали - скрывают аврору в центре, показывают по краям */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1/2 pointer-events-none z-[5]"
          style={{
            background: `linear-gradient(to right, 
              transparent 0%,
              transparent 10%,
              ${getSectionBgRgba(0.1)} 20%,
              ${getSectionBgRgba(0.3)} 30%,
              ${getSectionBgRgba(0.5)} 40%,
              ${getSectionBgRgba(0.7)} 50%,
              ${getSectionBgRgba(0.9)} 60%,
              ${getSectionBgRgba(0.95)} 75%,
              ${getSectionBgRgba(0.98)} 90%,
              ${sectionBgSolid} 100%
            )`,
          }}
        />
        
        <div 
          className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none z-[5]"
          style={{
            background: `linear-gradient(to left, 
              transparent 0%,
              transparent 10%,
              ${getSectionBgRgba(0.1)} 20%,
              ${getSectionBgRgba(0.3)} 30%,
              ${getSectionBgRgba(0.5)} 40%,
              ${getSectionBgRgba(0.7)} 50%,
              ${getSectionBgRgba(0.9)} 60%,
              ${getSectionBgRgba(0.95)} 75%,
              ${getSectionBgRgba(0.98)} 90%,
              ${sectionBgSolid} 100%
            )`,
          }}
        />
      </div>

      {/* Decorative background */}
      <div className="absolute inset-0 opacity-30 z-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-20">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center"
            style={{ marginBottom: '64px' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 
              className={cn(
                typography.sectionTitleTournament,
                typography.spacing.titleMargin
              )}
              style={typography.sectionTitleTournamentStyle}
            >
              How It Works
            </h2>
            <p className={cn(typography.subtitle, "max-w-2xl mx-auto mb-8")}>
              Follow our simple step-by-step process
            </p>
          </motion.div>
        </div>

        {/* Timeline */}
        <div ref={sectionRef} className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            {/* Steps */}
            <div ref={stepsContainerRef} className="relative">
              <div className="space-y-16 py-10 relative">
                {/* Vertical line - от центра первого кружка до центра последнего */}
                <motion.div 
                  ref={lineRef}
                  className="absolute left-1/2 -translate-x-1/2 hidden md:block pointer-events-none origin-top"
                  style={{
                    top: lineStyle.top,
                    width: '4px',
                    backgroundColor: 'var(--primary)',
                    zIndex: 0,
                    height: motionHeight
                  }}
                />
                
                {steps.map((step, index) => {
                  const isVisible = visibleSteps.has(step.id);
                  // Стрелка под шагом появляется, когда линия доходит до её позиции
                  const shouldShowArrow = arrowVisibility[index] || false;
                  // Нечетные (1, 3, 5) - слева, четные (2, 4) - справа
                  const isLeft = step.id % 2 === 1;
                  const isLast = index === steps.length - 1;
                  const isFirst = index === 0;
                  
                  // Создаем или получаем ref для этого кружка
                  if (!circleRefs.current[index]) {
                    circleRefs.current[index] = null;
                  }
                  
                  const setCircleRef = (el: HTMLDivElement | null) => {
                    circleRefs.current[index] = el;
                    if (isFirst && firstCircleRef) {
                      (firstCircleRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                    }
                    if (isLast && lastCircleRef) {
                      (lastCircleRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
                    }
                  };
                  
                  return (
                    <div key={step.id} className="relative" style={{ zIndex: 2 }}>
                      <HowItWorksStepCard
                        step={step}
                        isVisible={isVisible}
                        isLeft={isLeft}
                        index={index}
                        isLast={isLast}
                        shouldShowArrow={shouldShowArrow}
                        circleRef={setCircleRef}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




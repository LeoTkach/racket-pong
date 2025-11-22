import React, { useMemo } from 'react';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  time?: number;
  speed?: number;
  isDarkTheme?: boolean;
  constrainVertical?: boolean; // Ограничить движение по вертикали, чтобы элементы не подходили к краям
  verticalPadding?: number; // Отступ от верха и низа в процентах (например, 15 означает 15% сверху и снизу)
  verticalPaddingTop?: number; // Отступ от верха в процентах (приоритет над verticalPadding)
  verticalPaddingBottom?: number; // Отступ от низа в процентах (приоритет над verticalPadding)
}

export default function Aurora(props: AuroraProps) {
  const { 
    colorStops,
    amplitude = 1.0, 
    blend = 0.5,
    speed = 1.0,
    isDarkTheme = true,
    constrainVertical = false,
    verticalPadding = 15, // 15% сверху и снизу по умолчанию
    verticalPaddingTop,
    verticalPaddingBottom
  } = props;

  // Определяем цвета в зависимости от темы
  // Темная тема: темная насыщенная фиолетовая аврора
  const defaultDarkColors = useMemo(() => ['#6d28d9', '#5b21b6', '#4c1d95'], []); // Фиолетовый-700, фиолетовый-800, фиолетовый-900 (более темные и насыщенные)
  // Светлая тема: оранжевая аврора
  const defaultLightColors = useMemo(() => ['#fb923c', '#f97316', '#f59e0b'], []); // Оранжевый, оранжевый-темнее, amber
  
  // Используем useMemo чтобы гарантировать пересчет при изменении темы
  const finalColorStops = useMemo(() => {
    const colors = colorStops || (isDarkTheme ? defaultDarkColors : defaultLightColors);
    return colors;
  }, [colorStops, isDarkTheme, defaultDarkColors, defaultLightColors]);

  // Convert hex to RGB for CSS
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : '82, 39, 255';
  };

  const [color1, color2, color3] = finalColorStops;
  const color1Rgb = hexToRgb(color1);
  const color2Rgb = hexToRgb(color2);
  const color3Rgb = hexToRgb(color3);

  const animationDuration = `${20 / speed}s`;
  
  // Для светлой темы используем blend
  const lightBlend = blend * 1.1;

  // Вычисляем ограничения для вертикального движения
  // Если заданы отдельные значения для верха и низа, используем их, иначе используем verticalPadding для обоих
  const paddingTop = constrainVertical ? (verticalPaddingTop ?? verticalPadding) : 0;
  const paddingBottom = constrainVertical ? (verticalPaddingBottom ?? verticalPadding) : 0;
  const verticalMin = constrainVertical ? paddingTop : 0;
  const verticalMax = constrainVertical ? 100 - paddingBottom : 100;
  // Ограничиваем амплитуду вертикального движения (в процентах для translateY)
  // Когда ограничено, используем очень небольшие значения (1.5-2.5%), чтобы элементы не выходили за границы
  // Сильно уменьшаем движение вверх, чтобы не подходить к верхнему краю
  const verticalAmplitude1Up = constrainVertical ? Math.min(amplitude * 1.5, 2.5) : 15;
  const verticalAmplitude1Down = constrainVertical ? Math.min(amplitude * 3, 4.5) : 10;
  const verticalAmplitude2 = constrainVertical ? Math.min(amplitude * 2.5, 4) : 20;
  const verticalAmplitude3Up = constrainVertical ? Math.min(amplitude * 1.2, 2) : 10;
  const verticalAmplitude3Down = constrainVertical ? Math.min(amplitude * 2, 3.5) : 15;

  // Генерируем уникальный ID для этого экземпляра Aurora
  const auroraId = useMemo(() => `aurora-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <>
      <style key={`aurora-styles-${isDarkTheme ? 'dark' : 'light'}-${color1Rgb}`}>{`
        @keyframes aurora-wave-${auroraId} {
          0%, 100% {
            transform: translateY(0) skewY(0deg);
          }
          50% {
            transform: translateY(${constrainVertical ? '-3px' : '-20px'}) skewY(2deg);
          }
        }

        #${auroraId} .aurora-layer-1 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 80% 50% at 30% ${constrainVertical ? (verticalMin + (verticalMax - verticalMin) * 0.55) : 40}%,
            rgba(${color1Rgb}, ${isDarkTheme ? '0.42' : `${0.55 * lightBlend}`}) 0%,
            rgba(${color2Rgb}, ${isDarkTheme ? '0.35' : `${0.42 * lightBlend}`}) 40%,
            transparent 70%
          );
          animation: aurora-shift-1-${isDarkTheme ? 'dark' : 'light'}-${auroraId} ${animationDuration} ease-in-out infinite;
          filter: blur(${isDarkTheme ? '70px' : '70px'});
          will-change: transform, opacity;
          z-index: 0;
        }

        #${auroraId} .aurora-layer-2 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 60% at 70% ${constrainVertical ? (verticalMin + (verticalMax - verticalMin) * 0.70) : 60}%,
            rgba(${color2Rgb}, ${isDarkTheme ? '0.38' : `${0.46 * lightBlend}`}) 0%,
            rgba(${color3Rgb}, ${isDarkTheme ? '0.32' : `${0.34 * lightBlend}`}) 50%,
            transparent 80%
          );
          animation: aurora-shift-2-${isDarkTheme ? 'dark' : 'light'}-${auroraId} ${animationDuration} ease-in-out infinite;
          animation-delay: -${10 / speed}s;
          filter: blur(${isDarkTheme ? '90px' : '75px'});
          will-change: transform, opacity;
          ${!isDarkTheme ? 'mix-blend-mode: multiply;' : ''}
          z-index: 0;
        }

        #${auroraId} .aurora-layer-3 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 90% 40% at 50% ${constrainVertical ? (verticalMin + (verticalMax - verticalMin) * 0.50) : 30}%,
            rgba(${color3Rgb}, ${isDarkTheme ? '0.36' : `${0.42 * lightBlend}`}) 0%,
            rgba(${color1Rgb}, ${isDarkTheme ? '0.3' : `${0.38 * lightBlend}`}) 45%,
            transparent 75%
          );
          animation: aurora-shift-3-${isDarkTheme ? 'dark' : 'light'}-${auroraId} ${animationDuration} ease-in-out infinite;
          animation-delay: -${15 / speed}s;
          filter: blur(${isDarkTheme ? '110px' : '80px'});
          will-change: transform, opacity;
          ${!isDarkTheme ? 'mix-blend-mode: multiply;' : ''}
          z-index: 0;
        }

        #${auroraId} .aurora-wave-layer {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(${color2Rgb}, ${isDarkTheme ? '0.24' : `${0.3 * lightBlend}`}) 30%,
            rgba(${color1Rgb}, ${isDarkTheme ? '0.26' : `${0.38 * lightBlend}`}) 50%,
            rgba(${color3Rgb}, ${isDarkTheme ? '0.22' : `${0.34 * lightBlend}`}) 70%,
            transparent 100%
          );
          animation: aurora-wave-${auroraId} ${animationDuration} ease-in-out infinite;
          ${!isDarkTheme ? 'mix-blend-mode: multiply;' : ''}
          opacity: ${isDarkTheme ? '1' : `${0.68 * lightBlend}`};
          z-index: 0;
        }

        @keyframes aurora-shift-1-${isDarkTheme ? 'dark' : 'light'}-${auroraId} {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 1;
          }
          33% {
            transform: translate(10%, -${verticalAmplitude1Up}%) scale(1.1);
            opacity: 1;
          }
          66% {
            transform: translate(-10%, ${verticalAmplitude1Down}%) scale(0.9);
            opacity: 1;
          }
        }

        @keyframes aurora-shift-2-${isDarkTheme ? 'dark' : 'light'}-${auroraId} {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 1;
          }
          50% {
            transform: translate(-15%, ${verticalAmplitude2}%) scale(1.2);
            opacity: 1;
          }
        }

        @keyframes aurora-shift-3-${isDarkTheme ? 'dark' : 'light'}-${auroraId} {
          0%, 100% {
            transform: translate(0%, 0%) scale(1);
            opacity: 1;
          }
          25% {
            transform: translate(20%, -${verticalAmplitude3Up}%) scale(1.15);
            opacity: 1;
          }
          75% {
            transform: translate(-20%, ${verticalAmplitude3Down}%) scale(0.85);
            opacity: 1;
          }
        }
      `}</style>
      <div id={auroraId} className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="aurora-layer-1" />
        <div className="aurora-layer-2" />
        <div className="aurora-layer-3" />
        <div className="aurora-wave-layer" />
      </div>
    </>
  );
}

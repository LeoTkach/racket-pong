import React, { useState, useMemo, useEffect } from 'react'
// SVG paths для логотипа ракетки
const SVG_PATHS = {
  p32e07400: "M19.667 10.7002C29.7669 -2.07443 48.6512 -3.4783 61.7871 6.85259C61.8135 6.87332 61.8385 6.89569 61.8643 6.91704C74.8526 17.1969 77.9478 35.658 68.1592 48.4532L68.126 48.4961L67.4766 49.3223L67.459 49.3438L67.4424 49.3653C62.9383 54.9324 58.3969 58.3544 54.0196 60.2471C49.2996 62.6545 45.2425 63.305 39.5459 62.627C39.1591 62.581 38.7944 62.4976 38.4717 62.3975C35.1277 61.3606 33.0678 61.1916 31.6739 61.4034C30.4355 61.5916 29.3946 62.1278 28.1582 63.3497C26.8015 64.6905 25.4058 66.6554 23.4629 69.5772C21.5831 72.4041 19.2938 75.9611 16.3057 80.0147C14.2822 82.7597 10.4206 83.2216 7.79495 81.1563L2.28909 76.8262C-0.336595 74.7609 -0.796515 70.8994 1.39456 68.2862L2.5928 66.876C5.35023 63.6705 7.83613 61.0524 9.85256 58.8711C12.2343 56.2947 13.8144 54.4752 14.7979 52.8409C15.6941 51.3514 15.9702 50.2138 15.8614 48.9659C15.7387 47.5612 15.0895 45.5986 13.294 42.5928C13.1204 42.3023 12.9539 41.9677 12.8184 41.6036C11.6665 38.5085 11.0213 35.7278 10.999 32.8047C10.977 29.904 11.5709 27.1249 12.5342 24.0567C12.5536 23.9948 12.5742 23.9332 12.5967 23.8721C13.7886 19.8438 16.0147 15.4641 19.6299 10.7481L19.6485 10.7237L19.667 10.7002ZM59.3145 9.99712C47.7278 0.884679 31.3962 2.31455 22.8047 13.1817C19.3637 17.6705 17.3796 21.6888 16.3682 25.2208C16.3664 25.227 16.3634 25.2332 16.3594 25.2383C16.3556 25.2432 16.3525 25.2491 16.3506 25.2549C14.5502 30.9892 14.4752 34.5887 16.5664 40.2081C16.6087 40.3218 16.6663 40.4379 16.7285 40.542C24.4549 53.4761 17.0841 55.8001 4.45999 70.8565C3.74213 71.7127 3.88449 72.9909 4.76272 73.6817L10.2686 78.0127C11.1468 78.7034 12.423 78.54 13.086 77.6407C24.7445 61.825 25.2668 54.1141 39.6573 58.5762C39.773 58.6121 39.8983 58.64 40.0186 58.6543C45.0501 59.2532 48.3153 58.6885 52.3135 56.628C56.0183 55.0526 60.1058 52.0733 64.3321 46.8497L64.9824 46.0225C73.3262 35.1157 70.8274 19.0558 59.3164 10L59.3155 9.99907L59.3145 9.99712Z",
  p3f69f680: "M61.5097 26.9731C61.5097 30.563 58.5996 33.4731 55.0097 33.4731C51.4199 33.4731 48.5097 30.563 48.5097 26.9731C48.5097 23.3833 51.4199 20.4731 55.0097 20.4731C58.5996 20.4731 61.5097 23.3833 61.5097 26.9731Z",
}

// Градиенты для fallback - более интересные и яркие
const getFallbackGradient = (id: number | string) => {
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple-Blue
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-Red
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-Cyan
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-Turquoise
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-Yellow
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan-Deep Purple
    'linear-gradient(135deg, #f7b733 0%, #fc4a1a 100%)', // Yellow-Orange
    'linear-gradient(135deg, #ff512f 0%, #dd2476 100%)', // Orange-Red
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Bright Purple-Blue
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Coral-Blue
    'linear-gradient(135deg, #fad961 0%, #f76b1c 100%)', // Golden-Orange
    'linear-gradient(135deg, #8360c3 0%, #2ebf91 100%)', // Purple-Green
    'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)', // Deep Pink-Orange
    'linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%)', // Bright Cyan-Green
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // Soft Pink-Blue
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Light Blue
    'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', // Red-Peach
    'linear-gradient(135deg, #00d2ff 0%, #3a7bd5 100%)', // Cyan-Ocean Blue
    'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)', // Magenta-Red
    'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)', // Sky Blue-Deep Blue
    'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)', // Gold-Mint
    'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)', // Light Cyan-Blue
    'linear-gradient(135deg, #d53369 0%, #daae51 100%)', // Purple-Pink-Gold
    'linear-gradient(135deg, #a6c0fe 0%, #f68084 100%)', // Blue-Coral
  ];
  const idNum = typeof id === 'string' ? id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : id;
  return gradients[idNum % gradients.length];
}

// Generate stable ID from string
const generateStableId = (str: string): number => {
  return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  // Reset error state when src changes
  useEffect(() => {
    setDidError(false)
  }, [src])

  // Если src пустой или null/undefined, или была ошибка загрузки, показываем градиент с иконкой
  const hasValidSrc = src && src.trim() !== '' && src !== 'null' && src !== 'undefined'

  // Generate stable fallback ID using useMemo
  const fallbackId = useMemo(() => {
    // Priority 1: Use data-tournament-id if available
    const tournamentId = (rest as any)['data-tournament-id'];
    if (tournamentId !== undefined && tournamentId !== null) {
      return typeof tournamentId === 'number' ? tournamentId : generateStableId(String(tournamentId));
    }

    // Priority 2: Use src to generate stable ID
    if (src && typeof src === 'string') {
      return generateStableId(src);
    }

    // Priority 3: Use alt text if available
    if (alt && typeof alt === 'string') {
      return generateStableId(alt);
    }

    // Fallback: Use a default stable value (0)
    return 0;
  }, [(rest as any)['data-tournament-id'], src, alt]);

  // Memoize gradient to prevent recalculation
  const gradient = useMemo(() => getFallbackGradient(fallbackId), [fallbackId]);

  if (!hasValidSrc || didError) {
    return (
      <div
        className={`relative overflow-hidden ${className ?? ''}`}
        style={{
          ...style,
          background: gradient,
        }}
      >
        {/* Pattern Overlay - subtle but visible */}
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.12 }}>
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id={`pattern-${fallbackId}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.6" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#pattern-${fallbackId})`} />
          </svg>
        </div>
        {/* Logo Icon - 8.4x scale for consistency */}
        <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
          <div className="relative w-[140px] h-[157px]">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 74 83">
              <g>
                <path d={SVG_PATHS.p32e07400} fill="#FFFFFF" />
                <path d={SVG_PATHS.p3f69f680} fill="#FFFFFF" />
              </g>
            </svg>
          </div>
        </div>
        {/* No dark overlay - removed as requested to show gradient better */}
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
}

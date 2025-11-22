import { jsPDF } from "jspdf";

interface TournamentStyleCertificateProps {
  playerName: string;
  tournamentName: string;
  placement: string;
  date: string;
  organizerName: string;
  imageUrl?: string;
}

export async function generateTournamentStyleCertificate({
  playerName,
  tournamentName,
  placement,
  date,
  organizerName,
  imageUrl,
}: TournamentStyleCertificateProps): Promise<void> {
  try {
    // Create logo SVG as data URL
    const svgPaths = {
      racket: "M19.667 10.7002C29.7669 -2.07443 48.6512 -3.4783 61.7871 6.85259C61.8135 6.87332 61.8385 6.89569 61.8643 6.91704C74.8526 17.1969 77.9478 35.658 68.1592 48.4532L68.126 48.4961L67.4766 49.3223L67.459 49.3438L67.4424 49.3653C62.9383 54.9324 58.3969 58.3544 54.0196 60.2471C49.2996 62.6545 45.2425 63.305 39.5459 62.627C39.1591 62.581 38.7944 62.4976 38.4717 62.3975C35.1277 61.3606 33.0678 61.1916 31.6739 61.4034C30.4355 61.5916 29.3946 62.1278 28.1582 63.3497C26.8015 64.6905 25.4058 66.6554 23.4629 69.5772C21.5831 72.4041 19.2938 75.9611 16.3057 80.0147C14.2822 82.7597 10.4206 83.2216 7.79495 81.1563L2.28909 76.8262C-0.336595 74.7609 -0.796515 70.8994 1.39456 68.2862L2.5928 66.876C5.35023 63.6705 7.83613 61.0524 9.85256 58.8711C12.2343 56.2947 13.8144 54.4752 14.7979 52.8409C15.6941 51.3514 15.9702 50.2138 15.8614 48.9659C15.7387 47.5612 15.0895 45.5986 13.294 42.5928C13.1204 42.3023 12.9539 41.9677 12.8184 41.6036C11.6665 38.5085 11.0213 35.7278 10.999 32.8047C10.977 29.904 11.5709 27.1249 12.5342 24.0567C12.5536 23.9948 12.5742 23.9332 12.5967 23.8721C13.7886 19.8438 16.0147 15.4641 19.6299 10.7481L19.6485 10.7237L19.667 10.7002ZM59.3145 9.99712C47.7278 0.884679 31.3962 2.31455 22.8047 13.1817C19.3637 17.6705 17.3796 21.6888 16.3682 25.2208C16.3664 25.227 16.3634 25.2332 16.3594 25.2383C16.3556 25.2432 16.3525 25.2491 16.3506 25.2549C14.5502 30.9892 14.4752 34.5887 16.5664 40.2081C16.6087 40.3218 16.6663 40.4379 16.7285 40.542C24.4549 53.4761 17.0841 55.8001 4.45999 70.8565C3.74213 71.7127 3.88449 72.9909 4.76272 73.6817L10.2686 78.0127C11.1468 78.7034 12.423 78.54 13.086 77.6407C24.7445 61.825 25.2668 54.1141 39.6573 58.5762C39.773 58.6121 39.8983 58.64 40.0186 58.6543C45.0501 59.2532 48.3153 58.6885 52.3135 56.628C56.0183 55.0526 60.1058 52.0733 64.3321 46.8497L64.9824 46.0225C73.3262 35.1157 70.8274 19.0558 59.3164 10L59.3155 9.99907L59.3145 9.99712Z",
      ball: "M61.5097 26.9731C61.5097 30.563 58.5996 33.4731 55.0097 33.4731C51.4199 33.4731 48.5097 30.563 48.5097 26.9731C48.5097 23.3833 51.4199 20.4731 55.0097 20.4731C58.5996 20.4731 61.5097 23.3833 61.5097 26.9731Z"
    };

    // Convert SVG logo to image data URL
    const scale = 16;
    const viewBoxWidth = 74;
    const viewBoxHeight = 83;
    const canvasWidth = viewBoxWidth * scale;
    const canvasHeight = viewBoxHeight * scale;
    
    const svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
           width="${canvasWidth}" height="${canvasHeight}" 
           viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" 
           shape-rendering="geometricPrecision" 
           text-rendering="geometricPrecision" 
           image-rendering="optimizeQuality">
        <path d="${svgPaths.racket}" fill="#FB312E" stroke="none"/>
        <path d="${svgPaths.ball}" fill="#FCC054" stroke="none"/>
      </svg>`;
    
    const logoDataUrl = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          
          const ctx = canvas.getContext('2d', { 
            alpha: true,
            desynchronized: false,
            willReadFrequently: false
          });
          
          if (!ctx) {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to get canvas context'));
            return;
          }
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.clearRect(0, 0, canvasWidth, canvasHeight);
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(url);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG image: ' + error));
      };
      
      img.crossOrigin = 'anonymous';
      img.src = url;
    });

    // Load background image if provided
    let backgroundImageDataUrl: string | null = null;
    
    if (imageUrl) {
      try {
        backgroundImageDataUrl = await new Promise<string>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          
          img.onload = () => {
            try {
              // Увеличенное разрешение для лучшего качества и блюра (300 DPI)
              // A4 landscape @ 300 DPI: 3508 x 2480 px.
              const targetWidth = 3508;
              const targetHeight = 2480;
              
              const canvas = document.createElement('canvas');
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
              }
              
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
              
              const imgAspect = img.width / img.height;
              const canvasAspect = targetWidth / targetHeight;
              
              let drawWidth = targetWidth;
              let drawHeight = targetHeight;
              let drawX = 0;
              let drawY = 0;
              
              if (imgAspect > canvasAspect) {
                drawHeight = targetHeight;
                drawWidth = drawHeight * imgAspect;
                drawX = (targetWidth - drawWidth) / 2;
              } else {
                drawWidth = targetWidth;
                drawHeight = drawWidth / imgAspect;
                drawY = (targetHeight - drawHeight) / 2;
              }
              
              ctx.fillStyle = '#000000';
              ctx.fillRect(0, 0, targetWidth, targetHeight);
              
              // Применяем блюр перед отрисовкой изображения
              ctx.filter = 'blur(8px)'; // Измените значение в px для регулировки интенсивности блюра
              ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
              ctx.filter = 'none'; // Сбросим фильтр, чтобы он не влиял на градиент

              // "Запекаем" градиент прямо в холст (canvas)
              const gradient = ctx.createLinearGradient(0, 0, 0, targetHeight);
              gradient.addColorStop(0, 'rgba(0,0,0,0.1)'); // Немного светлее вверху
              gradient.addColorStop(0.5, 'rgba(0,0,0,0.4)'); // Темнее в середине
              gradient.addColorStop(1, 'rgba(0,0,0,0.85)'); // Темнее всего внизу
              ctx.fillStyle = gradient;
              ctx.fillRect(0, 0, targetWidth, targetHeight);
              
              // Конвертируем в JPEG с хорошим качеством
              const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
              resolve(dataUrl);
            } catch (error) {
              reject(error);
            }
          };
          
          img.onerror = () => {
            resolve(''); // Продолжаем без фона, если изображение не загрузилось
          };
          
          img.src = imageUrl;
        });
      } catch (error) {
        console.warn('Failed to load background image:', error);
      }
    }

    // Create PDF document in A4 format - LANDSCAPE orientation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // ~297mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // ~210mm
    
    // Draw background image if available
    if (backgroundImageDataUrl) {
      // Добавляем одно 'запеченное' изображение с блюром и градиентом
      pdf.addImage(backgroundImageDataUrl, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'MEDIUM'); // 'MEDIUM' для лучшего качества
    } else {
      // Default dark background if no image
      pdf.setFillColor(20, 20, 30);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    }

    const padding = 20; // mm
    const topPadding = 25; // mm
    const bottomPadding = 30; // mm

    // Top corner badges
    // Left badge with logo and text
    const logoBadgeWidth = 90;
    const logoBadgeHeight = 25;
    const logoBadgeX = padding;
    const logoBadgeY = topPadding;
    
    pdf.setFillColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.1 }));
    pdf.roundedRect(logoBadgeX, logoBadgeY, logoBadgeWidth, logoBadgeHeight, 4, 4, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));
    
    const logoSizeInBadge = 15;
    const logoXInBadge = logoBadgeX + 8;
    const logoYInBadge = logoBadgeY + (logoBadgeHeight - logoSizeInBadge * 1.12) / 2;
    pdf.addImage(logoDataUrl, 'PNG', logoXInBadge, logoYInBadge, logoSizeInBadge, logoSizeInBadge * 1.12, undefined, 'NONE');
    
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    const logoTextX = logoXInBadge + logoSizeInBadge + 5;
    const logoTextY = logoBadgeY + logoBadgeHeight / 2;
    pdf.text('Racket', logoTextX, logoTextY - 2.5, { maxWidth: logoBadgeWidth - (logoTextX - logoBadgeX) - 5 });
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Pong', logoTextX, logoTextY + 5, { maxWidth: logoBadgeWidth - (logoTextX - logoBadgeX) - 5 });

    // Right badge with placement
    const placementText = placement.toUpperCase();
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const placementWidth = pdf.getTextWidth(placementText);
    const placementBadgeWidth = placementWidth + 30;
    const placementBadgeHeight = 25;
    const placementBadgeX = pageWidth - padding - placementBadgeWidth;
    const placementBadgeY = topPadding;
    
    pdf.setFillColor(252, 192, 84); // Primary color
    pdf.roundedRect(placementBadgeX, placementBadgeY, placementBadgeWidth, placementBadgeHeight, 4, 4, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.text(placementText, placementBadgeX + placementBadgeWidth / 2, placementBadgeY + 16.5, { align: 'center' });

    // Content area
    const contentY = pageHeight - bottomPadding - 100;
    
    // Badges row
    const badgeY = contentY;
    const badgeSpacing = 8;
    
    // "Champion" badge
    pdf.setFillColor(220, 38, 38); // Red
    const championBadgeWidth = 50;
    const championBadgeHeight = 10;
    pdf.roundedRect(padding, badgeY, championBadgeWidth, championBadgeHeight, 3, 3, 'F');
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CHAMPION', padding + championBadgeWidth / 2, badgeY + 7, { align: 'center' });
    
    // Date badge
    const dateBadgeX = padding + championBadgeWidth + badgeSpacing;
    const dateBadgeWidth = 55;
    pdf.setFillColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.2 }));
    pdf.roundedRect(dateBadgeX, badgeY, dateBadgeWidth, championBadgeHeight, 3, 3, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    const dateText = date.length > 20 ? date.substring(0, 20).toUpperCase() : date.toUpperCase();
    pdf.text(dateText, dateBadgeX + dateBadgeWidth / 2, badgeY + 7, { align: 'center', maxWidth: dateBadgeWidth - 4 });

    // "Certificate awarded to" text
    const certificateTextY = badgeY + championBadgeHeight + 12;
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.text('CERTIFICATE AWARDED TO', padding, certificateTextY, { maxWidth: pageWidth - (padding * 2) });

    // Player name
    const playerNameY = certificateTextY + 14;
    pdf.setFontSize(38);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    const playerNameLines = pdf.splitTextToSize(playerName, pageWidth - (padding * 2));
    const lineHeight = 14;
    playerNameLines.forEach((line: string, index: number) => {
      pdf.text(line, padding, playerNameY + (index * lineHeight), { maxWidth: pageWidth - (padding * 2) });
    });

    // Primary color line under name
    const lineY = playerNameY + (playerNameLines.length * lineHeight) + 2;
    pdf.setDrawColor(252, 192, 84);
    pdf.setLineWidth(1.5);
    pdf.line(padding, lineY, padding + 100, lineY);

    // "For outstanding achievement in" text
    const achievementTextY = lineY + 10;
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.text('FOR OUTSTANDING ACHIEVEMENT IN', padding, achievementTextY, { maxWidth: pageWidth - (padding * 2) });

    // Tournament name
    const tournamentY = achievementTextY + 10;
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    const tournamentLines = pdf.splitTextToSize(tournamentName, pageWidth - (padding * 2));
    const tournamentLineHeight = 9;
    tournamentLines.forEach((line: string, index: number) => {
      pdf.text(line, padding, tournamentY + (index * tournamentLineHeight), { maxWidth: pageWidth - (padding * 2) });
    });

    // Footer with signature
    const footerY = pageHeight - bottomPadding;
    pdf.setDrawColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.2 }));
    pdf.setLineWidth(0.5);
    pdf.line(padding, footerY - 18, pageWidth - padding, footerY - 18);
    pdf.setGState(pdf.GState({ opacity: 1 }));

    // Director name
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'normal');
    pdf.text(organizerName, padding, footerY - 6, { maxWidth: pageWidth - (padding * 2) });
    
    // "Tournament Director" label
    pdf.setFontSize(9);
    pdf.setTextColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.7 }));
    pdf.text('TOURNAMENT DIRECTOR', padding, footerY + 4, { maxWidth: pageWidth - (padding * 2) });
    pdf.setGState(pdf.GState({ opacity: 1 }));

    // Save PDF
    pdf.save(`Certificate_${playerName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}
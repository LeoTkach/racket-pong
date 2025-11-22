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
  imageUrl, // Этот параметр теперь не используется для фона, но может использоваться для Авроры
}: TournamentStyleCertificateProps): Promise<void> {
  try {
    // --- 1. Создаем логотипы ---
    const svgPaths = {
      racket: "M19.667 10.7002C29.7669 -2.07443 48.6512 -3.4783 61.7871 6.85259C61.8135 6.87332 61.8385 6.89569 61.8643 6.91704C74.8526 17.1969 77.9478 35.658 68.1592 48.4532L68.126 48.4961L67.4766 49.3223L67.459 49.3438L67.4424 49.3653C62.9383 54.9324 58.3969 58.3544 54.0196 60.2471C49.2996 62.6545 45.2425 63.305 39.5459 62.627C39.1591 62.581 38.7944 62.4976 38.4717 62.3975C35.1277 61.3606 33.0678 61.1916 31.6739 61.4034C30.4355 61.5916 29.3946 62.1278 28.1582 63.3497C26.8015 64.6905 25.4058 66.6554 23.4629 69.5772C21.5831 72.4041 19.2938 75.9611 16.3057 80.0147C14.2822 82.7597 10.4206 83.2216 7.79495 81.1563L2.28909 76.8262C-0.336595 74.7609 -0.796515 70.8994 1.39456 68.2862L2.5928 66.876C5.35023 63.6705 7.83613 61.0524 9.85256 58.8711C12.2343 56.2947 13.8144 54.4752 14.7979 52.8409C15.6941 51.3514 15.9702 50.2138 15.8614 48.9659C15.7387 47.5612 15.0895 45.5986 13.294 42.5928C13.1204 42.3023 12.9539 41.9677 12.8184 41.6036C11.6665 38.5085 11.0213 35.7278 10.999 32.8047C10.977 29.904 11.5709 27.1249 12.5342 24.0567C12.5536 23.9948 12.5742 23.9332 12.5967 23.8721C13.7886 19.8438 16.0147 15.4641 19.6299 10.7481L19.6485 10.7237L19.667 10.7002ZM59.3145 9.99712C47.7278 0.884679 31.3962 2.31455 22.8047 13.1817C19.3637 17.6705 17.3796 21.6888 16.3682 25.2208C16.3664 25.227 16.3634 25.2332 16.3594 25.2383C16.3556 25.2432 16.3525 25.2491 16.3506 25.2549C14.5502 30.9892 14.4752 34.5887 16.5664 40.2081C16.6087 40.3218 16.6663 40.4379 16.7285 40.542C24.4549 53.4761 17.0841 55.8001 4.45999 70.8565C3.74213 71.7127 3.88449 72.9909 4.76272 73.6817L10.2686 78.0127C11.1468 78.7034 12.423 78.54 13.086 77.6407C24.7445 61.825 25.2668 54.1141 39.6573 58.5762C39.773 58.6121 39.8983 58.64 40.0186 58.6543C45.0501 59.2532 48.3153 58.6885 52.3135 56.628C56.0183 55.0526 60.1058 52.0733 64.3321 46.8497L64.9824 46.0225C73.3262 35.1157 70.8274 19.0558 59.3164 10L59.3155 9.99907L59.3145 9.99712Z",
      ball: "M61.5097 26.9731C61.5097 30.563 58.5996 33.4731 55.0097 33.4731C51.4199 33.4731 48.5097 30.563 48.5097 26.9731C48.5097 23.3833 51.4199 20.4731 55.0097 20.4731C58.5996 20.4731 61.5097 23.3833 61.5097 26.9731Z"
    };

    const scale = 16;
    const viewBoxWidth = 74;
    const viewBoxHeight = 83;
    const logoCanvasWidth = viewBoxWidth * scale;
    const logoCanvasHeight = viewBoxHeight * scale;
    
    // Логотип для белой (правой) части (Red Racket, Yellow Ball)
    const svgString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
           width="${logoCanvasWidth}" height="${logoCanvasHeight}" 
           viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" 
           shape-rendering="geometricPrecision" 
           text-rendering="geometricPrecision" 
           image-rendering="optimizeQuality">
        <path d="${svgPaths.racket}" fill="#FB312E" stroke="none"/>
        <path d="${svgPaths.ball}" fill="#FCC054" stroke="none"/>
      </svg>`;
    
    const logoDataUrlWhiteBg = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = logoCanvasWidth;
          canvas.height = logoCanvasHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, logoCanvasWidth, logoCanvasHeight);
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (e) { reject(e); }
      };
      img.onerror = (e) => { reject(e); };
      img.src = url;
    });

    // Логотип для темной (левой) части (Yellow Racket, White Ball)
    const logoSvgStringDark = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
      <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" 
           width="${logoCanvasWidth}" height="${logoCanvasHeight}" 
           viewBox="0 0 ${viewBoxWidth} ${viewBoxHeight}" 
           shape-rendering="geometricPrecision" 
           text-rendering="geometricPrecision" 
           image-rendering="optimizeQuality">
        <path d="${svgPaths.racket}" fill="#FCC054"/> 
        <path d="${svgPaths.ball}" fill="#FFFFFF"/>
      </svg>`;
    
    const logoDataUrlDarkBg = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      const svgBlob = new Blob([logoSvgStringDark], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = logoCanvasWidth;
          canvas.height = logoCanvasHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { reject(new Error('Failed to get canvas context')); return; }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, logoCanvasWidth, logoCanvasHeight);
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          URL.revokeObjectURL(url);
          resolve(dataUrl);
        } catch (e) { reject(e); }
      };
      img.onerror = (e) => { reject(e); };
      img.src = url;
    });


    // --- 2. Готовим левую панель (Аврора + Оверлей) ---
    // A4 Landscape: 297mm x 210mm
    // 40% width for left panel = 118.8mm
    // A4 @ 150 DPI landscape = 1754 x 1240 px
    // Left panel px width @ 150 DPI = 1754 * 0.4 = 701.6 px
    // Используем высокое разрешение для "запекания"
    const leftPanelWidthPx = 1188; // (297mm * 0.4) * 10 = 1188
    const leftPanelHeightPx = 2100; // (210mm) * 10 = 2100

    const leftPanelDataUrl = await new Promise<string>((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = leftPanelWidthPx;
        canvas.height = leftPanelHeightPx;
        const ctx = canvas.getContext('2d');
        if (!ctx) { 
          reject(new Error('Failed to get canvas context')); 
          return; 
        }

        // Создаем темный фон (база для Авроры)
        ctx.fillStyle = '#0a0a1e'; // Очень темный индиго
        ctx.fillRect(0, 0, leftPanelWidthPx, leftPanelHeightPx);

        // --- Добавляем статичные пятна Авроры (они будут размыты) ---
        ctx.filter = 'blur(100px)'; // Сильное размытие

        // Цвет 1 (из Aurora.tsx: #6d28d9)
        ctx.fillStyle = 'rgba(109, 40, 217, 0.6)'; 
        ctx.beginPath();
        // Используем ellipse (w, h, radiusX, radiusY, rotation, startAngle, endAngle)
        ctx.ellipse(leftPanelWidthPx * 0.3, leftPanelHeightPx * 0.4, leftPanelWidthPx * 0.4, leftPanelHeightPx * 0.3, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Цвет 2 (из Aurora.tsx: #5b21b6)
        ctx.fillStyle = 'rgba(91, 33, 182, 0.5)';
        ctx.beginPath();
        ctx.ellipse(leftPanelWidthPx * 0.7, leftPanelHeightPx * 0.6, leftPanelWidthPx * 0.3, leftPanelHeightPx * 0.4, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // Цвет 3 (из Aurora.tsx: #4c1d95)
        ctx.fillStyle = 'rgba(76, 29, 149, 0.5)';
        ctx.beginPath();
        ctx.ellipse(leftPanelWidthPx * 0.5, leftPanelHeightPx * 0.3, leftPanelWidthPx * 0.3, leftPanelHeightPx * 0.3, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Сбрасываем фильтр
        ctx.filter = 'none';

        // Добавляем градиент-оверлей (как в React-компоненте V3) ПОВЕРХ Авроры
        const gradient = ctx.createLinearGradient(0, 0, 0, leftPanelHeightPx); // Сверху вниз (CSS 'to top')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)'); // 0% (bottom in CSS)
        gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.6)'); // 40%
        gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.4)'); // 70%
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)'); // 100% (top in CSS)
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, leftPanelWidthPx, leftPanelHeightPx);
        
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (error) {
        reject(error);
      }
    });

    // --- 3. Создаем PDF ---
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4' // 297 x 210 mm
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 297
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210
    
    const leftPanelWidth = pageWidth * 0.4; // 118.8 mm
    const rightPanelWidth = pageWidth * 0.6; // 178.2 mm
    const rightPanelX = leftPanelWidth;

    // --- 4. Рисуем левую и правую панели ---
    
    // Левая панель (Аврора)
    pdf.addImage(leftPanelDataUrl, 'JPEG', 0, 0, leftPanelWidth, pageHeight, undefined, 'FAST');
    
    // Правая панель (Белый фон)
    pdf.setFillColor(255, 255, 255);
    pdf.rect(rightPanelX, 0, rightPanelWidth, pageHeight, 'F');

    // --- 5. Рисуем элементы поверх панелей ---

    // Логотип (на левой панели, bottom-8 left-8)
    const padding = 15;
    const logoSize = 15; // mm
    const boxPadding = 4; // mm (отступ внутри рамки, как p-4)
    const gap = 3; // mm (отступ между иконкой и текстом, как gap-3)

    // --- (ИЗМЕНЕНО) Сначала устанавливаем шрифт, чтобы измерить текст ---
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    const textWidth = Math.max(pdf.getTextWidth('Racket'), pdf.getTextWidth('Pong')); // Измеряем ширину текста

    // --- (ИЗМЕНЕНО) Вычисляем ширину рамки на основе контента ---
    const logoBoxWidth = boxPadding + logoSize + gap + textWidth + boxPadding; // padding + icon + gap + text + padding
    const logoBoxHeight = 25;
    const logoBoxX = padding;
    const logoBoxY = pageHeight - padding - logoBoxHeight;
    
    pdf.setFillColor(255, 255, 255);
    pdf.setGState(pdf.GState({ opacity: 0.1 }));
    pdf.roundedRect(logoBoxX, logoBoxY, logoBoxWidth, logoBoxHeight, 4, 4, 'F');
    pdf.setGState(pdf.GState({ opacity: 1 }));

    // Используем логотип для темного фона
    const logoImgX = logoBoxX + boxPadding; // (ИЗМЕНЕНО) Позиция X иконки
    const logoImgY = logoBoxY + (logoBoxHeight - (logoSize * 1.12)) / 2;
    pdf.addImage(logoDataUrlDarkBg, 'PNG', logoImgX, logoImgY, logoSize, logoSize * 1.12, undefined, 'NONE');
    
    // Текст логотипа
    const logoTextX_start = logoImgX + logoSize + gap; // (ИЗМЕНЕНО) Позиция X текста (сразу после иконки и отступа)
    const logoTextY_center = logoBoxY + logoBoxHeight / 2; // Центр Y
    
    pdf.setFontSize(13); // Увеличен размер
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold'); 
    // (ИЗМЕНЕНО) Центрируем текст в ЕГО СОБСТВЕННОЙ ширине
    pdf.text('Racket', logoTextX_start + (textWidth / 2), logoTextY_center - 2, { 
      align: 'center', 
      maxWidth: textWidth 
    });
    
    pdf.setFontSize(13); // Увеличен размер
    pdf.setFont('helvetica', 'bold'); 
    // (ИЗМЕНЕНО) Центрируем текст в ЕГО СОБСТВЕННОЙ ширине
    pdf.text('Pong', logoTextX_start + (textWidth / 2), logoTextY_center + 5, { 
      align: 'center', 
      maxWidth: textWidth
    });


    // Значок места (Placement Badge) (на правой панели, top-8 right-8)
    const badgeText = placement.toUpperCase();
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    const badgeWidth = pdf.getTextWidth(badgeText) + 16;
    const badgeHeight = 10;
    const badgeX = pageWidth - padding - badgeWidth;
    const badgeY = padding;
    
    pdf.setFillColor(252, 192, 84); // Primary color
    pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');
    
    pdf.setTextColor(0, 0, 0);
    pdf.text(badgeText, badgeX + badgeWidth / 2, badgeY + 7, { align: 'center' });
    
    // --- 6. Рисуем текст на правой (белой) панели ---
    
    const contentX = rightPanelX + 25;
    const contentY = 60;
    const contentWidth = rightPanelWidth - 50;

    // Header: "Certificate of Achievement"
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text('CERTIFICATE', contentX, contentY, { charSpace: 2 });
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('OF ACHIEVEMENT', contentX, contentY + 4, { charSpace: 1 });

    // Player Name
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text('PROUDLY PRESENTED TO', contentX, contentY + 25);
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(32);
    const playerNameLines = pdf.splitTextToSize(playerName, contentWidth);
    pdf.text(playerNameLines, contentX, contentY + 38);

    const nameEndY = contentY + 38 + ((playerNameLines.length - 1) * 12); // 12 - примерная высота строки

    // --- ДОБАВЛЕНА ПОЛОСКА ---
    // (w-20 h-1 bg-gradient-to-r from-primary to-yellow-400)
    const lineY = nameEndY + 5;
    const lineWidth = 50; // mm (эквивалент w-20)
    const lineHeight = 1; // mm (эквивалент h-1)

    // Имитируем градиент, рисуя два прямоугольника
    // from-primary (#f59e0b или #fbbf24)
    pdf.setFillColor(252, 192, 84); // #FCC054 (primary из лого)
    pdf.rect(contentX, lineY, lineWidth / 2, lineHeight, 'F');
    
    // to-yellow-400 (#facc15)
    pdf.setFillColor(250, 204, 21); // #facc15
    pdf.rect(contentX + (lineWidth / 2), lineY, lineWidth / 2, lineHeight, 'F');
    // --- КОНЕЦ ПОЛОСКИ ---

    // Tournament Info
    const infoY = lineY + lineHeight + 10; // Сдвигаем вниз после полоски
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('For exceptional performance in the', contentX, infoY);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    const tournamentLines = pdf.splitTextToSize(tournamentName, contentWidth);
    pdf.text(tournamentLines, contentX, infoY + 10);
    const tournamentEndY = infoY + 10 + ((tournamentLines.length - 1)* 7);

    // --- 7. Добавляем печать ---
    const sealSize = 20; // mm
    const sealX = rightPanelX + (rightPanelWidth / 2); // Центрируем на правой панели
    const sealY = pageHeight - 50; // Над футером

    // Внешний зубчатый круг (печать)
    pdf.setFillColor(218, 165, 32); // Золотой цвет (gold)
    const spikes = 20;
    const outerRadius = sealSize / 2;
    const innerRadius = sealSize / 2 * 0.9;
    
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * 2 * Math.PI;
      const x1 = sealX + innerRadius * Math.cos(angle);
      const y1 = sealY + innerRadius * Math.sin(angle);
      
      const angle_mid = ((i + 0.5) / spikes) * 2 * Math.PI;
      const x_mid = sealX + outerRadius * Math.cos(angle_mid); // Внешний край зубца
      const y_mid = sealY + outerRadius * Math.sin(angle_mid);
      
      const angle_next = ((i + 1) / spikes) * 2 * Math.PI;
      const x_next = sealX + innerRadius * Math.cos(angle_next);
      const y_next = sealY + innerRadius * Math.sin(angle_next);
      
      pdf.triangle(x1, y1, x_mid, y_mid, x_next, y_next, 'F');
    }
    // Внутренний круг
    pdf.circle(sealX, sealY, innerRadius, 'F');
    
    // Звезда внутри печати
    pdf.setFillColor(255, 223, 0); // Более яркий золотой
    pdf.setFontSize(18);
    // Используем '★' (U+2605)
    pdf.text('★', sealX, sealY + 3.5, { align: 'center' }); 

    // --- 8. Footer (Подписи) ---
    const footerY = pageHeight - 35;
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.5);
    pdf.line(contentX, footerY, pageWidth - 25, footerY);

    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('DIRECTOR', contentX, footerY + 8);
    pdf.text('DATE', pageWidth - 25, footerY + 8, { align: 'right' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.text(organizerName, contentX, footerY + 14);
    pdf.text(date, pageWidth - 25, footerY + 14, { align: 'right' });


    // --- 9. Сохраняем PDF ---
    pdf.save(`Certificate_${playerName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}
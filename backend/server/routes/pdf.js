const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');

console.log('[PDF Router] Loading PDF routes...');
console.log('[PDF Router] Routes loaded successfully');

// Генерация PDF для результатов турнира
router.post('/tournament-standings', async (req, res) => {
  let browser = null;
  
  try {
    console.log('[PDF] Received request for PDF generation');
    const { tournamentId, tournamentName, tournamentDate, tournamentLocation, organizerName, standings } = req.body;

    console.log('[PDF] Data received:', {
      tournamentId,
      tournamentName,
      standingsCount: standings?.length,
      hasStandings: !!standings,
      isArray: Array.isArray(standings)
    });

    if (!tournamentId) {
      console.error('[PDF] Missing tournamentId');
      return res.status(400).json({ error: 'Missing tournamentId' });
    }

    if (!standings || !Array.isArray(standings)) {
      console.error('[PDF] Missing or invalid standings:', {
        standings: standings,
        type: typeof standings,
        isArray: Array.isArray(standings)
      });
      return res.status(400).json({ error: 'Missing or invalid standings data' });
    }

    if (standings.length === 0) {
      console.error('[PDF] Empty standings array');
      return res.status(400).json({ error: 'Standings array is empty' });
    }

    // Запускаем браузер
    console.log('[PDF] Launching Puppeteer...');
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: process.platform === 'darwin' 
          ? ['--no-sandbox'] 
          : ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('[PDF] Puppeteer launched successfully');
    } catch (launchError) {
      console.error('[PDF] Failed to launch Puppeteer:', launchError);
      console.error('[PDF] Error details:', {
        message: launchError.message,
        stack: launchError.stack
      });
      throw new Error(`Failed to launch browser: ${launchError.message}`);
    }

    const page = await browser.newPage();
    console.log('[PDF] New page created');

    // Устанавливаем размер страницы
    await page.setViewport({ width: 1200, height: 800 });

    // Генерируем HTML для таблицы
    console.log('[PDF] Generating HTML...');
    const html = generateStandingsHTML({
      tournamentName: tournamentName || 'Tournament',
      tournamentDate: tournamentDate || '',
      tournamentLocation: tournamentLocation || '',
      organizerName: organizerName || '',
      standings: standings
    });
    console.log('[PDF] HTML generated, length:', html.length);

    // Устанавливаем HTML контент
    console.log('[PDF] Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('[PDF] Page content set');

    // Генерируем PDF
    console.log('[PDF] Generating PDF...');
    
    // Ждем немного, чтобы убедиться, что все стили применены
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Форматируем дату для футера
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      displayHeaderFooter: true,
      footerTemplate: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; font-size: 10px; color: #666; width: 100%; padding: 0 15mm; display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 10;">
          <span>Generated on ${now}</span>
          <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
        </div>
      `,
      headerTemplate: '<div></div>'
    });
    
    // Логируем тип результата для отладки
    console.log('[PDF] PDF result type:', typeof pdfBuffer, 'isBuffer:', Buffer.isBuffer(pdfBuffer), 'constructor:', pdfBuffer?.constructor?.name);
    
    // Конвертируем в Buffer, если это не Buffer
    let buffer;
    if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer instanceof Uint8Array) {
      buffer = Buffer.from(pdfBuffer);
    } else if (typeof pdfBuffer === 'string') {
      buffer = Buffer.from(pdfBuffer, 'binary');
    } else if (pdfBuffer && typeof pdfBuffer === 'object') {
      // Попробуем конвертировать через ArrayBuffer
      buffer = Buffer.from(pdfBuffer);
    } else {
      console.error('[PDF] Unknown PDF buffer type:', typeof pdfBuffer, pdfBuffer);
      throw new Error('Invalid PDF buffer generated - unknown type');
    }
    
    // Проверяем, что Buffer валидный и не пустой
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid PDF buffer generated - empty or null');
    }
    
    // Проверяем, что это действительно PDF (первые байты должны быть %PDF)
    const pdfHeader = buffer.slice(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      console.error('[PDF] Invalid PDF header:', pdfHeader, 'first 10 bytes:', buffer.slice(0, 10).toString());
      throw new Error('Generated file is not a valid PDF');
    }
    
    console.log('[PDF] PDF generated, size:', buffer.length, 'bytes, header:', pdfHeader);

    // Закрываем браузер
    await browser.close();
    console.log('[PDF] Browser closed');

    // Отправляем PDF
    const filename = `Standings_${(tournamentName || 'Tournament').replace(/\s+/g, '_')}.pdf`;
    
    // Устанавливаем заголовки перед отправкой
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Отправляем Buffer напрямую
    res.send(buffer);
    console.log('[PDF] PDF sent to client, size:', buffer.length, 'bytes');

  } catch (error) {
    console.error('[PDF] Error generating PDF:', error);
    console.error('[PDF] Error stack:', error.stack);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('[PDF] Error closing browser:', closeError);
      }
    }
    res.status(500).json({ 
      error: 'Failed to generate PDF',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Функция для генерации HTML
function generateStandingsHTML({ tournamentName, tournamentDate, tournamentLocation, organizerName, standings }) {
  const sortedStandings = [...standings].sort((a, b) => {
    const aRank = a.placement ?? a.rank ?? 999;
    const bRank = b.placement ?? b.rank ?? 999;
    return aRank - bRank;
  });

  const tableRows = sortedStandings.map((participant, index) => {
    const placementRange = participant.placementRange || participant.placement?.toString() || participant.rank.toString();
    const fullName = participant.full_name || '';
    const username = participant.username || '';
    const playerName = fullName || username || 'N/A';
    const gamesPlayed = (participant.wins || 0) + (participant.losses || 0);
    const wins = participant.wins || 0;
    const losses = participant.losses || 0;
    const pointDifference = participant.pointDifference || 0;
    const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
    const points = participant.points || 0;
    const rankNum = participant.placement ?? participant.rank ?? 999;
    const avatarUrl = participant.avatar_url || '';

    // Определяем цвета для ТОП-3
    let rankColor = '#000000';
    let playerColor = '#000000';
    if (rankNum === 1) {
      rankColor = '#EAB308'; // yellow-500
      playerColor = '#EAB308';
    } else if (rankNum === 2) {
      rankColor = '#9CA3AF'; // gray-400
      playerColor = '#9CA3AF';
    } else if (rankNum === 3) {
      rankColor = '#B45309'; // amber-700
      playerColor = '#B45309';
    }

    // Генерируем инициалы для аватара
    const initials = (fullName || username || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    // Аватар (изображение или инициалы)
    const avatarHtml = avatarUrl
      ? `<img src="${avatarUrl}" alt="${playerName}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />`
      : '';

    const isLastRow = index === sortedStandings.length - 1;
    const rankDisplay = rankNum === 1 
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
          <path d="M10 14.66v1.626a2 2 0 0 1-.976 1.696A5 5 0 0 0 7 21.978" stroke="${rankColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M14 14.66v1.626a2 2 0 0 0 .976 1.696A5 5 0 0 1 17 21.978" stroke="${rankColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M18 9h1.5a1 1 0 0 0 0-5H18" stroke="${rankColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M4 22h16" stroke="${rankColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 9a6 6 0 0 0 12 0V3a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1z" stroke="${rankColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M6 9H4.5a1 1 0 0 1 0-5H6" stroke="${rankColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
      : `<span style="font-size: 10px; font-weight: 600; color: ${rankColor}; line-height: 1;">${placementRange}</span>`;
    
    return `
      <tr style="${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'}">
        <td style="text-align: left; padding: 10px; vertical-align: middle; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'}">
          ${rankDisplay}
        </td>
        <td style="padding: 10px; vertical-align: middle; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'}">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #F3F4F6; display: flex; align-items: center; justify-content: center; overflow: hidden; flex-shrink: 0;">
              ${avatarHtml}
              <span style="display: ${avatarUrl ? 'none' : 'flex'}; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 9px; font-weight: 500; color: #6B7280; line-height: 1;">${initials}</span>
            </div>
            <div style="min-width: 0; display: flex; flex-direction: column; justify-content: center;">
              <div style="font-size: 10px; font-weight: 600; color: #000; line-height: 1.25; margin-bottom: 2px;">${playerName}</div>
              ${username && fullName ? `<div style="font-size: 9px; color: #6B7280; font-weight: 500; line-height: 1.25;">@${username}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="text-align: center; padding: 10px; vertical-align: middle; font-weight: 600; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'} font-size: 10px; line-height: 1;">${gamesPlayed}</td>
        <td style="text-align: center; padding: 10px; vertical-align: middle; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'}">
          <div style="display: flex; justify-content: center; align-items: center; line-height: 1;">
            <span style="font-weight: 600; font-size: 10px;">
              <span style="color: #16A34A;">${wins}</span><span style="color: #9CA3AF; padding: 0 1px;">/</span><span style="color: #DC2626;">${losses}</span>
            </span>
          </div>
        </td>
        <td style="text-align: center; padding: 10px; vertical-align: middle; font-weight: 600; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'} font-size: 10px; line-height: 1; color: ${pointDifference >= 0 ? '#16A34A' : '#DC2626'};">
          ${pointDifference >= 0 ? '+' : ''}${pointDifference}
        </td>
        <td style="padding: 10px; vertical-align: middle; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'}">
          <div style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 8px; background-color: rgba(245, 158, 11, 0.15); border-radius: 6px; min-width: 45px;">
            <span style="font-size: 10px; font-weight: 600; color: #92400E; line-height: 1;">${winRate}%</span>
          </div>
        </td>
        <td style="text-align: center; padding: 10px; vertical-align: middle; font-weight: 600; ${isLastRow ? '' : 'border-bottom: 1px solid rgba(245, 158, 11, 0.2);'} font-size: 10px; line-height: 1; color: #000;">${points}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        *:not(.aurora-background):not(.aurora-layer-1):not(.aurora-layer-2):not(.aurora-layer-3) {
          box-sizing: border-box;
        }
        html {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          padding: 0;
          margin: 0;
          color: #000;
          background: #fff;
          position: relative;
          overflow: visible;
          width: 100%;
          height: 100%;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          padding: 0;
          margin: 0;
          color: #000;
          background: #fff;
          position: relative;
          overflow: visible;
          min-height: 100vh;
        }
        .aurora-background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          z-index: 0;
          pointer-events: none;
        }
        .aurora-layer-1 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 80% 50% at 30% 40%,
            rgba(251, 146, 60, 0.95) 0%,
            rgba(249, 115, 22, 0.85) 40%,
            transparent 70%
          );
          filter: blur(70px);
          mix-blend-mode: multiply;
        }
        .aurora-layer-2 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 60% at 70% 60%,
            rgba(249, 115, 22, 0.90) 0%,
            rgba(245, 158, 11, 0.80) 50%,
            transparent 80%
          );
          filter: blur(75px);
          mix-blend-mode: multiply;
        }
        .aurora-layer-3 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 90% 40% at 50% 30%,
            rgba(245, 158, 11, 0.85) 0%,
            rgba(251, 146, 60, 0.75) 45%,
            transparent 75%
          );
          filter: blur(80px);
          mix-blend-mode: multiply;
        }
        .content-wrapper {
          position: relative;
          z-index: 1;
          background: rgba(255, 255, 255, 0.80);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          width: 100%;
          min-height: 100vh;
          overflow: visible;
        }
        .content-inner {
          padding: 3mm 15mm 25mm 15mm;
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
        }
        .logo-header {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          margin-top: 0;
          margin-bottom: 20px;
          padding-top: 0;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 2;
          width: 100%;
        }
        .logo-header svg {
          display: block;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          line-height: 1;
          gap: 0;
        }
        .logo-text span {
          font-size: 12px;
          font-weight: 600;
          color: #FB312E;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .header {
          margin-bottom: 40px;
          width: 100%;
        }
        .tournament-name {
          font-size: 36px;
          font-weight: 500;
          line-height: 43px;
          letter-spacing: -0.025em;
          margin-bottom: 8px;
          color: #000;
        }
        .tournament-name-gradient {
          height: 5px;
          width: 140px;
          border-radius: 9999px;
          background: linear-gradient(to right, #FCC054 0%, rgb(59, 130, 246) 33%, rgb(239, 68, 68) 66%, rgb(220, 38, 38) 100%);
          margin-bottom: 24px;
        }
        .tournament-details {
          font-size: 14px;
          line-height: 1.4;
          color: #000;
          margin-bottom: 6px;
          font-weight: 400;
        }
        .tournament-details-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #666;
          margin-bottom: 2px;
          font-weight: 400;
          line-height: 1.5;
        }
        .section-title {
          font-size: 10px;
          font-weight: 500;
          margin-bottom: 12px;
          color: #000;
          width: 100%;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          letter-spacing: 0.1em;
          line-height: 1.5;
          text-transform: uppercase;
        }
        .section-description {
          font-size: 14px;
          line-height: 1.5;
          color: #666;
          margin-bottom: 24px;
          width: 100%;
          font-weight: 400;
        }
        .table-wrapper {
          width: 100%;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
          box-sizing: border-box;
          border-radius: 12px;
          overflow: hidden;
        }
        table {
          width: 100%;
          max-width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          table-layout: fixed;
          position: relative;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          box-sizing: border-box;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(245, 158, 11, 0.25);
          box-shadow: none;
        }
        thead {
          background-color: rgba(245, 158, 11, 0.18);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-top-left-radius: 12px;
          border-top-right-radius: 12px;
          overflow: hidden;
        }
        th {
          padding: 10px;
          text-align: left;
          font-weight: 600;
          font-size: 10px;
          text-transform: capitalize;
          color: #000;
          border-bottom: 1px solid rgba(245, 158, 11, 0.3);
          vertical-align: middle;
        }
        th:first-child {
          border-top-left-radius: 12px;
        }
        th:last-child {
          border-top-right-radius: 12px;
        }
        th:nth-child(1) { width: 10%; text-align: left; }
        th:nth-child(2) { width: 30%; }
        th:nth-child(3) { width: 8%; text-align: center; }
        th:nth-child(4) { width: 12%; text-align: center; }
        th:nth-child(5) { width: 12%; text-align: center; }
        th:nth-child(6) { width: 13%; }
        th:nth-child(7) { width: 15%; text-align: center; }
        tbody tr {
          border-bottom: 1px solid rgba(245, 158, 11, 0.2);
        }
        tbody tr:last-child {
          border-bottom: none;
        }
        tbody tr:last-child td {
          border-bottom: none;
        }
        tbody tr:last-child td:first-child {
          border-bottom-left-radius: 12px;
        }
        tbody tr:last-child td:last-child {
          border-bottom-right-radius: 12px;
        }
        td {
          padding: 10px;
          font-size: 10px;
          vertical-align: middle;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #E5E7EB;
          text-align: center;
          font-size: 10px;
          color: #999;
        }
        @media print {
          body {
            padding: 0;
          }
          .content-inner {
            padding: 3mm 15mm 20mm 15mm;
          }
        }
      </style>
    </head>
    <body>
      <div class="aurora-background">
        <div class="aurora-layer-1"></div>
        <div class="aurora-layer-2"></div>
        <div class="aurora-layer-3"></div>
      </div>
      <div class="content-wrapper">
        <div class="content-inner">
        <div class="logo-header">
        <svg width="24" height="27" viewBox="0 0 74 83" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.667 10.7002C29.7669 -2.07443 48.6512 -3.4783 61.7871 6.85259C61.8135 6.87332 61.8385 6.89569 61.8643 6.91704C74.8526 17.1969 77.9478 35.658 68.1592 48.4532L68.126 48.4961L67.4766 49.3223L67.459 49.3438L67.4424 49.3653C62.9383 54.9324 58.3969 58.3544 54.0196 60.2471C49.2996 62.6545 45.2425 63.305 39.5459 62.627C39.1591 62.581 38.7944 62.4976 38.4717 62.3975C35.1277 61.3606 33.0678 61.1916 31.6739 61.4034C30.4355 61.5916 29.3946 62.1278 28.1582 63.3497C26.8015 64.6905 25.4058 66.6554 23.4629 69.5772C21.5831 72.4041 19.2938 75.9611 16.3057 80.0147C14.2822 82.7597 10.4206 83.2216 7.79495 81.1563L2.28909 76.8262C-0.336595 74.7609 -0.796515 70.8994 1.39456 68.2862L2.5928 66.876C5.35023 63.6705 7.83613 61.0524 9.85256 58.8711C12.2343 56.2947 13.8144 54.4752 14.7979 52.8409C15.6941 51.3514 15.9702 50.2138 15.8614 48.9659C15.7387 47.5612 15.0895 45.5986 13.294 42.5928C13.1204 42.3023 12.9539 41.9677 12.8184 41.6036C11.6665 38.5085 11.0213 35.7278 10.999 32.8047C10.977 29.904 11.5709 27.1249 12.5342 24.0567C12.5536 23.9948 12.5742 23.9332 12.5967 23.8721C13.7886 19.8438 16.0147 15.4641 19.6299 10.7481L19.6485 10.7237L19.667 10.7002ZM59.3145 9.99712C47.7278 0.884679 31.3962 2.31455 22.8047 13.1817C19.3637 17.6705 17.3796 21.6888 16.3682 25.2208C16.3664 25.227 16.3634 25.2332 16.3594 25.2383C16.3556 25.2432 16.3525 25.2491 16.3506 25.2549C14.5502 30.9892 14.4752 34.5887 16.5664 40.2081C16.6087 40.3218 16.6663 40.4379 16.7285 40.542C24.4549 53.4761 17.0841 55.8001 4.45999 70.8565C3.74213 71.7127 3.88449 72.9909 4.76272 73.6817L10.2686 78.0127C11.1468 78.7034 12.423 78.54 13.086 77.6407C24.7445 61.825 25.2668 54.1141 39.6573 58.5762C39.773 58.6121 39.8983 58.64 40.0186 58.6543C45.0501 59.2532 48.3153 58.6885 52.3135 56.628C56.0183 55.0526 60.1058 52.0733 64.3321 46.8497L64.9824 46.0225C73.3262 35.1157 70.8274 19.0558 59.3164 10L59.3155 9.99907L59.3145 9.99712Z" fill="#FB312E"/>
          <path d="M61.5097 26.9731C61.5097 30.563 58.5996 33.4731 55.0097 33.4731C51.4199 33.4731 48.5097 30.563 48.5097 26.9731C48.5097 23.3833 51.4199 20.4731 55.0097 20.4731C58.5996 20.4731 61.5097 23.3833 61.5097 26.9731Z" fill="#FCC054"/>
        </svg>
        <div class="logo-text">
          <span>Racket</span>
          <span>Pong</span>
        </div>
        </div>
        <div class="header">
          <div class="tournament-name">${tournamentName}</div>
          <div class="tournament-name-gradient"></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 16px;">
            ${tournamentLocation ? `
              <div>
                <div class="tournament-details-label">Location</div>
                <div class="tournament-details">${tournamentLocation}</div>
              </div>
            ` : '<div></div>'}
            <div>
              <div class="tournament-details-label">Date</div>
              <div class="tournament-details">${tournamentDate}</div>
            </div>
          </div>
          ${organizerName ? `
            <div style="margin-bottom: 8px;">
              <div class="tournament-details-label">Organizer</div>
              <div class="tournament-details">${organizerName}</div>
            </div>
          ` : ''}
        </div>

        <div class="section-title">Rankings</div>
        <div class="section-description">Tournament results and player performance</div>

        <div class="table-wrapper">
        <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Games</th>
            <th>W/L</th>
            <th>Score Diff</th>
            <th>Win Rate</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
        </table>
        </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Генерация PDF для сертификата игрока
router.post('/player-certificate', async (req, res) => {
  let browser = null;
  
  try {
    console.log('[PDF Certificate] Received request for certificate generation');
    const { playerName, tournamentName, placement, date, organizerName, imageUrl } = req.body;

    if (!playerName || !tournamentName || !placement || !date || !organizerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Запускаем браузер
    console.log('[PDF Certificate] Launching Puppeteer...');
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: process.platform === 'darwin' 
          ? ['--no-sandbox'] 
          : ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('[PDF Certificate] Puppeteer launched successfully');
    } catch (launchError) {
      console.error('[PDF Certificate] Failed to launch Puppeteer:', launchError);
      throw new Error(`Failed to launch browser: ${launchError.message}`);
    }

    const page = await browser.newPage();
    console.log('[PDF Certificate] New page created');

    // Устанавливаем размер страницы
    await page.setViewport({ width: 1200, height: 800 });

    // Генерируем HTML для сертификата
    console.log('[PDF Certificate] Generating HTML...');
    const html = generateCertificateHTML({
      playerName,
      tournamentName,
      placement,
      date,
      organizerName,
      imageUrl
    });
    console.log('[PDF Certificate] HTML generated, length:', html.length);

    // Устанавливаем HTML контент
    console.log('[PDF Certificate] Setting page content...');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    console.log('[PDF Certificate] Page content set');

    // Генерируем PDF
    console.log('[PDF Certificate] Generating PDF...');
    
    // Ждем немного, чтобы убедиться, что все стили применены
    await new Promise(resolve => setTimeout(resolve, 500));

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      preferCSSPageSize: false,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });
    
    // Конвертируем в Buffer
    let buffer;
    if (Buffer.isBuffer(pdfBuffer)) {
      buffer = pdfBuffer;
    } else if (pdfBuffer instanceof Uint8Array) {
      buffer = Buffer.from(pdfBuffer);
    } else {
      throw new Error('Invalid PDF buffer generated');
    }
    
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid PDF buffer generated - empty or null');
    }
    
    const pdfHeader = buffer.slice(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      throw new Error('Generated file is not a valid PDF');
    }
    
    console.log('[PDF Certificate] PDF generated, size:', buffer.length, 'bytes');

    // Закрываем браузер
    await browser.close();
    console.log('[PDF Certificate] Browser closed');

    // Отправляем PDF
    const filename = `Certificate_${playerName.replace(/\s+/g, '_')}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    res.send(buffer);
    console.log('[PDF Certificate] PDF sent to client, size:', buffer.length, 'bytes');

  } catch (error) {
    console.error('[PDF Certificate] Error generating PDF:', error);
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('[PDF Certificate] Error closing browser:', closeError);
      }
    }
    res.status(500).json({ 
      error: 'Failed to generate certificate PDF',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Функция для генерации HTML сертификата
function generateCertificateHTML({ playerName, tournamentName, placement, date, organizerName, imageUrl }) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 0;
        }
        .certificate-container {
          width: 297mm;
          height: 210mm;
          position: relative;
          overflow: hidden;
          background: white;
        }
        /* Aurora Background */
        .aurora-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }
        .aurora-layer-1 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 80% 50% at 30% 40%,
            rgba(251, 146, 60, 0.45) 0%,
            rgba(249, 115, 22, 0.38) 40%,
            transparent 70%
          );
          filter: blur(70px);
          mix-blend-mode: multiply;
        }
        .aurora-layer-2 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 70% 60% at 70% 60%,
            rgba(249, 115, 22, 0.38) 0%,
            rgba(245, 158, 11, 0.32) 50%,
            transparent 80%
          );
          filter: blur(75px);
          mix-blend-mode: multiply;
        }
        .aurora-layer-3 {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            ellipse 90% 40% at 50% 30%,
            rgba(245, 158, 11, 0.36) 0%,
            rgba(251, 146, 60, 0.30) 45%,
            transparent 75%
          );
          filter: blur(80px);
          mix-blend-mode: multiply;
        }
        /* Content Wrapper */
        .content-wrapper {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 80px 96px;
        }
        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .vertical-accent {
          width: 8px;
          height: 80px;
          background: linear-gradient(to bottom, #F59E0B 0%, #FB923C 100%);
        }
        .header-text {
          display: flex;
          flex-direction: column;
        }
        .certificate-title {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #000;
          margin-bottom: 4px;
        }
        .certificate-subtitle {
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #666;
        }
        /* Main Content */
        .main-content {
          display: flex;
          flex-direction: column;
          gap: 48px;
        }
        /* Achievement Badge */
        .placement-badge {
          display: inline-block;
          background: #F59E0B;
          color: #000;
          padding: 12px 32px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        /* Achievement Badge - Primary (for Group Stage) */
        .placement-badge-primary {
          display: inline-block;
          background: #F59E0B;
          color: #000;
          padding: 12px 32px;
          border-radius: 4px;
          font-size: 16px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        /* Player Info */
        .player-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .presented-to {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #666;
        }
        .player-name {
          font-size: clamp(48px, 6vw, 80px);
          font-weight: 300;
          letter-spacing: 0.01em;
          line-height: 1;
          color: #000;
        }
        /* Tournament Info */
        .tournament-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .tournament-label {
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #666;
        }
        .tournament-name {
          font-size: 32px;
          font-weight: 400;
          letter-spacing: 0.01em;
          color: #000;
        }
        /* Footer */
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .footer-left {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .footer-line {
          height: 1px;
          width: 256px;
          background: #e5e7eb;
        }
        .footer-name {
          font-size: 16px;
          font-weight: 500;
          color: #000;
        }
        .footer-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #666;
        }
        .footer-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }
        .footer-date-section {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: right;
        }
        .footer-date-line {
          height: 1px;
          width: 128px;
          background: #e5e7eb;
          margin-left: auto;
        }
        .footer-date {
          font-size: 16px;
          font-weight: 500;
          color: #000;
        }
        .logo-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 0;
          z-index: 10;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-header svg {
          display: block;
          width: 24px;
          height: 27px;
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          line-height: 1;
          gap: 0;
        }
        .logo-text span {
          font-size: 12px;
          font-weight: 600;
          color: #FB312E;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1;
          letter-spacing: -0.5px;
        }
        .header-divider {
          width: 1px;
          height: 40px;
          background: #e5e7eb;
        }
      </style>
    </head>
    <body>
      <div class="certificate-container">
        <!-- Aurora Background -->
        <div class="aurora-background">
          <div class="aurora-layer-1"></div>
          <div class="aurora-layer-2"></div>
          <div class="aurora-layer-3"></div>
        </div>
        <!-- Content -->
        <div class="content-wrapper">
          <!-- Logo Header with Certificate Title on left, Logo on right -->
          <div class="logo-header">
            <div class="header-left">
              <div class="vertical-accent"></div>
              <div class="header-text">
                <div class="certificate-title">Certificate</div>
                <div class="certificate-subtitle">Of Achievement</div>
              </div>
            </div>
            <div class="header-right">
              <svg width="24" height="27" viewBox="0 0 74 83" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.667 10.7002C29.7669 -2.07443 48.6512 -3.4783 61.7871 6.85259C61.8135 6.87332 61.8385 6.89569 61.8643 6.91704C74.8526 17.1969 77.9478 35.658 68.1592 48.4532L68.126 48.4961L67.4766 49.3223L67.459 49.3438L67.4424 49.3653C62.9383 54.9324 58.3969 58.3544 54.0196 60.2471C49.2996 62.6545 45.2425 63.305 39.5459 62.627C39.1591 62.581 38.7944 62.4976 38.4717 62.3975C35.1277 61.3606 33.0678 61.1916 31.6739 61.4034C30.4355 61.5916 29.3946 62.1278 28.1582 63.3497C26.8015 64.6905 25.4058 66.6554 23.4629 69.5772C21.5831 72.4041 19.2938 75.9611 16.3057 80.0147C14.2822 82.7597 10.4206 83.2216 7.79495 81.1563L2.28909 76.8262C-0.336595 74.7609 -0.796515 70.8994 1.39456 68.2862L2.5928 66.876C5.35023 63.6705 7.83613 61.0524 9.85256 58.8711C12.2343 56.2947 13.8144 54.4752 14.7979 52.8409C15.6941 51.3514 15.9702 50.2138 15.8614 48.9659C15.7387 47.5612 15.0895 45.5986 13.294 42.5928C13.1204 42.3023 12.9539 41.9677 12.8184 41.6036C11.6665 38.5085 11.0213 35.7278 10.999 32.8047C10.977 29.904 11.5709 27.1249 12.5342 24.0567C12.5536 23.9948 12.5742 23.9332 12.5967 23.8721C13.7886 19.8438 16.0147 15.4641 19.6299 10.7481L19.6485 10.7237L19.667 10.7002ZM59.3145 9.99712C47.7278 0.884679 31.3962 2.31455 22.8047 13.1817C19.3637 17.6705 17.3796 21.6888 16.3682 25.2208C16.3664 25.227 16.3634 25.2332 16.3594 25.2383C16.3556 25.2432 16.3525 25.2491 16.3506 25.2549C14.5502 30.9892 14.4752 34.5887 16.5664 40.2081C16.6087 40.3218 16.6663 40.4379 16.7285 40.542C24.4549 53.4761 17.0841 55.8001 4.45999 70.8565C3.74213 71.7127 3.88449 72.9909 4.76272 73.6817L10.2686 78.0127C11.1468 78.7034 12.423 78.54 13.086 77.6407C24.7445 61.825 25.2668 54.1141 39.6573 58.5762C39.773 58.6121 39.8983 58.64 40.0186 58.6543C45.0501 59.2532 48.3153 58.6885 52.3135 56.628C56.0183 55.0526 60.1058 52.0733 64.3321 46.8497L64.9824 46.0225C73.3262 35.1157 70.8274 19.0558 59.3164 10L59.3155 9.99907L59.3145 9.99712Z" fill="#FB312E"/>
                <path d="M61.5097 26.9731C61.5097 30.563 58.5996 33.4731 55.0097 33.4731C51.4199 33.4731 48.5097 30.563 48.5097 26.9731C48.5097 23.3833 51.4199 20.4731 55.0097 20.4731C58.5996 20.4731 61.5097 23.3833 61.5097 26.9731Z" fill="#FCC054"/>
              </svg>
              <div class="logo-text">
                <span>Racket</span>
                <span>Pong</span>
              </div>
            </div>
          </div>
          <!-- Main Content -->
          <div class="main-content">
            <!-- Achievement Badge -->
            <div>
              <div class="${placement.toUpperCase() === 'GROUP STAGE' ? 'placement-badge-primary' : 'placement-badge'}">${placement.toUpperCase()}</div>
            </div>
            <!-- Player Info -->
            <div class="player-section">
              <p class="presented-to">Presented to</p>
              <h1 class="player-name">${playerName}</h1>
            </div>
            <!-- Tournament Info -->
            <div class="tournament-section">
              <p class="tournament-label">In recognition of outstanding performance at</p>
              <h2 class="tournament-name">${tournamentName}</h2>
            </div>
          </div>
          <!-- Footer -->
          <div class="footer">
            <div class="footer-left">
              <div class="footer-line"></div>
              <p class="footer-name">${organizerName}</p>
              <p class="footer-label">Tournament Director</p>
            </div>
            <div class="footer-right">
              <div class="footer-date-section">
                <div class="footer-date-line"></div>
                <p class="footer-date">${date}</p>
                <p class="footer-label">Date</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;


import { jsPDF } from "jspdf";

interface MinimalCertificateProps {
  playerName: string;
  tournamentName: string;
  placement: string;
  date: string;
  organizerName: string;
}

export async function generateMinimalCertificate({
  playerName,
  tournamentName,
  placement,
  date,
  organizerName,
}: MinimalCertificateProps): Promise<void> {
  try {
    // Create logo SVG as data URL
    const svgPaths = {
      racket: "M19.667 10.7002C29.7669 -2.07443 48.6512 -3.4783 61.7871 6.85259C61.8135 6.87332 61.8385 6.89569 61.8643 6.91704C74.8526 17.1969 77.9478 35.658 68.1592 48.4532L68.126 48.4961L67.4766 49.3223L67.459 49.3438L67.4424 49.3653C62.9383 54.9324 58.3969 58.3544 54.0196 60.2471C49.2996 62.6545 45.2425 63.305 39.5459 62.627C39.1591 62.581 38.7944 62.4976 38.4717 62.3975C35.1277 61.3606 33.0678 61.1916 31.6739 61.4034C30.4355 61.5916 29.3946 62.1278 28.1582 63.3497C26.8015 64.6905 25.4058 66.6554 23.4629 69.5772C21.5831 72.4041 19.2938 75.9611 16.3057 80.0147C14.2822 82.7597 10.4206 83.2216 7.79495 81.1563L2.28909 76.8262C-0.336595 74.7609 -0.796515 70.8994 1.39456 68.2862L2.5928 66.876C5.35023 63.6705 7.83613 61.0524 9.85256 58.8711C12.2343 56.2947 13.8144 54.4752 14.7979 52.8409C15.6941 51.3514 15.9702 50.2138 15.8614 48.9659C15.7387 47.5612 15.0895 45.5986 13.294 42.5928C13.1204 42.3023 12.9539 41.9677 12.8184 41.6036C11.6665 38.5085 11.0213 35.7278 10.999 32.8047C10.977 29.904 11.5709 27.1249 12.5342 24.0567C12.5536 23.9948 12.5742 23.9332 12.5967 23.8721C13.7886 19.8438 16.0147 15.4641 19.6299 10.7481L19.6485 10.7237L19.667 10.7002ZM59.3145 9.99712C47.7278 0.884679 31.3962 2.31455 22.8047 13.1817C19.3637 17.6705 17.3796 21.6888 16.3682 25.2208C16.3664 25.227 16.3634 25.2332 16.3594 25.2383C16.3556 25.2432 16.3525 25.2491 16.3506 25.2549C14.5502 30.9892 14.4752 34.5887 16.5664 40.2081C16.6087 40.3218 16.6663 40.4379 16.7285 40.542C24.4549 53.4761 17.0841 55.8001 4.45999 70.8565C3.74213 71.7127 3.88449 72.9909 4.76272 73.6817L10.2686 78.0127C11.1468 78.7034 12.423 78.54 13.086 77.6407C24.7445 61.825 25.2668 54.1141 39.6573 58.5762C39.773 58.6121 39.8983 58.64 40.0186 58.6543C45.0501 59.2532 48.3153 58.6885 52.3135 56.628C56.0183 55.0526 60.1058 52.0733 64.3321 46.8497L64.9824 46.0225C73.3262 35.1157 70.8274 19.0558 59.3164 10L59.3155 9.99907L59.3145 9.99712Z",
      ball: "M61.5097 26.9731C61.5097 30.563 58.5996 33.4731 55.0097 33.4731C51.4199 33.4731 48.5097 30.563 48.5097 26.9731C48.5097 23.3833 51.4199 20.4731 55.0097 20.4731C58.5996 20.4731 61.5097 23.3833 61.5097 26.9731Z"
    };

    // Convert SVG to ultra-high-resolution image data URL using canvas
    const scale = 16;
    const viewBoxWidth = 74;
    const viewBoxHeight = 83;
    const canvasWidth = viewBoxWidth * scale;
    const canvasHeight = viewBoxHeight * scale;
    
    // Create SVG with light theme colors
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

    // Create PDF document in A4 format - LANDSCAPE orientation
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // ~297mm in landscape
    const pageHeight = pdf.internal.pageSize.getHeight(); // ~210mm in landscape
    
    // Minimal design with double border
    // In landscape: pageWidth ~297mm, pageHeight ~210mm
    const outerBorder = 20; // mm
    const innerBorder = 30; // mm
    const horizontalPadding = 60; // mm (left/right padding)
    const topPadding = 30; // mm
    const bottomPadding = 40; // mm

    // Draw double border frame
    pdf.setDrawColor(200, 200, 200); // Light gray for border
    pdf.setLineWidth(0.3);
    // Outer border
    pdf.rect(outerBorder, outerBorder, pageWidth - (outerBorder * 2), pageHeight - (outerBorder * 2));
    // Inner border (lighter)
    pdf.setDrawColor(220, 220, 220);
    pdf.setLineWidth(0.2);
    pdf.rect(innerBorder, innerBorder, pageWidth - (innerBorder * 2), pageHeight - (innerBorder * 2));

    // Add logo at top center
    const logoSize = 18; // mm
    const logoWidth = logoSize;
    const logoHeight = logoSize * 1.12;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = topPadding + 10;
    pdf.addImage(logoDataUrl, 'PNG', logoX, logoY, logoWidth, logoHeight, undefined, 'NONE');

    // Header text: "Certificate of Achievement"
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128); // Muted foreground
    pdf.setFont('helvetica', 'normal');
    pdf.text('CERTIFICATE OF ACHIEVEMENT', pageWidth / 2, logoY + logoHeight + 8, { 
      align: 'center',
      maxWidth: pageWidth - (horizontalPadding * 2)
    });

    // Calculate center area for main content (vertical center in landscape)
    const headerEndY = logoY + logoHeight + 20;
    const footerStartY = pageHeight - bottomPadding;
    const centerY = (headerEndY + footerStartY) / 2;

    // "This is to certify that" text
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('THIS IS TO CERTIFY THAT', pageWidth / 2, centerY - 35, { align: 'center' });

    // Player name - large, light weight
    pdf.setFontSize(44);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    const nameLines = pdf.splitTextToSize(playerName, pageWidth - (horizontalPadding * 2));
    const nameY = centerY - 15;
    nameLines.forEach((line: string, index: number) => {
      pdf.text(line, pageWidth / 2, nameY + (index * 18), { align: 'center' });
    });

    // Decorative line under name
    const nameEndY = nameY + (nameLines.length * 18) + 8;
    const longestNameLine = nameLines.reduce((a, b) => (a.length > b.length ? a : b), '');
    const nameTextWidth = pdf.getTextWidth(longestNameLine);
    const lineLength = Math.min(nameTextWidth + 60, pageWidth - (horizontalPadding * 2));
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line((pageWidth - lineLength) / 2, nameEndY, (pageWidth + lineLength) / 2, nameEndY);

    // Achievement section: "has achieved"
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('has achieved', pageWidth / 2, nameEndY + 12, { align: 'center' });

    // Placement in bordered box with primary color
    const placementY = nameEndY + 22;
    pdf.setFontSize(13);
    pdf.setTextColor(252, 192, 84); // Primary color (#FCC054)
    pdf.setFont('helvetica', 'normal');
    const placementText = placement.toUpperCase();
    const placementWidth = pdf.getTextWidth(placementText);
    const placementBoxWidth = placementWidth + 25;
    const placementBoxHeight = 8;
    
    // Draw borders for placement box (top and bottom)
    pdf.setDrawColor(252, 192, 84);
    pdf.setLineWidth(0.5);
    pdf.line((pageWidth - placementBoxWidth) / 2, placementY - 2, (pageWidth + placementBoxWidth) / 2, placementY - 2);
    pdf.line((pageWidth - placementBoxWidth) / 2, placementY + placementBoxHeight, (pageWidth + placementBoxWidth) / 2, placementY + placementBoxHeight);
    
    // Placement text
    pdf.text(placementText, pageWidth / 2, placementY + 5, { align: 'center' });

    // Tournament section: "in the"
    pdf.setFontSize(9);
    pdf.setTextColor(128, 128, 128);
    pdf.setFont('helvetica', 'normal');
    pdf.text('in the', pageWidth / 2, placementY + placementBoxHeight + 12, { align: 'center' });

    // Tournament name
    pdf.setFontSize(19);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    const tournamentLines = pdf.splitTextToSize(tournamentName, pageWidth - (horizontalPadding * 2));
    const tournamentY = placementY + placementBoxHeight + 24;
    tournamentLines.forEach((line: string, index: number) => {
      pdf.text(line, pageWidth / 2, tournamentY + (index * 11), { align: 'center' });
    });

    // Footer with signatures
    const footerY = pageHeight - bottomPadding;
    pdf.setDrawColor(150, 150, 150);
    pdf.setLineWidth(0.3);

    // Left signature (Director)
    const signatureLineLength = 45; // mm
    const leftSignatureX = horizontalPadding + 20;
    pdf.line(leftSignatureX, footerY - 20, leftSignatureX + signatureLineLength, footerY - 20);
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    const organizerLines = pdf.splitTextToSize(organizerName, signatureLineLength);
    organizerLines.forEach((line: string, index: number) => {
      pdf.text(line, leftSignatureX + (signatureLineLength / 2), footerY - 12 + (index * 6), { align: 'center', maxWidth: signatureLineLength });
    });
    pdf.setFontSize(7);
    pdf.setTextColor(128, 128, 128);
    pdf.text('DIRECTOR', leftSignatureX + (signatureLineLength / 2), footerY - 2, { align: 'center', maxWidth: signatureLineLength });

    // Right signature (Date)
    const rightSignatureX = pageWidth - horizontalPadding - 20 - signatureLineLength;
    pdf.line(rightSignatureX, footerY - 20, rightSignatureX + signatureLineLength, footerY - 20);
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    const dateLines = pdf.splitTextToSize(date, signatureLineLength);
    dateLines.forEach((line: string, index: number) => {
      pdf.text(line, rightSignatureX + (signatureLineLength / 2), footerY - 12 + (index * 6), { align: 'center', maxWidth: signatureLineLength });
    });
    pdf.setFontSize(7);
    pdf.setTextColor(128, 128, 128);
    pdf.text('DATE', rightSignatureX + (signatureLineLength / 2), footerY - 2, { align: 'center', maxWidth: signatureLineLength });

    // Save PDF
    pdf.save(`Certificate_${playerName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error generating certificate:', error);
    throw error;
  }
}




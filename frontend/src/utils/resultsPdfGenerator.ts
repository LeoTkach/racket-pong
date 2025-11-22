import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Standing {
  rank: string | number;
  placementRange?: string;
  placement?: number;
  full_name?: string;
  username?: string;
  playerName?: string;
  country: string;
  wins: number;
  losses: number;
  pointDifference?: number;
  winRate: string | number;
  points: number;
}

// Главная функция экспорта
export async function generateStandingsPdf(
  tournamentName: string,
  tournamentDate: string,
  tournamentLocation: string,
  standingsData: Standing[],
): Promise<void> {
  try {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const margin = 15;
    const now = new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // --- Заголовок ---
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(tournamentName, margin, 25);

    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(tournamentLocation, margin, 32);
    pdf.text(tournamentDate, margin, 38);

    // --- Заголовок таблицы ---
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("Rankings", margin, 50);

    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(100, 100, 100);
    pdf.text(
      "Current player rankings based on rating and performance",
      margin,
      56
    );

    // --- Таблица ---
    // Сортируем данные по рангу перед отрисовкой
    const sortedStandings = [...standingsData].sort((a, b) => {
      const aRank = a.placement ?? a.rank ?? 999;
      const bRank = b.placement ?? b.rank ?? 999;
      return (aRank as number) - (bRank as number);
    });

    // Подготовка данных для autoTable
    const tableHeaders = ["Rank", "Player", "W/L", "Score Diff", "Win Rate", "Points"];

    const tableBody = sortedStandings.map(row => {
      const rank = row.placementRange || row.rank;
      const name = row.full_name || row.username || row.playerName || "N/A";
      const wins = row.wins ?? 0;
      const losses = row.losses ?? 0;
      const pointDifference = row.pointDifference ?? 0;
      const numericWinRate =
        typeof row.winRate === "number" ? row.winRate : parseFloat(row.winRate ?? "0");
      const winRate = Number.isFinite(numericWinRate) ? numericWinRate : 0;
      const points = row.points ?? 0;

      return [
        rank.toString(),
        name,
        `${wins}/${losses}`,
        pointDifference >= 0 ? `+${pointDifference}` : pointDifference.toString(),
        `${winRate}%`,
        points.toString(),
      ];
    });

    // Вызов autoTable для генерации таблицы
    autoTable(pdf, {
      head: [tableHeaders],
      body: tableBody,
      startY: 62,
      margin: { left: margin, right: margin },
      theme: 'grid',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [10, 10, 10],
        fontStyle: 'bold',
        halign: 'left',
      },
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle',
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 }, // Rank
        1: { halign: 'left', cellWidth: 80 },   // Player
        2: { halign: 'center', cellWidth: 25 },  // W/L
        3: { halign: 'center', cellWidth: 25 }, // Score Diff
        4: { halign: 'center', cellWidth: 25 }, // Win Rate
        5: { halign: 'center', cellWidth: 25 }, // Points
      },
      didDrawCell: (data: any) => {
        if (data.section === 'body') {
          const rankStr = data.row.cells[0].text[0];
          const rankNum = parseInt(rankStr, 10);

          if (!isNaN(rankNum) && rankNum <= 3) {
            if (data.column.index === 0 || data.column.index === 1) {
              data.cell.styles.fontStyle = 'bold';
            }
            if (rankNum === 1) data.cell.styles.textColor = [217, 119, 6];
            if (rankNum === 2) data.cell.styles.textColor = [107, 114, 128];
            if (rankNum === 3) data.cell.styles.textColor = [180, 83, 9];
          }
        }
        
        if (data.section === 'head') {
          const align = ['center', 'left', 'center', 'center', 'center', 'center'][data.column.index];
          if (align) {
            data.cell.styles.halign = align;
          }
        }
      }
    });

    // Вычисляем Y-координату для футера
    const finalY = (pdf as any).lastAutoTable?.finalY || pdf.internal.pageSize.getHeight() - 20;
    const footerY = Math.max(finalY + 10, pdf.internal.pageSize.getHeight() - 10);

    // --- Футер ---
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated on ${now}`, margin, footerY);

    // Нумерация страниц
    const pageCount = pdf.internal.pages.length;
    if (pageCount > 1) {
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pdf.internal.pageSize.getWidth() - margin - 10,
          footerY,
          { align: 'right' }
        );
      }
    } else {
      pdf.text(
        `Page 1 of 1`,
        pdf.internal.pageSize.getWidth() - margin - 10,
        footerY,
        { align: 'right' }
      );
    }

    // --- Сохраняем PDF ---
    pdf.save(`Standings_${tournamentName.replace(/\s+/g, "_")}.pdf`);
  } catch (error) {
    console.error("Error generating standings PDF:", error);
    throw error;
  }
}

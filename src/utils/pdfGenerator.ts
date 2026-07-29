import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { ProgramacionResultado } from '../types';
import { formatDateVisual, capitalizeName } from './textUtils';

export async function generatePDFDocument(prog: ProgramacionResultado): Promise<void> {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const timestampGen = new Date().toLocaleString('es-ES');

  const textoQR = `UNEFCO-2026|VER-1.0|ID-${prog.idTransaccion || 'CRG-001'}|HASH-${prog.hashSeguridad || 'A000000'}|TS-${new Date().toISOString()}`;

  // Generate QR Code as Data URL
  let qrDataUrl = '';
  try {
    qrDataUrl = await QRCode.toDataURL(textoQR, {
      width: 120,
      margin: 1,
      color: { dark: '#1A1A1A', light: '#FFFFFF' }
    });
  } catch (err) {
    console.error("Error generating QR code:", err);
  }

  // Header titles
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 26, 26);
  doc.text("CALENDARIO ACADÉMICO", 14, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 82, 204);
  doc.text("UNEFCO La Paz - Gestión 2026", 14, 24);

  // QR Code on top right (x=254, width=28, height=28)
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 254, 8, 28, 28);
  }

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(115, 115, 115);
  doc.text("Escanear QR para verificar autenticidad", 268, 39, { align: 'center' });
  doc.text(`Generado: ${timestampGen}`, 268, 43, { align: 'center' });

  // Metadata block with clean columns and no overlap
  doc.setFontSize(9);
  let y = 30;

  // Row 1: Facilitador & Técnico
  doc.setFont("helvetica", "bold");
  doc.setTextColor(40, 40, 40);
  doc.text("Facilitador:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(capitalizeName(prog.facilitador), 38, y);

  doc.setFont("helvetica", "bold");
  doc.text("Técnico de Seguimiento:", 135, y);
  doc.setFont("helvetica", "normal");
  doc.text(capitalizeName(prog.tecnico), 180, y);

  // Row 2: Período de Contrato & ID Transacción
  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.text("Período de Contrato:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `${formatDateVisual(prog.fechaInicioContrato)} al ${formatDateVisual(prog.limiteContrato)} (${prog.daysUsed}/100 días)`,
    50,
    y
  );

  doc.setFont("helvetica", "bold");
  doc.text("Código de Registro:", 135, y);
  doc.setFont("helvetica", "normal");
  doc.text(prog.idTransaccion || 'CRG-001', 180, y);

  // Row 3: Modo Programación
  y += 5.5;
  doc.setFont("helvetica", "bold");
  doc.text("Modo Programación:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(prog.modo === 'automatico' ? 'Automático (Escalonado)' : 'Manual (Personalizado)', 50, y);

  y += 6;

  // Category Colors
  const catColors: Record<string, [number, number, number]> = {
    TACFI: [79, 70, 229],
    SEP: [37, 99, 235],
    INICIAL: [5, 150, 105],
    PRIMARIA: [2, 132, 199],
    SECUNDARIA: [124, 58, 237],
    ALTERNATIVA: [219, 39, 119],
    ESPECIAL: [13, 148, 136],
    TECNICO: [225, 29, 72]
  };

  // Build Table Data with formatted place name
  const tableData = prog.asignaciones.map(a => [
    a.cicloId,
    capitalizeName(a.lugar),
    a.modalidad,
    a.cat === 'TACFI' ? '30d Est.' : '15d Prof.',
    `C${a.cursoIndex + 1}: ${a.cursoNombre}`,
    formatDateVisual(a.inicio, false),
    formatDateVisual(a.sesion2, false),
    formatDateVisual(a.sesion3, false),
    formatDateVisual(a.fin, false),
    formatDateVisual(a.planificacion, false),
    formatDateVisual(a.informeFinal, false)
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      ['Ciclo', 'Lugar de Ejecución', 'Modalidad', 'Tipo', 'Curso', 'Inicio', 'S2', 'S3', 'Fin', 'Planificación', 'Informe Final']
    ],
    body: tableData,
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      font: "helvetica",
      fillColor: [255, 255, 255],
      textColor: [26, 26, 26],
      lineColor: [229, 231, 235],
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: [240, 243, 248],
      textColor: [0, 82, 204],
      fontStyle: 'bold',
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: [250, 251, 253]
    },
    didDrawCell: function (data) {
      if (data.section === 'body' && data.column.index === 0) {
        const rowAsig = prog.asignaciones[data.row.index];
        if (rowAsig) {
          const rgb = catColors[rowAsig.cat] || [120, 120, 120];
          doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
          doc.setLineWidth(1.5);
          doc.line(
            data.cell.x,
            data.cell.y,
            data.cell.x,
            data.cell.y + data.cell.height
          );
        }
      }
    }
  });

  // Footer Legend
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(100, 100, 100);
  doc.text("UNEFCO - LP 2026", 14, pageHeight - 8);

  doc.setFont("helvetica", "normal");
  doc.text(
    `Documento de Control y Trazabilidad Académica | ID: ${prog.idTransaccion || ''}`,
    140,
    pageHeight - 8
  );

  // Save PDF
  const filename = `Calendario_Academico_${prog.facilitador.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}


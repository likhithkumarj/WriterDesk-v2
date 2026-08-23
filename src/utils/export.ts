import { Block, BlockType, FileDoc, Project, TitlePage } from "../types/screenplay";
import { normalizeText } from "./formatting";
import { paginate } from "./pagination";
import { uid } from "./uid";
import { GLOBAL_STYLE } from "../components/screenplay/GlobalStyles";
import { jsPDF } from "jspdf";



export function blocksToTxt(blocks: Block[]): string {
  const pad = (n: number) => " ".repeat(n);
  return blocks
    .map((b) => {
      const text = b.text.replace(/<[^>]*>/g, "");
      switch (b.type) {
        case "scene": return "\n" + text.toUpperCase() + "\n";
        case "action": return pad(0) + text + "\n";
        case "character": return pad(20) + text.toUpperCase();
        case "parenthetical": return pad(15) + normalizeText("parenthetical", text);
        case "dialogue": return pad(10) + text + "\n";
      }
    })
    .join("\n");
}

function htmlToFountain(html: string): string {
  let text = html;

  // Convert bold
  text = text.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**");
  text = text.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");

  // Convert italic
  text = text.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*");
  text = text.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");

  // Convert underline
  text = text.replace(/<u[^>]*>(.*?)<\/u>/gi, "_$1_");

  // Strip any other HTML tags
  text = text.replace(/<[^>]*>/g, "");

  return text;
}

export function blocksToFountain(blocks: Block[]): string {
  return blocks
    .map((b) => {
      const text = htmlToFountain(b.text);
      switch (b.type) {
        case "scene": return "\n" + text.toUpperCase();
        case "action": return text;
        case "character": return "\n" + text.toUpperCase();
        case "parenthetical": return normalizeText("parenthetical", text);
        case "dialogue": return text;
      }
    })
    .join("\n");
}

export function download(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

export function renderTitlePageHtml(tp: TitlePage) {
  const e = escapeHtml;
  return `<div class="sp-page"><div class="sp-title-page-inner">
    <div class="sp-tp-spacer-top"></div>
    <div class="sp-tp-title">${e(tp.title)}</div>
    ${tp.credit ? `<div class="sp-tp-credit">${e(tp.credit)}</div>` : ""}
    ${tp.author ? `<div class="sp-tp-author">${e(tp.author)}</div>` : ""}
    ${tp.source ? `<div class="sp-tp-source">${e(tp.source)}</div>` : ""}
    <div class="sp-tp-spacer-bottom"></div>
    <div class="sp-tp-footer">
      <div>${e(tp.contact || "")}</div>
      <div>${e(tp.draftDate || "")}</div>
    </div>
  </div></div>`;
}

export interface MeasuredBlockData {
  type: string;
  text: string;
  splitMore?: boolean;
  splitContd?: string;
}

export interface MeasuredPageData {
  titlePage?: TitlePage;
  pages: {
    blocks: MeasuredBlockData[];
  }[];
}

export function getMeasuredPages(project: Project, files: FileDoc[], combined: boolean): MeasuredPageData[] {
  const filesToPrint = combined ? files : [files[0]];
  const allFilePages: MeasuredPageData[] = [];

  filesToPrint.forEach((f) => {
    const tp = f.titlePage;
    const hasTitlePage = !!(tp?.title && tp.title.trim());

    const measureDiv = document.createElement("div");
    measureDiv.className = "sp-print-container";
    measureDiv.style.width = "794px";
    measureDiv.style.padding = "72px 72px 72px 108px";
    measureDiv.style.boxSizing = "border-box";
    measureDiv.style.position = "absolute";
    measureDiv.style.left = "0";
    measureDiv.style.top = "0";
    measureDiv.style.zIndex = "-9999";
    measureDiv.style.opacity = "0";
    measureDiv.style.pointerEvents = "none";
    measureDiv.style.background = "#ffffff";

    measureDiv.innerHTML = `
      <style>
        .sp-print-block {
          white-space: pre-wrap;
          word-break: break-word;
          margin-left: 0;
          min-height: 1.15em;
          padding: 0;
          font-family: 'Courier Prime', 'Courier New', Courier, monospace !important;
          font-size: 16px;
          line-height: 1.15;
        }
        .sp-print-block[data-type="scene"]        { font-weight: 700; text-transform: uppercase; margin-top: 1.15em; }
        .sp-print-block[data-type="action"]       { margin-left: 4ch !important; margin-top: 0.575em; }
        .sp-print-block[data-type="character"]    { margin-left: 24ch !important; text-transform: uppercase; margin-top: 0.85em; }
        .sp-print-block[data-type="parenthetical"]{ margin-left: 18ch !important; }
        .sp-print-block[data-type="dialogue"]     { margin-left: 10ch !important; max-width: 35ch; }
      </style>
    `;
    document.body.appendChild(measureDiv);

    let endIdx = f.blocks.length - 1;
    while (endIdx >= 0 && (!f.blocks[endIdx].text || !f.blocks[endIdx].text.trim())) {
      endIdx--;
    }
    const activeBlocks = f.blocks.slice(0, endIdx + 1);

    activeBlocks.forEach((b) => {
      const el = document.createElement("div");
      el.className = "sp-print-block";
      el.setAttribute("data-type", b.type || "action");
      el.innerHTML = b.text || "<br>";
      measureDiv.appendChild(el);
    });

    const blockEls = Array.from(measureDiv.querySelectorAll(".sp-print-block")) as HTMLElement[];
    const maxHeight = 978; // Extended content area for full A4 page fill (~54 lines)
    let currentHeight = 0;
    const pageGroupings: HTMLElement[][] = [[]];

    for (let i = 0; i < blockEls.length; i++) {
      const el = blockEls[i];
      const type = el.getAttribute("data-type") || "action";

      let marginTop = 0;
      if (type === "scene") marginTop = 18;
      else if (type === "action") marginTop = 9;
      else if (type === "character") marginTop = 13;

      const h = el.offsetHeight + marginTop;
      let neededHeight = h;

      if (type === "character") {
        const nextEl = blockEls[i + 1];
        const afterNextEl = blockEls[i + 2];
        if (nextEl) {
          const nextType = nextEl.getAttribute("data-type") || "action";
          let nextMargin = 0;
          if (nextType === "scene") nextMargin = 18;
          else if (nextType === "action") nextMargin = 9;
          else if (nextType === "character") nextMargin = 13;

          if (nextType === "parenthetical" && afterNextEl) {
            const afterNextType = afterNextEl.getAttribute("data-type") || "action";
            let afterNextMargin = 0;
            if (afterNextType === "scene") afterNextMargin = 18;
            else if (afterNextType === "action") afterNextMargin = 9;
            else if (afterNextType === "character") afterNextMargin = 13;

            neededHeight += (nextEl.offsetHeight + nextMargin) + (afterNextEl.offsetHeight + afterNextMargin);
          } else {
            neededHeight += (nextEl.offsetHeight + nextMargin);
          }
        }
      }
      if (type === "parenthetical") {
        const nextEl = blockEls[i + 1];
        if (nextEl) {
          const nextType = nextEl.getAttribute("data-type") || "action";
          let nextMargin = 0;
          if (nextType === "scene") nextMargin = 18;
          else if (nextType === "action") nextMargin = 9;
          else if (nextType === "character") nextMargin = 13;
          neededHeight += (nextEl.offsetHeight + nextMargin);
        }
      }
      if (type === "scene") {
        const nextEl = blockEls[i + 1];
        if (nextEl) {
          const nextType = nextEl.getAttribute("data-type") || "action";
          let nextMargin = 0;
          if (nextType === "scene") nextMargin = 18;
          else if (nextType === "action") nextMargin = 9;
          else if (nextType === "character") nextMargin = 13;
          neededHeight += (nextEl.offsetHeight + nextMargin);
        }
      }

      if (currentHeight + neededHeight > maxHeight) {
        if (type === "dialogue" && currentHeight + 36 < maxHeight) {
          el.setAttribute("data-split-more", "true");

          let charName = "CHARACTER";
          for (let j = i - 1; j >= 0; j--) {
            if (blockEls[j].getAttribute("data-type") === "character") {
              charName = blockEls[j].textContent?.trim().replace(/\s*\(.*\)/g, "") || "CHARACTER";
              break;
            }
          }

          const nextEl = blockEls[i + 1];
          if (nextEl && nextEl.getAttribute("data-type") === "dialogue") {
            nextEl.setAttribute("data-split-contd", charName);
          }

          pageGroupings.push([el]);
          currentHeight = 0;
        } else {
          pageGroupings.push([el]);
          currentHeight = h;
        }
      } else {
        pageGroupings[pageGroupings.length - 1].push(el);
        currentHeight += h;
      }
    }

    const validGroupings = pageGroupings.filter((group) => group.length > 0);
    const parsedPages = validGroupings.map((group) => ({
      blocks: group.map((el) => ({
        type: el.getAttribute("data-type") || "action",
        text: el.innerHTML,
        splitMore: el.getAttribute("data-split-more") === "true",
        splitContd: el.getAttribute("data-split-contd") || undefined,
      }))
    }));

    allFilePages.push({
      titlePage: hasTitlePage ? tp : undefined,
      pages: parsedPages,
    });

    measureDiv.remove();
  });

  return allFilePages;
}

export function buildPagesHtml(project: Project, files: FileDoc[], combined: boolean): string {
  const filePagesData = getMeasuredPages(project, files, combined);
  let pagesHtml = "";

  filePagesData.forEach((fileData) => {
    if (fileData.titlePage) {
      const tp = fileData.titlePage;
      pagesHtml += `
        <div class="sp-print-tp">
          <div style="flex: 2.5;"></div>
          <div style="width: 100%;">
            <div class="sp-print-tp-title">${escapeHtml(tp.title)}</div>
            ${tp.credit ? `<div class="sp-print-tp-credit">${escapeHtml(tp.credit)}</div>` : ""}
            ${tp.author ? `<div class="sp-print-tp-author">${escapeHtml(tp.author)}</div>` : ""}
            ${tp.source ? `<div class="sp-print-tp-source">${escapeHtml(tp.source)}</div>` : ""}
          </div>
          <div style="flex: 3.5;"></div>
          <div class="sp-print-tp-footer">
            <div style="white-space: pre-wrap;">${escapeHtml(tp.contact || "")}</div>
            <div>${escapeHtml(tp.draftDate || "")}</div>
          </div>
        </div>
      `;
    }

    fileData.pages.forEach((page, pi) => {
      const pageNum = pi + 1;
      pagesHtml += `
        <div class="sp-print-page">
          ${pageNum > 1 ? `<div class="sp-print-page-number">${pageNum}.</div>` : ""}
          <div class="sp-print-page-content">
            ${page.blocks.map((b) => {
        let blockHtml = `<div class="sp-print-block" data-type="${b.type}">${b.text}</div>`;
        if (b.splitMore) {
          blockHtml += `<div class="sp-print-split-more">(MORE)</div>`;
        }
        if (b.splitContd) {
          blockHtml = `<div class="sp-print-split-contd">${b.splitContd} (CONT'D)</div>` + blockHtml;
        }
        return blockHtml;
      }).join("")}
          </div>
        </div>
      `;
    });
  });

  return pagesHtml;
}

export function exportPDF(project: Project, files: FileDoc[], combined: boolean) {
  const filePagesData = getMeasuredPages(project, files, combined);
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginTop = 54; // Standard top margin
  const marginLeft = 108; // 1.5 in binding margin
  const marginRight = 72;
  const contentWidth = pageWidth - marginLeft - marginRight; // 415.28 pt

  let isFirstPageInDoc = true;

  filePagesData.forEach((fileData) => {
    // 1. Title Page
    if (fileData.titlePage) {
      if (!isFirstPageInDoc) doc.addPage();
      isFirstPageInDoc = false;

      const tp = fileData.titlePage;
      doc.setFont("courier", "bold");
      doc.setFontSize(20);
      doc.text(tp.title.toUpperCase(), pageWidth / 2, 280, { align: "center" });

      doc.setFont("courier", "normal");
      doc.setFontSize(11);
      if (tp.credit) doc.text(tp.credit, pageWidth / 2, 320, { align: "center" });

      doc.setFont("courier", "bold");
      if (tp.author) doc.text(tp.author, pageWidth / 2, 340, { align: "center" });

      doc.setFont("courier", "normal");
      if (tp.source) doc.text(tp.source, pageWidth / 2, 370, { align: "center" });

      if (tp.contact || tp.draftDate) {
        let footerY = pageHeight - 100;
        if (tp.contact) {
          const contactLines = tp.contact.split("\n");
          contactLines.forEach((line) => {
            doc.text(line, marginLeft, footerY);
            footerY += 14;
          });
        }
        if (tp.draftDate) {
          doc.text(tp.draftDate, pageWidth - marginRight, pageHeight - 100, { align: "right" });
        }
      }
    }

    // 2. Screenplay Pages
    fileData.pages.forEach((page, pageIdx) => {
      if (!isFirstPageInDoc) doc.addPage();
      isFirstPageInDoc = false;

      const pageNum = pageIdx + 1;
      if (pageNum > 1) {
        doc.setFont("courier", "normal");
        doc.setFontSize(10);
        doc.text(`${pageNum}.`, pageWidth - marginRight, 36, { align: "right" });
      }

      let y = marginTop;

      page.blocks.forEach((b) => {
        const rawText = b.text.replace(/<[^>]*>/g, "").trim();
        const type = b.type;

        if (b.splitContd) {
          doc.setFont("courier", "bold");
          doc.setFontSize(10.5);
          doc.text(`${b.splitContd} (CONT'D)`, marginLeft + 140, y);
          y += 13;
        }

        if (!rawText) return;

        const fontSize = 10.5;
        const lineHeight = 13.5;

        if (type === "scene") {
          y += 13;
          doc.setFont("courier", "bold");
          doc.setFontSize(fontSize);
          const lines = doc.splitTextToSize(rawText.toUpperCase(), contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, marginLeft, y);
            y += lineHeight;
          });
        } else if (type === "action") {
          y += 6;
          doc.setFont("courier", "normal");
          doc.setFontSize(fontSize);
          const lines = doc.splitTextToSize(rawText, contentWidth);
          lines.forEach((line: string) => {
            doc.text(line, marginLeft, y);
            y += lineHeight;
          });
        } else if (type === "character") {
          y += 9;
          doc.setFont("courier", "bold");
          doc.setFontSize(fontSize);
          const charX = marginLeft + 140;
          const lines = doc.splitTextToSize(rawText.toUpperCase(), 220);
          lines.forEach((line: string) => {
            doc.text(line, charX, y);
            y += lineHeight;
          });
        } else if (type === "parenthetical") {
          doc.setFont("courier", "normal");
          doc.setFontSize(fontSize);
          const parenX = marginLeft + 100;
          const formatted = rawText.startsWith("(") ? rawText : `(${rawText})`;
          const lines = doc.splitTextToSize(formatted, 200);
          lines.forEach((line: string) => {
            doc.text(line, parenX, y);
            y += lineHeight;
          });
        } else if (type === "dialogue") {
          doc.setFont("courier", "normal");
          doc.setFontSize(fontSize);
          const dialX = marginLeft + 60;
          const lines = doc.splitTextToSize(rawText, 240);
          lines.forEach((line: string) => {
            doc.text(line, dialX, y);
            y += lineHeight;
          });
        }

        if (b.splitMore) {
          doc.setFont("courier", "bold");
          doc.setFontSize(10.5);
          doc.text("(MORE)", marginLeft + 140, y + 3);
        }
      });
    });
  });

  const targets = combined ? files : [files[0]];
  const docTitle = targets[0]?.title || project.title || "script";
  doc.save(`${docTitle}.pdf`);
}

export function printPDF(project: Project, files: FileDoc[], combined: boolean) {
  const pagesHtml = buildPagesHtml(project, files, combined);

  const w = window.open("", "_blank", "width=850,height=1100");
  if (!w) {
    alert("Popup blocked! Please allow popups to export PDFs.");
    return;
  }

  w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${escapeHtml(project.title)} - Script</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
    
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: 'Courier Prime', 'Courier New', Courier, monospace;
      font-size: 16px;
      line-height: 1.25;
    }
    
    .sp-print-container {
      background: #ffffff;
    }
    
    .sp-print-page {
      width: 210mm;
      height: 297mm;
      padding: 25.4mm 25.4mm 25.4mm 38.1mm;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
      background: #ffffff;
      overflow: hidden;
    }
    
    .sp-print-page:last-child {
      page-break-after: avoid;
    }
    
    .sp-print-page-number {
      position: absolute;
      top: 12.7mm;
      right: 25.4mm;
      font-size: 16px;
      color: #000000;
    }
    
    .sp-print-tp {
      width: 210mm;
      height: 297mm;
      padding: 25.4mm 38.1mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      position: relative;
      page-break-after: always;
      background: #ffffff;
      overflow: hidden;
    }
    
    .sp-print-tp-title {
      text-align: center;
      text-transform: uppercase;
      font-size: 20px;
      font-weight: bold;
      text-decoration: underline;
      margin-top: 75mm;
      margin-bottom: 24px;
    }
    
    .sp-print-tp-credit {
      text-align: center;
      font-size: 16px;
      margin-bottom: 12px;
    }
    
    .sp-print-tp-author {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    
    .sp-print-tp-source {
      text-align: center;
      font-size: 16px;
      width: 80%;
      margin: 0 auto;
    }
    
    .sp-print-tp-footer {
      display: flex;
      justify-content: space-between;
      width: 100%;
      font-size: 14px;
      margin-top: auto;
      padding-bottom: 15mm;
    }
    
    .sp-print-block {
      white-space: pre-wrap;
      word-break: break-word;
      margin-left: 0;
      min-height: 1.5em;
      padding: 2px 0;
    }
    
    .sp-print-block[data-type="scene"]        { font-weight: 700; text-transform: uppercase; margin-top: 1.5em; }
    .sp-print-block[data-type="action"]       { margin-left: 4ch !important; margin-top: 0.75em; }
    .sp-print-block[data-type="character"]    { margin-left: 24ch !important; text-transform: uppercase; margin-top: 1em; }
    .sp-print-block[data-type="parenthetical"]{ margin-left: 18ch !important; }
    .sp-print-block[data-type="dialogue"]     { margin-left: 10ch !important; max-width: 35ch; }
    
    .sp-print-split-more {
      text-align: center;
      font-size: 16px;
      margin-left: 10ch;
      margin-top: 4px;
    }
    
    .sp-print-split-contd {
      font-size: 16px;
      margin-left: 24ch;
      margin-bottom: 4px;
      text-transform: uppercase;
    }
    
    @media print {
      @page {
        size: A4;
        margin: 0;
      }
      body {
        background: #ffffff;
      }
      .sp-print-page, .sp-print-tp {
        box-shadow: none;
        border: none;
      }
    }
  </style>
</head>
<body>
  <div class="sp-print-container">
    ${pagesHtml}
  </div>
  <script>
    setTimeout(() => {
      window.print();
    }, 500);
  </script>
</body>
</html>`);

  w.document.close();
}

import { Shot } from "../types/screenplay";

export function exportShotListCSV(shots: Shot[], title: string) {
  const headers = ["Status", "Scene #", "Shot #", "Description", "Shot Size", "Shot Type", "Movement", "Equipment", "Lens"];
  const rows = [headers];

  for (const s of shots) {
    rows.push([
      s.status,
      s.sceneNumber.toString(),
      s.shotLabel,
      s.description,
      s.shotType,
      s.angle,
      s.movement,
      s.equipment || "",
      s.lens
    ]);
  }

  const csvContent = rows
    .map((row) =>
      row
        .map((val) => {
          const escaped = val.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(",")
    )
    .join("\n");

  const fileName = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-shot-list.csv`;
  download(fileName, csvContent, "text/csv;charset=utf-8;");
}

export function exportShotListPDF(shots: Shot[], title: string) {
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) return;

  const tableRows = shots.map((s) => `
    <tr>
      <td style="text-align: center; font-weight: 600; font-size: 11px;">${escapeHtml(s.status)}</td>
      <td style="text-align: center; font-weight: bold; width: 60px;">${s.sceneNumber}</td>
      <td style="text-align: center; font-weight: bold; width: 60px; color: #1e40af;">${escapeHtml(s.shotLabel)}</td>
      <td style="font-size: 11px;">${escapeHtml(s.description)}</td>
      <td style="width: 80px;">${escapeHtml(s.shotType)}</td>
      <td style="width: 100px;">${escapeHtml(s.angle)}</td>
      <td style="width: 80px;">${escapeHtml(s.movement)}</td>
      <td style="width: 90px;">${escapeHtml(s.equipment || "—")}</td>
      <td style="width: 80px;">${escapeHtml(s.lens)}</td>
    </tr>
  `).join("");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(title)} - Shot List</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      body {
        font-family: 'Inter', sans-serif;
        background: #ffffff;
        color: #111827;
        margin: 40px;
        font-size: 12px;
      }
      h1 {
        font-size: 24px;
        margin-bottom: 5px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }
      .subtitle {
        color: #6B7280;
        font-size: 14px;
        margin-bottom: 24px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
      }
      th {
        background: #F3F4F6;
        color: #374151;
        font-weight: 600;
        text-align: left;
        padding: 8px 10px;
        border: 1px solid #E5E7EB;
        font-size: 11px;
        text-transform: uppercase;
      }
      td {
        padding: 8px 10px;
        border: 1px solid #E5E7EB;
        vertical-align: top;
      }
      tr:nth-child(even) {
        background: #F9FAFB;
      }
      @media print {
        body { margin: 20px; }
        tr { page-break-inside: avoid; }
      }
    </style>
  </head><body>
    <h1>${escapeHtml(title)}</h1>
    <div class="subtitle">Production Shot List &bull; Generated by WriterDesk</div>
    <table>
      <thead>
        <tr>
          <th style="text-align: center;">Status</th>
          <th style="text-align: center;">Sc #</th>
          <th style="text-align: center;">Shot #</th>
          <th>Description</th>
          <th>Shot Size</th>
          <th>Shot Type</th>
          <th>Movement</th>
          <th>Equipment</th>
          <th>Lens</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    <script>setTimeout(()=>{window.print();},300);</script>
  </body></html>`);
  w.document.close();
}

import { Block, BlockType, FileDoc, Project, TitlePage } from "../types/screenplay";
import { normalizeText } from "./formatting";
import { paginate } from "./pagination";
import { uid } from "./uid";
import { GLOBAL_STYLE } from "../components/screenplay/GlobalStyles";

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
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

export function printPDF(project: Project, files: FileDoc[], combined: boolean) {
  const w = window.open("", "_blank", "width=900,height=1200");
  if (!w) return;
  const renderPages = (blocks: Block[]) => paginate(blocks).map((pageBlocks, pi) => `
    <div class="sp-page">
      ${pi > 0 ? `<div class="sp-page-number">${pi + 1}.</div>` : ""}
      <div class="sp-page-inner">
        ${pageBlocks.map((b) => `<div class="sp-block" data-type="${b.type}">${b.text}</div>`).join("")}
      </div>
    </div>
  `).join("");

  let body = "";
  if (combined) {
    const first = files[0];
    if (first?.titlePage?.title.trim()) body += renderTitlePageHtml(first.titlePage);
    const blocks = files.flatMap((f, i) => i === 0 ? f.blocks : [{ id: uid(), type: "action" as BlockType, text: "" }, ...f.blocks]);
    body += renderPages(blocks);
  } else {
    body = files.map((f) => {
      const tp = f.titlePage?.title.trim() ? renderTitlePageHtml(f.titlePage) : "";
      return tp + renderPages(f.blocks);
    }).join('<div style="page-break-after:always"></div>');
  }

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"/><title>${escapeHtml(project.title)}</title>
    <style>
      ${GLOBAL_STYLE}
      /* Override any viewport media queries to force standard A4 layout */
      body, .sp-canvas {
        background: #ffffff !important;
        padding: 0 !important;
        gap: 0 !important;
      }
      .sp-page-wrapper {
        width: 794px !important;
        height: 1123px !important;
        display: block !important;
        page-break-after: always !important;
        transform: none !important;
      }
      .sp-page {
        width: 794px !important;
        height: 1123px !important;
        transform: none !important;
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        background: #ffffff !important;
        display: block !important;
        position: relative !important;
      }
      .sp-page-inner {
        position: absolute !important;
        top: 72px !important;
        left: 108px !important;
        right: 72px !important;
        bottom: 54px !important;
        padding: 0 !important;
        background: transparent !important;
      }
      .sp-block {
        font-size: 16px !important;
        padding: 2px 4px !important;
        border-left: 3px solid transparent !important;
        margin-left: -7px !important;
      }
      .sp-block.no-bars {
        border-left-color: transparent !important;
      }
      .sp-block[data-type="scene"]        { border-left-color: var(--sp-accent) !important; font-weight: 700 !important; text-transform: uppercase !important; margin-top: 1.5em !important; margin-left: -7px !important; }
      .sp-block[data-type="action"]       { border-left-color: #9CA3AF !important; margin-left: calc(4ch - 7px) !important; margin-top: 0.75em !important; }
      .sp-block[data-type="character"]    { border-left-color: #60A5FA !important; margin-left: calc(24ch - 7px) !important; text-transform: uppercase !important; margin-top: 1em !important; }
      .sp-block[data-type="parenthetical"]{ border-left-color: #34D399 !important; margin-left: calc(18ch - 7px) !important; }
      .sp-block[data-type="dialogue"]     { border-left-color: #E5E7EB !important; margin-left: calc(10ch - 7px) !important; max-width: 35ch !important; }
    </style>
  </head><body><div class="sp-canvas">${body}</div>
  <script>setTimeout(()=>{window.print();},300);</script>
  </body></html>`);
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

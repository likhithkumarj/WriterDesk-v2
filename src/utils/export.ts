import { Block, BlockType, FileDoc, Project, TitlePage } from "../types/screenplay";
import { normalizeText } from "./formatting";
import { paginate } from "./pagination";
import { uid } from "./uid";
import { GLOBAL_STYLE } from "../components/screenplay/GlobalStyles";

export function blocksToTxt(blocks: Block[]): string {
  const pad = (n: number) => " ".repeat(n);
  return blocks
    .map((b) => {
      switch (b.type) {
        case "scene": return "\n" + b.text.toUpperCase() + "\n";
        case "action": return pad(0) + b.text + "\n";
        case "character": return pad(20) + b.text.toUpperCase();
        case "parenthetical": return pad(15) + normalizeText("parenthetical", b.text);
        case "dialogue": return pad(10) + b.text + "\n";
      }
    })
    .join("\n");
}

export function blocksToFountain(blocks: Block[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case "scene": return "\n" + b.text.toUpperCase();
        case "action": return b.text;
        case "character": return "\n" + b.text.toUpperCase();
        case "parenthetical": return normalizeText("parenthetical", b.text);
        case "dialogue": return b.text;
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
    <div class="sp-tp-spacer"></div>
    <div class="sp-tp-title">${e(tp.title)}</div>
    ${tp.credit ? `<div class="sp-tp-credit">${e(tp.credit)}</div>` : ""}
    ${tp.author ? `<div class="sp-tp-author">${e(tp.author)}</div>` : ""}
    ${tp.source ? `<div class="sp-tp-source">${e(tp.source)}</div>` : ""}
    <div class="sp-tp-spacer"></div>
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
        ${pageBlocks.map((b) => `<div class="sp-block" data-type="${b.type}">${escapeHtml(b.text)}</div>`).join("")}
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
    <style>${GLOBAL_STYLE} body{margin:0;background:#fff;} .sp-canvas{padding:0;gap:0;background:#fff;}</style>
  </head><body><div class="sp-canvas">${body}</div>
  <script>setTimeout(()=>{window.print();},300);</script>
  </body></html>`);
  w.document.close();
}

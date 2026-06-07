import React from "react";

export const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');

.sp-page, .sp-page * {
  font-family: 'Courier Prime', 'Courier New', Courier, monospace !important;
  font-size: 16px;
  line-height: 1.5;
  color: #000000;
}
.sp-page-wrapper {
  width: calc(794px * var(--page-scale, 1));
  height: calc(1123px * var(--page-scale, 1));
  flex: 0 0 auto;
}
.sp-page {
  position: relative;
  width: 794px;
  height: 1123px;
  background: #FFFFFF;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 16px rgba(0,0,0,0.18);
  flex: 0 0 auto;
  transform: scale(var(--page-scale, 1));
  transform-origin: top left;
}
.sp-page-inner {
  position: absolute;
  top: 72px;
  left: 108px;
  right: 72px;
  bottom: 72px;
  overflow: visible;
}
.sp-page-number {
  position: absolute;
  top: 36px;
  right: 72px;
  color: #000;
}
.sp-block {
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
  padding: 0 4px;
  border-left: 3px solid transparent;
  margin-left: -7px;
  min-height: 1.5em;
}
.sp-block[data-type="scene"]        { border-left-color: #E8B84B; font-weight: 700; text-transform: uppercase; margin-top: 1.5em; }
.sp-block[data-type="action"]       { border-left-color: #9CA3AF; margin-left: calc(4ch - 7px); margin-top: 0.75em; }
.sp-block[data-type="character"]    { border-left-color: #60A5FA; margin-left: calc(24ch - 7px); text-transform: uppercase; margin-top: 1em; }
.sp-block[data-type="parenthetical"]{ border-left-color: #34D399; margin-left: calc(18ch - 7px); }
.sp-block[data-type="dialogue"]     { border-left-color: #E5E7EB; margin-left: calc(10ch - 7px); max-width: 35ch; }
.sp-block:empty::before { content: attr(data-placeholder); color: #bbb; }

.sp-more { margin-left: 20ch; }

.sp-type-pill {
  position: absolute;
  transform: translateY(-100%);
  margin-top: -4px;
  background: #E8B84B;
  color: #1a1a1a;
  font-family: system-ui, sans-serif !important;
  font-size: 11px !important;
  line-height: 1 !important;
  padding: 3px 8px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
}

/* Theme */
:root {
  --sp-bg: #F0EDE8;
  --sp-toolbar: #FFFFFF;
  --sp-sidebar: #F7F4F0;
  --sp-text: #1a1a1a;
  --sp-border: #e2ddd5;
  --sp-accent: #E8B84B;
  --sp-muted: #6b6b6b;
}
@media (prefers-color-scheme: dark) {
  :root:not(.sp-light) {
    --sp-bg: #1C1C1E;
    --sp-toolbar: #2C2C2E;
    --sp-sidebar: #252525;
    --sp-text: #F5F5F5;
    --sp-border: #3a3a3c;
    --sp-muted: #9a9a9a;
  }
}

.sp-app { background: var(--sp-bg); color: var(--sp-text); min-height: 100vh; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.sp-toolbar { background: var(--sp-toolbar); border-color: var(--sp-border); backdrop-filter: blur(8px); }
.sp-sidebar {
  background: var(--sp-sidebar);
  border-color: var(--sp-border);
  width: 260px;
  border-right: 1px solid var(--sp-border);
  padding: 14px;
  overflow-y: auto;
  flex-shrink: 0;
}
@media (max-width: 794px) {
  .sp-sidebar {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 40;
    height: 100%;
    box-shadow: 4px 0 16px rgba(0,0,0,0.15);
  }
}
.sp-btn {
  background: transparent; border: 1px solid var(--sp-border); color: var(--sp-text);
  padding: 6px 10px; border-radius: 8px; font-size: 13px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
  transition: all 0.12s ease; font-weight: 500;
}
.sp-btn:hover { background: rgba(232,184,75,0.12); border-color: var(--sp-accent); transform: translateY(-1px); }
.sp-btn:active { transform: translateY(0); }
.sp-btn-primary { background: var(--sp-accent); color: #1a1a1a; border-color: var(--sp-accent); font-weight: 600; }
.sp-btn-primary:hover { filter: brightness(0.95); }
.sp-btn-ghost { border-color: transparent; }
.sp-btn-ghost:hover { border-color: var(--sp-border); }
.sp-btn-icon { padding: 6px; }
.sp-btn-active { background: rgba(232,184,75,0.18); border-color: var(--sp-accent); color: var(--sp-text); }
.sp-kbd {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px; padding: 1px 5px; border-radius: 4px;
  background: rgba(0,0,0,0.08); border: 1px solid var(--sp-border);
  color: var(--sp-muted); margin-left: 2px;
}
.sp-input {
  background: var(--sp-bg); color: var(--sp-text); border: 1px solid var(--sp-border);
  border-radius: 8px; padding: 8px 10px; font-size: 14px; width: 100%;
}
.sp-card {
  background: var(--sp-toolbar); border: 1px solid var(--sp-border);
  border-radius: 12px; padding: 18px; cursor: pointer; transition: all 0.18s;
}
.sp-card:hover { border-color: var(--sp-accent); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.sp-badge {
  background: rgba(232,184,75,0.12); color: var(--sp-text);
  border: 1px solid var(--sp-border); padding: 3px 9px; border-radius: 999px;
  font-size: 11px; display: inline-flex; align-items: center; gap: 4px; font-weight: 500;
}
.sp-modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 50;
  display: flex; align-items: center; justify-content: center; padding: 16px;
  backdrop-filter: blur(4px);
}
.sp-modal {
  background: var(--sp-toolbar); color: var(--sp-text); border-radius: 14px; padding: 24px;
  max-width: 520px; width: 100%; max-height: 90vh; overflow: auto;
  border: 1px solid var(--sp-border); box-shadow: 0 24px 60px rgba(0,0,0,0.35);
}
.sp-canvas {
  overflow: auto;
  padding: 40px;
  display: flex; flex-direction: column; align-items: center; gap: 32px;
  background: var(--sp-bg);
  height: 100%;
}
@media (max-width: 794px) {
  .sp-canvas {
    padding: 16px;
    gap: 16px;
  }
  .sp-kbd {
    display: none !important;
  }
}
.sp-scene-item {
  display: flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left;
  padding: 8px 10px; margin-bottom: 2px; border-radius: 8px; background: transparent;
  border: 1px solid transparent; color: var(--sp-text); cursor: pointer; font-size: 12px;
  transition: all 0.12s;
}
.sp-scene-item:hover { background: rgba(232,184,75,0.10); border-color: var(--sp-border); }
.sp-menu {
  position: absolute; right: 8px; top: 36px;
  background: var(--sp-toolbar); border: 1px solid var(--sp-border);
  border-radius: 8px; padding: 4px; z-index: 10; min-width: 140px;
}
.sp-menu button {
  display: block; width: 100%; text-align: left; padding: 6px 10px;
  background: transparent; border: none; color: var(--sp-text);
  font-size: 13px; cursor: pointer; border-radius: 4px;
}
.sp-menu button:hover { background: rgba(232,184,75,0.15); }
.sp-toast {
  position: fixed; bottom: 16px; right: 16px;
  background: var(--sp-accent); color: #1a1a1a; padding: 8px 14px;
  border-radius: 8px; font-size: 13px; font-weight: 600; z-index: 100;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.sp-file-row {
  background: var(--sp-toolbar); border: 1px solid var(--sp-border);
  border-radius: 8px; padding: 12px 14px; display: flex; align-items: center;
  gap: 12px; cursor: pointer; margin-bottom: 8px;
}
.sp-file-row:hover { border-color: var(--sp-accent); }
.sp-file-row.drag-over { border-color: var(--sp-accent); border-style: dashed; }

.sp-suggest {
  position: absolute; top: 100%; left: 0; margin-top: 2px;
  background: #fff; color: #1a1a1a;
  border: 1px solid #d9d4cc; border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
  min-width: 200px; max-width: 360px; max-height: 220px; overflow: auto;
  z-index: 20; padding: 4px;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif !important;
  font-size: 13px !important; line-height: 1.3 !important;
}
.sp-suggest-item {
  padding: 6px 10px; border-radius: 5px; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}
.sp-suggest-item[data-active="true"] { background: rgba(232,184,75,0.22); }
.sp-suggest-item:hover { background: rgba(232,184,75,0.15); }
.sp-suggest-hint { font-size: 10px; color: #999; margin-left: auto; }

.sp-title-page-inner {
  position: absolute; inset: 0; padding: 72px 108px;
  display: flex; flex-direction: column; align-items: center;
  text-align: center;
}
.sp-tp-spacer { flex: 1; }
.sp-tp-title { font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 2em; }
.sp-tp-credit { margin-bottom: 0.75em; }
.sp-tp-author { margin-bottom: 0.75em; }
.sp-tp-source { margin-top: 2em; font-style: italic; }
.sp-tp-footer {
  width: 100%; display: flex; justify-content: space-between;
  align-items: flex-end; text-align: left; white-space: pre-wrap;
}
.sp-tp-footer > div:last-child { text-align: right; }

@media print {
  body { background: #fff !important; }
  .sp-no-print { display: none !important; }
  .sp-canvas { padding: 0; gap: 0; background: #fff; }
  .sp-page-wrapper {
    width: 794px !important;
    height: 1123px !important;
  }
  .sp-page {
    box-shadow: none !important; border: none !important;
    page-break-after: always; margin: 0 !important;
    transform: none !important;
  }
  @page { size: A4; margin: 0; }
}
`;

export function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLE }} />;
}

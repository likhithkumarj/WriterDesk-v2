import React from "react";

export const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

/* Main Theme Variables */
:root {
  --sp-bg: #0f0f11;
  --sp-toolbar: #18181c;
  --sp-sidebar: #131316;
  --sp-text: #efeff1;
  --sp-border: #232329;
  --sp-hover-accent: rgba(255, 179, 0, 0.46);
  --sp-accent: #E8B84B;
  --sp-muted: #8e8e93;
  --sp-font-ui: 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --sp-font-script: 'Courier Prime', 'Courier New', Courier, monospace;
}

body {
  background-color: var(--sp-bg) !important;
  color: var(--sp-text) !important;
}

.sp-app { 
  background: var(--sp-bg); 
  color: var(--sp-text); 
  min-height: 100vh; 
  font-family: var(--sp-font-ui); 
}

/* Page Screenplay Styles */
.sp-page, .sp-page * {
  font-family: var(--sp-font-script) !important;
  font-size: 16px;
  line-height: 1.2;
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
  border: 1px solid #d4d4d8;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  flex: 0 0 auto;
  transform: scale(var(--page-scale, 1));
  transform-origin: top left;
}
.sp-page-inner {
  position: absolute;
  top: 72px;
  left: 108px;
  right: 72px;
  bottom: 54px;
  overflow: visible;
}
.sp-page-number {
  position: absolute;
  top: 36px;
  right: 72px;
  color: #000;
}

/* Screenplay Blocks */
.sp-block {
  white-space: pre-wrap;
  word-break: break-word;
  outline: none;
  padding: 2px 4px;
  border-left: 3px solid transparent;
  margin-left: -7px;
  min-height: 1.5em;
  transition: border-color 0.15s ease, background 0.15s ease;
}
.sp-block:focus {
  background: rgba(232, 184, 75, 0.05);
}
.sp-block[data-type="scene"]        { border-left-color: #E8B84B; font-weight: 700; text-transform: uppercase; margin-top: 1.5em; }
.sp-block[data-type="action"]       { border-left-color: #9CA3AF; margin-left: calc(4ch - 7px); margin-top: 0.75em; }
.sp-block[data-type="character"]    { border-left-color: #60A5FA; margin-left: calc(24ch - 7px); text-transform: uppercase; margin-top: 1em; }
.sp-block[data-type="parenthetical"]{ border-left-color: #34D399; margin-left: calc(18ch - 7px); }
.sp-block[data-type="dialogue"]     { border-left-color: #E5E7EB; margin-left: calc(10ch - 7px); max-width: 35ch; }
.sp-block:empty::before { content: attr(data-placeholder); color: #bbb; }

/* When vertical bars are toggled off */
.sp-block.no-bars { border-left-color: transparent !important; }

.sp-more { margin-left: 20ch; }

.sp-type-pill {
  position: absolute;
  transform: translateY(-100%);
  margin-top: -6px;
  background: #E8B84B;
  color: #0f0f11;
  font-family: var(--sp-font-ui) !important;
  font-size: 10px !important;
  font-weight: 700 !important;
  line-height: 1 !important;
  padding: 3px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
}

/* Redesigned Sidebar lists */
.sp-sidebar-header {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--sp-muted);
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sp-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: 10px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--sp-text);
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.15s ease;
}
.sp-file-item:hover {
  background: rgba(255, 255, 255, 0);
  border-color: var(--sp-border);
}
.sp-file-item.active {
  background: rgba(232, 184, 75, 0.08);
  border-color: rgba(232, 184, 75, 0.25);
  color: #fff;
  border-left: 3px solid var(--sp-accent);
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
}
.sp-file-page-badge {
  font-size: 10px;
  background: #232329;
  color: var(--sp-muted);
  padding: 2px 6px;
  border-radius: 6px;
  font-weight: 600;
}

.sp-scene-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  margin-bottom: 3px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--sp-text);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
  text-align: left;
}
.sp-scene-item:hover {
  background: rgba(255, 255, 255, 0.03);
  border-color: var(--sp-border);
}
.sp-scene-item.active {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--sp-border);
  color: var(--sp-accent);
}
.sp-scene-num-box {
  background: #1e1e24;
  color: var(--sp-muted);
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  font-size: 10px;
  font-weight: 700;
}
.sp-scene-item.active .sp-scene-num-box {
  background: var(--sp-accent);
  color: #0f0f11;
}

/* Global Buttons & Inputs */
.sp-btn {
  background: transparent; 
  border: 1px solid var(--sp-border); 
  color: var(--sp-text);
  padding: 8px 12px; 
  border-radius: 10px; 
  font-size: 13px; 
  cursor: pointer;
  display: inline-flex; 
  align-items: center; 
  justify-content: center;
  gap: 8px; 
  white-space: nowrap;
  transition: all 0.15s ease; 
  font-weight: 500;
}
.sp-btn:hover { 
  border-color: var(--sp-accent); 
}
.sp-btn-primary { 
  background: var(--sp-accent); 
  color: #0f0f11; 
  border-color: var(--sp-accent); 
  font-weight: 600; 
}
.sp-btn-primary:hover { 
  background: var(--sp-hover-accent); 
  border-color: var(--sp-accent); 
  color: white;
}
.sp-btn-ghost { 
  border-color: transparent; 
}
.sp-btn-ghost:hover { 
  background: rgba(255, 255, 255, 0.04);
}
.sp-btn-icon { 
  padding: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.sp-btn-active { 
  background: rgba(232, 184, 75, 0.1); 
  border-color: var(--sp-accent); 
  color: var(--sp-accent); 
}

/* Dropdown Menu styling */
.sp-menu {
  position: absolute;
  right: 0;
  top: 36px;
  background: #18181c;
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  z-index: 100;
  display: flex;
  flex-direction: column;
  padding: 6px;
  min-width: 160px;
  animation: sp-fade-in 0.1s ease-out;
}

.sp-menu button, .sp-menu a {
  background: transparent;
  border: none;
  padding: 8px 12px;
  text-align: left;
  font-size: 13px;
  font-family: var(--sp-font-ui);
  cursor: pointer;
  color: var(--sp-text);
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  box-sizing: border-box;
}

.sp-menu button:hover, .sp-menu a:hover {
  background: rgba(255, 255, 255, 0.04);
  color: var(--sp-accent);
}

/* Scrollbars styling */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #232329;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #32323a;
}

/* Comments cards */
.sp-comment-card {
  background: #16161a;
  border: 1px solid var(--sp-border);
  border-radius: 14px;
  padding: 12px 14px;
  margin-bottom: 10px;
  transition: border-color 0.15s ease;
  position: relative;
}
.sp-comment-card:hover {
  border-color: var(--sp-hover-accent);
}
.sp-comment-delete-btn {
  opacity: 0;
  pointer-events: none;
}
.sp-comment-card:hover .sp-comment-delete-btn {
  opacity: 1;
  pointer-events: auto;
}
.sp-comment-delete-btn:hover {
  color: #f87171 !important;
}
.sp-comment-linked-scene {
  display: inline-block;
  font-size: 10px;
  color: var(--sp-accent);
  background: rgba(232, 184, 75, 0.06);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
  margin-top: 8px;
}

/* Version timeline */
.sp-version-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
}
.sp-version-item:hover {
  background: rgba(255, 255, 255, 0.02);
}
.sp-version-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sp-muted);
  margin-top: 5px;
  flex-shrink: 0;
}
.sp-version-item.active .sp-version-bullet {
  background: var(--sp-accent);
  box-shadow: 0 0 8px var(--sp-accent);
}

.sp-canvas {
  overflow: auto;
  padding: 40px;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 32px;
  background: var(--sp-bg);
  height: 100%;
}

.sp-suggest {
  position: absolute; 
  top: 100%; 
  left: 0; 
  margin-top: 4px;
  background: #18181c; 
  color: #efeff1;
  border: 1px solid var(--sp-border); 
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  min-width: 220px; 
  max-width: 360px; 
  max-height: 230px; 
  overflow: auto;
  z-index: 20; 
  padding: 0px 4px;
  font-family: var(--sp-font-ui) !important;
  font-size: 13px !important; 
  line-height: 1.3 !important;
}
.sp-suggest-item {
  background: rgba(232, 185, 75, 1); 
  padding: 8px 10px; 
  border-radius: 6px; 
  cursor: pointer;
  display: flex; 
  align-items: center; 
  gap: 8px;
  color: #efeff1;
  margin: 5px 0;
}
.sp-suggest-item[data-active="true"] { 
  background: rgba(165, 128, 41, 1); 
  color: var(--sp-accent);
}
.sp-suggest-item:hover { 
  background: rgba(165, 128, 41, 1); 
}
.sp-suggest-hint { 
  font-size: 10px; 
  margin-left: auto; 
}

/* Modals styling */
.sp-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: sp-fade-in 0.15s ease-out;
}

.sp-modal {
  background: #18181c;
  color: #efeff1;
  padding: 28px;
  border-radius: 16px;
  border: 1px solid var(--sp-border);
  width: 90%;
  max-width: 500px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  font-family: var(--sp-font-ui);
  animation: sp-scale-up 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sp-input {
  width: 100%;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--sp-border);
  border-radius: 10px;
  color: var(--sp-text);
  padding: 10px 14px;
  font-size: 13px;
  font-family: var(--sp-font-ui);
  outline: none;
  transition: all 0.15s ease;
  box-sizing: border-box;
}

.sp-input:focus {
  border-color: var(--sp-accent);
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 0 0 2px rgba(232, 184, 75, 0.15);
}

.sp-modal label {
  color: var(--sp-text);
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
}

.sp-modal input[type="radio"],
.sp-modal input[type="checkbox"] {
  accent-color: var(--sp-accent);
  margin-right: 8px;
  cursor: pointer;
}

@keyframes sp-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes sp-scale-up {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Title Page styles */
.sp-title-page-inner {
  position: absolute;
  inset: 0;
  padding: 72px 108px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-sizing: border-box;
}

.sp-tp-spacer-top {
  flex: 2.5;
}

.sp-tp-spacer-bottom {
  flex: 3.5;
}

.sp-tp-title {
  font-weight: 700;
  text-transform: uppercase;
  text-decoration: underline;
  letter-spacing: 0.05em;
  margin-bottom: 2em;
}

.sp-tp-credit {
  margin-bottom: 0.75em;
}

.sp-tp-author {
  margin-bottom: 0.75em;
}

.sp-tp-source {
  margin-top: 2em;
  font-style: italic;
}

.sp-tp-footer {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  text-align: left;
  white-space: pre-wrap;
  box-sizing: border-box;
}

.sp-tp-footer > div:last-child {
  text-align: right;
}

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

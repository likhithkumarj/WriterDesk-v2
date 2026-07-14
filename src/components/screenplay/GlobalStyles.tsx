import React from "react";

export const GLOBAL_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Courier+Prime:ital,wght@0,400;0,700;1,400;1,700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

/* Main Theme Variables (configured in src/styles.css) */
:root {
  --sp-hover-accent: rgba(255, 179, 0, 0.46);
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
  background: rgba(var(--sp-accent-rgb), 0.05);
}
.sp-block[data-type="scene"]        { border-left-color: #3B82F6; font-weight: 700; text-transform: uppercase; margin-top: 1.5em; }
.sp-block[data-type="action"]       { border-left-color: #9CA3AF; margin-left: calc(4ch - 7px); margin-top: 0.75em; }
.sp-block[data-type="character"]    { border-left-color: #60A5FA; margin-left: calc(24ch - 7px); text-transform: uppercase; margin-top: 1em; }
.sp-block[data-type="parenthetical"]{ border-left-color: #34D399; margin-left: calc(18ch - 7px); }
.sp-block[data-type="dialogue"]     { border-left-color: #E5E7EB; margin-left: calc(10ch - 7px); max-width: 35ch; }
.sp-block:empty::before { content: attr(data-placeholder); color: #bbb; }

/* When vertical bars are toggled off */
.sp-block.no-bars { border-left-color: transparent !important; }

/* Visual page breaks inside editor */
.sp-block[data-page-start] {
  margin-top: 48px !important;
  position: relative !important;
}
.sp-block[data-page-start]::before {
  content: "PAGE " attr(data-page-start);
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%);
  background: #18181c;
  color: #efeff1;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 20px;
  border: 1px solid #232329;
  z-index: 10;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  pointer-events: none;
}
.sp-block[data-page-start]::after {
  content: "";
  position: absolute;
  top: -36px;
  width: 794px !important;
  height: 24px;
  background: var(--sp-bg, #0f0f11) !important;
  border-top: 1px solid var(--sp-border, #232329);
  border-bottom: 1px solid var(--sp-border, #232329);
  z-index: 5;
  pointer-events: none;
}

/* Offset left positions for visual page gap depending on block type indentation */
.sp-block[data-page-start][data-type="scene"]::after {
  left: -102px !important;
}
.sp-block[data-page-start][data-type="action"]::after {
  left: calc(-102px - 4ch) !important;
}
.sp-block[data-page-start][data-type="character"]::after {
  left: calc(-102px - 24ch) !important;
}
.sp-block[data-page-start][data-type="parenthetical"]::after {
  left: calc(-102px - 18ch) !important;
}
.sp-block[data-page-start][data-type="dialogue"]::after {
  left: calc(-102px - 10ch) !important;
}

.sp-more { margin-left: 20ch; }

.sp-type-pill {
  position: absolute;
  transform: translateY(-100%);
  margin-top: -6px;
  background: #3B82F6;
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
  background: rgba(var(--sp-accent-rgb), 0.08);
  border-color: rgba(var(--sp-accent-rgb), 0.25);
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
  background: rgba(var(--sp-accent-rgb), 0.1); 
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
  background: rgba(var(--sp-accent-rgb), 0.06);
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
  box-shadow: 0 0 0 2px rgba(var(--sp-accent-rgb), 0.15);
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

/* Desktop/Mobile Helpers */
.sp-desktop-only {
  display: flex !important;
}
.sp-mobile-only {
  display: none !important;
}

@media (max-width: 767px) {
  .sp-desktop-only {
    display: none !important;
  }
  .sp-mobile-only {
    display: flex !important;
  }
  
  html:has(.sp-app), body:has(.sp-app) {
    overflow: hidden !important;
    position: fixed !important;
    width: 100% !important;
    height: 100% !important;
  }
  
  .sp-workspace-frame {
    position: static !important;
  }
  
  /* Sidebar layouts overlay drawers */
  .sp-sidebar-left {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    bottom: 0 !important;
    z-index: 2000 !important;
    width: 250px !important;
    box-shadow: 5px 0 25px rgba(0, 0, 0, 0.6) !important;
    border-right: 1px solid var(--sp-border) !important;
  }
  
  /* Sidebar backdrop */
  .sp-sidebar-backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(0, 0, 0, 0.6) !important;
    backdrop-filter: blur(2px) !important;
    z-index: 1999 !important;
    animation: sp-fade-in 0.2s ease-out;
  }

  /* Mobile Header styling */
  .sp-header {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 56px !important;
    padding: 0 12px !important;
    background: var(--sp-toolbar) !important;
    border-bottom: 1px solid var(--sp-border) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    z-index: 1000 !important;
  }
  
  .sp-mobile-format-bar {
    position: fixed !important;
    top: 56px !important;
    left: 0 !important;
    right: 0 !important;
    height: 48px !important;
    background: var(--sp-toolbar) !important;
    border-bottom: 1px solid var(--sp-border) !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    padding: 0 10px !important;
    overflow-x: auto !important;
    scrollbar-width: none !important;
  }
  
  .sp-mobile-metrics-bar {
    position: fixed !important;
    top: 104px !important;
    left: 0 !important;
    right: 0 !important;
    height: 36px !important;
    background: #141417 !important;
    border-bottom: 1px solid var(--sp-border) !important;
    z-index: 1000 !important;
    display: flex !important;
    align-items: center !important;
    padding: 0 10px !important;
    justify-content: space-between !important;
    font-size: 11px !important;
    color: var(--sp-muted) !important;
  }
  
  .sp-mobile-save-btn {
    border: none !important;
    padding: 6px 12px !important;
    border-radius: 20px !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    cursor: pointer !important;
    background: var(--sp-accent) !important;
    color: #0f0f11 !important;
  }
  
  .sp-mobile-save-btn.saving {
    background: #f59e0b !important;
  }
  
  .sp-mobile-save-btn .dot {
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background: #0f0f11 !important;
    display: inline-block !important;
  }

  /* Fluid Page Canvas (Warped to screen) */
  .sp-canvas {
    padding: 154px 8px 60vh 8px !important; /* 140px top toolbar height offset + 14px padding + 60vh bottom scroll margin */
    gap: 12px !important;
    background: #0f0f11 !important;
    overflow-y: auto !important;
    box-sizing: border-box !important;
  }
  
  .sp-page-wrapper, .sp-page, .sp-page-inner, .sp-block {
    box-sizing: border-box !important;
  }
  
  .sp-page-wrapper {
    width: 100% !important;
    height: auto !important;
  }
  
  .sp-page {
    width: 100% !important;
    min-height: 1123px !important;
    height: auto !important;
    transform: none !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
    border: none !important;
    border-radius: 8px !important;
    background: #ffffff !important;
    display: flex !important;
    flex-direction: column !important;
  }
  
  .sp-page-inner {
    position: relative !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    padding: 24px 14px !important;
    background: #ffffff !important;
    flex: 1 !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: 1123px !important;
  }
  
  .sp-page-number {
    display: none !important;
  }

  /* Proportional screenplay element margins on small screens */
  .sp-block {
    font-size: 15px !important;
    padding-left: 6px !important;
    border-left-width: 2px !important;
    overflow-wrap: break-word !important;
    word-break: break-word !important;
    word-wrap: break-word !important;
    white-space: pre-wrap !important;
    max-width: 100% !important;
  }
  
  .sp-block[data-type="scene"]        { margin-left: 0px !important; max-width: 100% !important; }
  .sp-block[data-type="action"]       { margin-left: 12px !important; max-width: calc(100% - 12px) !important; }
  .sp-block[data-type="character"]    { margin-left: 60px !important; max-width: calc(100% - 60px) !important; }
  .sp-block[data-type="parenthetical"]{ margin-left: 44px !important; max-width: calc(100% - 44px) !important; }
  .sp-block[data-type="dialogue"]     { margin-left: 28px !important; max-width: calc(100% - 28px) !important; }

  /* Title Page Fluid adjustments */
  .sp-title-page-inner {
    position: relative !important;
    inset: auto !important;
    padding: 40px 20px !important;
    min-height: calc(100vh - 120px) !important;
    background: #ffffff !important;
  }

  /* suggestions fixed at the bottom for easy selection */
  .sp-suggest {
    position: fixed !important;
    top: auto !important;
    bottom: 12px !important;
    left: 12px !important;
    right: 12px !important;
    width: auto !important;
    max-width: none !important;
    min-width: 0 !important;
    max-height: 160px !important;
    z-index: 9999 !important;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.6) !important;
  }

  /* Mobile Bottom Navigation Bar */
  .sp-mobile-bottom-bar {
    display: flex !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    right: 0 !important;
    height: 64px !important;
    background: #131316 !important;
    border-top: 1px solid var(--sp-border) !important;
    padding: 0 12px !important;
    align-items: center !important;
    justify-content: space-between !important;
    z-index: 50 !important;
    box-sizing: border-box !important;
  }
  
  .sp-mobile-bottom-left-icons {
    display: flex !important;
    gap: 8px !important;
    align-items: center !important;
  }
  
  .sp-mobile-bar-icon-btn {
    width: 38px !important;
    height: 38px !important;
    border-radius: 10px !important;
    background: #1e1e24 !important;
    border: 1px solid var(--sp-border) !important;
    color: var(--sp-text) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
  }
  
  .sp-mobile-bar-icon-btn:hover {
    border-color: var(--sp-accent) !important;
  }
  
  .sp-mobile-export-btn {
    background: #2e2e38 !important;
    border: 1px solid var(--sp-border) !important;
    color: var(--sp-text) !important;
    height: 38px !important;
    padding: 0 12px !important;
    border-radius: 10px !important;
    font-family: var(--sp-font-ui) !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    cursor: pointer !important;
  }
  
  .sp-mobile-comments-trigger-btn {
    background: #231d14 !important;
    border: 1px solid rgba(var(--sp-accent-rgb), 0.4) !important;
    color: var(--sp-accent) !important;
    height: 38px !important;
    padding: 0 14px !important;
    border-radius: 10px !important;
    font-family: var(--sp-font-ui) !important;
    font-size: 12px !important;
    font-weight: 700 !important;
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
    cursor: pointer !important;
  }
  
  .sp-mobile-comments-badge {
    background: var(--sp-accent) !important;
    color: #0f0f11 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    width: 18px !important;
    height: 18px !important;
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    line-height: 1 !important;
  }

  /* Mobile Bottom Sheet Drawer */
  .sp-mobile-bottom-sheet {
    position: fixed !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background: #131316 !important;
    border-top: 1px solid var(--sp-border) !important;
    border-top-left-radius: 20px !important;
    border-top-right-radius: 20px !important;
    z-index: 2100 !important;
    display: flex !important;
    flex-direction: column !important;
    max-height: 80vh !important;
    min-height: 350px !important;
    padding: 0 16px 16px 16px !important;
    animation: sp-slide-up-anim 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-sizing: border-box !important;
  }

  .sp-mobile-sheet-handle {
    width: 40px !important;
    height: 4px !important;
    background: #444 !important;
    border-radius: 2px !important;
    margin: 10px auto 14px auto !important;
    flex-shrink: 0 !important;
  }

  .sp-mobile-sheet-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    border-bottom: 1px solid var(--sp-border) !important;
    padding-bottom: 8px !important;
    flex-shrink: 0 !important;
  }

  .sp-mobile-sheet-tabs {
    display: flex !important;
    gap: 16px !important;
  }

  .sp-mobile-sheet-tab {
    background: transparent !important;
    border: none !important;
    color: var(--sp-muted) !important;
    font-size: 14px !important;
    font-weight: 600 !important;
    padding: 8px 4px !important;
    cursor: pointer !important;
    position: relative !important;
    font-family: var(--sp-font-ui) !important;
  }

  .sp-mobile-sheet-tab.active {
    color: #fff !important;
  }

  .sp-mobile-sheet-tab.active::after {
    content: '' !important;
    position: absolute !important;
    bottom: -9px !important;
    left: 0 !important;
    right: 0 !important;
    height: 2px !important;
    background: var(--sp-accent) !important;
  }

  .sp-tab-badge {
    background: #2e2e34 !important;
    color: var(--sp-accent) !important;
    font-size: 10px !important;
    padding: 1px 6px !important;
    border-radius: 10px !important;
    margin-left: 4px !important;
    font-weight: 700 !important;
  }

  .sp-mobile-sheet-tab.active .sp-tab-badge {
    background: var(--sp-accent) !important;
    color: #0f0f11 !important;
  }

  .sp-mobile-sheet-close {
    background: transparent !important;
    border: none !important;
    color: var(--sp-muted) !important;
    cursor: pointer !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 4px !important;
  }

  .sp-mobile-sheet-content {
    flex: 1 !important;
    overflow: hidden !important;
    display: flex !important;
    flex-direction: column !important;
    min-height: 0 !important;
  }

  .sp-mobile-comment-form {
    display: flex !important;
    align-items: center !important;
    gap: 10px !important;
    border-top: 1px solid var(--sp-border) !important;
    padding: 10px 0 0 0 !important;
    background: #131316 !important;
    flex-shrink: 0 !important;
  }

  .sp-mobile-comment-input {
    flex: 1 !important;
    background: #0f0f11 !important;
    border: 1px solid var(--sp-border) !important;
    border-radius: 12px !important;
    padding: 10px 14px !important;
    font-size: 13px !important;
    color: #fff !important;
    outline: none !important;
    resize: none !important;
    font-family: var(--sp-font-ui) !important;
  }

  .sp-mobile-comment-send {
    width: 36px !important;
    height: 36px !important;
    border-radius: 12px !important;
    background: var(--sp-accent) !important;
    color: #0f0f11 !important;
    border: none !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    flex-shrink: 0 !important;
  }

  .sp-mobile-comment-send:hover {
    background: var(--sp-hover-accent) !important;
    color: white !important;
  }
}

@keyframes sp-slide-up-anim {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

@media print {
  body { background: #fff !important; }
  .sp-no-print { display: none !important; }
  .sp-canvas { padding: 0 !important; gap: 0 !important; background: #fff !important; display: block !important; height: auto !important; }
  .sp-page-wrapper {
    width: 210mm !important;
    height: 297mm !important;
  }
  .sp-page {
    width: 210mm !important;
    height: 297mm !important;
    min-height: 297mm !important;
    box-shadow: none !important; border: none !important;
    page-break-after: always; margin: 0 !important;
    transform: none !important;
    display: block !important;
  }
  .sp-page-inner {
    position: absolute !important;
    top: 19mm !important;
    left: 28.5mm !important;
    right: 19mm !important;
    bottom: 14mm !important;
    padding: 0 !important;
    min-height: auto !important;
    display: block !important;
  }
  .sp-block {
    font-size: 16px !important;
    max-width: none !important;
  }
  .sp-block[data-type="scene"]        { margin-left: -7px !important; max-width: 100% !important; }
  .sp-block[data-type="action"]       { margin-left: calc(4ch - 7px) !important; max-width: 100% !important; }
  .sp-block[data-type="character"]    { margin-left: calc(24ch - 7px) !important; max-width: 100% !important; }
  .sp-block[data-type="parenthetical"]{ margin-left: calc(18ch - 7px) !important; max-width: 100% !important; }
  .sp-block[data-type="dialogue"]     { margin-left: calc(10ch - 7px) !important; max-width: 35ch !important; }
  .sp-block[data-page-start]::before,
  .sp-block[data-page-start]::after {
    display: none !important;
  }
  .sp-block[data-page-start] {
    margin-top: 0 !important;
  }
  .sp-page:last-child {
    page-break-after: avoid !important;
  }
  @page { size: A4; margin: 0; }
}
`;

export function GlobalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLE }} />;
}

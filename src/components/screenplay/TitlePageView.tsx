import React from "react";
import { TitlePage } from "../../types/screenplay";

export function TitlePageView({ tp }: { tp: TitlePage }) {
  return (
    <div className="sp-title-page-inner">
      <div className="sp-tp-spacer" />
      <div className="sp-tp-title">{tp.title}</div>
      {tp.credit && <div className="sp-tp-credit">{tp.credit}</div>}
      {tp.author && <div className="sp-tp-author">{tp.author}</div>}
      {tp.source && <div className="sp-tp-source">{tp.source}</div>}
      <div className="sp-tp-spacer" />
      <div className="sp-tp-footer">
        <div>{tp.contact}</div>
        <div>{tp.draftDate}</div>
      </div>
    </div>
  );
}

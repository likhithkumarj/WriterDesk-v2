import React, { useMemo } from "react";

interface ActivityCalendarProps {
  userId?: string;
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({ userId }) => {
  if (!userId) return null;
  const activityMap = useMemo(() => {
    const saved = localStorage.getItem(`writing_activity:${userId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {};
  }, [userId]);

  const monthlyActivityCount = useMemo(() => {
    const totalCells = 5 * 7;
    let sum = 0;
    for (let i = 0; i < totalCells; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const y = targetDate.getFullYear();
      const m = String(targetDate.getMonth() + 1).padStart(2, "0");
      const d = String(targetDate.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${d}`;
      sum += activityMap[dateStr] || 0;
    }
    return sum;
  }, [activityMap]);

  const contributionGrid = useMemo(() => {
    const cols = 5;
    const rows = 7;
    const grid = [];
    const totalCells = cols * rows;
    
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        const cellIndex = c * 7 + r;
        const daysAgo = totalCells - 1 - cellIndex;
        
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - daysAgo);
        const y = targetDate.getFullYear();
        const m = String(targetDate.getMonth() + 1).padStart(2, "0");
        const d = String(targetDate.getDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${d}`;
        
        const count = activityMap[dateStr] || 0;
        let level = 0;
        if (count >= 10) level = 4;
        else if (count >= 6) level = 3;
        else if (count >= 3) level = 2;
        else if (count >= 1) level = 1;
        
        row.push({
          level,
          date: targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          count
        });
      }
      grid.push(row);
    }
    return grid;
  }, [activityMap]);

  return (
    <div className="sp-wd-calendar-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .sp-wd-calendar-container {
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 12px 16px;
          background: rgba(20, 20, 22, 0.3);
          backdrop-filter: blur(8px);
          width: 100%;
          max-width: 280px;
          box-sizing: border-box;
        }

        .sp-wd-calendar-header {
          // display: flex;
          // justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 11.5px;
          color: #fff;
          gap: 6px;
        }

        .sp-wd-calendar-scroll {
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .sp-wd-calendar-grid {
          display: grid;
          grid-template-columns: repeat(5, 12px);
          grid-template-rows: repeat(7, 12px);
          gap: 4px;
          width: max-content;
        }

        .sp-wd-calendar-cell {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          background-color: rgba(255, 255, 255, 0.07);
          transition: all 0.2s ease;
          cursor: help;
        }

        .sp-wd-calendar-cell:hover {
          transform: scale(1.15);
          box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
          z-index: 10;
        }

        .sp-wd-calendar-cell.level-1 { background-color: rgba(245, 158, 11, 0.18); }
        .sp-wd-calendar-cell.level-2 { background-color: rgba(245, 158, 11, 0.38); }
        .sp-wd-calendar-cell.level-3 { background-color: rgba(245, 158, 11, 0.68); }
        .sp-wd-calendar-cell.level-4 { background-color: #f59e0b; }

        .sp-wd-calendar-legend {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          color: #6c6c74;
          margin-top: 8px;
        }
        
        .sp-wd-calendar-legend .sp-wd-calendar-cell {
          width: 8px;
          height: 8px;
          border-radius: 2px;
        }
      `}} />

      <div className="sp-wd-calendar-header">
        <span><strong>{monthlyActivityCount}</strong> edits in the last 30 days</span>
        <span style={{ fontSize: 11.5, color: "#8e8e93" }}>Writing Activity</span>
      </div>
      
      <div className="sp-wd-calendar-scroll">
        <div className="sp-wd-calendar-grid">
          {contributionGrid.map((row, rIdx) => 
            row.map((cell, cIdx) => (
              <div 
                key={`${rIdx}-${cIdx}`} 
                className={`sp-wd-calendar-cell level-${cell.level}`}
                title={`${cell.count} save${cell.count === 1 ? "" : "s"} on ${cell.date}`}
              />
            ))
          )}
        </div>
      </div>

      <div className="sp-wd-calendar-legend">
        <span>Less</span>
        <div className="sp-wd-calendar-cell" />
        <div className="sp-wd-calendar-cell level-1" />
        <div className="sp-wd-calendar-cell level-2" />
        <div className="sp-wd-calendar-cell level-3" />
        <div className="sp-wd-calendar-cell level-4" />
        <span>More</span>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { Bell, Heart, MessageSquare, UserPlus, Cloud, Check, X, ShieldAlert } from "lucide-react";
import { Store } from "../types/screenplay";
import { Avatar } from "../components/screenplay/Avatar";

interface AlertItem {
  id: string;
  type: "like" | "comment" | "invite" | "system";
  senderName?: string;
  senderAvatar?: string;
  text: string;
  projectTitle?: string;
  time: string;
  unread: boolean;
  inviteStatus?: "pending" | "accepted" | "declined";
  inviteId?: string;
}

export function NotificationsPage({
  store,
  user,
  onLogout,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
}) {
  const [notifications, setNotifications] = useState<AlertItem[]>([
    {
      id: "n-1",
      type: "invite",
      senderName: "Elena Rostova",
      senderAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
      text: "invited you to collaborate on their screenplay",
      projectTitle: "Neon Tokyo",
      time: "10 minutes ago",
      unread: true,
      inviteStatus: "pending",
      inviteId: "invite-101"
    },
    {
      id: "n-2",
      type: "like",
      senderName: "Sarah Mitchell",
      senderAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
      text: "liked your screenplay project",
      projectTitle: "Noir City Redux",
      time: "2 hours ago",
      unread: true
    },
    {
      id: "n-3",
      type: "comment",
      senderName: "Marco Rivera",
      senderAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marco",
      text: "commented on act one draft: 'The transition in scene 2 is amazing!'",
      projectTitle: "Noir City",
      time: "Yesterday",
      unread: false
    },
    {
      id: "n-4",
      type: "system",
      text: "WriterDesk Cloud Backup successful. All 3 local projects synchronized.",
      time: "2 days ago",
      unread: false
    }
  ]);

  const handleAcceptInvite = (id: string, projectTitle?: string) => {
    alert(`Successfully accepted collaboration invite for ${projectTitle || "Project"}!`);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, inviteStatus: "accepted", unread: false } : n
    ));
  };

  const handleDeclineInvite = (id: string, projectTitle?: string) => {
    alert(`Declined collaboration invite for ${projectTitle || "Project"}.`);
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, inviteStatus: "declined", unread: false } : n
    ));
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all notifications?")) {
      setNotifications([]);
    }
  };

  const getIcon = (type: string) => {
    if (type === "like") return <Heart size={14} fill="#ef4444" color="#ef4444" />;
    if (type === "comment") return <MessageSquare size={14} color="#60a5fa" />;
    if (type === "invite") return <UserPlus size={14} color="#E8B84B" />;
    return <Cloud size={14} color="#34d399" />;
  };

  return (
    <DashboardLayout title="Notifications" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-notif-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-notif-container {
            max-width: 760px;
            margin: 0 auto;
            padding: 32px 24px;
            box-sizing: border-box;
          }

          .sp-notif-header-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .sp-notif-title {
            font-size: 16px;
            font-weight: 700;
            color: #fff;
          }

          .sp-notif-actions {
            display: flex;
            gap: 12px;
          }

          .sp-notif-action-link {
            font-size: 12px;
            color: #E8B84B;
            font-weight: 600;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
          }

          .sp-notif-action-link:hover {
            text-decoration: underline;
          }

          .sp-notif-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 12px;
            padding: 16px 20px;
            margin-bottom: 12px;
            display: flex;
            align-items: flex-start;
            gap: 16px;
            position: relative;
            transition: all 0.15s ease;
          }

          .sp-notif-card:hover {
            border-color: rgba(232, 184, 75, 0.15);
            background-color: #16161a;
          }

          .sp-notif-card.unread::before {
            content: "";
            position: absolute;
            left: 0;
            top: 20px;
            bottom: 20px;
            width: 3px;
            background-color: #E8B84B;
            border-radius: 0 4px 4px 0;
          }

          .sp-notif-icon-box {
            width: 32px;
            height: 32px;
            background-color: rgba(255, 255, 255, 0.02);
            border: 1px solid #1c1c20;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }

          .sp-notif-details {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sp-notif-text-row {
            font-size: 13px;
            color: #efeff1;
            line-height: 1.4;
          }

          .sp-notif-highlight {
            font-weight: 700;
            color: #fff;
          }

          .sp-notif-time {
            font-size: 11px;
            color: #55555d;
          }

          .sp-notif-invite-controls {
            display: flex;
            gap: 10px;
            margin-top: 10px;
          }

          .sp-notif-btn-accept {
            background-color: #E8B84B;
            color: #0f0f11;
            border: 1px solid #E8B84B;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
          }

          .sp-notif-btn-accept:hover {
            background-color: rgba(232, 184, 75, 0.85);
          }

          .sp-notif-btn-decline {
            background-color: transparent;
            color: #efeff1;
            border: 1px solid #232329;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.15s ease;
          }

          .sp-notif-btn-decline:hover {
            border-color: #ef4444;
            color: #ef4444;
          }

          .sp-notif-invite-status {
            font-size: 12px;
            font-weight: 700;
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
          }

          .sp-notif-invite-status.accepted {
            color: #34d399;
          }

          .sp-notif-invite-status.declined {
            color: #ef4444;
          }
        ` }} />

        {/* Action controls header */}
        <div className="sp-notif-header-row">
          <h2 className="sp-notif-title">Recent Activity</h2>
          {notifications.length > 0 && (
            <div className="sp-notif-actions">
              <button className="sp-notif-action-link" onClick={handleMarkAllRead}>Mark all read</button>
              <span style={{ color: "#1c1c20" }}>|</span>
              <button className="sp-notif-action-link" onClick={handleClearAll} style={{ color: "#ef4444" }}>Clear all</button>
            </div>
          )}
        </div>

        {/* Notifications log */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "64px 20px", color: "#8e8e93", background: "#121214", borderRadius: 14, border: "1px solid #1c1c20" }}>
              <Bell size={32} style={{ color: "#555", marginBottom: 12 }} />
              <p style={{ fontSize: 13, margin: 0 }}>You are all caught up! No new notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className={`sp-notif-card ${n.unread ? "unread" : ""}`}>
                
                {/* Left side icon or Avatar */}
                {n.senderAvatar ? (
                  <Avatar src={n.senderAvatar} name={n.senderName || "Writer"} size={32} />
                ) : (
                  <div className="sp-notif-icon-box">
                    {getIcon(n.type)}
                  </div>
                )}

                {/* Center details content */}
                <div className="sp-notif-details">
                  <div className="sp-notif-text-row">
                    {n.senderName && <span className="sp-notif-highlight">{n.senderName} </span>}
                    {n.text}
                    {n.projectTitle && <span className="sp-notif-highlight"> *{n.projectTitle}*</span>}
                  </div>
                  <span className="sp-notif-time">{n.time}</span>

                  {/* Collaboration invite status logic */}
                  {n.type === "invite" && n.inviteStatus === "pending" && (
                    <div className="sp-notif-invite-controls">
                      <button 
                        className="sp-notif-btn-accept"
                        onClick={() => handleAcceptInvite(n.id, n.projectTitle)}
                      >
                        <Check size={12} /> Accept
                      </button>
                      <button 
                        className="sp-notif-btn-decline"
                        onClick={() => handleDeclineInvite(n.id, n.projectTitle)}
                      >
                        <X size={12} /> Decline
                      </button>
                    </div>
                  )}

                  {n.type === "invite" && n.inviteStatus === "accepted" && (
                    <span className="sp-notif-invite-status accepted">
                      <Check size={12} /> Accepted Collaboration
                    </span>
                  )}

                  {n.type === "invite" && n.inviteStatus === "declined" && (
                    <span className="sp-notif-invite-status declined">
                      <X size={12} /> Declined Invitation
                    </span>
                  )}
                </div>

                {/* Right side icon box indicator */}
                {n.senderAvatar && (
                  <div style={{ alignSelf: "center", color: "#55555d" }}>
                    {getIcon(n.type)}
                  </div>
                )}

              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
export default NotificationsPage;

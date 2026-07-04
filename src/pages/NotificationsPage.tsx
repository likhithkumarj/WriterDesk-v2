import React, { useState, useEffect } from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { Bell, Heart, MessageSquare, UserPlus, Cloud, Check, X, ShieldAlert } from "lucide-react";
import { Store } from "../types/screenplay";
import { Avatar } from "../components/screenplay/Avatar";
import { supabaseService } from "../utils/supabaseService";

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
  onRefreshProjects,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
  onRefreshProjects?: () => void;
}) {
  const [notifications, setNotifications] = useState<AlertItem[]>([
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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadRealInvites = async () => {
      if (!supabaseService.isConfigured() || !user?.email) return;
      setLoading(true);
      try {
        const { data, error } = await supabaseService.fetchPendingInvites(user.email);
        if (!error && data) {
          const dbInvites = await Promise.all(
            data.map(async (invite: any) => {
              const projectObj = Array.isArray(invite.projects) ? invite.projects[0] : invite.projects;
              const title = projectObj?.title || "Untitled Project";
              const ownerId = projectObj?.user_id;

              let senderName = "Unknown Sender";
              let senderEmail = "";
              let senderAvatar = "";

              if (ownerId) {
                const { data: profile } = await supabaseService.fetchProfileById(ownerId);
                if (profile) {
                  senderName = profile.full_name || profile.email?.split("@")[0] || "Unknown Sender";
                  senderEmail = profile.email || "";
                  senderAvatar = profile.avatar_url || `https://api.dicebear.com/9.x/avataaars/svg?seed=${profile.email || ownerId}`;
                }
              }

              return {
                id: invite.id,
                type: "invite" as const,
                senderName,
                senderAvatar: senderAvatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${senderEmail || invite.id}`,
                text: `invited you to collaborate on ${senderEmail ? `(${senderEmail})` : ""}`,
                projectTitle: title,
                time: "Pending",
                unread: true,
                inviteStatus: "pending" as const,
                inviteId: invite.id,
              };
            })
          );

          // We merge the db invites with our mock notifications, keeping the invite notifications at the top
          setNotifications(prev => {
            const nonInvites = prev.filter(n => n.type !== "invite");
            return [...dbInvites, ...nonInvites];
          });
        }
      } catch (err) {
        console.error("Error loading invites on NotificationsPage:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRealInvites();
  }, [user]);

  const handleAcceptInvite = async (id: string, projectTitle?: string) => {
    try {
      const session = await supabaseService.getSession();
      const currentUserId = session?.user?.id;
      if (!currentUserId) throw new Error("No authenticated user found.");
      
      const { error } = await supabaseService.acceptInvite(id, currentUserId);
      if (error) throw error;

      alert(`Successfully accepted collaboration invite for ${projectTitle || "Project"}!`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, inviteStatus: "accepted", unread: false } : n
      ));
      
      if (onRefreshProjects) {
        onRefreshProjects();
      }
    } catch (err: any) {
      alert("Error accepting invite: " + err.message);
    }
  };

  const handleDeclineInvite = async (id: string, projectTitle?: string) => {
    try {
      const { error } = await supabaseService.declineInvite(id);
      if (error) throw error;

      alert(`Declined collaboration invite for ${projectTitle || "Project"}.`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, inviteStatus: "declined", unread: false } : n
      ));
    } catch (err: any) {
      alert("Error declining invite: " + err.message);
    }
  };

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const handleClearAll = async () => {
    const confirmed = await (window as any).customConfirm("Clear all notifications?", "Clear Notifications");
    if (confirmed) {
      setNotifications([]);
    }
  };

  const getIcon = (type: string) => {
    if (type === "like") return <Heart size={14} fill="#ef4444" color="#ef4444" />;
    if (type === "comment") return <MessageSquare size={14} color="#60a5fa" />;
    if (type === "invite") return <UserPlus size={14} color="var(--sp-accent)" />;
    return <Cloud size={14} color="#34d399" />;
  };

  return (
    <DashboardLayout 
      title="Notifications" 
      user={user} 
      onLogout={onLogout} 
      projectsCount={store.projects.length}
      unreadNotificationsCount={notifications.filter(n => n.unread).length}
    >
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
            color: var(--sp-accent);
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
            border-color: rgba(var(--sp-accent-rgb), 0.15);
            background-color: #16161a;
          }

          .sp-notif-card.unread::before {
            content: "";
            position: absolute;
            left: 0;
            top: 20px;
            bottom: 20px;
            width: 3px;
            background-color: var(--sp-accent);
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
            background-color: var(--sp-accent);
            color: #0f0f11;
            border: 1px solid var(--sp-accent);
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
            background-color: rgba(var(--sp-accent-rgb), 0.85);
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

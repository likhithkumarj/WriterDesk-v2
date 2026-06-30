import React, { useState, useEffect, useRef } from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { Send, Check, Phone, Video, Info, Circle } from "lucide-react";
import { Avatar } from "../components/screenplay/Avatar";
import { Store } from "../types/screenplay";

interface Message {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
}

interface ChatThread {
  id: string;
  contactName: string;
  contactAvatar: string;
  contactRole: string;
  online: boolean;
  messages: Message[];
  lastMessageTime: string;
  unread: boolean;
}

export function MessagesPage({
  store,
  user,
  onLogout,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
}) {
  const [threads, setThreads] = useState<ChatThread[]>([
    {
      id: "t-1",
      contactName: "Sarah Mitchell",
      contactAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
      contactRole: "Editor / Co-Writer",
      online: true,
      messages: [
        { id: "m-1", sender: "them", text: "Hey! Did you check out the new act two outline?", time: "2:30 PM" },
        { id: "m-2", sender: "me", text: "Yes, I did. I think the pacing in the middle is much faster now.", time: "2:35 PM" },
        { id: "m-3", sender: "them", text: "Great. Let's sync up on Act Two tonight to lock in the scenes.", time: "2:40 PM" }
      ],
      lastMessageTime: "2:40 PM",
      unread: true
    },
    {
      id: "t-2",
      contactName: "Marco Rivera",
      contactAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marco",
      contactRole: "Collaborator",
      online: true,
      messages: [
        { id: "m-4", sender: "them", text: "I reviewed the outline for the hotel scene! The lighting ideas are amazing.", time: "Yesterday" },
        { id: "m-5", sender: "me", text: "Thanks, Marco! I wanted it to feel like vintage neo-noir.", time: "Yesterday" }
      ],
      lastMessageTime: "Yesterday",
      unread: false
    },
    {
      id: "t-3",
      contactName: "Elena Rostova",
      contactAvatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
      contactRole: "Sci-Fi Writer",
      online: false,
      messages: [
        { id: "m-6", sender: "them", text: "Can you look at my android character dialogue when you get a second?", time: "3 days ago" }
      ],
      lastMessageTime: "3 days ago",
      unread: false
    }
  ]);

  const [activeThreadId, setActiveThreadId] = useState("t-1");
  const [typedMessage, setTypedMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeThreadId) || threads[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread.messages]);

  // Mark active thread as read when switching
  useEffect(() => {
    setThreads(threads.map(t => t.id === activeThreadId ? { ...t, unread: false } : t));
  }, [activeThreadId]);

  const handleSendMessage = () => {
    if (!typedMessage.trim()) return;

    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: "me",
      text: typedMessage.trim(),
      time: timeStr
    };

    const updatedMessages = [...activeThread.messages, userMsg];

    setThreads(threads.map(t => {
      if (t.id === activeThreadId) {
        return {
          ...t,
          messages: updatedMessages,
          lastMessageTime: timeStr
        };
      }
      return t;
    }));

    setTypedMessage("");

    // Setup auto reply simulation
    const activeContactName = activeThread.contactName;
    setTimeout(() => {
      const responseMsg: Message = {
        id: `msg-${Date.now() + 1}`,
        sender: "them",
        text: `Thanks for the message! I'm currently reviewing scripts, but let's connect shortly. — ${activeContactName.split(" ")[0]}`,
        time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      };

      setThreads(prevThreads => prevThreads.map(t => {
        if (t.id === activeThreadId) {
          return {
            ...t,
            messages: [...t.messages, responseMsg],
            lastMessageTime: responseMsg.time
          };
        }
        return t;
      }));
    }, 1200);
  };

  return (
    <DashboardLayout title="Messages" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-msg-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-msg-container {
            display: flex;
            height: calc(100vh - 72px); /* fill screen minus layout header */
            background-color: #08080a;
            box-sizing: border-box;
          }

          .sp-msg-sidebar {
            width: 300px;
            background-color: #0c0c0e;
            border-right: 1px solid #1c1c20;
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
          }

          .sp-msg-sidebar-header {
            padding: 24px;
            border-bottom: 1px solid #1c1c20;
          }

          .sp-msg-sidebar-title {
            font-size: 16px;
            font-weight: 800;
            color: #fff;
            margin: 0;
          }

          .sp-msg-threads-list {
            flex: 1;
            overflow-y: auto;
            padding: 12px;
          }

          .sp-msg-thread-item {
            display: flex;
            align-items: center;
            gap: 12px;
            width: 100%;
            padding: 12px;
            border-radius: 12px;
            background: transparent;
            border: none;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s ease;
            margin-bottom: 6px;
            box-sizing: border-box;
          }

          .sp-msg-thread-item:hover {
            background-color: #121214;
          }

          .sp-msg-thread-item.active {
            background-color: #121214;
            border: 1px solid #1c1c20;
          }

          .sp-msg-thread-avatar-wrap {
            position: relative;
            flex-shrink: 0;
          }

          .sp-msg-thread-status-dot {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 10px;
            height: 10px;
            background-color: #34d399;
            border: 2px solid #0c0c0e;
            border-radius: 50%;
          }

          .sp-msg-thread-status-dot.offline {
            background-color: #55555d;
          }

          .sp-msg-thread-details {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sp-msg-thread-header-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }

          .sp-msg-thread-name {
            font-size: 13.5px;
            font-weight: 700;
            color: #fff;
          }

          .sp-msg-thread-time {
            font-size: 10px;
            color: #55555d;
          }

          .sp-msg-thread-preview-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .sp-msg-thread-preview {
            font-size: 12px;
            color: #8e8e93;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin: 0;
          }

          .sp-msg-thread-unread-dot {
            width: 6px;
            height: 6px;
            background-color: var(--sp-accent);
            border-radius: 50%;
            flex-shrink: 0;
          }

          .sp-msg-chat-pane {
            flex: 1;
            display: flex;
            flex-direction: column;
            background-color: #08080a;
            min-width: 0;
          }

          .sp-msg-chat-header {
            height: 64px;
            border-bottom: 1px solid #1c1c20;
            padding: 0 24px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background-color: #0f0f11;
            flex-shrink: 0;
          }

          .sp-msg-chat-header-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .sp-msg-chat-header-text {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .sp-msg-chat-header-name {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
          }

          .sp-msg-chat-header-role {
            font-size: 11px;
            color: #8e8e93;
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .sp-msg-chat-header-actions {
            display: flex;
            gap: 8px;
          }

          .sp-msg-chat-scroller {
            flex: 1;
            overflow-y: auto;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .sp-msg-bubble-row {
            display: flex;
            width: 100%;
          }

          .sp-msg-bubble-row.me {
            justify-content: flex-end;
          }

          .sp-msg-bubble-row.them {
            justify-content: flex-start;
          }

          .sp-msg-bubble {
            max-width: 60%;
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 13px;
            line-height: 1.45;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sp-msg-bubble-row.me .sp-msg-bubble {
            background-color: var(--sp-accent);
            color: #0f0f11;
            font-weight: 600;
            border-top-right-radius: 2px;
          }

          .sp-msg-bubble-row.them .sp-msg-bubble {
            background-color: #121214;
            color: #efeff1;
            border-top-left-radius: 2px;
            border: 1px solid #1c1c20;
          }

          .sp-msg-bubble-time {
            font-size: 9.5px;
            align-self: flex-end;
          }

          .sp-msg-bubble-row.me .sp-msg-bubble-time {
            color: rgba(15, 15, 17, 0.6);
          }

          .sp-msg-bubble-row.them .sp-msg-bubble-time {
            color: #55555d;
          }

          .sp-msg-chat-input-row {
            height: 80px;
            border-top: 1px solid #1c1c20;
            padding: 0 24px;
            display: flex;
            align-items: center;
            gap: 12px;
            background-color: #0f0f11;
            flex-shrink: 0;
            box-sizing: border-box;
          }

          @media (max-width: 768px) {
            .sp-msg-container {
              height: calc(100vh - 136px); /* mobile top + mobile bottom nav sizes */
            }

            /* On mobile, if conversation is selected, hide list, else hide conversation */
            .sp-msg-sidebar {
              width: 100%;
            }

            .sp-msg-chat-pane {
              display: none; /* In layout, a simple toggle can show/hide, but let's keep basic split for prototype */
            }
          }
        ` }} />

        {/* Messaging Sidebar List */}
        <aside className="sp-msg-sidebar">
          <div className="sp-msg-sidebar-header">
            <h3 className="sp-msg-sidebar-title">Chats</h3>
          </div>
          <div className="sp-msg-threads-list">
            {threads.map((t) => (
              <button 
                key={t.id}
                className={`sp-msg-thread-item ${t.id === activeThreadId ? "active" : ""}`}
                onClick={() => setActiveThreadId(t.id)}
              >
                <div className="sp-msg-thread-avatar-wrap">
                  <Avatar src={t.contactAvatar} name={t.contactName} size={38} />
                  <span className={`sp-msg-thread-status-dot ${t.online ? "" : "offline"}`} />
                </div>

                <div className="sp-msg-thread-details">
                  <div className="sp-msg-thread-header-row">
                    <span className="sp-msg-thread-name">{t.contactName}</span>
                    <span className="sp-msg-thread-time">{t.lastMessageTime}</span>
                  </div>
                  <div className="sp-msg-thread-preview-row">
                    <p className="sp-msg-thread-preview">
                      {t.messages[t.messages.length - 1]?.text || "No messages yet."}
                    </p>
                    {t.unread && <span className="sp-msg-thread-unread-dot" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Messaging Active Conversation Window */}
        <div className="sp-msg-chat-pane">
          
          {/* Chat Window Header */}
          <header className="sp-msg-chat-header">
            <div className="sp-msg-chat-header-info">
              <Avatar src={activeThread.contactAvatar} name={activeThread.contactName} size={36} />
              <div className="sp-msg-chat-header-text">
                <span className="sp-msg-chat-header-name">{activeThread.contactName}</span>
                <span className="sp-msg-chat-header-role">
                  <Circle size={8} fill={activeThread.online ? "#34d399" : "#55555d"} color="transparent" />
                  {activeThread.contactRole} · {activeThread.online ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="sp-msg-chat-header-actions">
              <button className="sp-layout-header-btn" onClick={() => alert("Starting voice call...")} title="Call writer">
                <Phone size={14} />
              </button>
              <button className="sp-layout-header-btn" onClick={() => alert("Starting video call...")} title="Video call writer">
                <Video size={14} />
              </button>
              <button className="sp-layout-header-btn" onClick={() => alert("Collaborating settings overlay")} title="Chat info">
                <Info size={14} />
              </button>
            </div>
          </header>

          {/* Messages Scroller */}
          <div className="sp-msg-chat-scroller">
            {activeThread.messages.map((m) => (
              <div key={m.id} className={`sp-msg-bubble-row ${m.sender}`}>
                <div className="sp-msg-bubble">
                  <span>{m.text}</span>
                  <span className="sp-msg-bubble-time">{m.time}</span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Row */}
          <div className="sp-msg-chat-input-row">
            <input 
              className="sp-input" 
              placeholder={`Write a message to ${activeThread.contactName.split(" ")[0]}...`}
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendMessage();
              }}
              style={{ flex: 1, padding: "10px 16px" }}
            />
            <button 
              className="sp-ws-btn-gold" 
              onClick={handleSendMessage}
              disabled={!typedMessage.trim()}
              style={{ height: 38, width: 38, padding: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>

        </div>

      </div>
    </DashboardLayout>
  );
}
export default MessagesPage;

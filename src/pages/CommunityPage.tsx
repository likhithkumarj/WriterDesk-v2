import React, { useState } from "react";
import { DashboardLayout, UserProfile } from "./DashboardLayout";
import { MessageSquare, Heart, Share2, Send, Plus } from "lucide-react";
import { Store } from "../types/screenplay";
import { Avatar } from "../components/screenplay/Avatar";

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  time: string;
}

interface Post {
  id: string;
  author: string;
  avatar: string;
  role: string;
  time: string;
  title: string;
  content: string;
  snippet?: string; // Formatted script block
  likes: number;
  liked: boolean;
  comments: Comment[];
  showComments: boolean;
}

export function CommunityPage({
  store,
  user,
  onLogout,
}: {
  store: Store;
  user: UserProfile;
  onLogout: () => void;
}) {
  const [newPostText, setNewPostText] = useState("");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostSnippet, setNewPostSnippet] = useState("");
  const [showCreateBox, setShowCreateBox] = useState(false);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: "post-1",
      author: "Elena Rostova",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
      role: "Sci-Fi Writer",
      time: "2 hours ago",
      title: "Solaris 2088 — Scene 4 Draft Feedback",
      content: "Just finished tweaking this character introduction scene. I wanted to establish the isolation of the research vessel early on. Let me know what you think of the pacing!",
      snippet: "EXT. DEEP SPACE - SOLARIS OBSERVATORY\n\nThe station is a monolith of iron, suspended in the silent void. A single light flickers in the crew quarters.\n\nINT. OBSERVATORY - CREW QUARTERS\n\nKAI (30s), haggard, adjusts the terminal knobs. Static echoes.\n\nKAI\n(whispering)\nIf you can hear this... don't send the rescue boat.",
      likes: 18,
      liked: false,
      comments: [
        {
          id: "c-1",
          author: "Ben Carter",
          avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Ben",
          text: "The silence feels extremely tangible! Suggest capitalizing 'SILENT VOID' to emphasize it.",
          time: "1 hour ago",
        }
      ],
      showComments: false,
    },
    {
      id: "post-2",
      author: "Sarah Mitchell",
      avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Sarah",
      role: "Drama/Indie",
      time: "5 hours ago",
      title: "How detailed do you write your character descriptions?",
      content: "I'm starting a new indie screenplay. Usually, I keep character intros to just ages and a single trait. Does anyone prefer longer descriptions, or is it better to leave it completely open for casting directors?",
      likes: 12,
      liked: true,
      comments: [
        {
          id: "c-2",
          author: "Elena Rostova",
          avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Elena",
          text: "Usually, shorter is better unless a physical trait is key to the plot. Keeps the page flowing!",
          time: "4 hours ago",
        },
        {
          id: "c-3",
          author: "Marco Rivera",
          avatar: "https://api.dicebear.com/9.x/avataaars/svg?seed=Marco",
          text: "Agreed. Stick to personality and attitude rather than eye color or specific clothing.",
          time: "3 hours ago",
        }
      ],
      showComments: false,
    }
  ]);

  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});

  const handleLike = (postId: string) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleAddPost = () => {
    if (!newPostTitle.trim() || !newPostText.trim()) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      author: user.name,
      avatar: user.avatar,
      role: "Writer",
      time: "Just now",
      title: newPostTitle.trim(),
      content: newPostText.trim(),
      snippet: newPostSnippet.trim() || undefined,
      likes: 0,
      liked: false,
      comments: [],
      showComments: false
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle("");
    setNewPostText("");
    setNewPostSnippet("");
    setShowCreateBox(false);
  };

  const toggleComments = (postId: string) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, showComments: !p.showComments } : p));
  };

  const handleAddComment = (postId: string) => {
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            {
              id: `c-${Date.now()}`,
              author: user.name,
              avatar: user.avatar,
              text: text.trim(),
              time: "Just now"
            }
          ]
        };
      }
      return p;
    }));

    setCommentInputs({ ...commentInputs, [postId]: "" });
  };

  return (
    <DashboardLayout title="Community" user={user} onLogout={onLogout} projectsCount={store.projects.length}>
      <div className="sp-comm-container">
        <style dangerouslySetInnerHTML={{ __html: `
          .sp-comm-container {
            max-width: 760px;
            margin: 0 auto;
            padding: 32px 24px;
            box-sizing: border-box;
          }

          .sp-comm-action-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }

          .sp-comm-feed-title {
            font-size: 16px;
            font-weight: 700;
            color: #fff;
          }

          .sp-comm-create-box {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 14px;
            padding: 20px;
            margin-bottom: 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .sp-comm-post-card {
            background-color: #121214;
            border: 1px solid #1c1c20;
            border-radius: 14px;
            padding: 24px;
            margin-bottom: 16px;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .sp-comm-post-header {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .sp-comm-post-author-info {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .sp-comm-post-author-name {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
          }

          .sp-comm-post-author-role {
            font-size: 11px;
            color: #8e8e93;
            font-weight: 600;
          }

          .sp-comm-post-time {
            font-size: 11px;
            color: #55555d;
            margin-left: auto;
          }

          .sp-comm-post-title {
            font-size: 16px;
            font-weight: 800;
            color: #fff;
            margin: 0;
            letter-spacing: -0.01em;
          }

          .sp-comm-post-body {
            font-size: 13px;
            color: #efeff1;
            line-height: 1.5;
            margin: 0;
          }

          .sp-comm-post-snippet {
            background-color: #0c0c0e;
            border-left: 3px solid var(--sp-accent);
            border-radius: 6px;
            padding: 16px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            line-height: 1.4;
            color: #d1d1d6;
            white-space: pre-wrap;
            overflow-x: auto;
            margin: 0;
          }

          .sp-comm-post-actions {
            display: flex;
            gap: 24px;
            border-top: 1px solid #1c1c20;
            padding-top: 14px;
            margin-top: 4px;
          }

          .sp-comm-post-action-btn {
            background: transparent;
            border: none;
            color: #8e8e93;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 0;
            transition: all 0.15s ease;
          }

          .sp-comm-post-action-btn:hover {
            color: var(--sp-accent);
          }

          .sp-comm-post-action-btn.liked {
            color: #ef4444;
          }

          .sp-comm-comments-section {
            border-top: 1px solid #1c1c20;
            padding-top: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .sp-comm-comment-card {
            display: flex;
            gap: 12px;
            align-items: flex-start;
          }

          .sp-comm-comment-bubble {
            flex: 1;
            background-color: #1a1a1e;
            border-radius: 10px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .sp-comm-comment-author {
            font-size: 12px;
            font-weight: 700;
            color: #fff;
          }

          .sp-comm-comment-text {
            font-size: 12.5px;
            color: #efeff1;
            line-height: 1.4;
            margin: 0;
          }

          .sp-comm-comment-time {
            font-size: 10px;
            color: #55555d;
            align-self: flex-end;
          }

          .sp-comm-comment-input-row {
            display: flex;
            gap: 10px;
            align-items: center;
            margin-top: 8px;
          }
        ` }} />

        {/* Header Action Bar */}
        <div className="sp-comm-action-bar">
          <h2 className="sp-comm-feed-title">Writers Lounge Feed</h2>
          {!showCreateBox && (
            <button className="sp-ws-btn-gold" style={{ padding: "6px 14px", borderRadius: 8 }} onClick={() => setShowCreateBox(true)}>
              <Plus size={14} /> Share Scene
            </button>
          )}
        </div>

        {/* Create new post dialog box */}
        {showCreateBox && (
          <div className="sp-comm-create-box">
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Create Post</h3>
            <input 
              className="sp-input" 
              placeholder="Post Title (e.g. Solaris 2088 — Draft Scene)" 
              value={newPostTitle}
              onChange={(e) => setNewPostTitle(e.target.value)}
            />
            <textarea 
              className="sp-input" 
              placeholder="What are you working on? Ask for feedback or share updates..." 
              rows={3} 
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              style={{ resize: "none" }}
            />
            <textarea 
              className="sp-input" 
              placeholder="Screenplay script snippet (optional) — formatted in Courier New style" 
              rows={4} 
              value={newPostSnippet}
              onChange={(e) => setNewPostSnippet(e.target.value)}
              style={{ fontFamily: "monospace", resize: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="sp-btn" style={{ padding: "6px 12px" }} onClick={() => setShowCreateBox(false)}>Cancel</button>
              <button 
                className="sp-btn sp-btn-primary" 
                style={{ padding: "6px 12px" }}
                disabled={!newPostTitle.trim() || !newPostText.trim()}
                onClick={handleAddPost}
              >
                Post
              </button>
            </div>
          </div>
        )}

        {/* Posts feed */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {posts.map((post) => (
            <div key={post.id} className="sp-comm-post-card">
              
              {/* Post Header */}
              <div className="sp-comm-post-header">
                <Avatar src={post.avatar} name={post.author} size={38} />
                <div className="sp-comm-post-author-info">
                  <span className="sp-comm-post-author-name">{post.author}</span>
                  <span className="sp-comm-post-author-role">{post.role}</span>
                </div>
                <span className="sp-comm-post-time">{post.time}</span>
              </div>

              {/* Title & Body */}
              <h3 className="sp-comm-post-title">{post.title}</h3>
              <p className="sp-comm-post-body">{post.content}</p>

              {/* Script Snippet (if present) */}
              {post.snippet && (
                <pre className="sp-comm-post-snippet">{post.snippet}</pre>
              )}

              {/* Action Toolbar */}
              <div className="sp-comm-post-actions">
                <button 
                  className={`sp-comm-post-action-btn ${post.liked ? "liked" : ""}`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart size={14} fill={post.liked ? "currentColor" : "none"} />
                  <span>{post.likes} Like{post.likes === 1 ? "" : "s"}</span>
                </button>
                <button className="sp-comm-post-action-btn" onClick={() => toggleComments(post.id)}>
                  <MessageSquare size={14} />
                  <span>{post.comments.length} Comment{post.comments.length === 1 ? "" : "s"}</span>
                </button>
                <button className="sp-comm-post-action-btn" onClick={() => alert("Post link copied to clipboard!")}>
                  <Share2 size={14} />
                  <span>Share</span>
                </button>
              </div>

              {/* Comments Section */}
              {post.showComments && (
                <div className="sp-comm-comments-section">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="sp-comm-comment-card">
                      <Avatar src={comment.avatar} name={comment.author} size={28} />
                      <div className="sp-comm-comment-bubble">
                        <span className="sp-comm-comment-author">{comment.author}</span>
                        <p className="sp-comm-comment-text">{comment.text}</p>
                        <span className="sp-comm-comment-time">{comment.time}</span>
                      </div>
                    </div>
                  ))}

                  {/* Comment Input */}
                  <div className="sp-comm-comment-input-row">
                    <Avatar src={user.avatar} name={user.name} size={28} />
                    <input 
                      className="sp-input" 
                      placeholder="Add a comment..."
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddComment(post.id);
                      }}
                      style={{ flex: 1, padding: "6px 12px", fontSize: 12 }}
                    />
                    <button 
                      className="sp-layout-header-btn" 
                      onClick={() => handleAddComment(post.id)}
                      style={{ width: 32, height: 32, flexShrink: 0 }}
                      title="Send comment"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
export default CommunityPage;

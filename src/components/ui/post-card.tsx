"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { type Post } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { useComments } from "@/lib/comments";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import {
  Megaphone, Package, RefreshCw, Play, Pin,
  Heart, MessageCircle, Share2, Send, Star, Percent, Lock, Trash2,
} from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  announcement: Megaphone,
  drop: Package,
  update: RefreshCw,
  media: Play,
  review: Star,
  promo: Percent,
};

const typeLabels: Record<string, string> = {
  announcement: "ANNOUNCEMENT",
  drop: "NEW DROP",
  update: "UPDATE",
  media: "MEDIA",
  review: "MEMBER REVIEW",
  promo: "PROMO",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "NOW";
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

export function PostCard({ post, index }: { post: Post; index: number }) {
  const Icon = typeIcons[post.type];
  const { fg, border, isDark, cardBg, muted, accent } = useTheme();
  const { user, canComment, isAdmin } = useAuth();
  const { getPostComments, isPostCommentsEnabled, addComment, deleteComment, togglePostComments } = useComments();

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 30) + 5);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [shared, setShared] = useState(false);

  const postComments = getPostComments(post.id);
  const commentsEnabled = isPostCommentsEnabled(post.id);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
  };

  const handleComment = () => {
    if (commentText.trim() && user && canComment) {
      addComment(post.id, user.id, user.username, user.avatar, commentText);
      setCommentText("");
    }
  };

  const handleShare = () => {
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="border overflow-hidden transition-colors duration-300"
      style={{ borderColor: border, background: cardBg }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={12} style={{ color: muted }} />
          <span className="font-mono text-[10px] tracking-[0.15em]" style={{ color: muted }}>
            {typeLabels[post.type]}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {post.pinned && <Pin size={10} style={{ color: fg }} />}
          {isAdmin && (
            <button
              onClick={() => togglePostComments(post.id)}
              className="p-1 active:scale-90 transition-transform"
              title={commentsEnabled ? "Disable comments" : "Enable comments"}
              style={{ color: commentsEnabled ? muted : "rgb(239,68,68)" }}
            >
              {commentsEnabled ? <MessageCircle size={10} /> : <Lock size={10} />}
            </button>
          )}
          <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
            {timeAgo(post.timestamp)}
          </span>
        </div>
      </div>

      {/* Image */}
      {post.image && (
        <img
          src={post.image}
          alt={post.title}
          className="w-full aspect-[2/1] object-cover"
          loading="lazy"
        />
      )}

      {/* Body */}
      <div className="px-4 py-3">
        <h2 className="font-mono text-sm tracking-wider font-bold mb-2" style={{ color: fg }}>
          {post.title}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: muted }}>
          {post.content}
        </p>
      </div>

      {/* Author */}
      <div className="flex items-center gap-2 px-4 pb-3">
        <img
          src={post.authorAvatar}
          alt={post.author}
          className="w-7 h-7 rounded-full grayscale object-cover"
        />
        <span className="font-mono text-[10px] tracking-[0.15em] font-medium" style={{ color: fg }}>
          {post.author}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0 px-2 py-2" style={{ borderTop: `1px solid ${border}` }}>
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all active:scale-90"
        >
          <Heart
            size={16}
            fill={liked ? accent : "none"}
            style={{ color: liked ? accent : muted }}
          />
          <span className="font-mono text-[10px] tracking-wider" style={{ color: fg }}>
            {likeCount}
          </span>
        </button>

        <button
          onClick={() => setCommentOpen(!commentOpen)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all active:scale-90"
        >
          <MessageCircle size={16} style={{ color: commentOpen ? fg : muted }} />
          <span className="font-mono text-[10px] tracking-wider" style={{ color: fg }}>
            {postComments.length}
          </span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all active:scale-90 ml-auto"
        >
          <Share2 size={16} style={{ color: shared ? fg : muted }} />
          <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
            {shared ? "COPIED" : "SHARE"}
          </span>
        </button>
      </div>

      {/* Comments Section */}
      {commentOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="px-4 pb-3 overflow-hidden"
          style={{ borderTop: `1px solid ${border}` }}
        >
          {!commentsEnabled ? (
            <div className="flex items-center gap-2 py-3">
              <Lock size={12} style={{ color: muted }} />
              <p className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
                COMMENTS DISABLED ON THIS POST
              </p>
            </div>
          ) : (
            <>
              {/* Existing comments */}
              {postComments.length > 0 && (
                <div className="flex flex-col gap-2 py-2">
                  {postComments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2 px-3 py-2" style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)" }}>
                      <Avatar className="h-5 w-5 flex-shrink-0 mt-0.5">
                        <AvatarImage src={c.avatar} alt={c.username} />
                        <AvatarFallback className="text-[7px]">{c.username[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="font-mono text-[9px] tracking-wider font-bold" style={{ color: fg }}>@{c.username}</span>
                        <p className="text-xs mt-0.5" style={{ color: fg }}>{c.text}</p>
                      </div>
                      {(isAdmin || c.userId === user?.id) && (
                        <button onClick={() => deleteComment(c.id)} className="p-1 active:scale-90 transition-transform flex-shrink-0" style={{ color: muted }}>
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Comment input */}
              {canComment ? (
                <div className="flex gap-2 pt-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleComment()}
                    placeholder="Add a comment..."
                    className="flex-1 bg-transparent border px-3 py-2 font-mono text-xs tracking-wider outline-none transition-colors placeholder:text-white/20"
                    style={{ borderColor: border, color: fg }}
                  />
                  <button
                    onClick={handleComment}
                    className="p-2 transition-all active:scale-90"
                    style={{ color: fg }}
                  >
                    <Send size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <Lock size={10} style={{ color: muted }} />
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                    {user ? "PURCHASE REQUIRED TO COMMENT" : "SIGN IN TO COMMENT"}
                  </p>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </motion.article>
  );
}

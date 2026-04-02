"use client";

import { useState, useEffect, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { ReviewsColumn } from "@/components/ui/community-feed";
import { feedbackData } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { heroUrl, HERO_IMAGES, productCardUrl } from "@/lib/cloudinary-assets";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchPosts, getLocalPosts, addComment, fetchComments, deletePost, deleteComment,
  type DbPost, type DbComment,
} from "@/lib/community";
import { GasclubNavLogo } from "@/components/ui/gasclub-logo";
import {
  MessageCircle, Heart, Pin, Trash2, ChevronDown, ChevronUp,
  Send, Hash, Zap, Megaphone, Package, Image, Star, Tag, RefreshCw, CheckCircle,
} from "lucide-react";

const firstCol = feedbackData.slice(0, 4);
const secondCol = feedbackData.slice(4, 8);
const thirdCol = feedbackData.slice(8, 12);

// Calculate average rating
const avgRating = (feedbackData.reduce((sum, f) => sum + (f.rating || 5), 0) / feedbackData.length).toFixed(1);
const verifiedCount = feedbackData.filter(f => f.role?.toLowerCase().includes("verified") || f.role?.toLowerCase().includes("buyer")).length;

const TYPE_CONFIG = {
  announcement: { icon: Megaphone, color: "text-red-400",    label: "ANNOUNCEMENT" },
  drop:         { icon: Package,   color: "text-purple-400",  label: "DROP" },
  update:       { icon: Hash,      color: "text-blue-400",    label: "UPDATE" },
  media:        { icon: Image,     color: "text-green-400",   label: "MEDIA" },
  review:       { icon: Star,      color: "text-yellow-400",  label: "REVIEW" },
  promo:        { icon: Tag,       color: "text-orange-400",  label: "PROMO" },
};

export default function HomePage() {
  const { fg, border, muted, accent, accentFg, isDark } = useTheme();
  const { user, isAdmin } = useAuth();
  const [posts, setPosts] = useState<DbPost[]>(() => getLocalPosts());
  const [loading, setLoading] = useState(false);
  const [activePost, setActivePost] = useState<string | null>(null);
  const [heroIdx, setHeroIdx] = useState(0);

  // Auto-rotate hero
  useEffect(() => {
    const t = setInterval(() => setHeroIdx(i => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  // Background sync from Supabase (local data already rendered)
  useEffect(() => {
    fetchPosts().then(d => { if (d.length > 0) setPosts(d); });
  }, []);

  const refresh = () => {
    setLoading(true);
    fetchPosts().then(d => { setPosts(d); setLoading(false); });
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return (
    <AppShell>
      {/* Header */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
        className="pt-4 pb-4 mb-6" style={{ borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: muted }}>FEED</h1>
            {user && <p className="font-mono text-[10px] mt-0.5 tracking-wider" style={{ color: muted }}>Welcome, {user.displayName} 👋</p>}
          </div>
          <button onClick={refresh} className="p-2 hover:opacity-70 transition-opacity" style={{ color: muted }}>
            <RefreshCw size={13} />
          </button>
        </div>
      </motion.div>

      {/* Hero Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative w-full overflow-hidden mb-6"
        style={{ borderRadius: 0, border: `1px solid ${border}` }}
      >
        <div className="relative aspect-[21/9] w-full overflow-hidden" style={{ background: isDark ? "#111" : "#f5f5f5" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={heroIdx}
              src={heroUrl(HERO_IMAGES[heroIdx])}
              alt="Featured product"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Glass overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />

          {/* Hero content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
            <p className="font-mono text-[8px] sm:text-[10px] tracking-[0.3em] opacity-70" style={{ color: "#fff" }}>PREMIUM INDOOR · DIRECT ACCESS</p>
            <h2 className="font-mono text-sm sm:text-xl font-bold tracking-wider mt-1" style={{ color: "#fff" }}>PRIVATE INVENTORY — NOW LIVE</h2>
          </div>

          {/* Dot indicators */}
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroIdx(i)}
                className="w-1.5 h-1.5 rounded-full transition-all"
                style={{ background: i === heroIdx ? "#fff" : "rgba(255,255,255,0.3)" }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border p-5 animate-pulse" style={{ borderColor: border, height: 140 }} />
            ))
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: muted }}>NO POSTS YET</p>
            </div>
          ) : (
            posts.map((post, i) => (
              <PostCard
                key={post.id} post={post} index={i}
                currentUser={user}
                isAdmin={isAdmin}
                isExpanded={activePost === post.id}
                onToggleComments={() => setActivePost(prev => prev === post.id ? null : post.id)}
                onDelete={() => handleDeletePost(post.id)}
              />
            ))
          )}

          {/* Feed Footer / View Reviews Button for Mobile */}
          <div className="lg:hidden my-6 text-center">
            <button 
              onClick={() => {
                document.getElementById('mobile-reviews')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-4 border font-mono text-[11px] font-bold tracking-[0.2em] w-full active:scale-95 transition-transform"
              style={{ borderColor: border, color: fg, background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" }}
            >
              VIEW VERIFIED REVIEWS ↓
            </button>
          </div>
        </div>

        {/* Sidebar — desktop — Reviews & Social Proof */}
        <div className="hidden lg:block">
          <div className="sticky top-[130px]">
            {/* Reviews Header */}
            <div className="mb-4">
              <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: muted }}>REVIEWS & PROOF</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={11} fill={accent} style={{ color: accent }} />
                  ))}
                </div>
                <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>{avgRating}</span>
                <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
                  · {feedbackData.length} reviews
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1.5">
                <CheckCircle size={9} style={{ color: accent }} />
                <span className="font-mono text-[8px] tracking-wider" style={{ color: muted }}>
                  {verifiedCount} verified buyers
                </span>
              </div>
            </div>
            <div className="overflow-hidden max-h-[600px]" style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
              <ReviewsColumn testimonials={firstCol} duration={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Reviews & Social Proof */}
      <div id="mobile-reviews" className="lg:hidden mt-10 scroll-mt-24">
        {/* Reviews Header — mobile */}
        <div className="mb-4">
          <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase mb-2" style={{ color: muted }}>REVIEWS & PROOF</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={10} fill={accent} style={{ color: accent }} />
              ))}
            </div>
            <span className="font-mono text-[11px] font-bold" style={{ color: fg }}>{avgRating}</span>
            <span className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>
              · {feedbackData.length} reviews · {verifiedCount} verified
            </span>
          </div>
        </div>
        <div className="flex gap-4 overflow-hidden max-h-[400px]" style={{ maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)" }}>
          <ReviewsColumn testimonials={firstCol} duration={15} />
          <ReviewsColumn testimonials={secondCol} duration={19} className="hidden md:block" />
        </div>
      </div>

      {/* Bottom logo */}
      <div className="flex flex-col items-center justify-center mt-16 mb-4 gap-3">
        <GasclubNavLogo isDark={isDark} brightness={isDark ? 0 : 100} />
      </div>
    </AppShell>
  );
}

// ── Post Card ──────────────────────────────────────────────────────────────────
function PostCard({
  post, index, currentUser, isAdmin, isExpanded, onToggleComments, onDelete,
}: {
  post: DbPost;
  index: number;
  currentUser: any;
  isAdmin: boolean;
  isExpanded: boolean;
  onToggleComments: () => void;
  onDelete: () => void;
}) {
  const { fg, border, muted, accent, accentFg, cardBg, isDark } = useTheme();
  const TypeConfig = TYPE_CONFIG[post.type] || TYPE_CONFIG.update;
  const Icon = TypeConfig.icon;
  const [comments, setComments] = useState<DbComment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && !commentsLoaded) {
      fetchComments(post.id).then(d => { setComments(d); setCommentsLoaded(true); });
    }
  }, [isExpanded, post.id, commentsLoaded]);

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    setSubmitting(true);
    const result = await addComment({
      postId: post.id,
      authorId: currentUser.id,
      authorName: currentUser.displayName || currentUser.username,
      authorAvatar: currentUser.avatar,
      content: newComment.trim(),
    });
    if (result.success && result.comment) {
      setComments(prev => [...prev, result.comment!]);
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  const canDeleteComment = (comment: DbComment) =>
    isAdmin || comment.author_id === currentUser?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
      className="border overflow-hidden mb-6"
      style={{
        borderColor: post.pinned ? accent : border,
        background: cardBg || (isDark ? "rgba(255,255,255,0.01)" : "rgba(0,0,0,0.01)"),
      }}
    >
      {/* 1. Header (Avatar, Name, Time, Type) */}
      <div className="p-3 sm:p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex flex-shrink-0 items-center justify-center font-mono text-[11px] font-bold overflow-hidden" 
               style={{ border: `1px solid ${border}`, background: isDark ? "#111" : "#eee", color: fg }}>
             {(post.author_name || "G")[0]?.toUpperCase()}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5">
               <span className="font-mono text-[11px] font-bold tracking-wider cursor-pointer hover:underline" style={{ color: fg }}>
                 {post.author_name || "GASCLUB247"}
               </span>
               {(post.author_name === "GASCLUB247" || post.featured) && <CheckCircle size={10} style={{ color: accent }} />}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`flex items-center gap-1 font-mono text-[8px] tracking-wider uppercase ${TypeConfig.color}`}>
                <Icon size={9} /> {TypeConfig.label}
              </span>
              <span className="font-mono text-[8px]" style={{ color: muted }}>• {formatTime(post.created_at)}</span>
              {post.pinned && (
                <span className="flex items-center gap-0.5 font-mono text-[8px] tracking-wider" style={{ color: accent }}>
                  <Pin size={8} /> PINNED
                </span>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
           <button onClick={onDelete} className="p-2 hover:text-red-400 transition-colors active:scale-90" style={{ color: muted }}>
             <Trash2 size={13} />
           </button>
        )}
      </div>

      {/* 2. Media (Full Width) */}
      {post.image_url ? (
        <div className="w-full relative border-y" style={{ borderColor: border, backgroundColor: isDark ? "#000" : "#f5f5f5", aspectRatio: "1 / 1" }}>
          <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="px-4 py-2">
          {/* Divider if no image */}
          <div className="w-full h-px mb-2" style={{ background: border }} />
        </div>
      )}

      {/* 3. Actions Bar */}
      <div className="px-3 sm:px-4 py-3 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button
              onClick={() => setLiked(l => !l)}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider hover:opacity-70 transition-all active:scale-90"
              style={{ color: liked ? "#ef4444" : fg }}
            >
              <Heart size={18} fill={liked ? "#ef4444" : "none"} className={liked ? "text-red-500" : ""} />
            </button>
            <button
              onClick={onToggleComments}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider hover:opacity-70 transition-all active:scale-90"
              style={{ color: isExpanded ? accent : fg }}
            >
              <MessageCircle size={18} />
            </button>
            <button className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider hover:opacity-70 transition-all active:scale-90" style={{ color: fg }}>
              <Send size={18} />
            </button>
         </div>
         <div className="flex items-center">
            <button className="hover:opacity-70 transition-all active:scale-90" style={{ color: fg }}>
              <Zap size={18} />
            </button>
         </div>
      </div>

      {/* 4. Caption & Engagement Details */}
      <div className="px-3 sm:px-4 pb-4">
        {/* Likes Count */}
        <div className="font-mono text-[10px] font-bold tracking-wider mb-2" style={{ color: fg }}>
          {post.likes + (liked ? 1 : 0)} LIKES
        </div>
        
        {/* Caption */}
        <div className="max-w-full">
          <span className="font-mono text-[10px] font-bold tracking-wider mr-2 cursor-pointer hover:underline" style={{ color: fg }}>
            {post.author_name || "GASCLUB247"}
          </span>
          <span className="font-mono text-[11px] font-bold tracking-wider mr-1" style={{ color: fg }}>
            {post.title} —
          </span>
          <span className="font-mono text-[11px] leading-relaxed" style={{ color: fg, opacity: 0.85 }}>
            {post.content}
          </span>
        </div>
        
        {/* Comments Prompt */}
        {!isExpanded && (
          <button 
            onClick={onToggleComments}
            className="font-mono text-[10px] mt-2 tracking-wider hover:underline" 
            style={{ color: muted }}
          >
            {comments.length > 0 ? `VIEW ALL ${comments.length} COMMENTS` : "ADD A COMMENT..."}
          </button>
        )}
      </div>

      {/* Comments section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            <div className="border-t" style={{ borderColor: border }}>
              {/* Existing comments */}
              {comments.length > 0 && (
                <div className="divide-y" style={{ borderColor: border }}>
                  {comments.map(comment => (
                    <div key={comment.id} className="px-4 py-3 flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[9px] font-bold"
                        style={{ background: border, color: fg }}>
                        {(comment.author_name || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] font-bold" style={{ color: fg }}>@{comment.author_name}</span>
                          <span className="font-mono text-[8px]" style={{ color: muted }}>{formatTime(comment.created_at)}</span>
                        </div>
                        <p className="font-mono text-[10px] mt-0.5 leading-relaxed" style={{ color: muted }}>{comment.content}</p>
                      </div>
                      {canDeleteComment(comment) && (
                        <button onClick={() => handleDeleteComment(comment.id)} className="p-0.5 hover:text-red-400 transition-colors flex-shrink-0" style={{ color: muted }}>
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {comments.length === 0 && commentsLoaded && (
                <div className="px-4 py-4 text-center">
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>NO COMMENTS YET — BE FIRST</p>
                </div>
              )}

              {/* Comment input */}
              {currentUser ? (
                <form onSubmit={handleComment} className="flex items-center gap-2 px-4 py-3 border-t" style={{ borderColor: border }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 font-mono text-[9px] font-bold"
                    style={{ background: accent, color: accentFg }}>
                    {(currentUser.displayName || "?")[0]?.toUpperCase()}
                  </div>
                  <input
                    ref={inputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a comment…"
                    className="flex-1 bg-transparent font-mono text-[10px] outline-none"
                    style={{ color: fg }}
                    disabled={submitting}
                  />
                  <button type="submit" disabled={!newComment.trim() || submitting}
                    className="p-1.5 transition-all disabled:opacity-30 active:scale-90"
                    style={{ color: accent }}
                  >
                    <Send size={13} />
                  </button>
                </form>
              ) : (
                <div className="px-4 py-3 border-t text-center" style={{ borderColor: border }}>
                  <p className="font-mono text-[9px] tracking-wider" style={{ color: muted }}>LOG IN TO COMMENT</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

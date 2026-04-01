"use client";

import { AppShell } from "@/components/layout/app-shell";
import { PostCard } from "@/components/ui/post-card";
import { TestimonialsColumn } from "@/components/ui/community-feed";
import { posts, feedbackData } from "@/lib/data";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

const firstCol = feedbackData.slice(0, 3);
const secondCol = feedbackData.slice(3, 6);
const thirdCol = feedbackData.slice(6, 9);

export default function HomePage() {
  const { fg, border, muted } = useTheme();
  const { user } = useAuth();

  const sortedPosts = [...posts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <AppShell>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="pt-6 pb-4 mb-6"
        style={{ borderBottom: `1px solid ${border}` }}
      >
        <div className="flex items-center justify-between">
          <h1 className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: muted }}>
            FEED
          </h1>
          {user && (
            <span className="font-mono text-[10px] tracking-wider" style={{ color: muted }}>
              {user.displayName}
            </span>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed Column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {sortedPosts.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} />
          ))}
        </div>

        {/* Community Sidebar — desktop */}
        <div className="hidden lg:block">
          <div className="sticky top-16">
            <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: muted }}>
              COMMUNITY
            </h2>
            <div
              className="overflow-hidden max-h-[600px]"
              style={{
                maskImage:
                  "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
              }}
            >
              <TestimonialsColumn testimonials={firstCol} duration={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Community */}
      <div className="lg:hidden mt-10">
        <h2 className="font-mono text-[10px] tracking-[0.25em] uppercase mb-4" style={{ color: muted }}>
          COMMUNITY
        </h2>
        <div
          className="flex gap-4 overflow-hidden max-h-[500px]"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
          }}
        >
          <TestimonialsColumn testimonials={firstCol} duration={15} />
          <TestimonialsColumn testimonials={secondCol} duration={19} className="hidden md:block" />
        </div>
      </div>
    </AppShell>
  );
}

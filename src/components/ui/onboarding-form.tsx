"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, AtSign, Lock, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface OnboardingFormProps {
  className?: string;
  mode: "signup" | "signin";
  onToggleMode: () => void;
  onSubmit: (data: { username: string; password: string; avatar?: string }) => void;
  isSubmitting?: boolean;
  error?: string;
}

const FADE_UP = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 20 } },
};

function OnboardingForm({ className, mode, onToggleMode, onSubmit, isSubmitting = false, error }: OnboardingFormProps) {
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPw, setShowPw] = React.useState(false);
    const [avatarUrl, setAvatarUrl] = React.useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onSubmit({ username, password, avatar: avatarUrl || undefined });
    };

    const avatarPreview = avatarUrl || (username ? `https://api.dicebear.com/7.x/initials/svg?seed=${username.trim()}&backgroundColor=111111&textColor=ffffff` : "");

    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        className={cn(
          "w-full max-w-sm overflow-hidden border border-white/10 bg-black/80 backdrop-blur-xl",
          className
        )}
      >
        <div className="space-y-5 p-7">
          {/* Title */}
          <motion.div variants={FADE_UP} className="space-y-1.5 text-center">
            <h1 className="font-mono text-sm tracking-[0.3em] font-bold text-white">
              {mode === "signup" ? "CREATE ACCOUNT" : "WELCOME BACK"}
            </h1>
            <p className="font-mono text-[10px] tracking-wider text-white/40">
              {mode === "signup" ? "Join the private network" : "Sign in to your account"}
            </p>
          </motion.div>

          {/* Avatar section (signup only) */}
          {mode === "signup" && (
            <motion.div
              variants={FADE_UP}
              className="flex items-center justify-between border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={avatarPreview} alt="Preview" />
                  <AvatarFallback>{username ? username[0].toUpperCase() : "V"}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-mono text-[11px] font-medium text-white">Your avatar</p>
                  <p className="font-mono text-[9px] text-white/30">Auto-generated from username</p>
                </div>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username */}
            <motion.div variants={FADE_UP}>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <Input
                  placeholder="username"
                  className="pl-9 font-mono text-xs"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoFocus
                  autoComplete="username"
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={FADE_UP}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <Input
                  type={showPw ? "text" : "password"}
                  placeholder="password"
                  className="pl-9 pr-10 font-mono text-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </motion.div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-[10px] tracking-wider text-red-400 text-center"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.div variants={FADE_UP}>
              <Button
                type="submit"
                className="w-full font-mono text-[10px] tracking-[0.2em] h-11"
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                {mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
              </Button>
            </motion.div>
          </form>

          {/* Toggle mode */}
          <motion.div variants={FADE_UP} className="text-center">
            <button
              onClick={onToggleMode}
              className="font-mono text-[9px] tracking-wider text-white/30 hover:text-white/60 transition-colors"
            >
              {mode === "signup" ? "ALREADY HAVE AN ACCOUNT? SIGN IN" : "NEW HERE? CREATE ACCOUNT"}
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
}

export { OnboardingForm };

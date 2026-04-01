"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  avatar: string;
  text: string;
  timestamp: string;
}

interface CommentsState {
  globalCommentsEnabled: boolean;
  disabledPosts: string[]; // post IDs where comments are disabled
  comments: Comment[];
}

interface CommentsContextType {
  comments: Comment[];
  globalCommentsEnabled: boolean;
  getPostComments: (postId: string) => Comment[];
  isPostCommentsEnabled: (postId: string) => boolean;
  addComment: (postId: string, userId: string, username: string, avatar: string, text: string) => void;
  deleteComment: (commentId: string) => void;
  toggleGlobalComments: () => void;
  togglePostComments: (postId: string) => void;
}

const CommentsContext = createContext<CommentsContextType | null>(null);

const COMMENTS_KEY = "vault_comments";

function getStoredState(): CommentsState {
  if (typeof window === "undefined") return { globalCommentsEnabled: true, disabledPosts: [], comments: [] };
  try {
    const stored = localStorage.getItem(COMMENTS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { globalCommentsEnabled: true, disabledPosts: [], comments: [] };
}

function saveState(state: CommentsState) {
  localStorage.setItem(COMMENTS_KEY, JSON.stringify(state));
}

export function CommentsProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CommentsState>({ globalCommentsEnabled: true, disabledPosts: [], comments: [] });

  useEffect(() => {
    setState(getStoredState());
  }, []);

  const persistState = useCallback((newState: CommentsState) => {
    setState(newState);
    saveState(newState);
  }, []);

  const getPostComments = useCallback((postId: string) => {
    return state.comments.filter((c) => c.postId === postId).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [state.comments]);

  const isPostCommentsEnabled = useCallback((postId: string) => {
    return state.globalCommentsEnabled && !state.disabledPosts.includes(postId);
  }, [state.globalCommentsEnabled, state.disabledPosts]);

  const addComment = useCallback((postId: string, userId: string, username: string, avatar: string, text: string) => {
    const newComment: Comment = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      postId,
      userId,
      username,
      avatar,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    const newState = { ...state, comments: [...state.comments, newComment] };
    persistState(newState);
  }, [state, persistState]);

  const deleteComment = useCallback((commentId: string) => {
    const newState = { ...state, comments: state.comments.filter((c) => c.id !== commentId) };
    persistState(newState);
  }, [state, persistState]);

  const toggleGlobalComments = useCallback(() => {
    const newState = { ...state, globalCommentsEnabled: !state.globalCommentsEnabled };
    persistState(newState);
  }, [state, persistState]);

  const togglePostComments = useCallback((postId: string) => {
    const disabled = state.disabledPosts.includes(postId)
      ? state.disabledPosts.filter((id) => id !== postId)
      : [...state.disabledPosts, postId];
    const newState = { ...state, disabledPosts: disabled };
    persistState(newState);
  }, [state, persistState]);

  return (
    <CommentsContext.Provider
      value={{
        comments: state.comments,
        globalCommentsEnabled: state.globalCommentsEnabled,
        getPostComments,
        isPostCommentsEnabled,
        addComment,
        deleteComment,
        toggleGlobalComments,
        togglePostComments,
      }}
    >
      {children}
    </CommentsContext.Provider>
  );
}

export function useComments() {
  const ctx = useContext(CommentsContext);
  if (!ctx) throw new Error("useComments must be used within CommentsProvider");
  return ctx;
}

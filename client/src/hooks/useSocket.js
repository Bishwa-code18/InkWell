// hooks/useSocket.js — Socket.io connection + notification + comment events
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification } from '../store/notificationsSlice';
import { selectToken, selectIsAuthenticated } from '../store/authSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Singleton socket instance — shared across component mounts
let socketSingleton = null;
let socketToken     = null;

export const getSocket = () => socketSingleton;

export const useSocket = () => {
  const dispatch      = useDispatch();
  const token         = useSelector(selectToken);
  const isAuth        = useSelector(selectIsAuthenticated);
  const socketRef     = useRef(null);

  useEffect(() => {
    // Reuse existing connection if token is identical
    if (socketSingleton?.connected && socketToken === token) {
      socketRef.current = socketSingleton;
      return;
    }

    // Disconnect stale connection
    if (socketSingleton) {
      socketSingleton.disconnect();
      socketSingleton = null;
      socketToken     = null;
    }

    const socket = io(SOCKET_URL, {
      auth:            token ? { token } : {},
      transports:      ['websocket', 'polling'],
      reconnection:    true,
      reconnectionDelay: 1500,
      withCredentials: true,
    });

    socketSingleton   = socket;
    socketToken       = token;
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id, isAuth ? '(auth)' : '(anon)');
    });

    // ── Real-time notifications (auth only) ──────────────────────────────
    socket.on('notification', (notification) => {
      dispatch(addNotification(notification));
    });

    // ── Real-time comment broadcast ──────────────────────────────────────
    socket.on('newComment', (comment) => {
      window.dispatchEvent(new CustomEvent('socket:newComment', { detail: comment }));
    });

    // ── Typing indicators ────────────────────────────────────────────────
    socket.on('userTyping', (data) => {
      window.dispatchEvent(new CustomEvent('socket:userTyping', { detail: data }));
    });

    socket.on('userStopTyping', (data) => {
      window.dispatchEvent(new CustomEvent('socket:userStopTyping', { detail: data }));
    });

    // ── Vote updates (optional broadcast) ───────────────────────────────
    socket.on('voteUpdate', (data) => {
      window.dispatchEvent(new CustomEvent('socket:voteUpdate', { detail: data }));
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ Socket error:', err.message);
    });

    return () => {
      // Don't disconnect on component unmount — keep singleton alive
      // Only disconnect on auth change (handled by token dep)
    };
  }, [token, isAuth, dispatch]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const joinPost      = (postId) => socketRef.current?.emit('joinPost', postId);
  const leavePost     = (postId) => socketRef.current?.emit('leavePost', postId);
  const emitTyping    = (postId) => socketRef.current?.emit('typing', { postId });
  const emitStopTyping = (postId) => socketRef.current?.emit('stopTyping', { postId });

  return { socket: socketRef.current, joinPost, leavePost, emitTyping, emitStopTyping };
};

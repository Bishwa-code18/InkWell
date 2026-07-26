// utils/formatDate.js — Date formatting utilities
import { formatDistanceToNow, format } from 'date-fns';

export const timeAgo = (date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const formatDate = (date, fmt = 'MMM d, yyyy') => {
  return format(new Date(date), fmt);
};

export const formatReadTime = (minutes) => {
  if (minutes < 1) return '< 1 min read';
  return `${minutes} min read`;
};

export const formatCount = (count) => {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return String(count);
};

// utils/cn.js — Tailwind class merging utility
export const cn = (...classes) => classes.filter(Boolean).join(' ');

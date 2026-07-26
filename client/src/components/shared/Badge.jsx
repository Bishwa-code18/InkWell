// components/shared/Badge.jsx
import { cn } from '../../utils/cn';

const variants = {
  green: 'bg-primary-50 text-primary',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  dark: 'bg-gray-900 text-white',
  red: 'bg-red-50 text-red-600',
  yellow: 'bg-yellow-50 text-yellow-700',
};

export default function Badge({ children, variant = 'gray', className }) {
  return (
    <span className={cn('badge', variants[variant], className)}>
      {children}
    </span>
  );
}

// components/shared/Toggle.jsx — Accessible toggle switch
import { cn } from '../../utils/cn';

export default function Toggle({ checked, onChange, label, description, icon }) {
  return (
    <label className="flex items-center justify-between cursor-pointer gap-4">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-gray-500">{icon}</div>}
        <div>
          {label && <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>}
          {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 flex-shrink-0',
          checked ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'
        )}
      >
        <span
          className={cn(
            'absolute left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  );
}

// components/layout/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-dark-border py-6 mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <p className="text-sm font-serif font-semibold">Inkwell</p>
          <p className="text-xs text-gray-400">© 2024 Inkwell. An editorial community.</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-gray-500">
          {['About', 'Help', 'Guidelines', 'Advertise', 'Blog', 'Privacy Policy', 'Terms of Service', 'Help Center', 'Contact'].map((l) => (
            <a key={l} href="#" className="hover:text-gray-700 transition-colors">{l}</a>
          ))}
        </nav>
      </div>
    </footer>
  );
}

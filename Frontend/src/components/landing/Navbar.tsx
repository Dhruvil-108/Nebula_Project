import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { NebulaLogo } from '../ui/NebulaLogo';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Modules', href: '#modules' },
    { name: 'Before vs After', href: '#comparison' },
    { name: 'For Teams', href: '#roles' },
    { name: 'AI & Analytics', href: '#analytics' },
    { name: 'Security', href: '#security' },
  ];

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/96 backdrop-blur-2xl border-b border-slate-200/70 shadow-sm py-2.5'
          : 'bg-transparent py-4'
      }`}
    >
      <div className="w-full px-5 sm:px-8 lg:px-12 xl:px-16 flex items-center justify-between gap-6">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <NebulaLogo />
        </Link>

        {/* Desktop Nav — minimal, editorial style */}
        <nav className="hidden md:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onMouseEnter={() => setActiveLink(link.name)}
              onMouseLeave={() => setActiveLink(null)}
              className="relative px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-950 transition-colors rounded-lg group"
            >
              {activeLink === link.name && (
                <motion.div
                  layoutId="navHoverBg"
                  className="absolute inset-0 bg-slate-100/80 rounded-lg"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{link.name}</span>
            </a>
          ))}
        </nav>

        {/* CTAs */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <button
            onClick={() => navigate('/signin')}
            className="px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-all"
          >
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/signup')}
            className="flex items-center gap-2 px-4 py-2 text-[13px] font-semibold text-white bg-[#f0512f] hover:bg-[#d94425] rounded-lg transition-colors shadow-sm shadow-[#f0512f]/30"
          >
            Get Started
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>

        {/* Mobile toggle */}
        <div className="flex sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="sm:hidden mx-4 mt-2 mb-2 rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden"
          >
            <div className="p-4 space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center px-3 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-950 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  {link.name}
                </a>
              ))}
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/signin'); }}
                className="w-full py-2.5 text-sm font-medium text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); navigate('/signup'); }}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#f0512f] rounded-xl hover:bg-[#d94425] transition-colors"
              >
                Get Started Free
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

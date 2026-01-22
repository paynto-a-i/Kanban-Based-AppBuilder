'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const navLinks = [
  { href: '#demo', label: 'Demo' },
  { href: '#solution', label: 'Solution' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      const element = document.querySelector(href)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
        setIsMobileMenuOpen(false)
      }
    }
  }

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <nav
          className={`transition-all duration-300 ${
            isScrolled
              ? 'bg-white/90 backdrop-blur-md border-b border-comfort-sage-100'
              : 'bg-transparent'
          }`}
        >
          <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between h-16 md:h-20">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
                <Image
                  src="/paynto-logo.png"
                  alt="Paynto.AI Logo"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-xl"
                />
                <span className="text-xl font-semibold text-comfort-charcoal-800">
                  Paynto<span className="text-comfort-sage-500">.</span>AI
                </span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="px-4 py-2 text-sm font-medium text-comfort-charcoal-500 hover:text-comfort-charcoal-800 rounded-lg transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex items-center gap-3">
                <Link
                  href="/sign-in"
                  className="hidden sm:block px-4 py-2 text-sm font-medium text-comfort-charcoal-500 hover:text-comfort-charcoal-800 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/generation"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-comfort-charcoal-800 hover:bg-comfort-charcoal-700 rounded-xl transition-all duration-200"
                >
                  Get Started
                </Link>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 text-comfort-charcoal-600 hover:text-comfort-charcoal-800 rounded-lg transition-colors duration-200"
                  aria-label="Toggle menu"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </nav>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-comfort-charcoal-800/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 z-50 md:hidden"
            >
              <div className="bg-white rounded-2xl shadow-xl shadow-comfort-charcoal-800/10 border border-comfort-sage-100 overflow-hidden">
                <div className="p-4 space-y-1">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="block px-4 py-3 text-base font-medium text-comfort-charcoal-600 hover:text-comfort-charcoal-800 hover:bg-comfort-sage-50 rounded-xl transition-all duration-200"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="pt-2 mt-2 border-t border-comfort-sage-100">
                    <Link
                      href="/sign-in"
                      className="block px-4 py-3 text-base font-medium text-comfort-charcoal-600 hover:text-comfort-charcoal-800 hover:bg-comfort-sage-50 rounded-xl transition-all duration-200"
                    >
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

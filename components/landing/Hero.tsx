'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-center pt-24 pb-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-comfort-sage-50/20 to-comfort-sage-50" />

        {/* Subtle mesh */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '48px 48px',
          }}
        />

        {/* Floating gradient orbs */}
        <motion.div
          animate={{
            y: [0, -30, 0],
            x: [0, 20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(circle, rgba(127, 181, 137, 0.4) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            y: [0, 40, 0],
            x: [0, -30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(217, 139, 106, 0.3) 0%, transparent 70%)' }}
        />
      </div>

      <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Eyebrow badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-comfort-sage-100/80 border border-comfort-sage-200/50 text-sm text-comfort-sage-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-comfort-sage-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-comfort-sage-500"></span>
              </span>
              Now in Early Access
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl font-medium text-comfort-charcoal-800 tracking-tight leading-[1.1] mb-8"
          >
            Kanban Command Centre to <span className="text-comfort-sage-600">create anything with AI agents</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-comfort-charcoal-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Create a card, watch AI agents build your vision in real-time.
            No code required.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
          >
            <Link
              href="/generation"
              className="group relative px-8 py-4 bg-comfort-charcoal-800 text-white font-medium rounded-xl transition-all duration-300 hover:bg-comfort-charcoal-700 shadow-lg shadow-comfort-charcoal-800/20 hover:shadow-xl hover:shadow-comfort-charcoal-800/25 flex items-center gap-3"
            >
              Get Started Free
              <motion.svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </motion.svg>
            </Link>

            <a
              href="#solution"
              className="px-8 py-4 text-comfort-charcoal-600 font-medium rounded-xl transition-all duration-200 hover:bg-comfort-sage-100/50 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-full bg-comfort-sage-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-comfort-sage-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              See How It Works
            </a>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap justify-center items-center gap-x-8 gap-y-3 text-sm text-comfort-charcoal-400"
          >
            {[
              { icon: '✓', text: 'No credit card required' },
              { icon: '✓', text: 'Full code ownership' },
              { icon: '✓', text: 'Deploy in one click' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-comfort-sage-500 font-medium">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-10 rounded-full border-2 border-comfort-charcoal-200 flex justify-center pt-2"
        >
          <motion.div
            animate={{ opacity: [1, 0.3, 1], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-1 h-2 rounded-full bg-comfort-charcoal-300"
          />
        </motion.div>
      </motion.div>
    </section>
  )
}

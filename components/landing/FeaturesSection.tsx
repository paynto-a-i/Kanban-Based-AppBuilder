'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export default function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const features = [
    {
      title: "Visual Kanban Builder",
      description: "Manage your entire app development from a single Kanban UI. Track progress and watch your vision become reality.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      gradient: "from-comfort-sage-500 to-comfort-sage-600",
      size: "large", // Takes 2 columns
      stats: "50+ projects managed",
      visual: (
        <div className="mt-4 flex gap-2">
          {['To Do', 'In Progress', 'Done'].map((col, i) => (
            <motion.div
              key={col}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex-1 bg-white/50 rounded-lg p-2"
            >
              <div className="text-[10px] font-medium text-comfort-charcoal-500 mb-2">{col}</div>
              {[...Array(3 - i)].map((_, j) => (
                <motion.div
                  key={j}
                  animate={{ y: [0, -2, 0] }}
                  transition={{ delay: j * 0.2, duration: 2, repeat: Infinity }}
                  className="h-4 bg-comfort-sage-200/80 rounded mb-1"
                />
              ))}
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "Real-Time Preview",
      description: "See your app come to life as AI builds it. Watch components render instantly.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      gradient: "from-comfort-sage-400 to-comfort-sage-500",
      size: "normal",
      stats: "< 100ms refresh"
    },
    {
      title: "Multi-Agent Orchestration",
      description: "6 specialized AI agents work together seamlessly like a real dev team.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      gradient: "from-comfort-sage-600 to-comfort-sage-700",
      size: "normal",
      stats: "6 specialists",
      visual: (
        <div className="mt-3 flex -space-x-2">
          {['🏗️', '📋', '💻', '🧪', '🚀', '🎨'].map((emoji, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.2, zIndex: 10 }}
              className="w-8 h-8 rounded-full bg-white border-2 border-comfort-sage-100 flex items-center justify-center text-sm shadow-sm cursor-pointer"
            >
              {emoji}
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "Automatic Error Fixing",
      description: "AI detects and fixes errors as they occur. 92% of issues resolved automatically without intervention.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      gradient: "from-comfort-terracotta-400 to-comfort-terracotta-500",
      size: "tall", // Takes 2 rows
      stats: "92% auto-fixed",
      visual: (
        <div className="mt-4 space-y-2">
          {[
            { status: 'fixed', text: 'TypeError resolved' },
            { status: 'fixed', text: 'Import path corrected' },
            { status: 'fixing', text: 'Analyzing syntax...' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-center gap-2 text-xs bg-white/50 rounded-lg px-3 py-2"
            >
              {item.status === 'fixed' ? (
                <span className="w-4 h-4 rounded-full bg-comfort-sage-500 flex items-center justify-center text-white text-[8px]">✓</span>
              ) : (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 rounded-full border-2 border-comfort-sage-500 border-t-transparent"
                />
              )}
              <span className="text-comfort-charcoal-600">{item.text}</span>
            </motion.div>
          ))}
        </div>
      )
    },
    {
      title: "One-Click Deployment",
      description: "Deploy to production with a single click. Automatic builds and CDN distribution.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradient: "from-comfort-sage-500 to-comfort-sage-600",
      size: "normal",
      stats: "< 30s deploy"
    },
    {
      title: "Full Code Export",
      description: "Export your entire codebase anytime. Clean, documented code with no vendor lock-in.",
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      gradient: "from-comfort-sage-400 to-comfort-sage-500",
      size: "normal",
      stats: "100% yours"
    }
  ]

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }
    }
  }

  return (
    <section id="features" className="py-20 md:py-28 bg-gradient-to-b from-white to-comfort-sage-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center px-4 py-2 mb-6 text-sm font-medium text-comfort-sage-700 bg-comfort-sage-100 rounded-full border border-comfort-sage-200"
          >
            <span className="mr-2">⚡</span>
            Powerful Features
          </motion.div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-comfort-charcoal-800 tracking-tight">
            Built for Serious Building
          </h2>
          <p className="text-lg text-comfort-charcoal-500 max-w-2xl mx-auto">
            Everything you need to build production-ready applications, powered by AI agents working around the clock.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              onHoverStart={() => setHoveredIndex(index)}
              onHoverEnd={() => setHoveredIndex(null)}
              className={`
                group relative overflow-hidden rounded-2xl border border-comfort-sage-200
                bg-gradient-to-br from-comfort-sage-50/50 to-white
                hover:border-comfort-sage-300 hover:shadow-xl hover:shadow-comfort-sage-500/10
                transition-all duration-300 cursor-pointer
                ${feature.size === 'large' ? 'md:col-span-2 lg:col-span-2' : ''}
                ${feature.size === 'tall' ? 'md:row-span-2' : ''}
              `}
            >
              {/* Gradient overlay on hover */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
              />

              {/* Animated border gradient */}
              <motion.div
                className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(124, 154, 130, 0.1), transparent)`,
                  backgroundSize: '200% 100%',
                }}
                animate={hoveredIndex === index ? {
                  backgroundPosition: ['200% 0%', '-200% 0%']
                } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />

              <div className={`relative p-6 ${feature.size === 'tall' ? 'h-full flex flex-col' : ''}`}>
                {/* Icon */}
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} shadow-lg mb-4`}
                >
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </motion.div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-comfort-charcoal-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-comfort-charcoal-500 leading-relaxed mb-3">
                  {feature.description}
                </p>

                {/* Stats badge */}
                <div className="inline-flex items-center px-3 py-1 bg-comfort-sage-100/80 rounded-full text-xs font-medium text-comfort-sage-700">
                  {feature.stats}
                </div>

                {/* Visual element if exists */}
                {feature.visual && (
                  <div className={feature.size === 'tall' ? 'flex-1 flex items-end' : ''}>
                    {feature.visual}
                  </div>
                )}

                {/* Hover arrow */}
                <motion.div
                  className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={hoveredIndex === index ? { x: [0, 4, 0] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <svg className="w-5 h-5 text-comfort-sage-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-comfort-charcoal-400 mb-4">
            And much more coming soon...
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="inline-flex items-center gap-2 px-6 py-3 text-comfort-sage-600 font-medium hover:text-comfort-sage-700 transition-colors"
          >
            Join the waitlist to get updates
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}

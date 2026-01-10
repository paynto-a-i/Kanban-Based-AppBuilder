'use client'

import { motion } from 'framer-motion'

export default function Hero() {
  const handleGetAccess = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleWatchDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="hero" className="relative pt-24 pb-16 md:pt-32 md:pb-20 overflow-hidden bg-white">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px]" />

      {/* Gradient orbs - smaller and more subtle */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-300/30 rounded-full blur-3xl" />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1.5 mb-6 text-sm font-medium text-emerald-800 bg-emerald-100 rounded-full border border-emerald-300">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            AI-Powered App Development
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-[1.1] tracking-tight">
            <span className="text-gray-900">Kanban Command Centre</span>
            <br />
            <span className="text-emerald-700">to Build Any App</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 text-gray-600 leading-relaxed">
            Don&apos;t write code &mdash; <span className="text-gray-900 font-medium">direct it</span>.
            Create a card, watch AI agents build your vision.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetAccess}
              className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-700/25"
            >
              Get Early Access
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWatchDemo}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-50 text-gray-900 border-2 border-emerald-700 font-semibold rounded-xl transition-all"
            >
              See How It Works
            </motion.button>
          </div>

          {/* Feature list */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            {['Multi-Agent Orchestration', 'Real-time Preview', 'Full Human Control'].map((feature) => (
              <div key={feature} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

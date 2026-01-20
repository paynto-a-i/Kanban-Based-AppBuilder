'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 100])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  const handleGetAccess = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleWatchDemo = () => {
    document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Text animation variants for staggered reveal
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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
    <section
      ref={containerRef}
      id="hero"
      className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
    >
      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 -z-10">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-comfort-sage-50/30 to-comfort-sage-100/50" />

        {/* Animated mesh gradients */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 -left-1/4 w-1/2 h-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(184, 212, 190, 0.4) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -right-1/4 w-2/3 h-2/3 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(154, 196, 163, 0.3) 0%, transparent 70%)' }}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 20, 0],
            y: [0, -30, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-1/4 w-1/2 h-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(238, 192, 173, 0.2) 0%, transparent 70%)' }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
      </div>

      {/* Floating elements */}
      <motion.div
        style={{ y, opacity }}
        className="absolute top-32 left-[10%] hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="bg-white/80 backdrop-blur-sm border border-comfort-sage-200 rounded-xl p-3 shadow-lg shadow-comfort-sage-500/10"
        >
          <span className="text-2xl">🏗️</span>
          <span className="ml-2 text-xs font-medium text-comfort-charcoal-600">Architect</span>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 150]), opacity }}
        className="absolute top-48 right-[12%] hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="bg-white/80 backdrop-blur-sm border border-comfort-sage-200 rounded-xl p-3 shadow-lg shadow-comfort-sage-500/10"
        >
          <span className="text-2xl">💻</span>
          <span className="ml-2 text-xs font-medium text-comfort-charcoal-600">Coder</span>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 80]), opacity }}
        className="absolute bottom-32 left-[15%] hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          className="bg-white/80 backdrop-blur-sm border border-comfort-sage-200 rounded-xl p-3 shadow-lg shadow-comfort-sage-500/10"
        >
          <span className="text-2xl">🧪</span>
          <span className="ml-2 text-xs font-medium text-comfort-charcoal-600">Tester</span>
        </motion.div>
      </motion.div>

      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 120]), opacity }}
        className="absolute bottom-40 right-[8%] hidden lg:block"
      >
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, 4, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="bg-white/80 backdrop-blur-sm border border-comfort-sage-200 rounded-xl p-3 shadow-lg shadow-comfort-sage-500/10"
        >
          <span className="text-2xl">🚀</span>
          <span className="ml-2 text-xs font-medium text-comfort-charcoal-600">DevOps</span>
        </motion.div>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          {/* Social proof badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-3 px-4 py-2 mb-8 bg-white/80 backdrop-blur-sm border border-comfort-sage-200 rounded-full shadow-sm"
          >
            <div className="flex -space-x-2">
              {['🧑‍💻', '👩‍💻', '👨‍💻', '🧑‍🔬'].map((emoji, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: -10 }}
                  animate={{ scale: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, type: "spring", stiffness: 200 }}
                  className="w-7 h-7 rounded-full bg-comfort-sage-100 border-2 border-white flex items-center justify-center text-sm"
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
            <span className="text-sm text-comfort-charcoal-600">
              <span className="font-semibold text-comfort-sage-700">500+</span> builders on the waitlist
            </span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-comfort-sage-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-comfort-sage-500"></span>
            </span>
          </motion.div>

          {/* Headline with animated highlight */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight text-comfort-charcoal-800"
          >
            Build Apps with{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-comfort-sage-600 to-comfort-sage-500">
                Visual AI Agents
              </span>
              <motion.span
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 1, duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
                className="absolute bottom-2 left-0 h-3 bg-comfort-sage-200/50 -z-0 rounded"
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl lg:text-2xl max-w-2xl mx-auto mb-10 text-comfort-charcoal-500 leading-relaxed"
          >
            Create a card, watch AI agents build your vision in real-time.
            <span className="hidden sm:inline"> No code required.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px -15px rgba(124, 154, 130, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetAccess}
              className="group relative px-8 py-4 bg-gradient-to-r from-comfort-sage-500 to-comfort-sage-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-comfort-sage-500/25 text-base overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Early Access
                <motion.svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-comfort-sage-600 to-comfort-sage-700"
                initial={{ x: "100%" }}
                whileHover={{ x: 0 }}
                transition={{ duration: 0.3 }}
              />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "rgba(124, 154, 130, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleWatchDemo}
              className="group px-8 py-4 bg-white hover:bg-comfort-sage-50 text-comfort-charcoal-700 font-semibold rounded-xl transition-all shadow-sm border border-comfort-sage-200 text-base flex items-center gap-2"
            >
              <motion.div
                className="w-10 h-10 rounded-full bg-comfort-sage-100 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
              >
                <svg className="w-5 h-5 text-comfort-sage-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </motion.div>
              Watch Demo
            </motion.button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-12 flex flex-wrap justify-center items-center gap-6 text-sm text-comfort-charcoal-400"
          >
            {[
              { icon: '🔒', text: 'No credit card required' },
              { icon: '⚡', text: 'Start building in minutes' },
              { icon: '💯', text: 'Full code ownership' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-comfort-sage-50/80 to-transparent pointer-events-none" />
    </section>
  )
}

'use client'

import { motion } from 'framer-motion'

export default function FinalCTASection() {
  const handleGetAccess = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-comfort-sage-50 via-comfort-sage-100 to-comfort-sage-50" />

      {/* Animated background elements */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-comfort-sage-300/30 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-comfort-terracotta-200/20 rounded-full blur-3xl"
      />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-white/80 backdrop-blur-sm border border-comfort-sage-200 rounded-full shadow-sm"
          >
            <motion.span
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              🚀
            </motion.span>
            <span className="text-sm font-medium text-comfort-charcoal-600">Ready to transform your workflow?</span>
          </motion.div>

          {/* Headline */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-comfort-charcoal-800 tracking-tight leading-tight">
            Start Building Your
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-comfort-sage-600 to-comfort-sage-500">
              Next Big Thing
            </span>
          </h2>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-comfort-charcoal-500 mb-10 max-w-2xl mx-auto">
            Join hundreds of developers and founders who are shipping faster with AI-powered development. No credit card required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 25px 50px -12px rgba(124, 154, 130, 0.4)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetAccess}
              className="group relative px-10 py-5 bg-gradient-to-r from-comfort-sage-500 to-comfort-sage-600 text-white font-semibold rounded-2xl transition-all shadow-xl shadow-comfort-sage-500/30 text-lg overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                Get Early Access
                <motion.svg
                  className="w-6 h-6"
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

            <motion.a
              href="#demo"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.preventDefault()
                document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-8 py-4 text-comfort-charcoal-600 font-medium hover:text-comfort-sage-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              See it in action
            </motion.a>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center items-center gap-8 text-sm text-comfort-charcoal-400"
          >
            {[
              { icon: '🔒', text: 'Secure & Private' },
              { icon: '💳', text: 'No credit card' },
              { icon: '✨', text: 'Free tier available' },
              { icon: '📦', text: 'Full code export' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-center gap-2"
              >
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-comfort-sage-300 to-transparent" />
      </div>
    </section>
  )
}

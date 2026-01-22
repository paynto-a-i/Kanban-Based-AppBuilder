'use client'

import { motion, useInView } from 'framer-motion'
import { useState, useRef } from 'react'

export default function ContactForm() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit. Please try again.')
      }

      setIsSubmitted(true)
      setFormData({ name: '', email: '', company: '', role: '', message: '' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (isSubmitted) {
    return (
      <section className="py-32 md:py-40 bg-white">
        <div className="max-w-2xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-comfort-sage-50 border border-comfort-sage-200 rounded-2xl p-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-comfort-sage-500 flex items-center justify-center"
            >
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-3xl font-medium text-comfort-charcoal-800 mb-4">You&apos;re on the list!</h2>
            <p className="text-comfort-charcoal-500">We&apos;ll be in touch soon with early access to Paynto.AI.</p>
          </motion.div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-32 md:py-40 bg-white relative" ref={containerRef}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-comfort-sage-50 to-transparent rounded-full opacity-60" />
      </div>

      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block text-sm font-medium tracking-[0.2em] uppercase text-comfort-terracotta-500 mb-4"
          >
            Early Access
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-medium text-comfort-charcoal-800 tracking-tight leading-[1.1] mb-6">
            Start building today
          </h2>
          <p className="text-xl text-comfort-charcoal-400 leading-relaxed max-w-xl mx-auto">
            Join the waitlist to be among the first to build with AI agents.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onSubmit={handleSubmit}
          className="bg-white border border-comfort-sage-200 rounded-2xl p-8 md:p-10 max-w-2xl mx-auto shadow-xl shadow-comfort-charcoal-800/5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-comfort-charcoal-700 mb-2">
                Name <span className="text-comfort-terracotta-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-comfort-sage-200 bg-white text-comfort-charcoal-800 placeholder-comfort-charcoal-300 focus:ring-2 focus:ring-comfort-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-comfort-charcoal-700 mb-2">
                Email <span className="text-comfort-terracotta-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-comfort-sage-200 bg-white text-comfort-charcoal-800 placeholder-comfort-charcoal-300 focus:ring-2 focus:ring-comfort-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="you@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-comfort-charcoal-700 mb-2">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-comfort-sage-200 bg-white text-comfort-charcoal-800 placeholder-comfort-charcoal-300 focus:ring-2 focus:ring-comfort-sage-500 focus:border-transparent transition-all duration-200"
                placeholder="Your company"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-comfort-charcoal-700 mb-2">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-comfort-sage-200 bg-white text-comfort-charcoal-800 focus:ring-2 focus:ring-comfort-sage-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select role</option>
                <option value="founder">Founder / CEO</option>
                <option value="cto">CTO / VP Engineering</option>
                <option value="engineering-manager">Engineering Manager</option>
                <option value="developer">Developer</option>
                <option value="product">Product Manager</option>
                <option value="designer">Designer</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label htmlFor="message" className="block text-sm font-medium text-comfort-charcoal-700 mb-2">
              What would you build?
            </label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-comfort-sage-200 bg-white text-comfort-charcoal-800 placeholder-comfort-charcoal-300 focus:ring-2 focus:ring-comfort-sage-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Tell us about your dream project..."
            />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-8 py-4 bg-comfort-charcoal-800 hover:bg-comfort-charcoal-700 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Joining...' : 'Join the Waitlist'}
          </button>

          <p className="text-center text-comfort-charcoal-400 text-sm mt-4">
            No spam. We&apos;ll only contact you about early access.
          </p>
        </motion.form>
      </div>
    </section>
  )
}

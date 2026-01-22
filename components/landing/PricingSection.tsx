'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    description: 'For exploring and personal projects',
    price: { monthly: 0, annual: 0 },
    credits: '100 Credits/mo',
    features: [
      '3 projects',
      'Basic AI agents',
      'Community support',
      'Public deployments',
    ],
    cta: 'Get Started',
    href: '/generation',
    highlighted: false,
  },
  {
    name: 'Pro',
    description: 'For serious builders and small teams',
    price: { monthly: 29, annual: 24 },
    credits: '500 Credits/mo',
    features: [
      'Unlimited projects',
      'All AI agents',
      'Priority support',
      'Private deployments',
      'Custom domains',
      'Team collaboration',
    ],
    cta: 'Start Free Trial',
    href: '/generation',
    highlighted: true,
  },
  {
    name: 'Ultra',
    description: 'For power users and growing teams',
    price: { monthly: 80, annual: 66 },
    credits: '1,000 Credits/mo',
    features: [
      'Everything in Pro',
      'Dedicated AI capacity',
      'Advanced analytics',
      'API access',
      'White-label options',
      'Priority queue',
    ],
    cta: 'Start Free Trial',
    href: '/generation',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    description: 'Custom solutions for organizations',
    price: { monthly: null, annual: null },
    credits: 'Unlimited',
    features: [
      'Everything in Ultra',
      'Dedicated support',
      'On-premise option',
      'Custom integrations',
      'SLA guarantees',
      'Security compliance',
    ],
    cta: 'Contact Us',
    href: '#contact',
    highlighted: false,
  },
]

export default function PricingSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <section id="pricing" className="py-32 md:py-40 bg-white relative overflow-hidden" ref={containerRef}>
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block text-sm font-medium tracking-[0.2em] uppercase text-comfort-sage-600 mb-4"
          >
            Pricing
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-comfort-charcoal-800 tracking-tight leading-[1.1] mb-6">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-comfort-charcoal-400 leading-relaxed">
            Start free. Scale as you grow. No hidden fees.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center gap-4 mb-12"
        >
          <span className={`text-sm font-medium transition-colors duration-200 ${!isAnnual ? 'text-comfort-charcoal-800' : 'text-comfort-charcoal-400'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-14 h-7 rounded-full bg-comfort-sage-100 transition-colors duration-200 hover:bg-comfort-sage-200"
          >
            <motion.div
              animate={{ x: isAnnual ? 28 : 2 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute top-1 w-5 h-5 rounded-full bg-comfort-sage-500 shadow-sm"
            />
          </button>
          <span className={`text-sm font-medium transition-colors duration-200 ${isAnnual ? 'text-comfort-charcoal-800' : 'text-comfort-charcoal-400'}`}>
            Annual
            <span className="ml-2 px-2 py-0.5 text-xs font-medium text-comfort-sage-700 bg-comfort-sage-100 rounded-full">
              Save 17%
            </span>
          </span>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.6,
                delay: 0.1 + index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className={`relative rounded-2xl p-6 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-comfort-charcoal-800 text-white ring-2 ring-comfort-charcoal-800 shadow-xl shadow-comfort-charcoal-800/20'
                  : 'bg-comfort-sage-50 hover:bg-comfort-sage-100/80'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-medium bg-comfort-sage-400 text-white rounded-full">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className={`text-lg font-semibold mb-1 ${plan.highlighted ? 'text-white' : 'text-comfort-charcoal-800'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.highlighted ? 'text-comfort-charcoal-300' : 'text-comfort-charcoal-400'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                {plan.price.monthly !== null ? (
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-semibold ${plan.highlighted ? 'text-white' : 'text-comfort-charcoal-800'}`}>
                      ${isAnnual ? plan.price.annual : plan.price.monthly}
                    </span>
                    <span className={`text-sm ${plan.highlighted ? 'text-comfort-charcoal-400' : 'text-comfort-charcoal-400'}`}>
                      /mo
                    </span>
                  </div>
                ) : (
                  <span className={`text-4xl font-semibold ${plan.highlighted ? 'text-white' : 'text-comfort-charcoal-800'}`}>
                    Custom
                  </span>
                )}
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-comfort-charcoal-400' : 'text-comfort-charcoal-500'}`}>
                  {plan.credits}
                </p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <svg
                      className={`w-5 h-5 flex-shrink-0 ${plan.highlighted ? 'text-comfort-sage-400' : 'text-comfort-sage-500'}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className={plan.highlighted ? 'text-comfort-charcoal-200' : 'text-comfort-charcoal-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`block w-full py-3 px-4 text-center text-sm font-medium rounded-xl transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-white text-comfort-charcoal-800 hover:bg-comfort-sage-50'
                    : 'bg-comfort-charcoal-800 text-white hover:bg-comfort-charcoal-700'
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-sm text-comfort-charcoal-400 mt-12"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>
      </div>
    </section>
  )
}

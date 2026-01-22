'use client'

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const problems = [
  {
    number: '01',
    title: 'Engineering Bottleneck',
    description: 'Your ideas move faster than your development capacity. Every feature request gets stuck in an ever-growing backlog while your team struggles to keep up.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Context Switching',
    description: 'Non-technical founders spend hours explaining requirements, reviewing code, and coordinating between teams instead of building their vision.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Production Risk',
    description: 'Traditional no-code tools break at scale. AI code assistants need constant supervision. You need something that actually ships production-ready code.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
  },
]

export default function ProblemSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })

  return (
    <section id="problem" className="py-32 md:py-40 bg-white relative overflow-hidden" ref={containerRef}>
      {/* Subtle grain texture */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl mb-20"
        >
          <motion.span
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block text-sm font-medium tracking-[0.2em] uppercase text-comfort-terracotta-500 mb-4"
          >
            The Problem
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-comfort-charcoal-800 tracking-tight leading-[1.1] mb-6">
            Building software shouldn&apos;t feel like{' '}
            <span className="text-comfort-charcoal-300">pulling teeth</span>
          </h2>
          <p className="text-xl text-comfort-charcoal-400 leading-relaxed">
            You have the vision. You have the urgency. But turning ideas into working software still feels impossibly slow.
          </p>
        </motion.div>

        {/* Problem Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {problems.map((problem, index) => (
            <motion.div
              key={problem.number}
              initial={{ opacity: 0, y: 60 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{
                duration: 0.8,
                delay: 0.2 + index * 0.15,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="group"
            >
              <div className="relative">
                {/* Number */}
                <span className="text-8xl font-light text-comfort-sage-100 absolute -top-4 -left-2 select-none transition-colors duration-500 group-hover:text-comfort-sage-200">
                  {problem.number}
                </span>

                {/* Content */}
                <div className="relative pt-12 pl-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-comfort-sage-50 flex items-center justify-center text-comfort-sage-600 transition-all duration-300 group-hover:bg-comfort-sage-100 group-hover:scale-110">
                      {problem.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-comfort-charcoal-800">
                      {problem.title}
                    </h3>
                  </div>
                  <p className="text-comfort-charcoal-500 leading-relaxed">
                    {problem.description}
                  </p>
                </div>

                {/* Subtle connector line for larger screens */}
                {index < problems.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 lg:-right-8 w-8 lg:w-12 h-px bg-gradient-to-r from-comfort-sage-200 to-transparent" />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

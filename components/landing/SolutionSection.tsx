'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState } from 'react'

const steps = [
  {
    number: '01',
    title: 'Create a Card',
    description: 'Describe what you want to build in plain language. Our system understands your intent and breaks it down into actionable tasks.',
    visual: 'card',
  },
  {
    number: '02',
    title: 'AI Agents Activate',
    description: 'A coordinated team of specialized AI agents—Architect, Coder, Tester, DevOps—work together to build your feature.',
    visual: 'agents',
  },
  {
    number: '03',
    title: 'Watch & Guide',
    description: 'See your app come to life in real-time. Jump in anytime to adjust, refine, or redirect. You\'re always in control.',
    visual: 'preview',
  },
  {
    number: '04',
    title: 'Ship It',
    description: 'One click to deploy. Your production-ready code goes live instantly with automatic builds and optimizations.',
    visual: 'deploy',
  },
]

const agents = [
  { emoji: '🏗️', name: 'Architect', color: 'bg-blue-50 text-blue-600' },
  { emoji: '💻', name: 'Coder', color: 'bg-purple-50 text-purple-600' },
  { emoji: '🧪', name: 'Tester', color: 'bg-amber-50 text-amber-600' },
  { emoji: '🚀', name: 'DevOps', color: 'bg-emerald-50 text-emerald-600' },
]

function CardVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-2xl border border-comfort-sage-200 shadow-xl shadow-comfort-charcoal-800/5 p-6 max-w-sm mx-auto"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-3 h-3 rounded-full bg-comfort-sage-400 mt-1.5" />
        <div>
          <div className="font-medium text-comfort-charcoal-800 mb-1">Add user authentication</div>
          <div className="text-sm text-comfort-charcoal-400">Including OAuth, password reset, and session management</div>
        </div>
      </div>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: '100%' }}
        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
        className="h-1 bg-gradient-to-r from-comfort-sage-400 to-comfort-sage-500 rounded-full"
      />
    </motion.div>
  )
}

function AgentsVisual() {
  return (
    <div className="flex flex-wrap justify-center gap-3 max-w-sm mx-auto">
      {agents.map((agent, i) => (
        <motion.div
          key={agent.name}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl ${agent.color} border border-current/10`}
        >
          <span className="text-xl">{agent.emoji}</span>
          <span className="font-medium text-sm">{agent.name}</span>
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
            className="w-2 h-2 rounded-full bg-current"
          />
        </motion.div>
      ))}
    </div>
  )
}

function PreviewVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-comfort-charcoal-800 rounded-xl overflow-hidden shadow-2xl max-w-sm mx-auto"
    >
      <div className="flex items-center gap-1.5 px-4 py-3 bg-comfort-charcoal-700">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="ml-3 text-xs text-comfort-charcoal-300 font-mono">localhost:3000</span>
      </div>
      <div className="p-4 space-y-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '80%' }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="h-4 bg-comfort-sage-500/30 rounded"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '60%' }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="h-4 bg-comfort-charcoal-600 rounded"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '70%' }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="h-4 bg-comfort-charcoal-600 rounded"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-4 h-8 w-24 bg-comfort-sage-500 rounded-lg"
        />
      </div>
    </motion.div>
  )
}

function DeployVisual() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center max-w-sm mx-auto"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-comfort-sage-400 to-comfort-sage-600 flex items-center justify-center shadow-lg shadow-comfort-sage-500/25"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="w-10 h-10 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="font-mono text-sm text-comfort-sage-600"
      >
        yourapp.com is live
      </motion.div>
    </motion.div>
  )
}

export default function SolutionSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [activeStep, setActiveStep] = useState(0)

  const visualComponents: Record<string, React.ReactNode> = {
    card: <CardVisual />,
    agents: <AgentsVisual />,
    preview: <PreviewVisual />,
    deploy: <DeployVisual />,
  }

  return (
    <section id="solution" className="py-32 md:py-40 bg-comfort-sage-50 relative overflow-hidden" ref={containerRef}>
      {/* Background decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-bl from-comfort-sage-100 to-transparent opacity-60" />
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-comfort-sage-100 to-transparent opacity-40" />

      <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 relative">
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
            className="inline-block text-sm font-medium tracking-[0.2em] uppercase text-comfort-sage-600 mb-4"
          >
            How It Works
          </motion.span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-medium text-comfort-charcoal-800 tracking-tight leading-[1.1] mb-6">
            From idea to production in{' '}
            <span className="text-comfort-sage-600">four steps</span>
          </h2>
          <p className="text-xl text-comfort-charcoal-400 leading-relaxed">
            No coding. No complicated setup. Just describe what you want and watch it happen.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Steps List */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.button
                key={step.number}
                initial={{ opacity: 0, x: -40 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + index * 0.1,
                  ease: [0.22, 1, 0.36, 1]
                }}
                onClick={() => setActiveStep(index)}
                className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-white shadow-xl shadow-comfort-charcoal-800/5 border border-comfort-sage-200'
                    : 'bg-transparent hover:bg-white/50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <span className={`text-sm font-mono font-medium transition-colors duration-300 ${
                    activeStep === index ? 'text-comfort-sage-600' : 'text-comfort-charcoal-300'
                  }`}>
                    {step.number}
                  </span>
                  <div>
                    <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                      activeStep === index ? 'text-comfort-charcoal-800' : 'text-comfort-charcoal-500'
                    }`}>
                      {step.title}
                    </h3>
                    <p className={`leading-relaxed transition-colors duration-300 ${
                      activeStep === index ? 'text-comfort-charcoal-500' : 'text-comfort-charcoal-400'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Visual Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative"
          >
            <div className="aspect-square lg:aspect-[4/3] bg-white rounded-3xl border border-comfort-sage-200 shadow-2xl shadow-comfort-charcoal-800/5 flex items-center justify-center p-8 lg:p-12">
              {visualComponents[steps[activeStep].visual]}
            </div>

            {/* Decorative dots */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 grid grid-cols-4 gap-2">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-comfort-sage-200" />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

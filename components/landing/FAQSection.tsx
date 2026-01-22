'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'

const faqs = [
  {
    question: "What is Paynto.AI?",
    answer: "Paynto.AI is a visual development platform powered by AI agents. You create cards describing what you want to build, and our coordinated team of AI agents—Architect, Coder, Tester, DevOps—work together to build production-ready applications for you."
  },
  {
    question: "Do I need coding experience?",
    answer: "Not at all. The entire platform is designed for non-technical users. You describe features in plain language, and our AI handles all the technical implementation. Of course, if you do code, you'll have full access to the generated codebase."
  },
  {
    question: "Is my code secure and private?",
    answer: "Yes. Your code is yours completely. We use enterprise-grade encryption, never train on your data, and you can export your entire codebase at any time. For Enterprise customers, we also offer on-premise deployment options."
  },
  {
    question: "Can I use my own API keys?",
    answer: "Yes. Pro and higher plans allow you to bring your own API keys for AI models, giving you more control over costs and rate limits. Free tier users work with our shared infrastructure."
  },
  {
    question: "What technologies do you support?",
    answer: "We generate modern, production-ready code using React, Next.js, TypeScript, and Tailwind CSS. Our DevOps agent handles deployment to Vercel, and we're continuously adding support for more frameworks and deployment targets."
  },
  {
    question: "How does the credit system work?",
    answer: "Credits are consumed when AI agents work on your tasks. Simple tasks use fewer credits, while complex multi-step features use more. Unused credits don't roll over, but you can always upgrade your plan for more capacity."
  },
]

function FAQItem({ faq, index, isOpen, onToggle }: {
  faq: typeof faqs[0]
  index: number
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="border-b border-comfort-sage-200 last:border-0"
    >
      <button
        onClick={onToggle}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <h3 className="text-lg font-medium text-comfort-charcoal-800 pr-8 group-hover:text-comfort-sage-700 transition-colors duration-200">
          {faq.question}
        </h3>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 rounded-full bg-comfort-sage-100 flex items-center justify-center flex-shrink-0 group-hover:bg-comfort-sage-200 transition-colors duration-200"
        >
          <svg
            className="w-4 h-4 text-comfort-sage-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-comfort-charcoal-500 leading-relaxed max-w-3xl">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: "-100px" })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section id="faq" className="py-32 md:py-40 bg-comfort-sage-50 relative" ref={containerRef}>
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="inline-block text-sm font-medium tracking-[0.2em] uppercase text-comfort-sage-600 mb-4"
          >
            FAQ
          </motion.span>
          <h2 className="text-4xl sm:text-5xl font-medium text-comfort-charcoal-800 tracking-tight leading-[1.1] mb-6">
            Questions & Answers
          </h2>
          <p className="text-xl text-comfort-charcoal-400 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about building with Paynto.AI
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="bg-white rounded-2xl border border-comfort-sage-200 px-8">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-comfort-charcoal-400 mb-4">
            Still have questions?
          </p>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-comfort-sage-600 font-medium hover:text-comfort-sage-700 transition-colors duration-200"
          >
            Get in touch
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

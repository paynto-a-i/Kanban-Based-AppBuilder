'use client'

import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import BuiltBySection from '@/components/landing/BuiltBySection'
import ProblemSection from '@/components/landing/ProblemSection'
import SolutionSection from '@/components/landing/SolutionSection'
import MockUI from '@/components/landing/MockUI'
import PricingSection from '@/components/landing/PricingSection'
import FAQSection from '@/components/landing/FAQSection'
import ContactForm from '@/components/landing/ContactForm'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-white antialiased overflow-x-hidden">
      {/* Fixed navbar */}
      <Navbar />

      <main>
        {/* 1. Hero - Main headline with trust logos */}
        <Hero />

        {/* 2. Trust Section - Scrolling team credentials */}
        <BuiltBySection />

        {/* 2. Problem - Three pain points */}
        <ProblemSection />

        {/* 3. Solution - How it works */}
        <SolutionSection />

        {/* 4. Interactive Demo - Command Centre */}
        <div id="demo">
          <MockUI />
        </div>

        {/* 4. Pricing - Clear tiers */}
        <PricingSection />

        {/* 5. FAQ - Common questions */}
        <FAQSection />

        {/* 6. Contact Form */}
        <div id="contact">
          <ContactForm />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

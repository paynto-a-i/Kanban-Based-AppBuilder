'use client'

import { ThemeProvider } from '@/components/landing/ThemeContext'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import BuiltBySection from '@/components/landing/BuiltBySection'
import MockUI from '@/components/landing/MockUI'
import ProgressMetricsStrip from '@/components/landing/ProgressMetricsStrip'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import AgentTypesSection from '@/components/landing/AgentTypesSection'
import MetricsSection from '@/components/landing/MetricsSection'
import PricingSection from '@/components/landing/PricingSection'
import FAQSection from '@/components/landing/FAQSection'
import FinalCTASection from '@/components/landing/FinalCTASection'
import ContactForm from '@/components/landing/ContactForm'
import BackedBySection from '@/components/landing/BackedBySection'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white antialiased overflow-x-hidden overflow-y-auto">
        {/* Fixed navbar at top */}
        <Navbar />

        <main>
          {/* 1. Hero Section - Main headline with social proof */}
          <Hero />

          {/* 2. Trust Section - Team credentials logos */}
          <BuiltBySection />

          {/* 3. Interactive Demo - Show the product in action */}
          <div id="demo">
            <MockUI />
          </div>

          {/* 4. Quick Metrics Strip - Key value propositions */}
          <ProgressMetricsStrip />

          {/* 5. How It Works - Step-by-step journey */}
          <HowItWorksSection />

          {/* 6. Features Section - Bento grid of capabilities */}
          <FeaturesSection />

          {/* 7. Agent Types - Detailed agent showcase */}
          <AgentTypesSection />

          {/* 8. Metrics & Testimonials - Social proof and credibility */}
          <MetricsSection />

          {/* 9. Pricing Section - Clear pricing tiers */}
          <PricingSection />

          {/* 10. FAQ Section - Address common questions */}
          <FAQSection />

          {/* 11. Final CTA Section - Last conversion push */}
          <FinalCTASection />

          {/* 12. Contact/Waitlist Form */}
          <ContactForm />

          {/* 13. Backed By - Partner/accelerator logos */}
          <BackedBySection />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  )
}

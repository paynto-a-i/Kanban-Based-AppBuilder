'use client'

import { ThemeProvider } from '@/components/landing/ThemeContext'
import Navbar from '@/components/landing/Navbar'
import Hero from '@/components/landing/Hero'
import MockUI from '@/components/landing/MockUI'
import AgentTypesSection from '@/components/landing/AgentTypesSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import MetricsSection from '@/components/landing/MetricsSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FAQSection from '@/components/landing/FAQSection'
import ContactForm from '@/components/landing/ContactForm'
import Footer from '@/components/landing/Footer'

export default function Home() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-white antialiased overflow-x-hidden">
        <Navbar />
        <main>
          <Hero />
          <MockUI />
          <AgentTypesSection />
          <HowItWorksSection />
          <MetricsSection />
          <FeaturesSection />
          <FAQSection />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </ThemeProvider>
  )
}

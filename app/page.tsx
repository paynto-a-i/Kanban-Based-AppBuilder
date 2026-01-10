"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";

// ============================================================================
// TYPES
// ============================================================================
interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
  orbitAngle: number;
  orbitSpeed: number;
}

// ============================================================================
// WEBGL SILVER PARTICLE DUST FIELD
// ============================================================================
function SilverParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Initialize particles with slow orbit
    const particleCount = 120;
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      orbitAngle: Math.random() * Math.PI * 2,
      orbitSpeed: (Math.random() - 0.5) * 0.002,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      timeRef.current += 0.016;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Radial vignette
      const vignetteGradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) * 0.7
      );
      vignetteGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignetteGradient.addColorStop(0.7, "rgba(0, 0, 0, 0.1)");
      vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle) => {
        // Slow orbit motion
        particle.orbitAngle += particle.orbitSpeed;
        const orbitX = Math.cos(particle.orbitAngle) * 0.3;
        const orbitY = Math.sin(particle.orbitAngle) * 0.3;

        // Mouse magnetic attraction with cyan-silver spark trails
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 250) {
          const force = (250 - dist) / 250;
          particle.x += dx * force * 0.008;
          particle.y += dy * force * 0.008;
        }

        particle.x += particle.speedX + orbitX;
        particle.y += particle.speedY + orbitY;

        // Wrap around
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Silver dust particle with platinum glow
        const gradient = ctx.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 4
        );
        gradient.addColorStop(0, `rgba(220, 225, 235, ${particle.opacity})`);
        gradient.addColorStop(0.3, `rgba(200, 210, 220, ${particle.opacity * 0.6})`);
        gradient.addColorStop(0.6, `rgba(180, 190, 205, ${particle.opacity * 0.3})`);
        gradient.addColorStop(1, "rgba(160, 170, 185, 0)");

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright chrome specular core
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 1.2})`;
        ctx.fill();
      });

      // Cyan-silver spark trails orbiting mouse
      const sparkCount = 8;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (timeRef.current * 0.8 + i * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
        const radius = 35 + Math.sin(timeRef.current * 2 + i) * 12;
        const sparkX = mouseRef.current.x + Math.cos(angle) * radius;
        const sparkY = mouseRef.current.y + Math.sin(angle) * radius;

        const sparkGradient = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, 10);
        sparkGradient.addColorStop(0, "rgba(140, 220, 255, 0.7)");
        sparkGradient.addColorStop(0.4, "rgba(180, 230, 255, 0.4)");
        sparkGradient.addColorStop(1, "rgba(200, 220, 240, 0)");

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, 10, 0, Math.PI * 2);
        ctx.fillStyle = sparkGradient;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

// ============================================================================
// ENTERPRISE GLASSMORPHIC CARD (30-40px blur, chromatic aberration, neumorphic)
// ============================================================================
function EnterpriseGlassCard({
  children,
  className = "",
  hover3D = true,
  intensity = 1,
}: {
  children: React.ReactNode;
  className?: string;
  hover3D?: boolean;
  intensity?: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), { stiffness: 200, damping: 25 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !hover3D) return;
    const rect = cardRef.current.getBoundingClientRect();
    x.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    y.set((e.clientY - rect.top - rect.height / 2) / rect.height);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return (
    <motion.div
      ref={cardRef}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{
        rotateX: hover3D ? rotateX : 0,
        rotateY: hover3D ? rotateY : 0,
        transformStyle: "preserve-3d",
        perspective: 1200,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.015, z: 50 }}
      transition={{ duration: 0.35 }}
    >
      {/* Chromatic aberration edge effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          background: `linear-gradient(135deg, rgba(255, 120, 120, 0.08) 0%, transparent 25%, transparent 75%, rgba(120, 120, 255, 0.08) 100%)`,
          padding: 2,
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />
      {/* Heavy glassmorphism backdrop (35px blur, 75% opacity) */}
      <div
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(145deg, rgba(200, 210, 225, ${0.12 * intensity}) 0%, rgba(170, 180, 195, ${0.08 * intensity}) 50%, rgba(140, 150, 165, ${0.06 * intensity}) 100%)`,
          backdropFilter: "blur(35px) saturate(1.3)",
          WebkitBackdropFilter: "blur(35px) saturate(1.3)",
        }}
      />
      {/* Inner silver-white volumetric glow + neumorphic shadows + metallic bevel */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: `
            inset 0 2px 4px rgba(255, 255, 255, ${0.35 * intensity}),
            inset 0 -2px 4px rgba(0, 0, 0, 0.15),
            0 12px 40px rgba(0, 0, 0, 0.35),
            0 4px 16px rgba(0, 0, 0, 0.2),
            0 0 80px rgba(190, 205, 225, ${0.08 * intensity})
          `,
          border: `1px solid rgba(220, 230, 245, ${0.25 * intensity})`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// CHROME CTA BUTTON WITH IDLE PULSE
// ============================================================================
function ChromeCTAButton({
  children,
  primary = false,
  large = false,
  className = "",
  onClick,
  href,
}: {
  children: React.ReactNode;
  primary?: boolean;
  large?: boolean;
  className?: string;
  onClick?: () => void;
  href?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const buttonContent = (
    <motion.button
      className={`relative overflow-hidden font-semibold ${large ? "px-10 py-5 text-lg rounded-2xl" : "px-7 py-3.5 text-base rounded-xl"} ${className}`}
      style={{
        background: primary
          ? "linear-gradient(145deg, rgba(225, 230, 240, 0.97) 0%, rgba(195, 205, 218, 0.95) 50%, rgba(175, 185, 200, 0.97) 100%)"
          : "transparent",
        color: primary ? "#0d1117" : "#c8d0dc",
        border: primary ? "none" : "2px solid rgba(200, 215, 235, 0.35)",
        boxShadow: primary
          ? "0 6px 28px rgba(190, 210, 235, 0.35), 0 0 50px rgba(190, 210, 235, 0.12), inset 0 2px 3px rgba(255, 255, 255, 0.6)"
          : "none",
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
      whileHover={{ scale: 1.04, boxShadow: primary ? "0 8px 35px rgba(190, 210, 235, 0.45), 0 0 60px rgba(190, 210, 235, 0.18)" : "0 0 20px rgba(190, 210, 235, 0.15)" }}
      whileTap={{ scale: 0.97 }}
      animate={!isHovered ? { scale: [1, 1.035, 1] } : {}}
      transition={{ scale: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      {/* LED border rotation for primary */}
      {primary && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            background: "conic-gradient(from var(--angle), transparent 0%, rgba(130, 210, 255, 0.9) 8%, transparent 16%)",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            padding: 2,
            ["--angle" as string]: "0deg",
          }}
          animate={{ ["--angle" as string]: ["0deg", "360deg"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
      )}
      {/* Ripple on hover */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            style={{ background: "radial-gradient(circle at center, rgba(130, 210, 255, 0.25) 0%, transparent 65%)" }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.6, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </AnimatePresence>
      <span className="relative z-10">{children}</span>
    </motion.button>
  );

  if (href) {
    return <Link href={href}>{buttonContent}</Link>;
  }
  return buttonContent;
}

// ============================================================================
// ENTERPRISE FEATURE PILLS CAROUSEL
// ============================================================================
const enterprisePills = [
  "SSO", "SOC 2 Type II", "GDPR", "ISO 27001", "HIPAA Ready", "Audit Logs",
  "Custom Domains", "API Access", "99.99% SLA", "Zero Trust", "VPC Peering", "Data Residency"
];

function FeaturePillsCarousel() {
  return (
    <div className="relative overflow-hidden py-6">
      <motion.div
        className="flex gap-4"
        animate={{ x: [0, -1200] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      >
        {[...enterprisePills, ...enterprisePills].map((pill, i) => (
          <motion.div
            key={i}
            className="flex-shrink-0 px-5 py-2.5 rounded-full cursor-pointer"
            style={{
              background: "rgba(200, 215, 235, 0.08)",
              border: "1px solid rgba(200, 215, 235, 0.2)",
              backdropFilter: "blur(12px)",
            }}
            whileHover={{
              scale: 1.08,
              background: "rgba(200, 215, 235, 0.15)",
              boxShadow: "0 0 25px rgba(180, 210, 240, 0.25)",
            }}
          >
            <span className="text-sm font-medium text-silver-300 whitespace-nowrap">{pill}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================================
// INTEGRATIONS MARQUEE
// ============================================================================
const integrations = [
  { name: "Authentication & SSO", tooltip: "SOC 2 Type II compliant" },
  { name: "Payments & Billing", tooltip: "PCI DSS Level 1" },
  { name: "Secure Database", tooltip: "Encrypted at rest & transit" },
  { name: "Real-time Analytics", tooltip: "Sub-second latency" },
  { name: "Notifications & Alerts", tooltip: "Multi-channel delivery" },
  { name: "File Storage & CDN", tooltip: "Global edge network" },
  { name: "Custom APIs & Webhooks", tooltip: "Full REST & GraphQL" },
  { name: "Audit & Compliance Logs", tooltip: "7-year retention" },
  { name: "AI Intelligence Layer", tooltip: "Enterprise LLM access" },
  { name: "Voice & Multimodal Input", tooltip: "Natural language" },
];

function IntegrationsMarquee() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="relative overflow-hidden py-8" onMouseLeave={() => setHoveredIndex(null)}>
      <motion.div
        className="flex gap-8"
        animate={hoveredIndex === null ? { x: [0, -1400] } : {}}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {[...integrations, ...integrations].map((item, i) => (
          <motion.div
            key={i}
            className="flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl cursor-pointer relative"
            style={{
              background: "rgba(200, 215, 235, 0.05)",
              border: "1px solid rgba(200, 215, 235, 0.12)",
            }}
            whileHover={{ scale: 1.05, background: "rgba(200, 215, 235, 0.1)" }}
            onMouseEnter={() => setHoveredIndex(i)}
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-silver-300/20 to-silver-500/10 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400/60 to-silver-400/40" />
            </div>
            <span className="text-sm font-medium text-silver-300 whitespace-nowrap">{item.name}</span>
            {hoveredIndex === i && (
              <motion.div
                className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap z-20"
                style={{ background: "rgba(30, 35, 45, 0.95)", border: "1px solid rgba(200, 215, 235, 0.2)" }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-cyan-400">{item.tooltip}</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================
const comparisonRows = [
  { label: "Deployment Speed", traditional: "Months", product: "Minutes" },
  { label: "Total Cost of Ownership", traditional: "High & Unpredictable", product: "Predictable" },
  { label: "Customization", traditional: "Limited", product: "Unlimited via Code Export" },
  { label: "Vendor Lock-in", traditional: "High", product: "None" },
  { label: "Security & Compliance", traditional: "Standard", product: "Enterprise-grade + Custom" },
  { label: "Scalability", traditional: "Fixed", product: "Auto-scaling" },
  { label: "Ownership", traditional: "Rented", product: "Full Code & Data Export" },
];

function ComparisonTable() {
  return (
    <div className="space-y-3">
      {comparisonRows.map((row, i) => (
        <motion.div
          key={row.label}
          className="grid grid-cols-3 gap-4 items-center"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.5 }}
          viewport={{ once: true }}
        >
          <div className="text-silver-300 font-medium text-sm md:text-base">{row.label}</div>
          <EnterpriseGlassCard className="p-3 md:p-4" hover3D={false} intensity={0.5}>
            <div className="flex items-center gap-2">
              <span className="text-red-400 text-lg">✗</span>
              <span className="text-silver-500 text-xs md:text-sm">{row.traditional}</span>
            </div>
          </EnterpriseGlassCard>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: i * 0.08 + 0.3 }}
            viewport={{ once: true }}
          >
            <EnterpriseGlassCard className="p-3 md:p-4" hover3D={false} intensity={1.2}>
              <div className="flex items-center gap-2">
                <motion.span
                  className="text-emerald-400 text-lg"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: i * 0.08 + 0.5, type: "spring" }}
                  viewport={{ once: true }}
                >✓</motion.span>
                <span className="text-silver-200 text-xs md:text-sm font-medium">{row.product}</span>
              </div>
            </EnterpriseGlassCard>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================================================
// FAQ ACCORDION
// ============================================================================
const faqItems = [
  { q: "Is Paynto A.I. SOC 2 Type II compliant?", a: "Yes. We maintain SOC 2 Type II certification with annual audits by independent third parties. Reports are available upon request." },
  { q: "Do you offer dedicated instances / VPC peering?", a: "Yes. Enterprise plans include dedicated infrastructure, VPC peering, and private link options for maximum isolation." },
  { q: "What are your data residency options?", a: "We support US, EU, and APAC data centers. Custom residency requirements can be accommodated on Enterprise plans." },
  { q: "How does code export work for audits?", a: "Full source code export is available at any time. Code is clean, well-documented, and ready for your security audits." },
  { q: "What SLAs do you provide?", a: "Enterprise plans include 99.99% uptime SLA with financial credits, 24/7 support, and dedicated success managers." },
  { q: "How secure is the prompt-to-code process?", a: "All prompts are encrypted in transit and at rest. We never train on your data. Enterprise customers get isolated processing." },
];

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {faqItems.map((item, i) => (
        <EnterpriseGlassCard key={i} className="overflow-hidden" hover3D={false} intensity={0.8}>
          <button
            className="w-full px-6 py-5 flex items-center justify-between text-left"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            aria-expanded={openIndex === i}
            aria-controls={`faq-${i}`}
          >
            <span className="text-silver-200 font-medium pr-4">{item.q}</span>
            <motion.span
              className="text-silver-400 text-xl flex-shrink-0"
              animate={{ rotate: openIndex === i ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              ▾
            </motion.span>
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                id={`faq-${i}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="px-6 pb-5 text-silver-400 text-sm leading-relaxed">{item.a}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </EnterpriseGlassCard>
      ))}
    </div>
  );
}

// ============================================================================
// ENTERPRISE HEADER
// ============================================================================
function EnterpriseHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <EnterpriseGlassCard className="mx-3 mt-3 md:mx-6" hover3D={false} intensity={1.2}>
        <div className="px-4 md:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Paynto A.I. Home">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(145deg, #d0d8e4 0%, #a8b4c4 100%)",
                boxShadow: "0 4px 20px rgba(190, 210, 235, 0.35), inset 0 1px 2px rgba(255,255,255,0.5)",
              }}
            >
              <span className="text-xl font-bold text-gray-900">P</span>
            </div>
            <span className="text-xl font-bold hidden sm:block" style={{ background: "linear-gradient(90deg, #d8e0ec, #a8b8cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Paynto A.I.
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8" aria-label="Main navigation">
            {["Features", "Pricing", "Docs", "Blog", "Security", "Contact Sales"].map((item) => (
              <Link key={item} href="#" className="text-silver-400 hover:text-silver-200 transition-colors text-sm font-medium">
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <ChromeCTAButton href="/sign-in">Sign In</ChromeCTAButton>
            <ChromeCTAButton primary href="/generation">Start Free Trial</ChromeCTAButton>
          </div>
        </div>
      </EnterpriseGlassCard>
    </header>
  );
}

// ============================================================================
// HERO SECTION
// ============================================================================
function HeroSection() {
  const [promptValue, setPromptValue] = useState("");
  const router = useRouter();

  const handleSubmit = () => {
    const params = new URLSearchParams();
    if (promptValue.trim()) params.set("prompt", promptValue.trim());
    router.push(`/generation${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-28 pb-16">
      <motion.div className="text-center max-w-6xl mx-auto" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}>
        {/* Massive shimmering headline */}
        <motion.h1
          className="text-[clamp(3rem,12vw,14rem)] font-black leading-[0.9] tracking-tight mb-6"
          style={{
            background: "linear-gradient(100deg, #f0f4f8 0%, #c8d4e4 20%, #e8eef6 40%, #a8bcd0 60%, #dce4f0 80%, #f0f4f8 100%)",
            backgroundSize: "200% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
          transition={{ duration: 2.5, ease: "linear", repeat: Infinity }}
        >
          Enterprise AI
        </motion.h1>

        <motion.p
          className="text-[clamp(1.1rem,3vw,3.4rem)] text-silver-300 font-medium mb-10 tracking-wide"
          style={{ letterSpacing: "0.06em" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          From vision to production-ready software in minutes – no code, full ownership, enterprise-grade security.
        </motion.p>

        {/* Interactive prompt input */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <EnterpriseGlassCard className="max-w-3xl mx-auto" hover3D={false} intensity={1.5}>
            <div className="p-2">
              <div
                className="relative rounded-xl overflow-hidden"
                style={{ background: "rgba(20, 25, 35, 0.7)", border: "2px solid rgba(130, 180, 230, 0.25)" }}
              >
                <input
                  type="text"
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder="Build me a secure enterprise dashboard with SSO, audit logs, role-based access & real-time analytics…"
                  className="w-full pl-6 pr-44 py-6 bg-transparent text-white/90 text-lg placeholder:text-silver-500 focus:outline-none"
                  aria-label="Describe your enterprise software"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <ChromeCTAButton primary onClick={handleSubmit}>Get Started</ChromeCTAButton>
                </div>
              </div>
            </div>
          </EnterpriseGlassCard>
        </motion.div>

        {/* Dual CTAs */}
        <motion.div className="flex flex-wrap items-center justify-center gap-5 mt-10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <ChromeCTAButton primary large href="/generation">
            <span className="flex items-center gap-2">Start Free Trial – No Card Required <span className="text-xl">→</span></span>
          </ChromeCTAButton>
          <ChromeCTAButton large href="#">Book Enterprise Demo</ChromeCTAButton>
        </motion.div>

        {/* Feature pills */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }}>
          <FeaturePillsCarousel />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ============================================================================
// FOOTER
// ============================================================================
function EnterpriseFooter() {
  const footerLinks = {
    Product: ["Features", "Pricing", "Enterprise", "Roadmap", "Changelog"],
    "Security & Trust": ["Trust Center", "Compliance", "Security Reports", "SLA"],
    Resources: ["Docs", "API Reference", "Blog", "Case Studies", "Help Center"],
    Company: ["About", "Careers", "Contact Sales", "Partners"],
  };

  return (
    <footer className="relative mt-32" style={{ background: "linear-gradient(to top, rgba(12, 15, 22, 0.98) 0%, rgba(18, 22, 30, 0.95) 100%)" }}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(145deg, #c8d4e4 0%, #a0b0c4 100%)" }}>
                <span className="text-xl font-bold text-gray-900">P</span>
              </div>
              <span className="text-xl font-bold" style={{ background: "linear-gradient(90deg, #d8e0ec, #a8b8cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Paynto A.I.</span>
            </Link>
            <p className="text-silver-500 text-sm mb-6">Enterprise-grade AI software generation with complete sovereignty.</p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-silver-300 font-semibold mb-4 text-sm uppercase tracking-wider">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}><Link href="#" className="text-silver-500 text-sm hover:text-silver-300 transition-colors">{link}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-silver-800">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-silver-500 mb-4">
            {["Terms of Service", "Privacy Policy", "Cookie Policy", "Data Processing Addendum", "Security", "Accessibility Statement"].map((link, i) => (
              <span key={link} className="flex items-center gap-6">
                <Link href="#" className="hover:text-silver-300 transition-colors">{link}</Link>
                {i < 5 && <span className="text-silver-700">•</span>}
              </span>
            ))}
          </div>
          <p className="text-center text-silver-600 text-sm">© 2026 Paynto A.I. Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================
export default function EnterpriseChromeLandingPage() {
  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: `
          radial-gradient(ellipse 90% 60% at 50% -15%, rgba(50, 60, 80, 0.25) 0%, transparent 55%),
          radial-gradient(ellipse 70% 45% at 85% 55%, rgba(40, 50, 70, 0.18) 0%, transparent 45%),
          radial-gradient(ellipse 55% 35% at 15% 75%, rgba(45, 55, 75, 0.12) 0%, transparent 40%),
          linear-gradient(to bottom, #0a0c12 0%, #0f1218 50%, #080a0e 100%)
        `,
      }}
    >
      <SilverParticleField />
      <EnterpriseHeader />
      <HeroSection />

      {/* Built-in Capabilities Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-4"
            style={{ background: "linear-gradient(90deg, #e0e8f4, #b8c8dc, #e0e8f4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Enterprise-Grade Built-in Power
          </motion.h2>
          <IntegrationsMarquee />
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-12"
            style={{ background: "linear-gradient(90deg, #e0e8f4, #b8c8dc, #e0e8f4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Why Leading Enterprises Choose Paynto
          </motion.h2>
          <ComparisonTable />
          <div className="text-center mt-12">
            <ChromeCTAButton primary large href="#">Compare Plans</ChromeCTAButton>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-4xl md:text-5xl font-bold text-center mb-12"
            style={{ background: "linear-gradient(90deg, #e0e8f4, #b8c8dc, #e0e8f4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Addressing Enterprise Concerns
          </motion.h2>
          <FAQSection />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 px-4">
        <EnterpriseGlassCard className="max-w-4xl mx-auto p-12 md:p-16 text-center" hover3D={false} intensity={1.3}>
          <motion.h2
            className="text-3xl md:text-5xl font-bold mb-6"
            style={{ background: "linear-gradient(90deg, #f0f4f8, #c8d8ec, #f0f4f8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Ready to Deploy Enterprise-grade Software Faster & Safer?
          </motion.h2>
          <p className="text-silver-400 text-lg mb-10 max-w-2xl mx-auto">
            Join leading organizations building at AI speed without compromising security or control. No credit card required for trial.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5">
            <ChromeCTAButton primary large href="/generation">Start Free Enterprise Trial</ChromeCTAButton>
            <ChromeCTAButton large href="#">Schedule Compliance & Security Demo</ChromeCTAButton>
          </div>
        </EnterpriseGlassCard>
      </section>

      <EnterpriseFooter />

      {/* Global styles */}
      <style jsx global>{`
        .text-silver-200 { color: #e4ecf6; }
        .text-silver-300 { color: #c4d0e0; }
        .text-silver-400 { color: #a4b0c0; }
        .text-silver-500 { color: #848c9c; }
        .text-silver-600 { color: #646c7c; }
        .text-silver-700 { color: #444c5c; }
        .text-silver-800 { color: #2c343c; }
        .border-silver-800 { border-color: #2c343c; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: rgba(20, 25, 35, 0.6); }
        ::-webkit-scrollbar-thumb { background: rgba(160, 175, 195, 0.3); border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(160, 175, 195, 0.5); }
        *:focus-visible { outline: 2px solid rgba(130, 200, 255, 0.7); outline-offset: 3px; }
        ::selection { background: rgba(130, 200, 255, 0.3); color: #fff; }
      `}</style>
    </div>
  );
}

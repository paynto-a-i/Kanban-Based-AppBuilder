export interface GenerationTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
  features: string[];
  preview?: string;
}

export const UI_RICHNESS_APPENDIX =
  "\n\nUI QUALITY BAR (make it feel premium):" +
  "\n- Use a distinct, modern visual identity (not generic defaults)." +
  "\n- Add tasteful animations and micro-interactions; respect prefers-reduced-motion." +
  "\n- Use polished empty/loading states, rich surfaces (cards), and strong typography hierarchy." +
  "\n- Make it responsive and accessible (focus states, contrast, semantics)." +
  "\n- If I mention an aesthetic (e.g. anime/cyberpunk/retro), fully commit to it across the UI.";

export const GENERATION_TEMPLATES: GenerationTemplate[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Premium analytics console (command bar, KPIs, charts, table)",
    prompt:
      (
        `Build a premium admin dashboard that feels like a modern analytics console (not a generic CRUD page).

Layout & navigation:
- Collapsible sidebar with icons, animated active indicator, and smooth expand/collapse.
- Top command bar with global search (command-palette feel), notifications, and a profile menu.

Core content:
- KPI cards with subtle gradients/surfaces, hover states, and tiny trend indicators.
- Interactive line chart (tooltips + legend toggles) and a comparison bar chart (hover highlights).
- Data table with sticky header, filters, row actions, pagination, and polished empty/loading states.

Polish:
- Motion-safe page/section transitions and micro-interactions throughout.
- Dark-first, high-contrast theme with a memorable accent color and consistent spacing rhythm.`
      ).trim() + UI_RICHNESS_APPENDIX,
    icon: "📊",
    color: "#3B82F6",
    features: ["Command bar", "Charts", "Data table"],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Boutique shop UX (filters, quick-view, cart drawer, checkout)",
    prompt:
      (
        `Create a boutique e-commerce experience with a strong, modern visual identity and delightful interactions.

Shopping UX:
- Product grid with rich cards (hover reveal, quick actions, badges, and an elegant image treatment).
- Filters sidebar with animated filter chips, sort controls, and a clear "reset filters" state.
- Product quick-view modal (or drawer) with variants, quantity, and add-to-cart.
- Cart drawer with springy motion and editable quantities + remove.
- Checkout as a multi-step flow with progress indicator, polished validation, and trust badges.

Polish:
- Skeleton loading for the grid and a premium empty state when no results match.
- Motion-safe transitions and micro-interactions on every card/button.`
      ).trim() + UI_RICHNESS_APPENDIX,
    icon: "🛒",
    color: "#10B981",
    features: ["Filters", "Cart drawer", "Checkout"],
  },
  {
    id: "blog",
    name: "Blog",
    description: "Editorial magazine style (reading UX, typography-first)",
    prompt:
      (
        `Build an editorial blog experience that feels like a digital magazine (typography-first, premium, and modern).

Homepage:
- Featured post hero with a striking layout and subtle motion-safe entrance.
- Post grid with hover previews, category/tags UI, and a newsletter signup that feels high-end.
- Category navigation with clear active states and smooth interactions.

Post page:
- Reading progress indicator, author card, related posts, and a comments section with polished empty/loading states.
- Add a table of contents when the post is long-form.`
      ).trim() + UI_RICHNESS_APPENDIX,
    icon: "📝",
    color: "#8B5CF6",
    features: ["Reading UX", "Newsletter", "Comments"],
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Bold personal brand (case studies, timeline, contact)",
    prompt:
      (
        `Create a modern personal portfolio with a bold personal brand, slick motion, and a cohesive design system.

Must include:
- A standout hero (name + tagline + CTAs) with an art-directed background and motion-safe animation.
- About section with premium layout and clear hierarchy.
- Skills presented in a modern way (chips, meters, or bento tiles — avoid plain progress bars unless stylized).
- Projects gallery with filters and immersive modal case studies (images, role, outcomes, links).
- Work experience timeline with scroll-reveal and great spacing.
- Contact form with polished validation and delightful micro-interactions.`
      ).trim() + UI_RICHNESS_APPENDIX,
    icon: "💼",
    color: "#F59E0B",
    features: ["Case studies", "Timeline", "Contact"],
  },
  {
    id: "pricing",
    name: "Pricing Page",
    description: "High-converting pricing (toggle, comparison, FAQ, trust)",
    prompt:
      (
        `Build a high-converting pricing page with a distinctive, premium look and motion-forward interactions.

Must include:
- 3 pricing tiers (Basic, Pro, Enterprise) with a highlighted "most popular" tier and clear value hierarchy.
- Monthly/yearly toggle with a smooth animated thumb and price transitions.
- Feature comparison (table or bento) with hover tooltips and crisp alignment.
- FAQ accordion with polished open/close motion and good content spacing.
- Final CTA section with trust signals (logos, badges, or guarantees) and a confident primary action.`
      ).trim() + UI_RICHNESS_APPENDIX,
    icon: "💰",
    color: "#EC4899",
    features: ["Toggle", "Comparison", "FAQ"],
  },
  {
    id: "landing",
    name: "Landing Page",
    description: "Award-worthy SaaS landing (bento, testimonials, pricing)",
    prompt:
      (
        `Design and build an award-worthy SaaS landing page with a distinct visual identity and modern motion.

Must include:
- A cinematic hero (headline + subheadline + dual CTAs) with a layered background (glow/gradient + subtle texture) and a tasteful animated centerpiece.
- Sticky glass header with clear nav + subtle animated active indicator.
- Features presented as a bento grid with iconography + hover-reveal microcopy.
- Testimonials as premium cards (or a subtle carousel if appropriate) with polished empty/loading states.
- Pricing cards with a highlighted "most popular" tier, feature comparison, and a strong final CTA band.
- Footer with structured links + social.

Interaction & polish:
- Micro-interactions everywhere (hover lift, press states, focus rings, juicy primary button feel).
- Motion-safe entrances for key sections and refined loading (skeleton shimmer, not plain spinners).`
      ).trim() + UI_RICHNESS_APPENDIX,
    icon: "🚀",
    color: "#fa5d19",
    features: ["Hero", "Bento", "Conversion"],
  },
];


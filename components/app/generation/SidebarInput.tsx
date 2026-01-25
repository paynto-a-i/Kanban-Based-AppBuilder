"use client";

import { useState } from "react";
import Link from "next/link";
import { appConfig } from "@/config/app.config";

interface SidebarInputProps {
  onSubmit: (url: string, style: string, model: string, instructions?: string) => void;
  onPromptSubmit?: (prompt: string, model: string) => void;
  onImportSubmit?: (
    repoFullName: string,
    branch: string,
    maxFiles: number,
    model: string,
    goalPrompt?: string
  ) => void;
  disabled?: boolean;
}

const UI_RICHNESS_APPENDIX =
  "\n\nUI QUALITY BAR (make it feel premium):" +
  "\n- Use a distinct, modern visual identity (not generic defaults)." +
  "\n- Add tasteful animations and micro-interactions; respect prefers-reduced-motion." +
  "\n- Use polished empty/loading states, rich surfaces (cards), and strong typography hierarchy." +
  "\n- Make it responsive and accessible (focus states, contrast, semantics)." +
  "\n- If I mention an aesthetic (e.g. anime/cyberpunk/retro), fully commit to it across the UI.";

const SUGGESTED_BUILDS = [
  {
    id: "landing",
    name: "Landing Page",
    description: "Modern SaaS landing page with hero, features, and CTA",
    prompt:
      "Design and build an award-worthy SaaS landing page with a distinct visual identity and modern motion." +
      "\n\nMust include:" +
      "\n- A cinematic hero (headline + subheadline + dual CTAs) with a layered background (glow/gradient + subtle texture) and a tasteful animated centerpiece (e.g., floating UI mock card or bento hero)." +
      "\n- Sticky glass header with clear nav + a subtle animated active indicator." +
      "\n- Features presented as a bento grid with iconography + hover-reveal microcopy." +
      "\n- Testimonials as premium cards (or a subtle carousel if appropriate) with polished empty/loading states." +
      "\n- Pricing cards with a highlighted “most popular” tier, feature comparison, and a strong final CTA band." +
      "\n- Footer with structured links + social." +
      "\n\nInteraction & polish:" +
      "\n- Micro-interactions everywhere (hover lift, press states, focus rings, magnetic/juicy primary button feel)." +
      "\n- Motion-safe entrances for key sections and a refined loading experience (skeleton shimmer, not plain spinners)." +
      "\n- Responsive, accessible, and high-contrast." +
      UI_RICHNESS_APPENDIX,
    icon: "🚀",
  },
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Admin dashboard with charts and data tables",
    prompt:
      "Build a premium admin dashboard that feels like a modern analytics console (not a generic CRUD page)." +
      "\n\nLayout & navigation:" +
      "\n- Collapsible sidebar with animated active indicator, icons, and a smooth expand/collapse interaction." +
      "\n- Top command bar with global search (command-palette feel), notifications, and a profile menu." +
      "\n\nCore content:" +
      "\n- KPI cards with subtle gradients/surfaces, hover states, and tiny trend indicators." +
      "\n- Interactive line chart (tooltips + legend toggles) and a comparison bar chart (hover highlights)." +
      "\n- Data table with sticky header, filters, row actions, pagination, and polished empty/loading states." +
      "\n\nPolish:" +
      "\n- Motion-safe page/section transitions and micro-interactions throughout." +
      "\n- Dark-first, high-contrast theme with a memorable accent color and consistent spacing rhythm." +
      UI_RICHNESS_APPENDIX,
    icon: "📊",
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Product listing with cart and checkout",
    prompt:
      "Create a boutique e-commerce experience with a strong, modern visual identity and delightful interactions." +
      "\n\nShopping UX:" +
      "\n- Product grid with rich cards (hover reveal, quick actions, badges, and an elegant image treatment)." +
      "\n- Filters sidebar with animated filter chips, sort controls, and a clear “reset filters” state." +
      "\n- Product quick-view modal (or drawer) with variants, quantity, and add-to-cart." +
      "\n- Cart drawer with springy motion and editable quantities + remove." +
      "\n- Checkout as a multi-step flow with progress indicator, polished validation, and trust badges." +
      "\n\nPolish:" +
      "\n- Skeleton loading for the grid and a premium empty state when no results match." +
      "\n- Micro-interactions on every card/button, motion-safe transitions, and responsive layout." +
      UI_RICHNESS_APPENDIX,
    icon: "🛒",
  },
  {
    id: "blog",
    name: "Blog",
    description: "Blog with posts, categories, and comments",
    prompt:
      "Build an editorial blog experience that feels like a digital magazine (typography-first, premium, and modern)." +
      "\n\nHomepage:" +
      "\n- Featured post hero with a striking layout and subtle motion-safe entrance." +
      "\n- Post grid with hover previews, category/tags UI, and a newsletter signup that feels high-end." +
      "\n- Category sidebar (or top nav) with clear active states and smooth interactions." +
      "\n\nPost page:" +
      "\n- Reading progress indicator, author card, related posts, and a comments section with polished empty/loading states." +
      "\n- Optional table of contents if long-form content is implied." +
      "\n\nPolish:" +
      "\n- Editorial typography scale, generous spacing, tasteful textures, and micro-interactions everywhere." +
      UI_RICHNESS_APPENDIX,
    icon: "📝",
  },
  {
    id: "portfolio",
    name: "Portfolio",
    description: "Personal portfolio with projects showcase",
    prompt:
      "Create a modern personal portfolio with a bold personal brand, slick motion, and a cohesive design system." +
      "\n\nMust include:" +
      "\n- A standout hero (name + tagline + CTAs) with an art-directed background and motion-safe animation." +
      "\n- About section with a premium layout and clear hierarchy." +
      "\n- Skills presented in a modern way (chips, meters, or bento tiles — avoid plain progress bars unless stylized)." +
      "\n- Projects gallery with filters and immersive modal case studies (images, role, outcomes, links)." +
      "\n- Work experience timeline with scroll-reveal and great spacing." +
      "\n- Contact form with polished validation and delightful micro-interactions." +
      UI_RICHNESS_APPENDIX,
    icon: "💼",
  },
  {
    id: "saas-pricing",
    name: "Pricing Page",
    description: "SaaS pricing with feature comparison",
    prompt:
      "Build a high-converting pricing page with a distinctive, premium look and motion-forward interactions." +
      "\n\nMust include:" +
      "\n- 3 pricing tiers (Basic, Pro, Enterprise) with a highlighted “most popular” tier and clear value hierarchy." +
      "\n- Monthly/yearly toggle with a smooth animated thumb and price transitions." +
      "\n- Feature comparison (table or bento) with hover tooltips and crisp alignment." +
      "\n- FAQ accordion with polished open/close motion and good content spacing." +
      "\n- Final CTA section with trust signals (logos, badges, or guarantees) and a confident primary action." +
      "\n\nPolish:" +
      "\n- Micro-interactions on all interactive elements, premium empty/loading states, and responsive layout." +
      UI_RICHNESS_APPENDIX,
    icon: "💰",
  },
];

const CLONE_EXAMPLES = [
  { name: "Stripe", url: "stripe.com", icon: "💳" },
  { name: "Linear", url: "linear.app", icon: "📐" },
  { name: "Vercel", url: "vercel.com", icon: "▲" },
  { name: "Notion", url: "notion.so", icon: "📓" },
  { name: "Figma", url: "figma.com", icon: "🎨" },
  { name: "GitHub", url: "github.com", icon: "🐙" },
];

export default function SidebarInput({ onSubmit, onPromptSubmit, onImportSubmit, disabled = false }: SidebarInputProps) {
  const [activeTab, setActiveTab] = useState<"build" | "clone" | "import">("build");
  const [url, setUrl] = useState<string>("");
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("4");
  const [selectedModel, setSelectedModel] = useState<string>(appConfig.ai.defaultModel);
  const [additionalInstructions, setAdditionalInstructions] = useState<string>("");
  const [showCloneOptions, setShowCloneOptions] = useState<boolean>(false);
  const [repoFullName, setRepoFullName] = useState<string>("");
  const [repoBranch, setRepoBranch] = useState<string>("main");
  const [maxFiles, setMaxFiles] = useState<number>(100);
  const [importGoal, setImportGoal] = useState<string>("");

  const styles = [
    { id: "1", name: "Glassmorphism" },
    { id: "2", name: "Neumorphism" },
    { id: "3", name: "Brutalism" },
    { id: "4", name: "Minimalist" },
    { id: "5", name: "Dark Mode" },
    { id: "6", name: "Gradient Rich" },
  ];

  const models = appConfig.ai.availableModels.map(model => ({
    id: model,
    name: appConfig.ai.modelDisplayNames[model] || model,
  }));

  const handleCloneSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim() || disabled) return;
    onSubmit(url.trim(), selectedStyle, selectedModel, additionalInstructions || undefined);
    setUrl("");
    setAdditionalInstructions("");
    setShowCloneOptions(false);
  };

  const handleBuildSubmit = (prompt: string) => {
    if (disabled) return;
    if (onPromptSubmit) {
      onPromptSubmit(prompt, selectedModel);
    } else {
      sessionStorage.setItem('buildFromPrompt', 'true');
      sessionStorage.setItem('buildPrompt', prompt);
      sessionStorage.setItem('selectedModel', selectedModel);
      window.location.reload();
    }
  };

  const handleCustomPromptSubmit = () => {
    if (!customPrompt.trim() || disabled) return;
    handleBuildSubmit(customPrompt.trim());
    setCustomPrompt("");
  };

  const validateUrl = (urlString: string): boolean => {
    if (!urlString) return false;
    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    return urlPattern.test(urlString.toLowerCase());
  };

  const normalizeRepoFullName = (raw: string): string => {
    let v = raw.trim();
    v = v.replace(/^https?:\/\/github\.com\//i, "");
    v = v.replace(/^github\.com\//i, "");
    v = v.replace(/\.git$/i, "");
    return v;
  };

  const isValidRepoFullName = (raw: string): boolean => {
    const v = normalizeRepoFullName(raw);
    const parts = v.split("/");
    return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
  };

  const handleImportSubmit = () => {
    if (disabled) return;
    if (!isValidRepoFullName(repoFullName)) return;
    const cleaned = normalizeRepoFullName(repoFullName);
    const branch = repoBranch.trim() || "main";
    const goal = importGoal.trim() || undefined;
    const cappedMaxFiles = Math.max(10, Math.min(300, Math.floor(maxFiles)));
    onImportSubmit?.(cleaned, branch, cappedMaxFiles, selectedModel, goal);
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-100">
        <Link href="/">
          <button className="w-full px-3 py-2 text-xs font-medium text-gray-700 bg-white rounded border border-gray-200 hover:border-gray-300 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-colors">
            ← Back to Home
          </button>
        </Link>
      </div>

      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab("build")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "build"
              ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🔨 Build
        </button>
        <button
          onClick={() => setActiveTab("clone")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "clone"
              ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Clone
        </button>
        <button
          onClick={() => setActiveTab("import")}
          className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
            activeTab === "import"
              ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/50"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🐙 Import
        </button>
      </div>

      {activeTab === "build" && (
        <div className="p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Suggested Templates</label>
            <div className="space-y-1.5 max-h-[280px] overflow-y-auto">
              {SUGGESTED_BUILDS.map((build) => (
                <button
                  key={build.id}
                  onClick={() => handleBuildSubmit(build.prompt)}
                  disabled={disabled}
                  className="w-full p-2.5 text-left rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-base">{build.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-gray-800 group-hover:text-orange-700">
                        {build.name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {build.description}
                      </div>
                    </div>
                    <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Or describe your own</label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              disabled={disabled}
              placeholder="Describe what you want to build..."
              className="w-full px-2.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400 resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleCustomPromptSubmit();
                }
              }}
            />
            <button
              onClick={handleCustomPromptSubmit}
              disabled={!customPrompt.trim() || disabled}
              className={`w-full mt-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                customPrompt.trim() && !disabled
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {disabled ? "Planning..." : "Start Building"}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={disabled}
              className="w-full px-2.5 py-1.5 text-xs text-gray-700 bg-white rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeTab === "clone" && (
        <div className="p-3 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Enter URL to clone</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setShowCloneOptions(validateUrl(e.target.value));
                }}
                disabled={disabled}
                placeholder="https://example.com"
                className="flex-1 px-2.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleCloneSubmit();
                  }
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Quick Clone</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CLONE_EXAMPLES.map((example) => (
                <button
                  key={example.url}
                  onClick={() => {
                    setUrl(example.url);
                    setShowCloneOptions(true);
                  }}
                  disabled={disabled}
                  className="p-2 text-center rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50/50 transition-all disabled:opacity-50"
                >
                  <span className="text-base block">{example.icon}</span>
                  <span className="text-[10px] text-gray-600">{example.name}</span>
                </button>
              ))}
            </div>
          </div>

          {showCloneOptions && (
            <div className="space-y-3 pt-2 border-t border-gray-100">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Style</label>
                <div className="grid grid-cols-2 gap-1">
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style.id)}
                      disabled={disabled}
                      className={`py-1.5 px-2 rounded text-[10px] font-medium border transition-all ${
                        selectedStyle === style.id
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">AI Model</label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs text-gray-700 bg-white rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Instructions (optional)</label>
                <input
                  type="text"
                  value={additionalInstructions}
                  onChange={(e) => setAdditionalInstructions(e.target.value)}
                  disabled={disabled}
                  className="w-full px-2.5 py-1.5 text-xs text-gray-700 bg-gray-50 rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400"
                  placeholder="e.g., make it more colorful..."
                />
              </div>

              <button
                onClick={handleCloneSubmit}
                disabled={!url.trim() || disabled}
                className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  url.trim() && !disabled
                    ? "bg-orange-500 hover:bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {disabled ? "Planning..." : "Clone Website"}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === "import" && (
        <div className="p-3 space-y-3">
          <div className="text-[11px] text-gray-500">
            Import an existing repo for brownfield planning. Make sure you're logged in with GitHub (top bar).
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Repository</label>
            <input
              type="text"
              value={repoFullName}
              onChange={(e) => setRepoFullName(e.target.value)}
              disabled={disabled}
              placeholder="owner/repo (or https://github.com/owner/repo)"
              className="w-full px-2.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400"
            />
            {!disabled && repoFullName.trim().length > 0 && !isValidRepoFullName(repoFullName) && (
              <div className="mt-1 text-[10px] text-red-600">Enter a valid GitHub repo like “owner/repo”.</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Branch</label>
              <input
                type="text"
                value={repoBranch}
                onChange={(e) => setRepoBranch(e.target.value)}
                disabled={disabled}
                placeholder="main"
                className="w-full px-2.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Max files</label>
              <input
                type="number"
                min={10}
                max={300}
                value={maxFiles}
                onChange={(e) => setMaxFiles(Number(e.target.value))}
                disabled={disabled}
                className="w-full px-2.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">What do you want to change? (optional)</label>
            <textarea
              value={importGoal}
              onChange={(e) => setImportGoal(e.target.value)}
              disabled={disabled}
              placeholder="e.g., Add a billing page, modernize the UI, fix navigation…"
              className="w-full px-2.5 py-2 text-xs text-gray-700 bg-gray-50 rounded-lg border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 placeholder:text-gray-400 resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleImportSubmit();
                }
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={disabled}
              className="w-full px-2.5 py-1.5 text-xs text-gray-700 bg-white rounded border border-gray-200 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              {models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleImportSubmit}
            disabled={disabled || !isValidRepoFullName(repoFullName)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all ${
              !disabled && isValidRepoFullName(repoFullName)
                ? "bg-orange-500 hover:bg-orange-600 text-white"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            {disabled ? "Importing..." : "Import & Create plan"}
          </button>
        </div>
      )}
    </div>
  );
}

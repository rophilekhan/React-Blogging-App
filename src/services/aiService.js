/**
 * AI Debate & Editorial Review Service
 * Simulates an intelligent devil's advocate AI agent that critically analyzes
 * article drafts, identifies blind spots, and engages in interactive debates.
 */

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TOPIC_ANALYZERS = [
  {
    regex: /\b(react|nextjs|vue|svelte|frontend|javascript|typescript|dom)\b/i,
    topic: "Frontend & Architecture",
    tone: "Performance & Systems Pragmatist",
    critique:
      "Your thesis leans heavily into modern frontend conventions. However, have you accounted for the runtime overhead of deep component tree reconciliation and client-side bundle hydration on low-tier mobile devices? Compile-time or server-first primitives might challenge this premise.",
    debateQuestion:
      "Is the developer ergonomic convenience of this abstraction genuinely worth the end-user computational and battery penalty?",
  },
  {
    regex: /\b(3d|three\.?js|webgl|webgpu|r3f|spatial|canvas|shader|graphics)\b/i,
    topic: "3D & Spatial Computing",
    tone: "Accessibility & Hardware Auditor",
    critique:
      "The spatial immersion is undeniably compelling. However, immersive 3D viewports frequently create severe thermal throttling and battery drain on mobile chipsets, while introducing severe accessibility barriers for screen readers and assistive navigation.",
    debateQuestion:
      "Does adding a spatial third dimension enhance the narrative density of the written word, or does it merely introduce visual cognitive friction?",
  },
  {
    regex: /\b(ai|artificial intelligence|llm|gpt|claude|machine learning|neural|agent)\b/i,
    topic: "Artificial Intelligence & Automation",
    tone: "Epistemological Skeptic",
    critique:
      "While generative intelligence promises unprecedented velocity, relying on statistical token prediction risks epistemic homogenization—flattening unique human prose into bland consensus-driven syntactical averages.",
    debateQuestion:
      "If artificial agents write, summarize, and synthesize our ideas, where does original human authorship end and derivative curation begin?",
  },
  {
    regex: /\b(crypto|web3|blockchain|decentralized|token|wallet|solana|bitcoin|ethereum)\b/i,
    topic: "Decentralized Networks",
    tone: "UX & Economic Realist",
    critique:
      "Decentralization offers sovereign data custody, yet the irreversible nature of key custody and transaction friction remains an insurmountable moat for 98% of casual readers. Centralized simplicity almost always beats architectural purity.",
    debateQuestion:
      "Can trustless infrastructure ever achieve mass consumer velocity without re-introducing custodial intermediaries?",
  },
  {
    regex: /\b(design|glassmorphism|ui|ux|typography|tailwind|minimalism|aesthetic)\b/i,
    topic: "Design Systems & Aesthetics",
    tone: "Visual Accessibility Critic",
    critique:
      "Translucent glassmorphism and subtle contrast gradients look stunning in curated mockups, but often fail WCAG AAA legibility in direct sunlight or for users with visual acuity impairments.",
    debateQuestion:
      "Are modern interface aesthetics prioritizing designer prestige over raw functional readability?",
  },
];

/**
 * Analyzes article draft content and returns a critical review with debate prompt.
 */
export const analyzeContent = async (text) => {
  // Simulate AI network inference delay (700ms - 1100ms)
  await delay(800);

  if (!text || text.trim().length < 20) {
    return {
      topic: "General Editorial",
      tone: "Inquisitive Editor",
      critique:
        "Your draft is still in its infancy. Add more depth, concrete examples, or technical claims so I can properly stress-test your premise.",
      debateQuestion: "What is the single most controversial thesis you want readers to take away from this piece?",
      rating: "Draft Stage",
    };
  }

  // Find matching topic
  const matched = TOPIC_ANALYZERS.find((analyzer) => analyzer.regex.test(text));

  if (matched) {
    return {
      topic: matched.topic,
      tone: matched.tone,
      critique: matched.critique,
      debateQuestion: matched.debateQuestion,
      rating: "High Engagement Potential",
    };
  }

  // Default thought-provoking critique
  return {
    topic: "Conceptual Inquiry",
    tone: "Socratic Inquisitor",
    critique:
      "Your argument assumes the reader already shares your foundational presuppositions. A skeptical opponent could argue that this perspective ignores systemic second-order consequences.",
    debateQuestion:
      "If the exact opposite of your core assertion were true, what unassailable evidence would prove you wrong?",
    rating: "Thought Provoking",
  };
};

/**
 * Generates an intelligent AI debate rebuttal based on the user's reply.
 */
export const replyToDebate = async (history, userReply) => {
  await delay(900);

  const replies = [
    `That is a compelling counterpoint. However, consider the edge case: under extreme operational constraints or adversarial conditions, doesn't that stance collapse back into the very problem you were trying to evade?`,
    `You make a valid pragmatic argument. But doesn't this perspective conflate short-term developer expediency with long-term architectural sustainability?`,
    `Fascinating defense. Yet historical precedent in technology demonstrates that when scalability pressures mount, the exact failure modes I highlighted inevitably manifest. How would your system gracefully degrade?`,
    `A sharp rebuttal! But if you examine the economic incentives of all stakeholders involved, who truly bears the risk if that assumption proves optimistic?`,
    `Touché. You've addressed the primary friction point. Now take it a step further: how would you articulate this defense directly to a skeptical reader in your opening paragraph?`,
  ];

  const randomReply = replies[Math.floor(Math.random() * replies.length)];
  return randomReply;
};

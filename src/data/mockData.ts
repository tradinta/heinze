export interface Article {
  id: string;
  title: string;
  category: 'AI' | 'Intelligence' | 'Philosophy' | 'General';
  publishedDate: string;
  readTime: string;
  description: string;
  content: string; // HTML or markdown-like content with structure
  summary: string; // Simulated AI summary
  tags: string[];
}

export interface Book {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  publishedDate: string;
  pages: number;
  pdfUrl: string;
  summary: string;
  tableOfContents: string[];
  mockPages: string[]; // Simulates a PDF's text pages for reading mode features
}

export const articlesData: Article[] = [
  {
    id: "ai-consciousness-barrier",
    title: "The Consciousness Barrier: Why Artificial Intelligence is Not Quite There",
    category: "AI",
    publishedDate: "2026-05-15",
    readTime: "8 min read",
    description: "An inquiry into the philosophical and neurological limitations of current transformer models, exploring the boundary between computed syntax and experienced semantics.",
    summary: "Current LLMs rely on complex syntactic probabilities rather than subjective awareness. While artificial agents can mimic semantic understanding, they lack subjective experience (qualia) and a unified locus of attention. Understanding this consciousness barrier is essential for framing safety and ethical models.",
    tags: ["Artificial Intelligence", "Cognitive Science", "Philosophy of Mind"],
    content: `
      <h2>The Semantics-Syntax Divide</h2>
      <p>Modern artificial intelligence has achieved feats that would have seemed miraculous a decade ago. We now have machines that can compose poetry, write functioning code, and diagnose complex medical cases. Yet, beneath these impressive calculations lies a fundamental philosophical question: does the machine actually *know* what it is talking about?</p>
      <p>This is the classic distinction between syntax (the rules for arranging symbols) and semantics (the meanings attached to those symbols). An AI model is, at its core, a highly advanced syntactic engine. It operates by predicting the most statistically probable next token based on billions of parameters. It processes symbols, but it does not experience the meaning of those symbols.</p>

      <h2>The Chinese Room Re-examined</h2>
      <p>Philosopher John Searle's famous "Chinese Room" thought experiment is more relevant today than ever. Imagine a person inside a locked room with a vast rulebook that tells them how to respond to Chinese characters. To someone outside the room, the responses are coherent and correct. It appears the person inside understands Chinese. Yet, the person is simply following mechanical rules without understanding a single word.</p>
      <p>Our current generative AI is the ultimate Chinese Room. The rulebook is the trained weight matrix, and the person inside is the inference engine. The output is indistinguishable from understanding, but the internal state is devoid of comprehension. True intelligence requires not just the manipulation of symbols, but the grounding of those symbols in a shared reality.</p>

      <h2>The Locus of Attention and Will</h2>
      <p>Another barrier to machine consciousness is the nature of attention. While transformer architectures utilize "self-attention mechanisms" to weight different words in a sentence, this is a purely mathematical operation. Human attention is driven by goals, survival needs, emotions, and a unified sense of self. It is directed outwards towards the world, filtered through an biological substrate that feels pain, pleasure, and desire.</p>
      <p>Without an embodied presence and a survival instinct, can an agent truly possess intent? Intentionality is the property of mental states to be directed towards or about things in the world. AI lacks this directedness. It responds when prompted, but it does not wonder, it does not desire, and it does not decide.</p>

      <h2>Conclusion: Coexistence, Not Replacement</h2>
      <p>As we build increasingly capable systems, we must resist the urge to anthropomorphize them. Conflating high syntactic performance with conscious intelligence leads to dangerous assumptions about their reliability, moral status, and agency. By recognizing the consciousness barrier, we can design AI as tools that augment human capabilities rather than rivals that replace human minds.</p>
    `
  },
  {
    id: "evolution-of-human-intelligence",
    title: "Evolutionary Friction: How Digital Convenience is Reshaping Human Intelligence",
    category: "Intelligence",
    publishedDate: "2026-04-28",
    readTime: "12 min read",
    description: "Analyzing the cognitive trade-offs of the smartphone era. What happens to our working memory, spatial orientation, and critical thinking when offloaded to external algorithms?",
    summary: "Offloading cognitive tasks to smartphones and search engines diminishes working memory capacity and spatial skills. However, it frees up mental bandwidth for higher-level abstract thinking. The challenge is preserving deep attention spans amidst continuous notification loops.",
    tags: ["Cognitive Science", "Human Evolution", "Technology Culture"],
    content: `
      <h2>The Cognitive Offloading Epidemic</h2>
      <p>Throughout history, humans have used tools to extend their physical and mental capacities. Writing saved us from memorizing epic poems; calculators freed us from long division. But today, the rate of cognitive offloading has accelerated exponentially. We no longer memorize phone numbers, navigate streets without GPS, or struggle to recall historical dates. We externalize our memory to the cloud.</p>
      <p>Psychologists call this "transactive memory." We treat the internet as a collective memory bank. While this allows us to access vast stores of information instantly, it alters the neural pathways of our brains. Studies show that when people expect to have future access to information, they have lower recall rates for the information itself, but higher recall for *where* to find it.</p>

      <h2>The Shallows of Deep Thought</h2>
      <p>Deep reading and contemplation require sustained, undivided attention. In contrast, the digital environment is designed to fragment attention. Infinite scroll, pop-up notifications, and hypertext links encourage rapid scanning rather than deep comprehension. We are training our brains to be highly efficient indexers of information, but poor synthesizers of knowledge.</p>
      <p>Neuroplasticity means our brains adapt to the environments we subject them to. If we spend hours daily in a state of hyper-distraction, our capacity for deep focus declines. The "friction" of having to search physical books, sit with boredom, and ponder difficult questions is not a bug of human intelligence; it is a feature that consolidates memory and fosters original insight.</p>

      <h2>Reclaiming Biological Edge</h2>
      <p>To preserve our cognitive depth, we must practice deliberate intellectual resistance. This does not mean abandoning technology, but rather establishing boundaries. Cognitive hygiene practices, such as device-free reading hours, active memory training, and analog writing exercises, can help maintain neural density in areas responsible for analytical thought.</p>
      <p>Ultimately, the intelligence of the future will not belong to those who can search the fastest, but to those who can synthesize information, sustain focus on complex problems, and think critically without algorithmic mediation.</p>
    `
  },
  {
    id: "epistemology-of-noise",
    title: "The Epistemology of Noise: Navigating a Post-Truth Information Sphere",
    category: "Philosophy",
    publishedDate: "2026-03-10",
    readTime: "10 min read",
    description: "An exploration of modern truth filters. How do we construct reliable worldviews when information is abundant but context is scarcer than ever?",
    summary: "Abundant information leads to contextual scarcity and polarization. To combat algorithmic filter bubbles, individuals must adopt epistemic humility, verify primary sources, and understand the difference between signal and noise.",
    tags: ["Epistemology", "Philosophy", "Information Theory"],
    content: `
      <h2>Information Abundance, Meaning Scarcity</h2>
      <p>We are drowning in information but starving for wisdom. The digitization of knowledge has democratized access to data, but it has also dismantled the traditional gatekeepers of truth. Without editors, scientists, and peer reviewers filtering the stream, the burden of epistemology—determining what is true—has shifted entirely to the individual reader.</p>
      <p>This shift has coincided with the rise of engagement-driven algorithms. Platforms prioritize content that triggers strong emotional reactions (outrage, fear, or validation) over nuanced, accurate reports. The result is a hyper-fragmented information sphere where objective reality is secondary to group identity.</p>

      <h2>The Architecture of Echo Chambers</h2>
      <p>We naturally seek out information that confirms our pre-existing beliefs. In the physical world, we are occasionally forced to encounter opposing viewpoints. In the digital world, however, algorithms curate our feeds to match our profiles, creating echo chambers that filter out dissenting perspectives. Over time, this makes us less capable of understanding complex, multi-sided issues.</p>
      <p>Truth is rarely simple or binary. It is complex, messy, and requires context. When complex issues are reduced to 280-character soundbites, the context is lost, and what remains is emotional noise. To navigate this landscape, we must learn to recognize the cognitive biases that make us vulnerable to manipulation.</p>

      <h2>Epistemic Hygiene for the Modern Mind</h2>
      <p>How do we build a robust epistemic filter? First, we must cultivate intellectual humility—the willingness to admit that we might be wrong. Second, we must actively seek out high-quality sources that challenge our views. Third, we must distinguish between assertion and evidence.</p>
      <p>By slowing down our consumption, reading long-form articles, and verifying primary sources before sharing, we can transform ourselves from passive consumers of noise into active seekers of signal.</p>
    `
  },
  {
    id: "future-of-general-education",
    title: "Reframing Education in the Age of Co-Pilots and Generators",
    category: "General",
    publishedDate: "2026-02-18",
    readTime: "9 min read",
    description: "Traditional education systems test memorization and basic composition—tasks now done instantly by AI. We must redefine pedagogy to focus on critical analysis, synthesis, and asking the right questions.",
    summary: "As AI tools handle basic composition and factual recall, education must shift from testing answers to testing queries, evaluation strategies, and multi-disciplinary synthesis. The human role moves from creator of standard drafts to editor, critic, and architect.",
    tags: ["Education", "Artificial Intelligence", "Pedagogical Theory"],
    content: `
      <h2>The Obsolescence of the Five-Paragraph Essay</h2>
      <p>For generations, the cornerstone of humanities education has been the five-paragraph essay. Students are taught to state a thesis, list three supporting points, and write a summary. Today, any basic LLM can generate a passing essay on any standard topic in under five seconds. The traditional homework assignment has been fundamentally disrupted.</p>
      <p>Rather than banning these tools, educators must recognize that the baseline of writing has changed. If a machine can write it, maybe humans shouldn't spend their training years copying it. We must move up the cognitive pyramid. The focus must shift from basic drafting to critical critique, structural design, and original synthesis.</p>

      <h2>From Answering to Querying</h2>
      <p>In the past, intelligence was often measured by how many answers you could recall. In the future, intelligence will be measured by the quality of your questions. Prompt engineering is a primitive term for what is actually a sophisticated cognitive skill: the ability to frame a problem, decompose it, and guide a helper system to a high-quality solution.</p>
      <p>Students must be taught how to interrogate AI systems, spot hallucinations, verify claims, and combine outputs from different domains. The educator's role is no longer to be the 'sage on the stage' delivering facts, but the 'guide on the side' teaching students how to critically evaluate information.</p>

      <h2>The Power of Interdisciplinary Thinking</h2>
      <p>AI models are excellent at specialized tasks and general summarization, but they struggle with authentic interdisciplinary integration. The most innovative breakthroughs happen at the intersections of fields—where biology meets computing, or philosophy meets design. Educating students in broad, multi-disciplinary fields will give them the creative flexibility that machines cannot easily replicate.</p>
      <p>By nurturing curiosity, philosophical inquiry, and emotional intelligence, we can prepare the next generation to cooperate with smart systems rather than be replaced by them.</p>
    `
  }
];

export const booksData: Book[] = [
  {
    id: "algorithmic-mind",
    title: "The Algorithmic Mind: Intelligence in the Age of Silicon",
    description: "An extensive exploration of human and artificial cognition. Robert Heinze traces the history of thinking machines and projects the next fifty years of human-machine symbiosis.",
    coverImage: "/covers/algorithmic_mind.png", // Will generate placeholder cover or render gracefully
    publishedDate: "2025-11-12",
    pages: 312,
    pdfUrl: "/pdfs/algorithmic_mind.pdf",
    summary: "This book dissects the mechanics of both biological and silicon-based systems. It covers the history of neural networks, the nature of consciousness, neural implants, and the socio-economic implications of AGI. It offers a framework for retaining human agency in an automated world.",
    tableOfContents: [
      "Introduction: The Architecture of Thought",
      "Chapter 1: The Biological Machine",
      "Chapter 2: The Silicon Mirror",
      "Chapter 3: The Language Trap",
      "Chapter 4: The Convergence",
      "Chapter 5: Autonomy and Free Will in Code",
      "Chapter 6: Post-Human Epistemology"
    ],
    mockPages: [
      "Title Page: The Algorithmic Mind. By Robert Heinze. A treatise on silicon intelligence and human cognition.",
      "Introduction: The Architecture of Thought. Throughout our evolutionary journey, we have defined ourselves by our capacity to reason. Now, we confront an intelligence of our own creation. What happens when the mirror begins to reflect something deeper than we intended? This chapter sets the stage for comparing biological brains to artificial neural grids.",
      "Chapter 1: The Biological Machine. The human brain is a marvel of evolutionary efficiency, running on roughly 20 watts of power. In this chapter, we outline the wetware constraints—synaptic latency, metabolic limits, and neurotransmitter balance—that both limit and shape our intelligence, comparing them to the raw compute power of modern server farms.",
      "Chapter 2: The Silicon Mirror. Silicon chips manipulate electrons near the speed of light. Yet, they lack the chemical density of biological cells. Here, we delve into the physics of computing and how backpropagation works to create an approximation of learning. Is it a mirror that reflects us, or a window into a new kind of mind?",
      "Chapter 3: The Language Trap. Language is our primary medium for transfer of knowledge. It is also the playground of generative models. We explore how transformers exploit grammatical structure to mimic logic, and why this syntax-level manipulation does not equate to semantic representation or deep comprehension.",
      "Chapter 4: The Convergence. When we combine high-bandwidth brain-computer interfaces with massive language models, the border between individual memory and global database begins to blur. We examine early experiments in neural linkups and the profound psychological changes they portend.",
      "Chapter 5: Autonomy and Free Will in Code. If our choices can be predicted with 99% accuracy by predictive models, does free will exist in any meaningful sense? We analyze the philosophical implications of algorithmic determinism on law, morality, and individual agency.",
      "Chapter 6: Post-Human Epistemology. How do we trust knowledge when it is produced, validated, and applied entirely by non-human systems? We outline a new set of epistemic tools designed to help future humans maintain intellectual grounding in an automated world."
    ]
  },
  {
    id: "silent-epiphanies",
    title: "Silent Epiphanies: Essays on Solitude and Focus",
    description: "A counter-weight to the hyper-connected world. Heinze shares his reflections on silence, attention, and the intellectual growth that occurs when we disconnect.",
    coverImage: "/covers/silent_epiphanies.png",
    publishedDate: "2024-06-05",
    pages: 184,
    pdfUrl: "/pdfs/silent_epiphanies.pdf",
    summary: "A collection of 15 essays advocating for intellectual isolation as a driver of creative and analytical breakthrough. Drawing on the habits of history's greatest thinkers, Heinze outlines practical rules for focus and digital detox.",
    tableOfContents: [
      "Preface: The Noise of the Modern World",
      "Chapter 1: The Solitary Workspace",
      "Chapter 2: Boredom as a Catalyst",
      "Chapter 3: The Art of Slow Reading",
      "Chapter 4: The Digital Sabbath",
      "Chapter 5: Deep Memory Preservation"
    ],
    mockPages: [
      "Title Page: Silent Epiphanies. Essays on Solitude and Focus by Robert Heinze.",
      "Preface: The Noise of the Modern World. We are bombarded by signals from the moment we wake. This text explores the cost of continuous connection and the rare beauty of uninterrupted silence.",
      "Chapter 1: The Solitary Workspace. Historical figures from Kant to Darwin established strict physical boundaries to protect their concentration. We dissect how the ergonomics of isolation fosters deep logical pipelines that are impossible to sustain in active social or digital environments.",
      "Chapter 2: Boredom as a Catalyst. When we fill every quiet moment with a screen, we kill the incubator of original thoughts. Boredom is the mind's way of signaling that it is ready to explore internal landscapes. Without it, our intellectual output remains shallow and derivative.",
      "Chapter 3: The Art of Slow Reading. Reading a text slowly is an act of collaboration with the author. We discuss cognitive studies showing that slow, printed-page reading engages regions of the brain associated with emotional empathy and critical analysis far more than rapid digital skimming.",
      "Chapter 4: The Digital Sabbath. A practical guide to disconnecting for 24 hours every week. We detail the chemical resetting of the dopamine receptors that occurs when we remove algorithmic stimuli, and the subsequent rise in clarity and emotional stability.",
      "Chapter 5: Deep Memory Preservation. Offloading our memories to search engines degrades our brain's hippocampus. We present memory exercise techniques designed to maintain biological recall and preserve the integrity of our personal narrative in an era of digital amnesia."
    ]
  }
];

export const analyticsData = {
  viewsByMonth: [
    { name: "Dec", articles: 4200, downloads: 850 },
    { name: "Jan", articles: 5100, downloads: 920 },
    { name: "Feb", articles: 4800, downloads: 1100 },
    { name: "Mar", articles: 6200, downloads: 1300 },
    { name: "Apr", articles: 7500, downloads: 1550 },
    { name: "May", articles: 8900, downloads: 1820 }
  ],
  categoryViews: [
    { name: "AI", value: 45 },
    { name: "Intelligence", value: 25 },
    { name: "Philosophy", value: 20 },
    { name: "General", value: 10 }
  ],
  readingStats: {
    totalSessions: 14230,
    avgFocusTime: "14m 32s",
    textToSpeechListens: 2840,
    activeSubscribers: 1240,
    mostSharedQuote: "The friction of having to search physical books is a feature, not a bug."
  },
  bookDownloads: [
    { name: "The Algorithmic Mind", downloads: 4120, rating: 4.8 },
    { name: "Silent Epiphanies", downloads: 2840, rating: 4.9 }
  ],
  geographicViews: [
    { name: "United States", value: 35 },
    { name: "Germany", value: 25 },
    { name: "United Kingdom", value: 15 },
    { name: "Canada", value: 10 },
    { name: "Others", value: 15 }
  ]
};

export const subscribersList = [
  { id: "1", email: "maria@domain.com", joinedDate: "2026-05-28" },
  { id: "2", email: "johndoe@gmail.com", joinedDate: "2026-05-25" },
  { id: "3", email: "heinrich@university.edu", joinedDate: "2026-05-18" },
];

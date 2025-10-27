import { useAuth } from "@/shared/hooks/useAuth";
import Image from "next/image";

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  return (
    <main id="main" className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Skip link for accessibility */}
      <a href="#content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-black focus:px-3 focus:py-2 focus:text-white">Skip to content</a>
      
      {/* Top Navigation */}
      <header className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-gray-200/30 dark:border-gray-700/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl text-gray-900 dark:text-white shadow-xl transition-all duration-300 hover:shadow-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-lg">
              E
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">EYE</span>
          </div>

          {/* Main Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <NavLink href="/projects" label="Projects" />
            <NavLink href="/datasets" label="Datasets" />
            <NavLink href="/jobs" label="Jobs" />
            <NavLink href="/models" label="Models" />
            <NavLink href="/inference" label="Inference" />
            <NavLink href="/eye-ai" label="EYE AI" />
            <NavLink href="/memory" label="Memory" isActive />
            <NavLink href="/training" label="Training" />
            <NavLink href="/annotation" label="Annotation" />
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Secondary Links */}
            <div className="hidden md:flex items-center space-x-1">
              <SecondaryLink href="/docs" label="Docs" />
              <SecondaryLink href="/community" label="Community" />
            </div>
            
            {/* GitHub Link */}
            <a 
              href="https://github.com/anuragatulya/EYE" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>GitHub</span>
            </a>

            {/* Auth Button */}
            {!isAuthenticated ? (
              <a 
                href="/login" 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Login
              </a>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-white text-sm font-semibold">
                  A
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Anurag</span>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button className="lg:hidden p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section aria-labelledby="hero-heading" className="px-6 pt-32 pb-20 sm:px-10 md:px-16 lg:px-24">
        <div id="content" className="mx-auto max-w-6xl">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400">Memory preservation platform</p>
            <h1 id="hero-heading" className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl text-gray-900 dark:text-white">
              Preserve memories. Have intelligent conversations.
            </h1>
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              EYE is an open-source platform that preserves your photos and videos as memories, enabling intelligent conversations with your personal history through AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a aria-label="Start preserving memories" href="/eye-ai" className="rounded border border-gray-900 dark:border-white bg-gray-900 dark:bg-white px-4 py-2 text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-500 dark:focus-visible:outline-white motion-reduce:transition-none">Start Preserving Memories</a>
              <a aria-label="View on GitHub" href="https://github.com/anuragatulya/EYE" target="_blank" rel="noopener noreferrer" className="rounded border border-gray-300 dark:border-gray-600 bg-transparent px-4 py-2 text-gray-900 dark:text-white transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-500 dark:focus-visible:outline-white motion-reduce:transition-none">View on GitHub</a>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs text-gray-600 dark:text-gray-400">
              <div>Open Source</div>
              <div>AI-Powered</div>
              <div>Privacy-First</div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" aria-labelledby="features-heading" className="px-6 py-16 sm:px-10 md:px-16 lg:px-24 bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-6xl">
          <h2 id="features-heading" className="text-2xl font-semibold tracking-tight text-center text-gray-900 dark:text-white">How EYE Preserves Your Memories</h2>
          <p className="mt-4 text-center text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
            EYE transforms your photos and videos into intelligent memories that you can converse with, preserving the stories behind every moment.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard 
              icon="📸" 
              title="Memory Ingestion" 
              desc="Upload photos and videos to create your personal memory vault." 
              bullets={["Drag & drop upload", "Batch processing", "Automatic metadata extraction"]} 
            />
            <FeatureCard 
              icon="🧠" 
              title="AI Understanding" 
              desc="EYE AI analyzes your memories to understand context, people, places, and emotions." 
              bullets={["Visual recognition", "Scene understanding", "Emotional context"]} 
            />
            <FeatureCard 
              icon="💬" 
              title="Intelligent Conversations" 
              desc="Have natural conversations with your memories through our AI interface." 
              bullets={["Ask questions", "Get insights", "Relive moments"]} 
            />
            <FeatureCard 
              icon="🔍" 
              title="Smart Search" 
              desc="Find specific memories instantly using natural language queries." 
              bullets={["Semantic search", "Time-based filtering", "Person recognition"]} 
            />
            <FeatureCard 
              icon="🛡️" 
              title="Privacy Protection" 
              desc="Your memories stay private with local processing and encryption." 
              bullets={["Local AI processing", "End-to-end encryption", "No cloud dependency"]} 
            />
            <FeatureCard 
              icon="🔧" 
              title="Open Source" 
              desc="Built by the community, for the community. Contribute and customize." 
              bullets={["MIT License", "Community driven", "Extensible architecture"]} 
            />
          </div>
        </div>
      </section>

      {/* EYE AI Showcase */}
      <section aria-labelledby="eye-ai-showcase" className="px-6 py-16 sm:px-10 md:px-16 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 id="eye-ai-showcase" className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">EYE AI: Your Memory Companion</h2>
              <p className="mt-4 text-gray-700 dark:text-gray-300">
                Powered by advanced multimodal AI models, EYE AI understands both your images and text, enabling rich conversations about your memories.
              </p>
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white dark:text-gray-900 text-xs">✓</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Vision Analysis</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Describe scenes, identify objects, and understand context in your photos</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white dark:text-gray-900 text-xs">✓</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Conversational Interface</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Ask questions, get insights, and have natural conversations about your memories</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white dark:text-gray-900 text-xs">✓</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">GPU Acceleration</div>
                    <div className="text-sm text-gray-700 dark:text-gray-300">Fast processing with local GPU support for real-time interactions</div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <a href="/eye-ai" className="rounded border border-gray-900 dark:border-white bg-gray-900 dark:bg-white px-4 py-2 text-white dark:text-gray-900 transition-colors hover:bg-gray-800 dark:hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gray-500 dark:focus-visible:outline-white motion-reduce:transition-none">Try EYE AI →</a>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-6 text-white">
              <div className="text-sm text-gray-400 mb-4">Example Conversation</div>
              <div className="space-y-3">
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-300 mb-1">You:</div>
                  <div>"What's happening in this photo from last summer?"</div>
                </div>
                <div className="bg-blue-600 rounded-lg p-3">
                  <div className="text-sm text-blue-200 mb-1">EYE AI:</div>
                  <div>"This photo shows a beach scene with people enjoying a sunny day. I can see sand, waves, and what appears to be a family gathering. The lighting suggests it was taken in the late afternoon."</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3">
                  <div className="text-sm text-gray-300 mb-1">You:</div>
                  <div>"Who are the people in the photo?"</div>
                </div>
                <div className="bg-blue-600 rounded-lg p-3">
                  <div className="text-sm text-blue-200 mb-1">EYE AI:</div>
                  <div>"I can see several people in the photo, but I'd need more context to identify them specifically. Would you like to tell me who they are so I can remember for future conversations?"</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Community */}
      <section aria-labelledby="community" className="px-6 py-16 sm:px-10 md:px-16 lg:px-24 bg-black text-white">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 id="community" className="text-2xl font-semibold tracking-tight">Join the Open Source Community</h2>
            <p className="mt-4 text-white/70 max-w-2xl mx-auto">
              EYE is built by developers, for developers. Contribute to the future of memory preservation technology.
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Contribute</h3>
              <p className="text-white/70 text-sm">Help build features, fix bugs, and improve the platform for everyone.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Innovate</h3>
              <p className="text-white/70 text-sm">Propose new ideas and help shape the future of memory preservation.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Collaborate</h3>
              <p className="text-white/70 text-sm">Join discussions, share knowledge, and build together.</p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <a href="https://github.com/anuragatulya/EYE" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded border border-white px-6 py-3 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-white motion-reduce:transition-none">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section aria-labelledby="getting-started" className="px-6 py-16 sm:px-10 md:px-16 lg:px-24">
        <div className="mx-auto max-w-6xl">
          <h2 id="getting-started" className="text-2xl font-semibold tracking-tight text-center">Get Started in Minutes</h2>
          <p className="mt-4 text-center text-black/70 max-w-2xl mx-auto">
            EYE runs locally on your machine, ensuring your memories stay private while providing powerful AI capabilities.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <StepCard 
              number={1} 
              title="Clone & Setup" 
              body="Clone the repository and start the system with Docker Compose." 
              helper="git clone && docker-compose up" 
            />
            <StepCard 
              number={2} 
              title="Upload Memories" 
              body="Add your photos and videos to start building your memory vault." 
              helper="Drag & drop or batch upload" 
            />
            <StepCard 
              number={3} 
              title="Start Conversations" 
              body="Begin having intelligent conversations with your memories through EYE AI." 
              helper="Ask questions, get insights" 
            />
          </div>
          <div className="mt-12 text-center">
            <a href="https://github.com/anuragatulya/EYE" target="_blank" rel="noopener noreferrer" className="rounded border border-black bg-black px-6 py-3 text-white transition-colors hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-black motion-reduce:transition-none">Get Started →</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-black py-10 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 sm:px-10 md:px-16 lg:px-24 md:grid-cols-2">
          <div>
            <div className="font-semibold">EYE — Memory Preservation Platform</div>
            <div className="mt-2 text-sm text-white/70">Preserve memories. Have intelligent conversations.</div>
            <div className="mt-2 text-xs text-white/60">Author: Anurag Atulya — EYE for Humanity</div>
            <div className="mt-1 text-xs text-white/50">EYE for Humanity — I love machines, AI, humans, coffee, leaf. 8 is my north star.</div>
          </div>
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <div className="font-medium">Build</div>
              <ul className="mt-2 space-y-1 text-white/80">
                <li><a className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80" href="/docs">Docs</a></li>
                <li><a className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80" href="/api">API Reference</a></li>
                <li><a className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80" href="/community">Community</a></li>
              </ul>
            </div>
            <div>
              <div className="font-medium">Legal</div>
              <ul className="mt-2 space-y-1 text-white/80">
                <li><a className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80" href="/privacy">Privacy</a></li>
                <li><a className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80" href="/terms">Terms</a></li>
                <li><a className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/80" href="https://github.com/anuragatulya/EYE/blob/main/LICENSE">MIT License</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-6xl px-6 sm:px-10 md:px-16 lg:px-24 text-xs text-white/70">© 2025 EYE. All rights reserved.</div>
      </footer>
    </main>
  );
}

function FeatureCard({ icon, title, desc, bullets }: { icon: string; title: string; desc: string; bullets: string[] }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 transition-colors hover:border-gray-400 dark:hover:border-gray-500 focus-within:outline focus-within:outline-2 focus-within:outline-gray-500 dark:focus-within:outline-white motion-reduce:transition-none">
      <div className="text-3xl mb-3">{icon}</div>
      <div className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{title}</div>
      <div className="text-sm text-gray-700 dark:text-gray-300 mb-4">{desc}</div>
      <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2">
            <span className="w-1 h-1 bg-gray-900 dark:bg-white rounded-full"></span>
            {bullet}
          </li>
        ))}
      </ul>
    </div>
  );
}

function StepCard({ number, title, body, helper }: { number: number; title: string; body: string; helper: string }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold">{number}</div>
        <div className="font-semibold text-gray-900 dark:text-white">{title}</div>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{body}</p>
      <p className="text-xs text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded">{helper}</p>
    </div>
  );
}

function NavLink({ href, label, isActive = false }: { href: string; label: string; isActive?: boolean }) {
  return (
    <a
      href={href}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      {label}
    </a>
  );
}

function SecondaryLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
    >
      {label}
    </a>
  );
}
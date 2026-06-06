"use client";
import { useEffect, useRef, useState, FormEvent } from "react";

// ═══════ HOOKS ═══════

// ═══════ HOOKS ═══════

function useNavScroll() {
  useEffect(() => {
    const nav = document.getElementById("nav");
    if (!nav) return;
    const fn = () => nav.classList.toggle("scrolled", window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
}

function useReveal(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("vis");
          e.target.querySelectorAll(".wi").forEach(child => child.classList.add("vis"));
        }
      }),
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    el.querySelectorAll(".rv, .wr").forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);
}

function useSpotlightTilt(ref: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(".p-card");
    cards.forEach((card) => {
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) scale(1.005)`;
      };
      const onLeave = () => { card.style.transform = ""; };
      card.addEventListener("mousemove", onMove, { passive: true });
      card.addEventListener("mouseleave", onLeave);
    });
  }, []);
}

// ═══════ COMPONENTS ═══════

function HeroMarqueeBackground() {
  const cols = Array.from({ length: 8 });
  const baseImages = [
    '/projects/crypto_dark_1780659960854.png',
    '/projects/ecommerce_dark_1780659989939.png',
    '/projects/portfolio_dark_1780659976580.png',
    '/projects/saas_dark_1780659947275.png'
  ];
  const sequence = [...baseImages, ...baseImages]; // 8 images long

  return (
    <div className="hero-mq-wrapper">
      <div id="hero-mq-grid" className="hero-mq-grid">
        {cols.map((_, i) => (
          <div key={i} className={`hero-mq-col ${i % 2 === 0 ? 'even-col' : 'odd-col'}`}>
            <div className="mq-track-inner">
              {sequence.map((src, j) => (
                <div key={`a-${j}`} className="snap-card">
                  <img src={src} className="snap-img" alt="Project snapshot" />
                </div>
              ))}
            </div>
            <div className="mq-track-inner">
              {sequence.map((src, j) => (
                <div key={`b-${j}`} className="snap-card">
                  <img src={src} className="snap-img" alt="Project snapshot" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="hero-glass-overlay" />
    </div>
  );
}

function MagBtn({ href, children, className = "", type, style }: {
  href?: string; children: React.ReactNode; className?: string; type?: "submit"; style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLAnchorElement & HTMLButtonElement>(null);
  useEffect(() => {
    const btn = ref.current;
    if (!btn) return;
    let f = 0;
    const onM = (e: MouseEvent) => {
      const r = btn.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) * 0.2;
      const dy = (e.clientY - r.top - r.height / 2) * 0.2;
      cancelAnimationFrame(f);
      f = requestAnimationFrame(() => { btn.style.transform = `translate(${dx}px,${dy}px)`; });
    };
    const onL = () => { cancelAnimationFrame(f); btn.style.transform = ""; };
    btn.addEventListener("mousemove", onM, { passive: true });
    btn.addEventListener("mouseleave", onL);
    return () => { btn.removeEventListener("mousemove", onM); btn.removeEventListener("mouseleave", onL); };
  }, []);

  if (type === "submit") {
    return <button ref={ref} type="submit" className={`btn ${className}`} style={style}>{children}</button>;
  }
  return <a ref={ref} href={href} className={`btn ${className}`} style={style} target={href?.startsWith("http") ? "_blank" : undefined} rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}>{children}</a>;
}

function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return <>
    {words.map((w, i) => (
      <span key={i} className="wr">
        <span className="wi" style={{ transitionDelay: `${delay + i * 0.05}s` }}>{w}</span>
        {i < words.length - 1 ? "\u00A0" : ""}
      </span>
    ))}
  </>;
}

const skills = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "Go",
  "AWS", "Docker", "Kubernetes", "PostgreSQL", "MongoDB", "Redis",
  "GraphQL", "CI/CD", "Terraform", "System Design", "REST APIs", "Microservices",
];

function Marquee() {
  return (
    <div className="mq-wrap">
      <div className="mq-track">
        {[...skills, ...skills].map((s, i) => (
          <span key={i} className="mq-item">{s}</span>
        ))}
      </div>
    </div>
  );
}

// ═══════ DATA ═══════

const projects = [
  {
    tag: "Full Stack · AI",
    title: "Auto Apply",
    desc: "AI-powered job follow-up automation. Upload a job posting screenshot — AI extracts details, writes a tailored email, sends it at the optimal time in the right timezone.",
    stack: ["Next.js", "TypeScript", "GPT-4", "Gemini", "Chrome Ext", "SMTP"],
    size: "c7", link: "/dashboard",
  },
  {
    tag: "E-Commerce",
    title: "Swago Jr.",
    desc: "Full-stack e-commerce with admin panel, Razorpay payments, real-time inventory, and masterclass booking.",
    stack: ["Next.js", "Supabase", "Razorpay", "Framer Motion"],
    size: "c5",
  },
  {
    tag: "DevOps",
    title: "Infra Toolkit",
    desc: "Containerized microservices pipeline with automated scaling, health checks, and zero-downtime deployments.",
    stack: ["Docker", "Kubernetes", "Terraform", "GitHub Actions", "AWS"],
    size: "c5",
  },
  {
    tag: "Open Source",
    title: "Dev Utilities",
    desc: "CLI tools and VS Code extensions for workflow automation — scaffolding, migration helpers, and code generators.",
    stack: ["Go", "Node.js", "Python", "VS Code API"],
    size: "c7",
  },
];

const timeline = [
  { date: "2024 — Present", role: "Senior Software Engineer", co: "", desc: "Leading frontend architecture and full-stack delivery. Scalable UI systems, mentoring, and CI/CD improvements." },
  { date: "2022 — 2024", role: "Full Stack Developer", co: "", desc: "Shipped production features across React/Next.js frontends and Node.js backends. End-to-end ownership." },
  { date: "2021 — 2022", role: "Frontend Engineer", co: "", desc: "Built responsive, accessible web apps with React. Performance optimization and design system development." },
];

// ═══════════════════════════════
//  PORTFOLIO
// ═══════════════════════════════

export default function Portfolio() {
  const heroRef = useRef<HTMLElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const projRef = useRef<HTMLElement>(null);
  const expRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  const [formStatus, setFormStatus] = useState<"idle" | "sent">("idle");

  useNavScroll();
  useReveal(heroRef);
  useReveal(aboutRef);
  useReveal(projRef);
  useReveal(expRef);
  useReveal(contactRef);
  useSpotlightTilt(projRef);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormStatus("sent");
    setTimeout(() => setFormStatus("idle"), 3000);
  };

  return (
    <>
      {/* NAV */}
      <nav id="nav" className="nav">
        <div className="wrap nav-inner">
          <a href="#" className="nav-name">gokul<span>.</span>dev</a>
          <div className="nav-right">
            <a href="#about" className="nav-link">About</a>
            <a href="#work" className="nav-link">Work</a>
            <a href="#exp" className="nav-link">Experience</a>
            <MagBtn href="#contact" className="btn-fill" >Let&apos;s Talk</MagBtn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <HeroMarqueeBackground />
        <div className="hero-content">
          <div className="rv hero-badge">
            <span className="hero-dot" />
            Available for opportunities
          </div>
          <h1>
            <SplitText text="I design & build" delay={0.1} />
            <br />
            <span className="wr"><span className="wi blue" style={{ transitionDelay: "0.4s" }}>digital</span></span>
            {"\u00A0"}
            <SplitText text="experiences" delay={0.46} />
          </h1>
          <p className="rv d2 hero-sub">
            Full Stack Engineer with 4+ years crafting performant web applications,
            scalable systems, and interfaces that people actually enjoy using.
          </p>
          <div className="rv d3 hero-btns">
            <MagBtn href="#work" className="btn-fill btn-lg">View Projects →</MagBtn>
            <MagBtn href="https://github.com/janagokul6" className="btn-ghost btn-lg">GitHub ↗</MagBtn>
          </div>
        </div>
        <div className="scroll-cue">
          <span>Scroll</span>
          <div className="scroll-bar-anim" />
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section" ref={aboutRef}>
        <div className="wrap">
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">About</p>
            <h2 className="rv d1 s-title">A bit about me</h2>
          </div>
          <div className="about-grid">
            <div>
              <div className="rv d2 about-text">
                <p>
                  I&apos;m a software engineer who thrives at the intersection of
                  <strong> design and engineering</strong>. Frontend is where I come alive —
                  there&apos;s something deeply satisfying about making complex systems
                  feel effortless.
                </p>
                <p>
                  Over the past 4+ years, I&apos;ve built production apps with
                  <strong> React, Next.js, Node.js</strong>, and various cloud platforms.
                  I care about the details: smooth interactions, clean architecture,
                  systems that scale, and deploys that don&apos;t break at 2 AM.
                </p>
                <p>
                  Outside of work, I build side projects that automate tedious
                  things — because life&apos;s too short for manual follow-up emails.
                </p>
              </div>
              <div className="rv d3 about-stats">
                <div className="a-stat">
                  <div className="a-stat-val">4+</div>
                  <div className="a-stat-lbl">Years exp</div>
                </div>
                <div className="a-stat">
                  <div className="a-stat-val">20+</div>
                  <div className="a-stat-lbl">Projects</div>
                </div>
                <div className="a-stat">
                  <div className="a-stat-val">Full</div>
                  <div className="a-stat-lbl">Stack</div>
                </div>
              </div>
            </div>
            <div className="rv d4">
              <div className="avatar-ring">
                <div className="avatar-inner">GJ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* PROJECTS */}
      <section id="work" className="section" ref={projRef} style={{ background: "var(--bg2)" }}>
        <div className="wrap">
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">Selected Work</p>
            <h2 className="rv d1 s-title">Things I&apos;ve built</h2>
            <p className="rv d2 s-sub">Professional work and passion projects — each one pushed me further.</p>
          </div>
          <div className="rv d3 bento">
            {projects.map((p, i) => (
              <div key={i} className={`p-card ${p.size}`}>
                <span className="p-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="p-stack">
                  {p.stack.map((t) => <span key={t}>{t}</span>)}
                </div>
                {p.link && (
                  <a href={p.link} className="p-link">View Live →</a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="exp" className="section" ref={expRef}>
        <div className="wrap" style={{ maxWidth: 700 }}>
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">Experience</p>
            <h2 className="rv d1 s-title">Where I&apos;ve worked</h2>
          </div>
          <div className="timeline">
            {timeline.map((t, i) => (
              <div key={i} className={`rv d${i + 1} tl-item`}>
                <div className="tl-date">{t.date}</div>
                <h3>{t.role}</h3>
                {t.co && <span className="tl-co">{t.co}</span>}
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="section" ref={contactRef} style={{ background: "var(--bg2)" }}>
        <div className="wrap">
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">Connect</p>
            <h2 className="rv d1 s-title">Let&apos;s work together</h2>
            <p className="rv d2 s-sub">Got a project, a question, or just want to say hi? I&apos;m all ears.</p>
          </div>
          <div className="rv d3 contact-grid">
            <form className="contact-form" onSubmit={handleSubmit}>
              <input className="form-field" placeholder="Name" required />
              <input className="form-field" type="email" placeholder="Email" required />
              <textarea className="form-field" placeholder="Your message..." required />
              <MagBtn type="submit" className="btn-fill btn-lg" style={{ alignSelf: "flex-start" } as React.CSSProperties}>
                {formStatus === "sent" ? "✓ Message Sent!" : "Send Message →"}
              </MagBtn>
            </form>
            <div>
              <p className="rv" style={{ color: "var(--gray)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
                Open to full-time roles, freelance projects, and interesting collaborations.
                Feel free to reach out through any channel.
              </p>
              <div className="social-links">
                <a href="https://github.com/janagokul6" target="_blank" rel="noopener noreferrer" className="social-link">GitHub ↗</a>
                <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer" className="social-link">LinkedIn ↗</a>
                <a href="mailto:gokuljanarthanan@gmail.com" className="social-link">Email ↗</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p className="footer-note">
          Designed & built by Gokul Janarthanan · © {new Date().getFullYear()}
        </p>
      </footer>
    </>
  );
}
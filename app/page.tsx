"use client";
import { useEffect, useRef, useState, FormEvent } from "react";

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
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("vis");
            e.target.querySelectorAll(".wi").forEach((child) =>
              child.classList.add("vis")
            );
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
      const onLeave = () => {
        card.style.transform = "";
      };
      card.addEventListener("mousemove", onMove, { passive: true });
      card.addEventListener("mouseleave", onLeave);
    });
  }, []);
}

// ═══════ COMPONENTS ═══════

function HeroMarqueeBackground() {
  const cols = Array.from({ length: 8 });
  const baseImages = [
    "/projects/crypto_dark_1780659960854.png",
    "/projects/ecommerce_dark_1780659989939.png",
    "/projects/portfolio_dark_1780659976580.png",
    "/projects/saas_dark_1780659947275.png",
  ];
  const sequence = [...baseImages, ...baseImages];

  return (
    <div className="hero-mq-wrapper">
      <div id="hero-mq-grid" className="hero-mq-grid">
        {cols.map((_, i) => (
          <div
            key={i}
            className={`hero-mq-col ${i % 2 === 0 ? "even-col" : "odd-col"}`}
          >
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

function MagBtn({
  href,
  children,
  className = "",
  type,
  style,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  type?: "submit";
  style?: React.CSSProperties;
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
      f = requestAnimationFrame(() => {
        btn.style.transform = `translate(${dx}px,${dy}px)`;
      });
    };
    const onL = () => {
      cancelAnimationFrame(f);
      btn.style.transform = "";
    };
    btn.addEventListener("mousemove", onM, { passive: true });
    btn.addEventListener("mouseleave", onL);
    return () => {
      btn.removeEventListener("mousemove", onM);
      btn.removeEventListener("mouseleave", onL);
    };
  }, []);

  if (type === "submit") {
    return (
      <button ref={ref} type="submit" className={`btn ${className}`} style={style}>
        {children}
      </button>
    );
  }
  return (
    <a
      ref={ref}
      href={href}
      className={`btn ${className}`}
      style={style}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
    >
      {children}
    </a>
  );
}

function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <>
      {words.map((w, i) => (
        <span key={i} className="wr">
          <span className="wi" style={{ transitionDelay: `${delay + i * 0.05}s` }}>
            {w}
          </span>
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </>
  );
}

const skills = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "Python",
  "MongoDB",
  "PostgreSQL",
  "AWS",
  "Docker",
  "Redis",
  "Tailwind CSS",
  "GraphQL",
  "REST APIs",
  "Prisma",
  "Express.js",
  "Git",
  "CI/CD",
  "Supabase",
  "Vercel",
  "Socket.io",
];

function Marquee() {
  return (
    <div className="mq-wrap">
      <div className="mq-track">
        {[...skills, ...skills].map((s, i) => (
          <span key={i} className="mq-item">
            {s}
          </span>
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
    desc: "AI-powered job follow-up automation. Upload a job posting screenshot — AI extracts the details, writes a tailored follow-up email, and sends it at the optimal time in the right timezone. Built with GPT-4 & Gemini, Chrome Extension, and SMTP delivery.",
    stack: ["Next.js", "TypeScript", "GPT-4", "Gemini", "Chrome Ext", "SMTP", "MongoDB"],
    size: "c7",
    link: "/dashboard",
  },
  {
    tag: "Booking Platform",
    title: "GoBikes",
    desc: "Full-stack bike booking and fleet management platform with real-time availability, user authentication, admin dashboard, and seamless booking flows.",
    stack: ["React", "Node.js", "MongoDB", "Express", "Vercel"],
    size: "c5",
    link: "https://gobikes-strugend-ehgdcpkf0-rudrakshikumar.vercel.app/",
    github: "https://github.com/strugend/booking-management-frontend",
  },
  {
    tag: "SaaS · B2B",
    title: "Sprowt AI",
    desc: "AI-powered platform to help businesses grow. Contributed to full-stack feature development, performance optimization, and scalable architecture at Sprowt AI.",
    stack: ["React", "Next.js", "TypeScript", "Node.js", "PostgreSQL"],
    size: "c5",
    link: "https://sprowt.ai/",
  },
  {
    tag: "E-Commerce · Marketplace",
    title: "WishGeeks & AstroConverse",
    desc: "Developed key frontend features and full-stack integrations for WishGeeks (gifting marketplace) and AstroConverse (astrology SaaS), focusing on performance and UX.",
    stack: ["React", "Next.js", "Node.js", "MongoDB", "Framer Motion"],
    size: "c7",
    link: "https://www.wishgeeks.com/",
  },
  {
    tag: "Tech Company",
    title: "Vaani Labs",
    desc: "Built product interfaces and backend APIs for Vaani Labs — a voice-tech startup. Delivered accessible, responsive UIs and RESTful services.",
    stack: ["React", "TypeScript", "Node.js", "REST APIs", "AWS"],
    size: "c5",
    link: "https://www.vaanilabs.in/",
  },
  {
    tag: "Platform · Community",
    title: "Shine Quizz",
    desc: "Interactive quiz platform with real-time leaderboards, question management, and engaging multiplayer game mechanics.",
    stack: ["React", "Node.js", "Socket.io", "MongoDB", "Express"],
    size: "c7",
    link: "https://www.shinequizz.com/",
  },
];

const timeline = [
  {
    date: "2024 — Present",
    role: "Full Stack Developer",
    co: "Driva.tech",
    coLink: "https://driva.tech/",
    desc: "Building and shipping full-stack product features for a fast-growing tech company. Leading frontend architecture decisions, integrating third-party APIs, and maintaining CI/CD pipelines for seamless deployments.",
  },
  {
    date: "2023 — 2024",
    role: "Full Stack Developer",
    co: "Vaani Labs",
    coLink: "https://www.vaanilabs.in/",
    desc: "Developed voice-tech product interfaces and RESTful backend services. Focused on accessibility, performance optimization, and delivering pixel-perfect responsive designs across all devices.",
  },
  {
    date: "2022 — 2023",
    role: "Frontend Developer",
    co: "Sprowt AI",
    coLink: "https://sprowt.ai/",
    desc: "Contributed to AI-powered B2B platform development. Built scalable UI components in React/TypeScript, worked closely with product and design teams, and improved core web vitals significantly.",
  },
  {
    date: "2021 — 2022",
    role: "Web Developer",
    co: "Freelance & Contract",
    desc: "Delivered end-to-end web applications for clients across e-commerce, education, and SaaS verticals. Shipped WishGeeks marketplace integrations, AstroConverse features, and multiple landing pages.",
  },
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

  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  useNavScroll();
  useReveal(heroRef);
  useReveal(aboutRef);
  useReveal(projRef);
  useReveal(expRef);
  useReveal(contactRef);
  useSpotlightTilt(projRef);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    // Simulate async send
    await new Promise((r) => setTimeout(r, 1200));
    setFormStatus("sent");
    setFormData({ name: "", email: "", message: "" });
    setTimeout(() => setFormStatus("idle"), 4000);
  };

  return (
    <>
      {/* NAV */}
      <nav id="nav" className="nav">
        <div className="wrap nav-inner">
          <a href="#" className="nav-name">
            gokul<span>.</span>dev
          </a>
          <div className="nav-right">
            <a href="#about" className="nav-link">
              About
            </a>
            <a href="#work" className="nav-link">
              Work
            </a>
            <a href="#exp" className="nav-link">
              Experience
            </a>
            <MagBtn href="#contact" className="btn-fill">
              Let&apos;s Talk
            </MagBtn>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <HeroMarqueeBackground />
        <div className="hero-content">
          <div className="rv hero-badge">
            <span className="hero-dot" />
            Open to full-time &amp; freelance roles
          </div>
          <h1>
            <SplitText text="I design &" delay={0.1} />
            {"\u00A0"}
            <SplitText text="build" delay={0.25} />
            <br />
            <span className="wr">
              <span className="wi blue" style={{ transitionDelay: "0.4s" }}>
                digital
              </span>
            </span>
            {"\u00A0"}
            <SplitText text="experiences" delay={0.46} />
          </h1>
          <p className="rv d2 hero-sub">
            Full Stack Engineer with 4+ years crafting performant web applications,
            scalable systems, and interfaces that people actually enjoy using.
          </p>
          <div className="rv d3 hero-btns">
            <MagBtn href="#work" className="btn-fill btn-lg">
              View Projects →
            </MagBtn>
            <MagBtn
              href="https://github.com/janagokul6"
              className="btn-ghost btn-lg"
            >
              GitHub ↗
            </MagBtn>
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
                  I&apos;m <strong>Gokul Janarthanan</strong> — a Full Stack
                  Engineer based in India who thrives at the intersection of
                  <strong> design and engineering</strong>. Frontend is where I
                  come alive, but I&apos;m equally comfortable building APIs,
                  managing databases, and shipping products end-to-end.
                </p>
                <p>
                  Over the past 4+ years, I&apos;ve built and shipped production
                  apps across startups and clients —{" "}
                  <strong>React, Next.js, Node.js, MongoDB, PostgreSQL</strong>,
                  and cloud platforms. I care about the details: smooth
                  interactions, clean architecture, systems that scale, and
                  deploys that don&apos;t break at 2 AM.
                </p>
                <p>
                  Outside work, I build side projects that automate tedious
                  things — like this very app, which sends AI-written follow-up
                  emails so you never miss a job opportunity again.
                </p>
              </div>
              <div className="rv d3 about-stats">
                <div className="a-stat">
                  <div className="a-stat-val">4+</div>
                  <div className="a-stat-lbl">Years exp</div>
                </div>
                <div className="a-stat">
                  <div className="a-stat-val">20+</div>
                  <div className="a-stat-lbl">Projects shipped</div>
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
      <section
        id="work"
        className="section"
        ref={projRef}
        style={{ background: "var(--bg2)" }}
      >
        <div className="wrap">
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">Selected Work</p>
            <h2 className="rv d1 s-title">Things I&apos;ve built</h2>
            <p className="rv d2 s-sub">
              A mix of client work, startup products, and passion projects —
              each one pushed me further.
            </p>
          </div>
          <div className="rv d3 bento">
            {projects.map((p, i) => (
              <div key={i} className={`p-card ${p.size}`}>
                <span className="p-tag">{p.tag}</span>
                <h3>{p.title}</h3>
                <p>{p.desc}</p>
                <div className="p-stack">
                  {p.stack.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  {p.link && (
                    <a
                      href={p.link}
                      className="p-link"
                      target={p.link.startsWith("http") ? "_blank" : undefined}
                      rel={
                        p.link.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                    >
                      View Live →
                    </a>
                  )}
                  {"github" in p && p.github && (
                    <a
                      href={p.github}
                      className="p-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--gray)" }}
                    >
                      GitHub →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCE */}
      <section id="exp" className="section" ref={expRef}>
        <div className="wrap" style={{ maxWidth: 760 }}>
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">Experience</p>
            <h2 className="rv d1 s-title">Where I&apos;ve worked</h2>
          </div>
          <div className="timeline">
            {timeline.map((t, i) => (
              <div key={i} className={`rv d${i + 1} tl-item`}>
                <div className="tl-date">{t.date}</div>
                <h3>{t.role}</h3>
                {"coLink" in t && t.coLink ? (
                  <a
                    href={t.coLink}
                    className="tl-co"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-block", marginTop: "0.1rem" }}
                  >
                    {t.co} ↗
                  </a>
                ) : (
                  t.co && <span className="tl-co">{t.co}</span>
                )}
                <p>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section
        id="contact"
        className="section"
        ref={contactRef}
        style={{ background: "var(--bg2)" }}
      >
        <div className="wrap">
          <div style={{ marginBottom: "3rem" }}>
            <p className="rv s-label">Connect</p>
            <h2 className="rv d1 s-title">Let&apos;s work together</h2>
            <p className="rv d2 s-sub">
              Got a project, a question, or just want to say hi? I&apos;m all ears.
            </p>
          </div>
          <div className="rv d3 contact-grid">
            <form className="contact-form" onSubmit={handleSubmit}>
              <input
                className="form-field"
                placeholder="Name"
                required
                value={formData.name}
                onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              />
              <input
                className="form-field"
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
              />
              <textarea
                className="form-field"
                placeholder="Your message..."
                required
                value={formData.message}
                onChange={(e) =>
                  setFormData((d) => ({ ...d, message: e.target.value }))
                }
              />
              <MagBtn
                type="submit"
                className="btn-fill btn-lg"
                style={{ alignSelf: "flex-start" } as React.CSSProperties}
              >
                {formStatus === "sending"
                  ? "Sending…"
                  : formStatus === "sent"
                  ? "✓ Message Sent!"
                  : "Send Message →"}
              </MagBtn>
            </form>
            <div>
              <p
                className="rv"
                style={{
                  color: "var(--gray)",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  marginBottom: "1.5rem",
                }}
              >
                Open to full-time engineering roles, freelance projects, and
                interesting collaborations. Based in India — available remotely
                worldwide. Feel free to reach out through any channel.
              </p>
              <div className="social-links">
                <a
                  href="https://github.com/janagokul6"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  GitHub ↗
                </a>
                <a
                  href="https://linkedin.com/in/janagokul"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  LinkedIn ↗
                </a>
                <a href="mailto:janagokul6@gmail.com" className="social-link">
                  Email ↗
                </a>
                <a
                  href="/Gokul Jana (resume).pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                >
                  Resume ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <p className="footer-note">
          Designed &amp; built by Gokul Janarthanan &nbsp;·&nbsp; © {new Date().getFullYear()}
        </p>
      </footer>
    </>
  );
}

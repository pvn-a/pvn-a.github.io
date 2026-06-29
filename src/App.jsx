import { Download, Github, Leaf, Linkedin, Mail, Menu, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import TrailWorld from "./TrailWorld.jsx";
import data from "./generated/portfolioData.json";

const stops = [
  {
    id: "rainforest",
    nav: "About",
    place: "Forest trail",
    label: "About",
    title: "Backend engineer with a research compass.",
    copy: "I build data-heavy backend systems, research pipelines, and ML-adjacent tools. The route starts quietly: trees, water, terrain, and a little curiosity.",
  },
  {
    id: "rockies",
    nav: "Experience",
    place: "Climbing path",
    label: "Experience",
    title: "Production systems at altitude.",
    copy: "AWS, Vymo, Earth Lab, and Samsung shaped the route: distributed services, data infrastructure, customer-facing reliability, and applied computer vision.",
  },
  {
    id: "arch",
    nav: "Projects",
    place: "Creek crossing",
    label: "Projects",
    title: "Projects that open into the work.",
    // copy: "A small but expandable project stop. Add future builds and this trail can keep growing without changing the whole site.",
    copy: "A small but expandable project stop.",
  },
  {
    id: "geyser",
    nav: "Publications",
    place: "Waterfall overlook",
    label: "Publications",
    title: "Research that surfaces.",
    copy: "Publications and research work across malware classification, music generation, dehazing, edge computing, and environmental datasets.",
  },
  {
    id: "canyon",
    nav: "Skills",
    place: "Snow line",
    label: "Skills",
    title: "A wide technical landscape.",
    copy: "Backend engineering, cloud, big data, ML, infrastructure, and enough debugging stamina to appreciate the view.",
  },
  {
    id: "milky-way",
    nav: "Contact",
    place: "Camp clearing",
    label: "Contact",
    title: "Let’s build what’s next.",
    copy: "The final stop is simple: a quiet clearing, a few links, and an easy way to reach me.",
  },
];

function cleanMarkdown(markdown) {
  return markdown
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .split(/\n+/)
    .filter(Boolean);
}

function externalLink(kind) {
  if (kind === "github") return `https://github.com/${data.site.github}`;
  if (kind === "linkedin") return `https://www.linkedin.com/in/${data.site.linkedin}`;
  if (kind === "scholar") return `https://scholar.google.com/citations?user=${data.site.scholar}`;
  return `mailto:${data.site.email}`;
}

function useActiveStop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const update = () => {
      let next = 0;
      stops.forEach((stop, index) => {
        const element = document.getElementById(stop.id);
        if (!element) return;
        const rect = element.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.55 && rect.bottom > window.innerHeight * 0.25) {
          next = index;
        }
      });
      setActive(next);
      document.documentElement.style.setProperty("--route-progress", `${next / (stops.length - 1)}`);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return active;
}

function CommandBar({ active }) {
  return (
    <header className="command-bar">
      <a href="#top" className="brand-mark" aria-label="Back to trail start">
        <span>P</span>
      </a>
      <nav aria-label="Portfolio sections">
        {stops.map((stop, index) => (
          <a className={index === active ? "is-active" : ""} href={`#${stop.id}`} key={stop.id}>
            {stop.nav}
          </a>
        ))}
      </nav>
      <button className="icon-button" type="button" onClick={() => document.body.classList.toggle("nav-open")} aria-label="Menu">
        <Menu size={20} />
      </button>
    </header>
  );
}

function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__content">
        <h1>Pavan</h1>
      </div>
    </section>
  );
}

function AboutPanel() {
  const about = cleanMarkdown(data.aboutMarkdown).slice(0, 2);
  return (
    <>
      {about.map((line) => (
        <p key={line}>{line}</p>
      ))}
      <div className="mini-grid">
        {data.education.slice(0, 2).map((item) => (
          <article key={item.title}>
            <span>{item.year}</span>
            <h3>{item.title}</h3>
            <p>{item.institution}</p>
          </article>
        ))}
      </div>
    </>
  );
}

function ExperiencePanel() {
  return (
    <div className="stack-list">
      {[...data.work.slice(0, 3), ...data.research.slice(0, 2)].map((item) => (
        <article key={`${item.title}-${item.institution}`}>
          <span>{item.year}</span>
          <div>
            <h3>{item.title}</h3>
            <p>{item.institution}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectsPanel() {
  return (
    <div className="project-strip">
      {data.projects.slice(0, 4).map((project) => (
        <article key={project.title}>
          <span>{project.category || "project"}</span>
          <h3>{project.title}</h3>
          <p>{project.description}</p>
        </article>
      ))}
    </div>
  );
}

function PublicationsPanel() {
  return (
    <div className="stack-list">
      {data.publications.flatMap((year) =>
        year.items.map((paper) => (
          <article key={`${year.year}-${paper.title}`}>
            <span>{year.year}</span>
            <div>
              <h3>{paper.title}</h3>
              <p>{paper.contents?.join(" ").replace(/<[^>]+>/g, "")}</p>
            </div>
          </article>
        )),
      )}
    </div>
  );
}

function SkillsPanel() {
  return (
    <>
      <div className="skill-cloud">
        {data.skills.map((skill) => (
          <article key={skill.title}>
            <strong>{skill.title === "Tools/Technologies/Frameworks" ? "Tools/Technologies" : skill.title}</strong>
            <span>{skill.items}</span>
          </article>
        ))}
      </div>
      <div className="stack-list awards">
        {data.honors.slice(0, 3).map((award) => {
          const first = award.items?.[0];
          return (
            <article key={award.year}>
              <span>{award.year}</span>
              <div>
                <h3>{typeof first === "string" ? first : first?.title}</h3>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function ContactPanel() {
  return (
    <>
      <div className="contact-grid">
        <a href={externalLink("email")}>
          <Mail size={18} />
          Email
        </a>
        <a href={externalLink("github")} target="_blank" rel="noreferrer">
          <Github size={18} />
          GitHub
        </a>
        <a href={externalLink("linkedin")} target="_blank" rel="noreferrer">
          <Linkedin size={18} />
          LinkedIn
        </a>
        <button type="button" onClick={() => window.print()}>
          <Download size={18} />
          Resume
        </button>
      </div>
      <p>{data.site.contactNote}</p>
    </>
  );
}

function PanelContent({ id }) {
  if (id === "rainforest") return <AboutPanel />;
  if (id === "rockies") return <ExperiencePanel />;
  if (id === "arch") return <ProjectsPanel />;
  if (id === "geyser") return <PublicationsPanel />;
  if (id === "canyon") return <SkillsPanel />;
  return <ContactPanel />;
}

function TrailStop({ stop }) {
  return (
    <section className={`trail-stop trail-stop--${stop.id}`} id={stop.id}>
      <article className="story-panel">
        <div className="panel-location">
          <Leaf size={16} />
          <span>{stop.place}</span>
        </div>
        <h2>{stop.nav}</h2>
        <PanelContent id={stop.id} />
      </article>
    </section>
  );
}

export default function App() {
  const active = useActiveStop();

  return (
    <>
      <TrailWorld activeIndex={active} />
      <CommandBar active={active} />
      <main>
        <Hero />
        {stops.map((stop) => (
          <TrailStop key={stop.id} stop={stop} />
        ))}
      </main>
      <footer className="site-footer">
        <Sparkles size={16} />
        <span>Copyright © Pavan</span>
      </footer>
    </>
  );
}

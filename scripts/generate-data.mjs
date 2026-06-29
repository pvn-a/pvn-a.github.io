import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import matter from "gray-matter";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const ensureDir = (dir) => fs.mkdirSync(path.join(root, dir), { recursive: true });

const cv = yaml.load(read("_data/cv.yml"));
const config = yaml.load(read("_config.yml"));

const section = (title) => cv.find((entry) => entry.title === title) || { contents: [] };

const projectsDir = path.join(root, "_projects");
const projects = fs
  .readdirSync(projectsDir)
  .filter((file) => file.endsWith(".md"))
  .map((file) => {
    const parsed = matter(fs.readFileSync(path.join(projectsDir, file), "utf8"));
    return {
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      importance: parsed.data.importance || 99,
      image: parsed.data.img,
      slug: file.replace(/^\d+_/, "").replace(/\.md$/, ""),
      body: parsed.content.trim(),
    };
  })
  .sort((a, b) => a.importance - b.importance);

const aboutMarkdown = read("_pages/about.md")
  .replace(/^---[\s\S]*?---/, "")
  .trim();

const data = {
  site: {
    firstName: config.first_name,
    lastName: config.last_name,
    title: `${config.first_name} ${config.last_name}`.trim(),
    subtitle: "MSCS @ University of Colorado at Boulder",
    email: config.email,
    github: config.github_username,
    linkedin: config.linkedin_username,
    scholar: config.scholar_userid,
    contactNote: String(config.contact_note || "").trim(),
  },
  aboutMarkdown,
  general: section("General").contents,
  education: section("Education").contents,
  work: section("Work Experience").contents,
  research: section("Research Experience").contents,
  additional: section("Additional Experience").contents,
  publications: section("Publications").contents,
  skills: section("Skills").contents,
  honors: section("Honors and Awards").contents,
  projects,
};

ensureDir("src/generated");
fs.writeFileSync(path.join(root, "src/generated/portfolioData.json"), `${JSON.stringify(data, null, 2)}\n`);

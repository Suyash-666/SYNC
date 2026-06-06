// ============================================================================
// placement/data/resumeChecklist.js
//
// Recruiter-grade resume checklist. Topics follow the structure of
// the resume-readability guides on Jobscan, Cultivated Culture, and
// the standard "one-page CS resume" template used at IITs / NITs / BITS.
//
// Each item is a binary checklist the user can tick off. The
// difficulty column here encodes "how much polish is required" rather
// than a cognitive difficulty — useful for sorting.
// ============================================================================

export const resumeChecklist = [
  {
    topic: 'Header & Contact',
    icon: '📇',
    items: [
      { id: 'res-h-1',  name: 'Full name, in larger font, top of the page',                                  difficulty: 'EASY' },
      { id: 'res-h-2',  name: 'Phone number with country code (+91)',                                          difficulty: 'EASY' },
      { id: 'res-h-3',  name: 'Professional email (firstname.lastname@gmail.com, not xX_cool_Xx@…)',           difficulty: 'EASY' },
      { id: 'res-h-4',  name: 'City + state (no full address needed)',                                          difficulty: 'EASY' },
      { id: 'res-h-5',  name: 'LinkedIn URL (customised, not the auto one)',                                   difficulty: 'EASY' },
      { id: 'res-h-6',  name: 'GitHub URL — pinned repos look active',                                         difficulty: 'EASY' },
      { id: 'res-h-7',  name: 'Portfolio / personal site if applicable',                                        difficulty: 'MEDIUM' },
      { id: 'res-h-8',  name: 'No photo, no age, no marital status, no passport number',                        difficulty: 'EASY' },
    ],
  },
  {
    topic: 'Education',
    icon: '🎓',
    items: [
      { id: 'res-edu-1', name: 'College, degree, branch, expected graduation year',                              difficulty: 'EASY' },
      { id: 'res-edu-2', name: 'CGPA / percentage (only if ≥7.5 / 75%, else optional)',                          difficulty: 'EASY' },
      { id: 'res-edu-3', name: 'Class 12 + Class 10 marks (only if strong, otherwise drop)',                    difficulty: 'MEDIUM' },
      { id: 'res-edu-4', name: 'Relevant coursework list (4–6 max, only if fresher)',                            difficulty: 'MEDIUM' },
      { id: 'res-edu-5', name: 'Honors / scholarships / Dean\'s list with year',                                 difficulty: 'EASY' },
    ],
  },
  {
    topic: 'Projects',
    icon: '🧪',
    items: [
      { id: 'res-pr-1',  name: '3–4 projects, with 2-line description each',                                       difficulty: 'EASY' },
      { id: 'res-pr-2',  name: 'Tech stack listed on the same line as the project name',                          difficulty: 'EASY' },
      { id: 'res-pr-3',  name: 'Each project: 2–4 bullet points, action-driven ("Built X using Y, did Z…")',     difficulty: 'EASY' },
      { id: 'res-pr-4',  name: 'Metrics wherever possible ("reduced load time by 40%", "100+ active users")',    difficulty: 'MEDIUM' },
      { id: 'res-pr-5',  name: 'GitHub link and live demo link for each project',                                  difficulty: 'EASY' },
      { id: 'res-pr-6',  name: 'No tutorial clones (TODO app #14) — replace with original work',                 difficulty: 'MEDIUM' },
      { id: 'res-pr-7',  name: 'One project should be a substantial full-stack / ML / systems piece',             difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Skills',
    icon: '🧰',
    items: [
      { id: 'res-sk-1',  name: 'Languages listed with proficiency honesty (not "Expert" in 10)',                 difficulty: 'EASY' },
      { id: 'res-sk-2',  name: 'Frameworks grouped (Frontend, Backend, ML, DevOps)',                               difficulty: 'EASY' },
      { id: 'res-sk-3',  name: 'Tools (Git, Docker, AWS, Figma, Postman, Linux)',                                  difficulty: 'EASY' },
      { id: 'res-sk-4',  name: 'Databases (SQL + at least one NoSQL)',                                            difficulty: 'EASY' },
      { id: 'res-sk-5',  name: 'Drop skills you can\'t answer a 30-second question about',                        difficulty: 'EASY' },
    ],
  },
  {
    topic: 'Experience & Internships',
    icon: '💼',
    items: [
      { id: 'res-exp-1', name: 'Internships in reverse-chronological order (most recent first)',                   difficulty: 'EASY' },
      { id: 'res-exp-2', name: 'Each internship: company, role, dates, location, 3–4 bullet outcomes',            difficulty: 'EASY' },
      { id: 'res-exp-3', name: 'Bullets start with strong verbs (Built, Led, Reduced, Shipped)',                  difficulty: 'EASY' },
      { id: 'res-exp-4', name: 'Quantified outcomes wherever possible',                                           difficulty: 'MEDIUM' },
      { id: 'res-exp-5', name: 'Includes at least one tech internship OR strong open-source contribution',         difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Achievements & Extracurriculars',
    icon: '🏆',
    items: [
      { id: 'res-ach-1', name: 'Coding contest ranks (CodeChef, Codeforces, LeetCode rating)',                     difficulty: 'EASY' },
      { id: 'res-ach-2', name: 'Hackathon wins / top finishes',                                                    difficulty: 'EASY' },
      { id: 'res-ach-3', name: 'Scholarships / merit awards / publications',                                       difficulty: 'EASY' },
      { id: 'res-ach-4', name: 'Open source contributions (number of PRs, projects contributed to)',              difficulty: 'MEDIUM' },
      { id: 'res-ach-5', name: 'Club / community leadership (NOT just "member of coding club")',                  difficulty: 'EASY' },
    ],
  },
  {
    topic: 'Formatting & ATS',
    icon: '📄',
    items: [
      { id: 'res-fmt-1', name: 'One page (two pages ONLY if you have 3+ years of relevant experience)',            difficulty: 'EASY' },
      { id: 'res-fmt-2', name: 'Clean font (Inter, Calibri, Roboto) — no Comic Sans, no script fonts',            difficulty: 'EASY' },
      { id: 'res-fmt-3', name: 'Margins ≥0.5 inch, body font 10–11pt, name 18–20pt',                                difficulty: 'EASY' },
      { id: 'res-fmt-4', name: 'Saved as PDF, filename is "Firstname_Lastname_Resume.pdf"',                         difficulty: 'EASY' },
      { id: 'res-fmt-5', name: 'Passed an ATS parser test (try Jobscan or a free ATS simulator)',                  difficulty: 'MEDIUM' },
      { id: 'res-fmt-6', name: 'No tables, no columns, no icons, no images (ATS breaks on these)',                 difficulty: 'EASY' },
      { id: 'res-fmt-7', name: 'Tailored keywords for the job description in the first 200 words',                difficulty: 'MEDIUM' },
      { id: 'res-fmt-8', name: 'Proofread: zero typos, consistent tense, consistent punctuation',                difficulty: 'EASY' },
      { id: 'res-fmt-9', name: 'Test print: readable in B&W, looks good in a 6" screen preview',                   difficulty: 'EASY' },
    ],
  },
  {
    topic: 'Final Polish',
    icon: '✨',
    items: [
      { id: 'res-fin-1', name: 'Reviewed by 2 seniors / peers who got placed',                                     difficulty: 'EASY' },
      { id: 'res-fin-2', name: '3 mock interviews done (at least 1 with a real interviewer)',                      difficulty: 'MEDIUM' },
      { id: 'res-fin-3', name: 'Customised version for each role / company (or at least, 2–3 versions)',           difficulty: 'MEDIUM' },
      { id: 'res-fin-4', name: 'LinkedIn "About" section mirrors resume summary',                                  difficulty: 'EASY' },
      { id: 'res-fin-5', name: 'You can talk about every bullet on your resume for 60 seconds each',               difficulty: 'EASY' },
    ],
  },
];

export default resumeChecklist;

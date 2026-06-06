// ============================================================================
// placement/data/interviewSheet.js
//
// Interview prep. Topics follow the most common structure used by
// Indian campus placement drives and the long-form guides on
// GeeksforGeeks / InterviewBit / IGate Patrich. For each question
// we ship a "what they're really asking" hint that helps the user
// structure a 60–90 second answer.
// ============================================================================

export const interviewSheet = [
  {
    topic: 'Tell Me About Yourself',
    icon: '🗣️',
    items: [
      { id: 'int-tellme-1', name: '60-second self-introduction (Present–Past–Future)',                          difficulty: 'EASY',   hint: 'Present role → past wins → why this company. <90s.' },
      { id: 'int-tellme-2', name: 'Walk me through your resume (2-minute version)',                                difficulty: 'EASY' },
      { id: 'int-tellme-3', name: '"Why should we hire you?" — 3-bullet answer',                                    difficulty: 'EASY' },
      { id: 'int-tellme-4', name: 'Pitch a project from your resume in 90 seconds',                                  difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Behavioral / HR',
    icon: '🤝',
    items: [
      { id: 'int-beh-1',  name: 'Tell me about a time you worked in a team with a difficult person',                difficulty: 'MEDIUM', hint: 'Use STAR (Situation, Task, Action, Result).' },
      { id: 'int-beh-2',  name: 'Describe a time you failed. What did you learn?',                                  difficulty: 'MEDIUM', hint: 'Real failure → ownership → specific learning.' },
      { id: 'int-beh-3',  name: 'Give an example of when you showed leadership with no formal authority',          difficulty: 'MEDIUM' },
      { id: 'int-beh-4',  name: 'Tell me about the toughest decision you\'ve had to make',                            difficulty: 'HARD' },
      { id: 'int-beh-5',  name: 'A time you disagreed with your manager. How did you handle it?',                   difficulty: 'MEDIUM' },
      { id: 'int-beh-6',  name: 'How do you handle conflict inside a team?',                                         difficulty: 'EASY' },
      { id: 'int-beh-7',  name: 'Where do you see yourself in 5 years?',                                              difficulty: 'EASY' },
      { id: 'int-beh-8',  name: 'Why our company specifically? (replace the name as needed)',                        difficulty: 'MEDIUM', hint: 'Mention a product, a person, or a recent news item.' },
    ],
  },
  {
    topic: 'Strengths & Weaknesses',
    icon: '💪',
    items: [
      { id: 'int-sw-1',   name: 'What are your top 3 strengths? (give 3 with examples)',                              difficulty: 'EASY' },
      { id: 'int-sw-2',   name: 'What is your biggest weakness? (real + steps to fix)',                              difficulty: 'EASY',   hint: 'Avoid "I\'m a perfectionist". Pick a real one + mitigation.' },
      { id: 'int-sw-3',   name: 'How do you handle pressure / tight deadlines?',                                     difficulty: 'EASY' },
      { id: 'int-sw-4',   name: 'Tell me about a time you went above and beyond',                                    difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Technical — CS Fundamentals',
    icon: '💻',
    items: [
      { id: 'int-tech-1', name: 'Explain OOP with 4 pillars + a real example',                                       difficulty: 'EASY' },
      { id: 'int-tech-2', name: 'Difference between process and thread',                                             difficulty: 'EASY' },
      { id: 'int-tech-3', name: 'What happens when you type a URL in a browser?',                                    difficulty: 'MEDIUM' },
      { id: 'int-tech-4', name: 'Explain ACID properties with a banking example',                                    difficulty: 'MEDIUM' },
      { id: 'int-tech-5', name: 'How does HTTPS work? (TLS handshake)',                                              difficulty: 'HARD' },
      { id: 'int-tech-6', name: 'Explain normalisation (1NF, 2NF, 3NF) with an example',                              difficulty: 'MEDIUM' },
      { id: 'int-tech-7', name: 'Stack vs heap memory — when does each get used?',                                    difficulty: 'EASY' },
      { id: 'int-tech-8', name: 'Big-O of common operations on arrays, maps, sets',                                  difficulty: 'EASY' },
      { id: 'int-tech-9', name: 'Difference between SQL joins (INNER, LEFT, RIGHT, FULL)',                            difficulty: 'EASY' },
      { id: 'int-tech-10',name: 'Explain deadlock. What are the 4 conditions?',                                      difficulty: 'MEDIUM' },
      { id: 'int-tech-11',name: 'REST vs GraphQL — when to pick which?',                                              difficulty: 'MEDIUM' },
      { id: 'int-tech-12',name: 'How would you design a URL shortener (high level)?',                                 difficulty: 'HARD' },
    ],
  },
  {
    topic: 'Technical — Coding Round',
    icon: '🧑‍💻',
    items: [
      { id: 'int-code-1', name: 'How do you approach a problem you\'ve never seen before?',                            difficulty: 'EASY',   hint: 'Brute force → examples → pattern → optimise → code → test.' },
      { id: 'int-code-2', name: 'How do you decide the right data structure for a problem?',                         difficulty: 'EASY' },
      { id: 'int-code-3', name: 'Walk me through debugging a memory leak',                                            difficulty: 'HARD' },
      { id: 'int-code-4', name: 'How do you write test cases for "Two Sum"?',                                         difficulty: 'EASY' },
      { id: 'int-code-5', name: 'Time vs space trade-off in DP — give an example',                                    difficulty: 'MEDIUM' },
      { id: 'int-code-6', name: 'Why is a hash map O(1) on average but O(n) worst case?',                              difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Project Deep-Dive',
    icon: '🛠️',
    items: [
      { id: 'int-proj-1', name: 'Pick your strongest project. Explain the architecture',                              difficulty: 'MEDIUM' },
      { id: 'int-proj-2', name: 'What was the hardest technical problem in this project?',                            difficulty: 'MEDIUM' },
      { id: 'int-proj-3', name: 'If you had 2 more weeks, what would you build next?',                                difficulty: 'EASY' },
      { id: 'int-proj-4', name: 'How did you handle auth / scaling in this project?',                                 difficulty: 'HARD' },
      { id: 'int-proj-5', name: 'Why did you pick tech X over Y? (database, framework, etc.)',                        difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'HR / Closing Round',
    icon: '🎯',
    items: [
      { id: 'int-hr-1',  name: 'Why this role? Why not a different track?',                                          difficulty: 'EASY' },
      { id: 'int-hr-2',  name: 'Expected CTC and how you arrived at it',                                              difficulty: 'EASY' },
      { id: 'int-hr-3',  name: 'Are you willing to relocate / travel?',                                               difficulty: 'EASY' },
      { id: 'int-hr-4',  name: 'Do you have any questions for us? (always have 2-3)',                                  difficulty: 'EASY' },
      { id: 'int-hr-5',  name: 'How do you keep up with new tech outside of college?',                                difficulty: 'EASY' },
      { id: 'int-hr-6',  name: 'What other companies are you interviewing with?',                                    difficulty: 'MEDIUM', hint: 'Be honest, never lie.' },
    ],
  },
  {
    topic: 'Body Language & Logistics',
    icon: '🎙️',
    items: [
      { id: 'int-log-1', name: 'Dress code for a tech interview (in-person / virtual)',                                difficulty: 'EASY' },
      { id: 'int-log-2', name: 'How to set up your background, mic and lighting for virtual interviews',              difficulty: 'EASY' },
      { id: 'int-log-3', name: 'How early should you log in for a virtual interview?',                                difficulty: 'EASY' },
      { id: 'int-log-4', name: 'What to do if you don\'t know the answer',                                            difficulty: 'EASY' },
      { id: 'int-log-5', name: 'When to follow up after an interview (and what to say)',                                difficulty: 'EASY' },
    ],
  },
];

export default interviewSheet;

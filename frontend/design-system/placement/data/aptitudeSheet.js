// ============================================================================
// placement/data/aptitudeSheet.js
//
// Quant + logical + verbal aptitude prep. Topic structure modelled on
// IndiaBix (indiabix.com), the de-facto free resource for Indian campus
// placement aptitude rounds. Each item is a self-contained question
// the user can mark done. We intentionally ship questions (not a 50-page
// test) so the user can come back daily and tick them off.
//
// For each question we provide a short hint that nudges the user
// toward the right method without giving the answer away — that way
// the page stays useful as a study tool, not a cheat sheet.
// ============================================================================

export const aptitudeSheet = [
  {
    topic: 'Numbers & Arithmetic',
    icon: '🔢',
    items: [
      { id: 'apt-num-1', name: 'A number is increased by 20% and then decreased by 20%. What is the net change?', difficulty: 'EASY',   hint: 'Net factor: (1+0.2)(1-0.2) ≠ 1.' },
      { id: 'apt-num-2', name: 'Find the smallest number divisible by 12, 15, 20.',                                  difficulty: 'EASY',   hint: 'LCM, not GCD.' },
      { id: 'apt-num-3', name: 'The ratio of ages of A and B is 4:5. After 5 years it will be 5:6. Find present ages.', difficulty: 'MEDIUM' },
      { id: 'apt-num-4', name: 'Sum of three consecutive even numbers is 72. Find the largest.',                     difficulty: 'EASY' },
      { id: 'apt-num-5', name: 'How many zeros are at the end of 100! ?',                                            difficulty: 'MEDIUM', hint: 'Count factors of 5.' },
      { id: 'apt-num-6', name: 'A two-digit number is 4 times the sum of its digits and 3 times the product. Find it.', difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Percentages, Profit & Loss',
    icon: '💯',
    items: [
      { id: 'apt-pct-1', name: 'A shopkeeper sells at cost price but uses 950g as 1kg. Find his profit %.',          difficulty: 'EASY' },
      { id: 'apt-pct-2', name: 'Price of sugar falls by 10%. By how much must consumption rise to keep expense same?', difficulty: 'EASY' },
      { id: 'apt-pct-3', name: 'A sells to B at 20% profit, B to C at 10% loss. C pays ₹1056. What is A\'s cost?',   difficulty: 'MEDIUM' },
      { id: 'apt-pct-4', name: 'Two successive discounts of 10% and 20% equal a single discount of ?',                 difficulty: 'EASY' },
      { id: 'apt-pct-5', name: 'If 60% of students pass in Math, 70% in Science, and 40% in both, find % failing both.', difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Ratio, Proportion & Variation',
    icon: '⚖️',
    items: [
      { id: 'apt-rat-1', name: 'Divide ₹6400 between A, B, C in ratio 3:5:8.',                                       difficulty: 'EASY' },
      { id: 'apt-rat-2', name: 'If 12 men can do a job in 20 days, how many days for 15 men?',                       difficulty: 'EASY' },
      { id: 'apt-rat-3', name: 'Mixture of milk & water in 5:2. To get 7:5, what fraction of mixture is to be replaced?', difficulty: 'HARD' },
      { id: 'apt-rat-4', name: 'A, B, C subscribe ₹50,000 for a business. A ₹15000, B ₹20000, C ₹15000 and profit is ₹9600. Find B\'s share.', difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Time, Work & Wages',
    icon: '⏱️',
    items: [
      { id: 'apt-tw-1',  name: 'A can do a job in 12 days, B in 15. Working together, how long?',                    difficulty: 'EASY' },
      { id: 'apt-tw-2',  name: 'A is twice as good as B. Together they finish in 12 days. Find A alone.',             difficulty: 'MEDIUM' },
      { id: 'apt-tw-3',  name: 'Pipes A and B fill a tank in 6 and 8 hours. Pipe C empties in 12 hours. All open: when full?', difficulty: 'MEDIUM' },
      { id: 'apt-tw-4',  name: 'A can finish a work in 18 days; he works for 12 days and leaves. B finishes in 6 more. B alone would take?', difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Time, Speed & Distance',
    icon: '🚗',
    items: [
      { id: 'apt-ts-1',  name: 'A train 240m long passes a pole in 24s. Find speed (km/h).',                            difficulty: 'EASY' },
      { id: 'apt-ts-2',  name: 'Two trains 120m and 80m long run in opposite directions at 40 km/h and 50 km/h. Time to cross?', difficulty: 'MEDIUM' },
      { id: 'apt-ts-3',  name: 'A man rows 6 km/h in still water. Stream 2 km/h. Time up vs down a 8 km stretch?',    difficulty: 'EASY' },
      { id: 'apt-ts-4',  name: 'A starts from P to Q at 60 km/h. After 2h, B starts from Q to P at 80 km/h. They meet at midpoint. Distance PQ?', difficulty: 'HARD' },
      { id: 'apt-ts-5',  name: 'A man covers half the distance at 4 km/h and rest at 6 km/h. Average speed?',         difficulty: 'EASY',   hint: 'Harmonic mean, not arithmetic.' },
    ],
  },
  {
    topic: 'Simple & Compound Interest',
    icon: '🏦',
    items: [
      { id: 'apt-si-1', name: '₹5000 at 8% p.a. simple interest for 2 years.',                                       difficulty: 'EASY' },
      { id: 'apt-si-2', name: 'Rate at which ₹2000 becomes ₹2400 in 4 years (SI)?',                                difficulty: 'EASY' },
      { id: 'apt-ci-1', name: '₹10000 at 10% compounded annually for 3 years?',                                     difficulty: 'MEDIUM' },
      { id: 'apt-ci-2', name: 'Difference between SI and CI on ₹5000 at 10% for 2 years?',                            difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Probability & Permutations',
    icon: '🎲',
    items: [
      { id: 'apt-prob-1', name: 'Two dice rolled. Probability that sum is 7?',                                       difficulty: 'EASY' },
      { id: 'apt-prob-2', name: '5 cards drawn from a deck. Probability of exactly 2 aces?',                         difficulty: 'MEDIUM' },
      { id: 'apt-prob-3', name: 'In how many ways can letters of "MISSISSIPPI" be arranged?',                      difficulty: 'HARD' },
      { id: 'apt-prob-4', name: 'A bag has 4 red, 5 black. Two drawn. Probability both are red?',                   difficulty: 'EASY' },
      { id: 'apt-prob-5', name: 'From 6 men and 5 women, a committee of 4 is formed with at least 2 women. How many ways?', difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Geometry & Mensuration',
    icon: '📐',
    items: [
      { id: 'apt-geo-1', name: 'Area of a triangle with sides 7, 8, 9 (Heron\'s).',                                   difficulty: 'MEDIUM' },
      { id: 'apt-geo-2', name: 'Volume of a cylinder radius 7, height 10. (π=22/7).',                                  difficulty: 'EASY' },
      { id: 'apt-geo-3', name: 'Diagonals of a rhombus are 16 and 12. Find area.',                                     difficulty: 'EASY' },
      { id: 'apt-geo-4', name: 'A sphere fits in a cube of side 2r. Volume of sphere as % of cube.',                  difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Logical Reasoning — Patterns & Series',
    icon: '🧩',
    items: [
      { id: 'apt-lr-1', name: 'Next term: 1, 4, 9, 16, 25, ?',                                                       difficulty: 'EASY' },
      { id: 'apt-lr-2', name: 'Next term: 2, 6, 12, 20, 30, ?',                                                      difficulty: 'EASY' },
      { id: 'apt-lr-3', name: 'Find missing: 3, 9, 27, ?, 243',                                                      difficulty: 'EASY' },
      { id: 'apt-lr-4', name: 'Odd-one-out: 121, 144, 169, 200, 225',                                                difficulty: 'MEDIUM', hint: 'Which is not a perfect square?' },
      { id: 'apt-lr-5', name: 'Find the wrong term: 1, 4, 9, 16, 23, 36',                                              difficulty: 'EASY' },
    ],
  },
  {
    topic: 'Blood Relations & Directions',
    icon: '🧭',
    items: [
      { id: 'apt-br-1', name: 'A is the brother of B. B is the sister of C. C is the father of D. How is A related to D?', difficulty: 'MEDIUM' },
      { id: 'apt-br-2', name: 'Pointing to a man, Sita said, "He is the son of my mother\'s only son." Who is the man?', difficulty: 'EASY' },
      { id: 'apt-dr-1', name: 'Ravi walks 5 km north, then 3 km east, then 5 km south. How far is he from start?',     difficulty: 'EASY' },
      { id: 'apt-dr-2', name: 'A is north of B. C is east of B. D is south of C. Where is D relative to A?',           difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Coding-Decoding & Syllogisms',
    icon: '🔐',
    items: [
      { id: 'apt-cd-1', name: 'In a code, CAT = 24. If DOG = 26, what is PIG?',                                       difficulty: 'MEDIUM', hint: 'Sum of letter positions.' },
      { id: 'apt-cd-2', name: 'If APPLE is coded as DSSOH, then MANGO is coded as?',                                    difficulty: 'MEDIUM', hint: 'Each letter +3.' },
      { id: 'apt-sy-1', name: 'All roses are flowers. Some flowers fade quickly. Conclusion: some roses fade quickly. (T/F)', difficulty: 'EASY' },
      { id: 'apt-sy-2', name: 'No A is B. All C are A. Conclusion: No C is B.',                                          difficulty: 'MEDIUM' },
    ],
  },
  {
    topic: 'Data Interpretation',
    icon: '📈',
    items: [
      { id: 'apt-di-1', name: 'Bar chart: 5 companies A–E with revenues 100, 150, 80, 200, 120. Average?',              difficulty: 'EASY' },
      { id: 'apt-di-2', name: 'Pie chart with 4 sectors 25%, 30%, 20%, 25% — which two are equal?',                     difficulty: 'EASY' },
      { id: 'apt-di-3', name: 'Table: marks of 5 students in 4 subjects. Who topped overall?',                         difficulty: 'EASY' },
      { id: 'apt-di-4', name: 'Line graph: product sales Q1–Q4: 100, 150, 130, 170. % growth Q1 to Q4?',                  difficulty: 'MEDIUM' },
    ],
  },
];

export default aptitudeSheet;

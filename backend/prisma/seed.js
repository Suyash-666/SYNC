const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main(){
  await prisma.$connect();

  // Create a user
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const user = await prisma.user.create({
    data: {
      email: 'student@example.com',
      password_hash: passwordHash,
      full_name: 'Test Student',
      avatar_url: null,
      role: 'STUDENT',
      college: 'Example University',
      degree: 'B.Tech CSE',
      total_semesters: 8,
      is_onboarded: true,
    }
  });

  // Semester
  const semester = await prisma.semester.create({
    data: {
      user_id: user.id,
      semester_number: 4,
      academic_year: '2024-25',
      is_current: true,
    }
  });

  // Subjects
  const subjectsData = [
    { name: 'Algorithms', subject_code: 'CS301' },
    { name: 'DBMS', subject_code: 'CS302' },
    { name: 'Operating Systems', subject_code: 'CS303' },
    { name: 'Artificial Intelligence', subject_code: 'CS304' },
  ];

  const subjects = [];
  for(const s of subjectsData){
    const subj = await prisma.subject.create({ data: { semester_id: semester.id, name: s.name, subject_code: s.subject_code, total_modules: 8, completed_modules: Math.floor(Math.random()*8) } });
    subjects.push(subj);
  }

  // Assignments (10)
  const statuses = ['TODO','IN_PROGRESS','REVIEW','SUBMITTED'];
  const priorities = ['LOW','MEDIUM','HIGH'];
  for(let i=0;i<10;i++){
    const subj = subjects[i % subjects.length];
    await prisma.assignment.create({ data: {
      user_id: user.id,
      subject_id: subj.id,
      title: `Assignment ${i+1} - ${subj.name}`,
      description: `Description for assignment ${i+1}`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      due_date: new Date(Date.now() + (i-5)*24*3600*1000),
    }});
  }

  // Notes (5)
  for(let i=0;i<5;i++){
    await prisma.note.create({ data: {
      user_id: user.id,
      title: `Note ${i+1}`,
      content: `Content for note ${i+1}`,
      folder: i%2===0 ? 'Semester 4' : 'Personal',
      tags: ['tag1','tag2'].slice(0, (i%2)+1),
    }});
  }

  // Notifications (3)
  await prisma.notification.createMany({ data: [
    { user_id: user.id, type: 'ASSIGNMENT', title: 'Assignment due', body: 'Binary Trees due in 3 days' },
    { user_id: user.id, type: 'ATTENDANCE', title: 'Attendance update', body: 'You were marked present in OS lecture' },
    { user_id: user.id, type: 'AI_SUGGESTION', title: 'AI Tip', body: 'Try spaced repetition for Algorithms' },
  ]});

  console.log('Seed data created.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

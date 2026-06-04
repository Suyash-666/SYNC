const prisma = require('../config/db');
const ApiError = require('../utils/ApiError');

async function updateUserOnboarding(userId, payload){
  // Validate semester constraints at service level
  const { degree, college, total_semesters, current_semester, semester_start_date, semester_end_date } = payload;
  if(current_semester > total_semesters) throw new ApiError('Current semester cannot exceed total_semesters', 400);

  // Update user
  await prisma.user.update({ where: { id: userId }, data: { degree, college, total_semesters, is_onboarded: true } });

  // Create Semester record for current_semester
  const semester = await prisma.semester.create({ data: {
    user_id: userId,
    semester_number: current_semester,
    academic_year: `${new Date().getFullYear()}`,
    start_date: semester_start_date ? new Date(semester_start_date) : null,
    end_date: semester_end_date ? new Date(semester_end_date) : null,
    is_current: true,
  }});

  // Optionally save goals/habits/interests as metadata — for now store in user (if columns exist) or ignore
  return { semester };
}

module.exports = { updateUserOnboarding };

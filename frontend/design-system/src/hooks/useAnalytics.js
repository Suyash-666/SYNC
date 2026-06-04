import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api';

export function useAnalytics(period = '7d') {
  const overviewQuery = useQuery({ queryKey: ['analytics', 'overview'], queryFn: analyticsApi.getOverview });
  const attendanceQuery = useQuery({ queryKey: ['analytics', 'attendance', period], queryFn: () => analyticsApi.getAttendance(period) });
  const assignmentsQuery = useQuery({ queryKey: ['analytics', 'assignments', period], queryFn: () => analyticsApi.getAssignments(period) });
  const productivityQuery = useQuery({ queryKey: ['analytics', 'productivity'], queryFn: analyticsApi.getProductivity });
  const subjectsQuery = useQuery({ queryKey: ['analytics', 'subjects'], queryFn: analyticsApi.getSubjects });
  const studyHoursQuery = useQuery({ queryKey: ['analytics', 'study-hours', period], queryFn: analyticsApi.getStudyHours });

  return {
    overview: overviewQuery.data,
    attendance: attendanceQuery.data || [],
    assignments: assignmentsQuery.data || [],
    productivity: productivityQuery.data,
    subjects: subjectsQuery.data || [],
    studyHours: studyHoursQuery.data || [],
    isLoading:
      overviewQuery.isLoading ||
      attendanceQuery.isLoading ||
      assignmentsQuery.isLoading ||
      productivityQuery.isLoading ||
      subjectsQuery.isLoading ||
      studyHoursQuery.isLoading,
    error:
      overviewQuery.error ||
      attendanceQuery.error ||
      assignmentsQuery.error ||
      productivityQuery.error ||
      subjectsQuery.error ||
      studyHoursQuery.error,
    refetch: () => {
      overviewQuery.refetch();
      attendanceQuery.refetch();
      assignmentsQuery.refetch();
      productivityQuery.refetch();
      subjectsQuery.refetch();
      studyHoursQuery.refetch();
    },
  };
}

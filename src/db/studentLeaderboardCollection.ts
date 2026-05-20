import axios from 'axios';
import {
  FETCH_STUDENT_SCHOOL_LEADERBOARD,
  STUDENTS_APIS,
} from '../constants/constants';
import authTokenHandler from '../functions/auth_token/auth_token_handler';
import type { ExamLeaderboardSection, LeaderboardGrade } from '../utils/leaderboard';

export interface StudentSchoolLeaderboardResponse {
  schoolId: string;
  grade: LeaderboardGrade;
  sections: ExamLeaderboardSection[];
  lastUpdatedISO: string | null;
}

export const getStudentSchoolLeaderboard = async (): Promise<StudentSchoolLeaderboardResponse> => {
  const authToken = await authTokenHandler.getAuthToken();
  if (!authToken) {
    throw new Error('You are not signed in. Please sign in again.');
  }

  const response = await axios.get(
    `${process.env.REACT_APP_GOOGLE_CLOUD_FUNCTIONS}${STUDENTS_APIS}${FETCH_STUDENT_SCHOOL_LEADERBOARD}`,
    { headers: { Authorization: `Bearer ${authToken}` } }
  );
  return response.data;
};

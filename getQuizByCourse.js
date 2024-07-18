export const getQuizByCourse = async (courseId) => {
  try {
    const response = await API.get(`/api/quiz/course/${courseId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    throw error;
  }
};

import apiClient from "./api-client";
import type {
  TrainingModuleSummaryResponse,
  TrainingModuleDetailResponse,
  EmployeeTrainingStatusResponse,
  CreateTrainingModuleRequest,
  UpdateTrainingModuleRequest,
  CreateTrainingVideoRequest,
  CreateTrainingQuestionRequest,
  UpdateTrainingQuestionRequest,
  TrainingQuizQuestionResponse,
  TrainingVideoResponse,
  TrainingExternalCourseResponse,
  EmployeeTrainingCertificateResponse,
  CreateTrainingExternalCourseRequest,
  UpdateTrainingExternalCourseRequest,
  TrainingAttemptSubmitResponse,
  SubmitTrainingAttemptRequest,
  PagedResult,
} from "@/types";

export const trainingApi = {
  // ── Modules ──────────────────────────────────────────────────────────────
  getActiveModules: () =>
    apiClient.get<TrainingModuleSummaryResponse[]>("/api/training/modules/active"),

  getModule: (moduleId: string) =>
    apiClient.get<TrainingModuleDetailResponse>(`/api/training/modules/${moduleId}`),

  createModule: (data: CreateTrainingModuleRequest) =>
    apiClient.post<TrainingModuleDetailResponse>("/api/training/modules", data),

  updateModule: (moduleId: string, data: UpdateTrainingModuleRequest) =>
    apiClient.put<TrainingModuleDetailResponse>(
      `/api/training/modules/${moduleId}`,
      data
    ),

  deleteModule: (moduleId: string) =>
    apiClient.delete(`/api/training/modules/${moduleId}`),

  // ── Videos ───────────────────────────────────────────────────────────────
  addVideo: (moduleId: string, data: CreateTrainingVideoRequest) =>
    apiClient.post<TrainingVideoResponse>(
      `/api/training/modules/${moduleId}/videos`,
      data
    ),

  deleteVideo: (moduleId: string, videoId: string) =>
    apiClient.delete(`/api/training/modules/${moduleId}/videos/${videoId}`),

  // ── Questions ─────────────────────────────────────────────────────────────
  addQuestion: (moduleId: string, data: CreateTrainingQuestionRequest) =>
    apiClient.post<TrainingQuizQuestionResponse>(
      `/api/training/modules/${moduleId}/questions`,
      data
    ),

  updateQuestion: (
    moduleId: string,
    questionId: string,
    data: UpdateTrainingQuestionRequest
  ) =>
    apiClient.put<TrainingQuizQuestionResponse>(
      `/api/training/modules/${moduleId}/questions/${questionId}`,
      data
    ),

  deleteQuestion: (moduleId: string, questionId: string) =>
    apiClient.delete(`/api/training/modules/${moduleId}/questions/${questionId}`),

  // ── External Courses ───────────────────────────────────────────────────────
  addExternalCourse: (moduleId: string, data: CreateTrainingExternalCourseRequest) =>
    apiClient.post<TrainingExternalCourseResponse>(
      `/api/training/modules/${moduleId}/external-courses`,
      data
    ),

  updateExternalCourse: (
    moduleId: string,
    courseId: string,
    data: UpdateTrainingExternalCourseRequest
  ) =>
    apiClient.put<TrainingExternalCourseResponse>(
      `/api/training/modules/${moduleId}/external-courses/${courseId}`,
      data
    ),

  deleteExternalCourse: (moduleId: string, courseId: string) =>
    apiClient.delete(
      `/api/training/modules/${moduleId}/external-courses/${courseId}`
    ),

  // ── Certificates ───────────────────────────────────────────────────────────
  uploadCertificate: (moduleId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.post<EmployeeTrainingCertificateResponse>(
      `/api/training/modules/${moduleId}/certificates`,
      formData
    );
  },

  replaceCertificate: (moduleId: string, certificateId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient.put<EmployeeTrainingCertificateResponse>(
      `/api/training/modules/${moduleId}/certificates/${certificateId}`,
      formData
    );
  },

  deleteCertificate: (moduleId: string, certificateId: string) =>
    apiClient.delete(
      `/api/training/modules/${moduleId}/certificates/${certificateId}`
    ),

  getMyCertificates: (moduleId: string) =>
    apiClient.get<EmployeeTrainingCertificateResponse[]>(
      `/api/training/modules/${moduleId}/certificates/me`
    ),

  getEmployeeCertificates: (employeeId: string, moduleId: string) =>
    apiClient.get<EmployeeTrainingCertificateResponse[]>(
      `/api/training/employees/${employeeId}/modules/${moduleId}/certificates`
    ),

  // ── Attempts ──────────────────────────────────────────────────────────────
  submitAttempt: (moduleId: string, data: SubmitTrainingAttemptRequest) =>
    apiClient.post<TrainingAttemptSubmitResponse>(
      `/api/training/modules/${moduleId}/attempts`,
      data
    ),

  // ── Status ────────────────────────────────────────────────────────────────
  getMyStatus: () =>
    apiClient.get<EmployeeTrainingStatusResponse[]>("/api/training/me/status"),

  getEmployeeStatus: (employeeId: string, moduleId: string) =>
    apiClient.get<EmployeeTrainingStatusResponse>(
      `/api/training/employees/${employeeId}/status?moduleId=${moduleId}`
    ),

  getBranchStatuses: (branchId: string, page = 1, pageSize = 20) =>
    apiClient.get<PagedResult<EmployeeTrainingStatusResponse>>(
      `/api/training/branches/${branchId}/status?page=${page}&pageSize=${pageSize}`
    ),
};

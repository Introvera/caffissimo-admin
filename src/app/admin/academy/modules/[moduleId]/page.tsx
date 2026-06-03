"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Video,
  HelpCircle,
  Loader2,
  GripVertical,
  CheckCircle2,
  Circle,
  Trash2,
  ExternalLink,
  BookOpen,
  PenLine,
  Save,
  Pencil,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trainingApi } from "@/lib/training-api";
import {
  TrainingModuleType,
  type TrainingModuleDetailResponse,
  type CreateTrainingVideoRequest,
  type CreateTrainingQuestionRequest,
  type CreateTrainingQuestionOptionRequest,
  type CreateTrainingExternalCourseRequest,
  type UpdateTrainingExternalCourseRequest,
  type TrainingExternalCourseResponse,
  type UpdateTrainingQuestionRequest,
  type UpdateTrainingQuestionOptionRequest,
} from "@/types";
import { toast } from "sonner";

// ─── Default form states ────────────────────────────────────────────────────

const defaultVideoForm: CreateTrainingVideoRequest = {
  title: "",
  videoUrl: "",
  sortOrder: 1,
  isRequired: true,
  isActive: true,
};

const defaultOption = (): CreateTrainingQuestionOptionRequest => ({
  optionText: "",
  isCorrect: false,
});

const defaultQuestionForm = (): CreateTrainingQuestionRequest => ({
  questionText: "",
  sortOrder: 1,
  isActive: true,
  options: [defaultOption(), defaultOption()],
});

// ────────────────────────────────────────────────────────────────────────────

export default function ModuleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params.moduleId as string;

  const [module, setModule] = useState<TrainingModuleDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inline header edit
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [headerForm, setHeaderForm] = useState({ title: "", description: "", isActive: true });
  const [isSavingHeader, setIsSavingHeader] = useState(false);

  // Add Video dialog
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [videoForm, setVideoForm] = useState<CreateTrainingVideoRequest>(defaultVideoForm);
  const [isAddingVideo, setIsAddingVideo] = useState(false);

  // Add Question dialog
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [questionForm, setQuestionForm] = useState<CreateTrainingQuestionRequest>(
    defaultQuestionForm()
  );
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);

  // Edit Question dialog
  const [editQuestionDialogOpen, setEditQuestionDialogOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editQuestionForm, setEditQuestionForm] = useState<UpdateTrainingQuestionRequest>({
    questionText: "",
    sortOrder: 1,
    isActive: true,
    options: [],
  });
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // External Course dialog
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [courseEditTargetId, setCourseEditTargetId] = useState<string | null>(null);
  const [courseForm, setCourseForm] = useState<CreateTrainingExternalCourseRequest>({
    title: "",
    courseUrl: "",
    sortOrder: 1,
    isRequired: true,
    isActive: true,
  });
  const [isSavingCourse, setIsSavingCourse] = useState(false);

  const loadModule = async () => {
    setIsLoading(true);
    try {
      const data = await trainingApi.getModule(moduleId);
      setModule(data);
      setHeaderForm({
        title: data.title,
        description: data.description || "",
        isActive: data.isActive,
      });
    } catch {
      toast.error("Failed to load module");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (moduleId) loadModule();
  }, [moduleId]);

  const handleSaveHeader = async () => {
    if (!headerForm.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setIsSavingHeader(true);
    try {
      await trainingApi.updateModule(moduleId, {
        title: headerForm.title,
        description: headerForm.description || undefined,
        isActive: headerForm.isActive,
      });
      toast.success("Module updated");
      setIsEditingHeader(false);
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update module");
    } finally {
      setIsSavingHeader(false);
    }
  };

  // ── Video Actions ────────────────────────────────────────────────────────
  const handleAddVideo = async () => {
    if (!videoForm.title.trim() || !videoForm.videoUrl.trim()) {
      toast.error("Title and video URL are required");
      return;
    }
    setIsAddingVideo(true);
    try {
      await trainingApi.addVideo(moduleId, videoForm);
      toast.success("Video added");
      setVideoDialogOpen(false);
      setVideoForm({ ...defaultVideoForm, sortOrder: (module?.videos.length ?? 0) + 1 });
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add video");
    } finally {
      setIsAddingVideo(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;
    try {
      await trainingApi.deleteVideo(moduleId, videoId);
      toast.success("Video deleted successfully");
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete video");
    }
  };

  // ── Question Actions ─────────────────────────────────────────────────────
  const handleAddQuestion = async () => {
    if (!questionForm.questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (questionForm.options.some((o) => !o.optionText.trim())) {
      toast.error("All option texts must be filled in");
      return;
    }
    if (!questionForm.options.some((o) => o.isCorrect)) {
      toast.error("Please mark at least one option as correct");
      return;
    }
    setIsAddingQuestion(true);
    try {
      await trainingApi.addQuestion(moduleId, questionForm);
      toast.success("Question added");
      setQuestionDialogOpen(false);
      setQuestionForm({
        ...defaultQuestionForm(),
        sortOrder: (module?.questions.length ?? 0) + 1,
      });
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to add question");
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const openEditQuestion = (q: any) => {
    setEditingQuestionId(q.trainingQuizQuestionId);
    setEditQuestionForm({
      questionText: q.questionText,
      sortOrder: q.sortOrder,
      isActive: q.isActive,
      options: q.options.map((o: any) => ({
        trainingQuizOptionId: o.trainingQuizOptionId,
        optionText: o.optionText,
        isCorrect: false, // Defaulting to false since backend doesn't expose it
      })),
    });
    setEditQuestionDialogOpen(true);
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestionId) return;
    if (!editQuestionForm.questionText.trim()) {
      toast.error("Question text is required");
      return;
    }
    if (editQuestionForm.options.some((o) => !o.optionText.trim())) {
      toast.error("All option texts must be filled in");
      return;
    }
    if (!editQuestionForm.options.some((o) => o.isCorrect)) {
      toast.error("Please re-select the correct option before saving");
      return;
    }
    setIsSavingQuestion(true);
    try {
      await trainingApi.updateQuestion(moduleId, editingQuestionId, editQuestionForm);
      toast.success("Question updated successfully");
      setEditQuestionDialogOpen(false);
      setEditingQuestionId(null);
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to update question");
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!window.confirm("Are you sure you want to delete this quiz question?")) return;
    try {
      await trainingApi.deleteQuestion(moduleId, questionId);
      toast.success("Question deleted successfully");
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete question");
    }
  };

  const updateOption = (
    index: number,
    patch: Partial<CreateTrainingQuestionOptionRequest>
  ) => {
    const updated = questionForm.options.map((o, i) =>
      i === index ? { ...o, ...patch } : o
    );
    setQuestionForm({ ...questionForm, options: updated });
  };

  const setCorrectOption = (index: number) => {
    const updated = questionForm.options.map((o, i) => ({
      ...o,
      isCorrect: i === index,
    }));
    setQuestionForm({ ...questionForm, options: updated });
  };

  const addOptionField = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, defaultOption()],
    });
  };

  const removeOptionField = (index: number) => {
    if (questionForm.options.length <= 2) {
      toast.error("A question must have at least 2 options");
      return;
    }
    setQuestionForm({
      ...questionForm,
      options: questionForm.options.filter((_, i) => i !== index),
    });
  };

  // ── Edit Question Options Helpers ────────────────────────────────────────
  const updateEditOption = (
    index: number,
    patch: Partial<UpdateTrainingQuestionOptionRequest>
  ) => {
    const updated = editQuestionForm.options.map((o, i) =>
      i === index ? { ...o, ...patch } : o
    );
    setEditQuestionForm({ ...editQuestionForm, options: updated });
  };

  const setCorrectEditOption = (index: number) => {
    const updated = editQuestionForm.options.map((o, i) => ({
      ...o,
      isCorrect: i === index,
    }));
    setEditQuestionForm({ ...editQuestionForm, options: updated });
  };

  const addEditOptionField = () => {
    setEditQuestionForm({
      ...editQuestionForm,
      options: [...editQuestionForm.options, { optionText: "", isCorrect: false }],
    });
  };

  const removeEditOptionField = (index: number) => {
    if (editQuestionForm.options.length <= 2) {
      toast.error("A question must have at least 2 options");
      return;
    }
    setEditQuestionForm({
      ...editQuestionForm,
      options: editQuestionForm.options.filter((_, i) => i !== index),
    });
  };

  // ── External Course Actions ──────────────────────────────────────────────
  const handleSaveExternalCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.courseUrl.trim()) {
      toast.error("Title and Course URL are required");
      return;
    }
    setIsSavingCourse(true);
    try {
      if (courseEditTargetId) {
        await trainingApi.updateExternalCourse(moduleId, courseEditTargetId, courseForm);
        toast.success("External course updated");
      } else {
        await trainingApi.addExternalCourse(moduleId, courseForm);
        toast.success("External course added");
      }
      setCourseDialogOpen(false);
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to save external course");
    } finally {
      setIsSavingCourse(false);
    }
  };

  const handleEditExternalCourse = (course: TrainingExternalCourseResponse) => {
    setCourseEditTargetId(course.trainingExternalCourseId);
    setCourseForm({
      title: course.title,
      courseUrl: course.courseUrl,
      sortOrder: course.sortOrder,
      isRequired: course.isRequired,
      isActive: course.isActive,
    });
    setCourseDialogOpen(true);
  };

  const handleDeleteExternalCourse = async (courseId: string) => {
    if (!window.confirm("Are you sure you want to delete this external course?")) return;
    try {
      await trainingApi.deleteExternalCourse(moduleId, courseId);
      toast.success("External course deleted");
      await loadModule();
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete external course");
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <BookOpen className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">Module not found</p>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={() => router.push("/admin/academy/modules")}
        id="back-to-modules"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Modules
      </Button>

      {/* Module Header Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BookOpen className="h-5 w-5" />
              </div>
              {isEditingHeader ? (
                <div className="flex-1 space-y-3 min-w-0">
                  <div className="space-y-1.5">
                    <Label htmlFor="header-title">Title</Label>
                    <Input
                      id="header-title"
                      value={headerForm.title}
                      onChange={(e) =>
                        setHeaderForm({ ...headerForm, title: e.target.value })
                      }
                      className="max-w-md"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="header-desc">Description</Label>
                    <Textarea
                      id="header-desc"
                      rows={2}
                      value={headerForm.description}
                      onChange={(e) =>
                        setHeaderForm({ ...headerForm, description: e.target.value })
                      }
                      className="max-w-md"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="header-active"
                      checked={headerForm.isActive}
                      onCheckedChange={(v) =>
                        setHeaderForm({ ...headerForm, isActive: v })
                      }
                    />
                    <Label htmlFor="header-active" className="text-sm">
                      Active
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground">{module.title}</h1>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 border-0 ${
                        module.moduleType === TrainingModuleType.External
                          ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                          : "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                      }`}
                    >
                      {module.moduleType}
                    </Badge>
                    <Badge
                      variant={module.isActive ? "default" : "secondary"}
                      className={`text-[10px] px-1.5 py-0 ${
                        module.isActive
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0"
                          : ""
                      }`}
                    >
                      {module.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {module.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {module.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                    {module.moduleType === TrainingModuleType.External ? (
                      <span className="flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        {(module.externalCourses ?? []).length} course{(module.externalCourses ?? []).length !== 1 ? "s" : ""}
                      </span>
                    ) : (
                      <>
                        <span className="flex items-center gap-1">
                          <Video className="h-3.5 w-3.5" />
                          {module.videos.length} video{module.videos.length !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1">
                          <HelpCircle className="h-3.5 w-3.5" />
                          {module.questions.length} question{module.questions.length !== 1 ? "s" : ""}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Edit / Save buttons */}
            <div className="flex items-center gap-2 shrink-0">
              {isEditingHeader ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingHeader(false);
                      setHeaderForm({
                        title: module.title,
                        description: module.description || "",
                        isActive: module.isActive,
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveHeader}
                    disabled={isSavingHeader}
                    id="save-module-header"
                  >
                    {isSavingHeader ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1.5" />
                        Save
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingHeader(true)}
                  id="edit-module-header"
                >
                  <PenLine className="h-4 w-4 mr-1.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs: Videos / Quiz vs External Courses */}
      <Tabs defaultValue={module.moduleType === TrainingModuleType.External ? "courses" : "videos"}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            {module.moduleType === TrainingModuleType.External ? (
              <TabsTrigger value="courses" id="tab-courses">
                <ExternalLink className="h-4 w-4 mr-1.5" />
                External Courses ({(module.externalCourses ?? []).length})
              </TabsTrigger>
            ) : (
              <>
                <TabsTrigger value="videos" id="tab-videos">
                  <Video className="h-4 w-4 mr-1.5" />
                  Videos ({module.videos.length})
                </TabsTrigger>
                <TabsTrigger value="quiz" id="tab-quiz">
                  <HelpCircle className="h-4 w-4 mr-1.5" />
                  Quiz ({module.questions.length})
                </TabsTrigger>
              </>
            )}
          </TabsList>
        </div>

        {/* ── VIDEOS TAB ─────────────────────────────────────────────────── */}
        {module.moduleType !== TrainingModuleType.External && (
          <TabsContent value="videos" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setVideoForm({
                    ...defaultVideoForm,
                    sortOrder: module.videos.length + 1,
                  });
                  setVideoDialogOpen(true);
                }}
                id="add-video-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </div>

            {module.videos.length === 0 ? (
              <Card>
                <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-muted">
                    <Video className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No videos yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add your first training video to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {module.videos
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((video, idx) => (
                    <Card key={video.trainingVideoId}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{video.title}</p>
                            <a
                              href={video.videoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {video.videoUrl}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {video.isRequired && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Required
                              </Badge>
                            )}
                            <Badge
                              variant={video.isActive ? "default" : "secondary"}
                              className={`text-[10px] px-1.5 py-0 ${
                                video.isActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0"
                                  : ""
                              }`}
                            >
                              {video.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteVideo(video.trainingVideoId)}
                              id={`delete-video-${video.trainingVideoId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* ── QUIZ TAB ───────────────────────────────────────────────────── */}
        {module.moduleType !== TrainingModuleType.External && (
          <TabsContent value="quiz" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setQuestionForm({
                    ...defaultQuestionForm(),
                    sortOrder: module.questions.length + 1,
                  });
                  setQuestionDialogOpen(true);
                }}
                id="add-question-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {module.questions.length === 0 ? (
              <Card>
                <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-muted">
                    <HelpCircle className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No quiz questions yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add questions so employees can test their knowledge
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {module.questions
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((question, qi) => (
                    <Card key={question.trainingQuizQuestionId}>
                      <CardHeader className="pb-2 pt-4 px-4 flex-row items-start justify-between gap-4 space-y-0">
                        <div className="flex items-start gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                            {qi + 1}
                          </span>
                          <p className="font-medium text-sm leading-snug">
                            {question.questionText}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge
                            variant={question.isActive ? "default" : "secondary"}
                            className={`text-[10px] px-1.5 py-0 ${
                              question.isActive
                                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0"
                                : ""
                            }`}
                          >
                            {question.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => openEditQuestion(question)}
                            id={`edit-question-${question.trainingQuizQuestionId}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteQuestion(question.trainingQuizQuestionId)}
                            id={`delete-question-${question.trainingQuizQuestionId}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <Separator className="mb-3" />
                        <div className="space-y-2 pl-9">
                          {question.options.map((option) => (
                            <div
                              key={option.trainingQuizOptionId}
                              className="flex items-center gap-2.5 text-sm text-muted-foreground"
                            >
                              <Circle className="h-3.5 w-3.5 shrink-0 text-border" />
                              <span>{option.optionText}</span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 pl-9 text-[11px] text-muted-foreground italic">
                          {question.options.length} answer option{question.options.length !== 1 ? "s" : ""}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        )}

        {/* ── EXTERNAL COURSES TAB ───────────────────────────────────────── */}
        {module.moduleType === TrainingModuleType.External && (
          <TabsContent value="courses" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  setCourseEditTargetId(null);
                  setCourseForm({
                    title: "",
                    courseUrl: "",
                    sortOrder: (module.externalCourses?.length ?? 0) + 1,
                    isRequired: true,
                    isActive: true,
                  });
                  setCourseDialogOpen(true);
                }}
                id="add-course-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add External Course
              </Button>
            </div>

            {(!module.externalCourses || module.externalCourses.length === 0) ? (
              <Card>
                <CardContent className="py-14 flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-muted">
                    <ExternalLink className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">No external courses yet</p>
                  <p className="text-sm text-muted-foreground">
                    Add links to external courses or materials for this module
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {module.externalCourses
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((course, idx) => (
                    <Card key={course.trainingExternalCourseId}>
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{course.title}</p>
                            <a
                              href={course.courseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 truncate max-w-xs"
                            >
                              <ExternalLink className="h-3 w-3 shrink-0" />
                              {course.courseUrl}
                            </a>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {course.isRequired && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                Required
                              </Badge>
                            )}
                            <Badge
                              variant={course.isActive ? "default" : "secondary"}
                              className={`text-[10px] px-1.5 py-0 ${
                                course.isActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0"
                                  : ""
                              }`}
                            >
                              {course.isActive ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                              onClick={() => handleEditExternalCourse(course)}
                              id={`edit-course-${course.trainingExternalCourseId}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDeleteExternalCourse(course.trainingExternalCourseId)}
                              id={`delete-course-${course.trainingExternalCourseId}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* ── Add Video Dialog ───────────────────────────────────────────────── */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Add Video</DialogTitle>
            <DialogDescription>
              Add a training video to this module.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="video-title">Title *</Label>
              <Input
                id="video-title"
                placeholder="e.g. Espresso Extraction Basics"
                value={videoForm.title}
                onChange={(e) =>
                  setVideoForm({ ...videoForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="video-url">Video URL *</Label>
              <Input
                id="video-url"
                placeholder="https://..."
                value={videoForm.videoUrl}
                onChange={(e) =>
                  setVideoForm({ ...videoForm, videoUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Paste a YouTube, Vimeo, or direct video link
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="video-sort">Sort Order</Label>
                <Input
                  id="video-sort"
                  type="number"
                  min={1}
                  value={videoForm.sortOrder}
                  onChange={(e) =>
                    setVideoForm({
                      ...videoForm,
                      sortOrder: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Required</p>
                <p className="text-xs text-muted-foreground">
                  Employees must watch this video to complete the module
                </p>
              </div>
              <Switch
                id="video-required"
                checked={videoForm.isRequired}
                onCheckedChange={(v) =>
                  setVideoForm({ ...videoForm, isRequired: v })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Show this video to employees
                </p>
              </div>
              <Switch
                id="video-active"
                checked={videoForm.isActive}
                onCheckedChange={(v) =>
                  setVideoForm({ ...videoForm, isActive: v })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVideoDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddVideo}
              disabled={isAddingVideo}
              id="confirm-add-video"
            >
              {isAddingVideo ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Video"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Question Dialog ────────────────────────────────────────────── */}
      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Quiz Question</DialogTitle>
            <DialogDescription>
              Add a multiple-choice question. Mark the correct answer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="q-text">Question *</Label>
              <Textarea
                id="q-text"
                rows={2}
                placeholder="e.g. What is the ideal extraction time for a double espresso?"
                value={questionForm.questionText}
                onChange={(e) =>
                  setQuestionForm({ ...questionForm, questionText: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="q-sort">Sort Order</Label>
              <Input
                id="q-sort"
                type="number"
                min={1}
                className="w-24"
                value={questionForm.sortOrder}
                onChange={(e) =>
                  setQuestionForm({
                    ...questionForm,
                    sortOrder: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options *</Label>
                <p className="text-xs text-muted-foreground">
                  Click the circle to mark correct
                </p>
              </div>

              {questionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Correct radio */}
                  <button
                    type="button"
                    onClick={() => setCorrectOption(idx)}
                    className="shrink-0 focus:outline-none"
                    title="Mark as correct"
                    id={`option-correct-${idx}`}
                  >
                    {opt.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                    )}
                  </button>
                  <Input
                    id={`option-text-${idx}`}
                    placeholder={`Option ${idx + 1}`}
                    value={opt.optionText}
                    onChange={(e) =>
                      updateOption(idx, { optionText: e.target.value })
                    }
                    className={`flex-1 ${opt.isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeOptionField(idx)}
                    disabled={questionForm.options.length <= 2}
                    id={`remove-option-${idx}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOptionField}
                className="w-full"
                id="add-option-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Include this question in the quiz
                </p>
              </div>
              <Switch
                id="q-active"
                checked={questionForm.isActive}
                onCheckedChange={(v) =>
                  setQuestionForm({ ...questionForm, isActive: v })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddQuestion}
              disabled={isAddingQuestion}
              id="confirm-add-question"
            >
              {isAddingQuestion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Question"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Question Dialog ────────────────────────────────────────────── */}
      <Dialog open={editQuestionDialogOpen} onOpenChange={setEditQuestionDialogOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Quiz Question</DialogTitle>
            <DialogDescription>
              Modify the question text and options. Mark the correct answer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-q-text">Question *</Label>
              <Textarea
                id="edit-q-text"
                rows={2}
                placeholder="e.g. What is the ideal extraction time for a double espresso?"
                value={editQuestionForm.questionText}
                onChange={(e) =>
                  setEditQuestionForm({ ...editQuestionForm, questionText: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-q-sort">Sort Order</Label>
              <Input
                id="edit-q-sort"
                type="number"
                min={1}
                className="w-24"
                value={editQuestionForm.sortOrder}
                onChange={(e) =>
                  setEditQuestionForm({
                    ...editQuestionForm,
                    sortOrder: parseInt(e.target.value) || 1,
                  })
                }
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Answer Options *</Label>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    Click the circle to mark correct
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                    Please re-select the correct answer option
                  </p>
                </div>
              </div>

              {editQuestionForm.options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {/* Correct radio */}
                  <button
                    type="button"
                    onClick={() => setCorrectEditOption(idx)}
                    className="shrink-0 focus:outline-none"
                    title="Mark as correct"
                    id={`edit-option-correct-${idx}`}
                  >
                    {opt.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                    )}
                  </button>
                  <Input
                    id={`edit-option-text-${idx}`}
                    placeholder={`Option ${idx + 1}`}
                    value={opt.optionText}
                    onChange={(e) =>
                      updateEditOption(idx, { optionText: e.target.value })
                    }
                    className={`flex-1 ${opt.isCorrect ? "border-emerald-500/50 bg-emerald-500/5" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeEditOptionField(idx)}
                    disabled={editQuestionForm.options.length <= 2}
                    id={`edit-remove-option-${idx}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEditOptionField}
                className="w-full"
                id="edit-add-option-btn"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Include this question in the quiz
                </p>
              </div>
              <Switch
                id="edit-q-active"
                checked={editQuestionForm.isActive}
                onCheckedChange={(v) =>
                  setEditQuestionForm({ ...editQuestionForm, isActive: v })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={isSavingQuestion}
              id="confirm-edit-question"
            >
              {isSavingQuestion ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add/Edit External Course Dialog ─────────────────────────────────── */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{courseEditTargetId ? "Edit External Course" : "Add External Course"}</DialogTitle>
            <DialogDescription>
              Provide links to external course materials or certifications.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">Title *</Label>
              <Input
                id="course-title"
                placeholder="e.g. Food Safety Training Level 1"
                value={courseForm.title}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, title: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-url">Course URL *</Label>
              <Input
                id="course-url"
                placeholder="https://..."
                value={courseForm.courseUrl}
                onChange={(e) =>
                  setCourseForm({ ...courseForm, courseUrl: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                The URL where employees can complete this training course.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-sort">Sort Order</Label>
                <Input
                  id="course-sort"
                  type="number"
                  min={1}
                  value={courseForm.sortOrder}
                  onChange={(e) =>
                    setCourseForm({
                      ...courseForm,
                      sortOrder: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Required</p>
                <p className="text-xs text-muted-foreground">
                  Employees must visit/complete this course to pass
                </p>
              </div>
              <Switch
                id="course-required"
                checked={courseForm.isRequired}
                onCheckedChange={(v) =>
                  setCourseForm({ ...courseForm, isRequired: v })
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-xs text-muted-foreground">
                  Show this course to employees immediately
                </p>
              </div>
              <Switch
                id="course-active"
                checked={courseForm.isActive}
                onCheckedChange={(v) =>
                  setCourseForm({ ...courseForm, isActive: v })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveExternalCourse}
              disabled={isSavingCourse}
              id="confirm-save-course"
            >
              {isSavingCourse ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Course"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/auth";
import toast from "react-hot-toast";
import LearningProgressCard from "../components/LearningProgressCard";
import EditLearningProgressModal from "../components/EditLearningProgressModal";
import useConfirmModal from "../hooks/useConfirmModal";
import ConfirmModal from "../components/ConfirmModal";
import {
  createLearningProgress,
  getAllLearningProgress,
  deleteLearningProgress,
  addLike,
  removeLike,
  addComment,
} from "../api/learningProgressAPI";
import { getLearningPlansByUserId } from "../api/learningPlanAPI";
import {
  Award,
  BookOpen,
  Code,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  Edit,
  X,
  Filter,
  Plus,
  Book
} from "lucide-react";

// Status options
const STATUS_OPTIONS = [
  {
    id: "not_started",
    name: "Not Started",
    icon: <AlertCircle size={16} className="mr-2" />,
    color: "text-gray-400",
  },
  {
    id: "in_progress",
    name: "In Progress",
    icon: <Clock size={16} className="mr-2" />,
    color: "text-yellow-400",
  },
  {
    id: "completed",
    name: "Completed",
    icon: <CheckCircle size={16} className="mr-2" />,
    color: "text-green-400",
  },
];

// Templates
const TEMPLATES = [
  {
    id: "general",
    name: "General Progress",
    icon: <Award size={16} className="mr-2" />,
    fields: ["title", "description", "skillsLearned"],
  },
  {
    id: "tutorial",
    name: "Tutorial Completion",
    icon: <BookOpen size={16} className="mr-2" />,
    fields: ["title", "tutorialName", "skillsLearned", "challenges"],
  },
  {
    id: "project",
    name: "Project Milestone",
    icon: <Code size={16} className="mr-2" />,
    fields: [
      "title",
      "projectName",
      "description",
      "skillsLearned",
      "nextSteps",
    ],
  },
];

const LearningProgressPage = () => {
  const { currentUser } = useAuth();
  const [progressEntries, setProgressEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0].id);
  const [selectedStatus, setSelectedStatus] = useState(STATUS_OPTIONS[0].id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProgress, setEditingProgress] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const { modalState, openModal, closeModal } = useConfirmModal();
  const [userLearningPlans, setUserLearningPlans] = useState([]);
  const [selectedLearningPlan, setSelectedLearningPlan] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      tutorialName: "",
      projectName: "",
      skillsLearned: "",
      challenges: "",
      nextSteps: "",
    },
  });

  useEffect(() => {
    fetchProgressEntries();
  }, []);

  const fetchProgressEntries = async () => {
    setLoading(true);
    try {
      const response = await getAllLearningProgress(currentUser?.token);
      setProgressEntries(response.data);
    } catch (error) {
      console.error("Error fetching learning progress entries:", error);
      toast.error("Failed to load learning progress entries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserPlans = async () => {
      if (!currentUser?.id) return;
      
      try {
        const response = await getLearningPlansByUserId(
          currentUser.id, 
          currentUser.token
        );
        setUserLearningPlans(response.data || []);
      } catch (error) {
        console.error("Error fetching learning plans:", error);
      }
    };
    
    fetchUserPlans();
  }, [currentUser]);

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
    reset({
      title: "",
      description: "",
      tutorialName: "",
      projectName: "",
      skillsLearned: "",
      challenges: "",
      nextSteps: "",
    });
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const handleProgressSubmit = async (data) => {
    if (!currentUser) {
      toast.error("You must be logged in to share progress");
      return;
    }

    const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);
    const requiredFields = currentTemplate.fields.filter(
        (field) =>
            field === "title" ||
            field === "description" ||
            field === "tutorialName" ||
            field === "projectName"
    );

    const isValid = requiredFields.every((field) => data[field]?.trim());
    if (!isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const progressData = {
        userId: currentUser.id,
        userName: currentUser.name,
        userProfileImage: currentUser.profileImage,
        templateType: selectedTemplate,
        status: selectedStatus,
        learningPlanId: selectedLearningPlan,
        ...data,
      };

      const response = await createLearningProgress(
          currentUser.id,
          progressData,
          currentUser.token
      );

      toast.success("Progress shared successfully");

      setProgressEntries([response.data, ...progressEntries]);

      reset();
      setSelectedTemplate(TEMPLATES[0].id);
      setSelectedStatus(STATUS_OPTIONS[0].id);
      setShowCreateForm(false);
    } catch (error) {
      console.error("Error creating learning progress:", error);
      toast.error("Failed to share progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (progressId) => {
    if (!currentUser) {
      toast.error("You must be logged in to like this progress");
      return;
    }

    try {
      const isLiked = progressEntries
          .find((p) => p.id === progressId)
          ?.likes?.some((like) => like.userId === currentUser.id);

      if (isLiked) {
        // Unlike
        await removeLike(progressId, currentUser.id, currentUser.token);

        // Update state
        setProgressEntries(
            progressEntries.map((entry) => {
              if (entry.id === progressId) {
                return {
                  ...entry,
                  likes: entry.likes.filter(
                      (like) => like.userId !== currentUser.id
                  ),
                };
              }
              return entry;
            })
        );
      } else {
        // Like
        const likeData = { userId: currentUser.id };
        const response = await addLike(progressId, likeData, currentUser.token);

        // Update state
        setProgressEntries(
            progressEntries.map((entry) => {
              if (entry.id === progressId) {
                return response.data;
              }
              return entry;
            })
        );
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to process like");
    }
  };

  const handleAddComment = async (progressId, commentData) => {
    if (!currentUser) {
      toast.error("You must be logged in to comment");
      return;
    }

    try {
      const response = await addComment(
          progressId,
          commentData,
          currentUser.token
      );

      // Update state
      setProgressEntries(
          progressEntries.map((entry) => {
            if (entry.id === progressId) {
              return response.data;
            }
            return entry;
          })
      );
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
      throw error;
    }
  };

  const handleUpdateComment = async (progressId, commentId, updatedContent) => {
    setProgressEntries(
        progressEntries.map((progressEntry) => {
          if (progressEntry.id === progressId) {
            return {
              ...progressEntry,
              comments: progressEntry.comments.map((comment) => {
                if (comment.id === commentId) {
                  return {
                    ...comment,
                    content: updatedContent,
                    updatedAt: new Date(),
                  };
                }
                return comment;
              }),
            };
          }
          return progressEntry;
        })
    );
  };

  const handleDeleteComment = async (progressId, commentId) => {
    setProgressEntries(
        progressEntries.map((progressEntry) => {
          if (progressEntry.id === progressId) {
            return {
              ...progressEntry,
              comments: progressEntry.comments.filter(
                  (comment) => comment.id !== commentId
              ),
            };
          }
          return progressEntry;
        })
    );
  };

  const handleEdit = (progress) => {
    setEditingProgress(progress);
  };

  const handleProgressUpdated = async () => {
    await fetchProgressEntries();
    setEditingProgress(null);
  };

  const handleDelete = (progressId) => {
    openModal({
      title: "Delete Learning Progress",
      message:
          "Are you sure you want to delete this learning progress? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await deleteLearningProgress(progressId, currentUser.token);

          // Update state
          setProgressEntries(
              progressEntries.filter((entry) => entry.id !== progressId)
          );

          toast.success("Learning progress deleted");
        } catch (error) {
          console.error("Error deleting learning progress:", error);
          toast.error("Failed to delete learning progress");
        }
      },
    });
  };

  // Get filtered progress entries
  const getFilteredEntries = () => {
    if (filterType === "all") return progressEntries;
    return progressEntries.filter(entry => entry.templateType === filterType);
  };

  // Get the current template object
  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
      <div className="max-w-2xl mx-auto pb-10">
        {/* Create Progress Button */}
        <motion.div
            className="bg-black rounded-xl shadow-lg border border-gray-500 mb-6 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
          {showCreateForm ? (
              <div>
                <div className="p-4 border-b border-gray-500 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-white flex items-center">
                <span className="text-yellow-400 mr-2">
                  {currentTemplate.icon}
                </span>
                    Share Your Learning Progress
                  </h2>
                  <button
                      onClick={() => setShowCreateForm(false)}
                      className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-800 cursor-pointer"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit(handleProgressSubmit)} className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Template Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Progress Type
                      </label>
                      <div className="relative">
                        <select
                            value={selectedTemplate}
                            onChange={handleTemplateChange}
                            className="w-full p-2 bg-black rounded-lg border border-gray-500 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none pl-8 pr-4"
                            disabled={isSubmitting}
                        >
                          {TEMPLATES.map((template) => (
                              <option key={template.id} value={template.id}>
                                {template.name}
                              </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-yellow-400">
                          {TEMPLATES.find(t => t.id === selectedTemplate)?.icon}
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Status
                      </label>
                      <div className="relative">
                        <select
                            value={selectedStatus}
                            onChange={handleStatusChange}
                            className="w-full p-2 bg-black rounded-lg border border-gray-500 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none pl-8 pr-4"
                            disabled={isSubmitting}
                        >
                          {STATUS_OPTIONS.map((status) => (
                              <option key={status.id} value={status.id} className={status.color}>
                                {status.name}
                              </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                      <span className={STATUS_OPTIONS.find(s => s.id === selectedStatus)?.color}>
                        {STATUS_OPTIONS.find(s => s.id === selectedStatus)?.icon}
                      </span>
                        </div>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                          <ChevronDown size={16} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Form Fields based on selected template */}
                  <div className="space-y-4">
                    {currentTemplate.fields.includes("title") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Title*
                          </label>
                          <input
                              type="text"
                              {...register("title", { required: "Title is required" })}
                              placeholder="Give your progress update a clear title"
                              className={`w-full p-2 bg-black rounded-lg border ${
                                  errors.title ? "border-red-500" : "border-gray-500"
                              } text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none`}
                              disabled={isSubmitting}
                          />
                          {errors.title && (
                              <p className="mt-1 text-sm text-red-500">
                                {errors.title.message}
                              </p>
                          )}
                        </div>
                    )}

                    {currentTemplate.fields.includes("description") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Description*
                          </label>
                          <textarea
                              {...register("description", {
                                required: currentTemplate.fields.includes("description")
                                    ? "Description is required"
                                    : false,
                              })}
                              placeholder="Describe what you've learned or accomplished"
                              rows="3"
                              className={`w-full p-2 bg-black rounded-lg border ${
                                  errors.description ? "border-red-500" : "border-gray-500"
                              } text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none`}
                              disabled={isSubmitting}
                          />
                          {errors.description && (
                              <p className="mt-1 text-sm text-red-500">
                                {errors.description.message}
                              </p>
                          )}
                        </div>
                    )}

                    {currentTemplate.fields.includes("tutorialName") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Tutorial Name*
                          </label>
                          <input
                              type="text"
                              {...register("tutorialName", {
                                required: currentTemplate.fields.includes("tutorialName")
                                    ? "Tutorial name is required"
                                    : false,
                              })}
                              placeholder="Name of the tutorial you completed"
                              className={`w-full p-2 bg-black rounded-lg border ${
                                  errors.tutorialName ? "border-red-500" : "border-gray-500"
                              } text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none`}
                              disabled={isSubmitting}
                          />
                          {errors.tutorialName && (
                              <p className="mt-1 text-sm text-red-500">
                                {errors.tutorialName.message}
                              </p>
                          )}
                        </div>
                    )}

                    {currentTemplate.fields.includes("projectName") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Project Name*
                          </label>
                          <input
                              type="text"
                              {...register("projectName", {
                                required: currentTemplate.fields.includes("projectName")
                                    ? "Project name is required"
                                    : false,
                              })}
                              placeholder="Name of your project"
                              className={`w-full p-2 bg-black rounded-lg border ${
                                  errors.projectName ? "border-red-500" : "border-gray-500"
                              } text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none`}
                              disabled={isSubmitting}
                          />
                          {errors.projectName && (
                              <p className="mt-1 text-sm text-red-500">
                                {errors.projectName.message}
                              </p>
                          )}
                        </div>
                    )}

                    {currentTemplate.fields.includes("skillsLearned") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Skills Learned
                          </label>
                          <input
                              type="text"
                              {...register("skillsLearned")}
                              placeholder="Skills or technologies (comma-separated)"
                              className="w-full p-2 bg-black rounded-lg border border-gray-500 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                              disabled={isSubmitting}
                          />
                          <p className="text-xs text-gray-500 mt-1">Example: JavaScript, React, Node.js</p>
                        </div>
                    )}

                    {currentTemplate.fields.includes("challenges") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Challenges Faced
                          </label>
                          <textarea
                              {...register("challenges")}
                              placeholder="What challenges did you encounter and how did you overcome them?"
                              rows="2"
                              className="w-full p-2 bg-black rounded-lg border border-gray-500 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none"
                              disabled={isSubmitting}
                          />
                        </div>
                    )}

                    {currentTemplate.fields.includes("nextSteps") && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Next Steps
                          </label>
                          <textarea
                              {...register("nextSteps")}
                              placeholder="What are your next steps or goals?"
                              rows="2"
                              className="w-full p-2 bg-black rounded-lg border border-gray-500 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none cursor-pointer"
                              disabled={isSubmitting}
                          />
                        </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <Book size={16} className="text-yellow-400 mr-2" />
                      <label className="text-sm font-medium text-yellow-400">
                        Related Learning Plan (Optional)
                      </label>
                    </div>
                    <select
                      value={selectedLearningPlan}
                      onChange={(e) => setSelectedLearningPlan(e.target.value)}
                      className="w-full p-2 bg-black rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none"
                      disabled={isSubmitting}
                    >
                      <option value="">None</option>
                      {userLearningPlans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <motion.button
                        type="button"
                        onClick={() => setShowCreateForm(false)}
                        className="px-4 py-2 bg-black text-gray-300 rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        disabled={isSubmitting}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                        type="submit"
                        className="px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition-colors disabled:bg-yellow-900 disabled:text-gray-500 cursor-pointer"
                        whileHover={{ scale: isSubmitting ? 1 : 1.03 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.97 }}
                        disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sharing..." : "Share Progress"}
                    </motion.button>
                  </div>
                </form>
              </div>
          ) : (
              <button
                  onClick={() => setShowCreateForm(true)}
                  className="p-4 w-full flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gray-800 group-hover:bg-gray-700 flex items-center justify-center">
                  <Plus className="text-yellow-400" size={20} />
                </div>
                <span className="text-white font-medium">Share Your Learning Progress</span>
              </button>
          )}
        </motion.div>

        {/* Filter Controls */}
        <motion.div
            className="bg-black rounded-xl p-2 flex justify-between items-center shadow-lg border border-gray-500 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center space-x-1">
          <span className="text-gray-400 px-2 hidden sm:inline">
            <Filter size={16} />
          </span>
            <span className="text-gray-300 font-medium hidden sm:inline">Filter:</span>
          </div>

          <div className="flex bg-black rounded-lg p-1">
            <button
                onClick={() => setFilterType('all')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    filterType === 'all'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
              <span className="sm:hidden">All</span>
              <span className="hidden sm:inline">All Progress</span>
            </button>

            <button
                onClick={() => setFilterType('general')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    filterType === 'general'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
              <Award size={14} className="sm:mr-1" />
              <span className="hidden sm:inline">General</span>
            </button>

            <button
                onClick={() => setFilterType('tutorial')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
                    filterType === 'tutorial'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
              <BookOpen size={14} className="sm:mr-1" />
              <span className="hidden sm:inline">Tutorials</span>
            </button>

            <button
                onClick={() => setFilterType('project')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filterType === 'project'
                        ? 'bg-black text-yellow-400'
                        : 'text-gray-400 hover:text-white'
                }`}
            >
              <Code size={14} className="sm:mr-1" />
              <span className="hidden sm:inline">Projects</span>
            </button>
          </div>
        </motion.div>

        {/* Progress Entries Feed */}
        {loading ? (
            <div className="flex justify-center items-center my-12">
              <motion.div
                  className="relative w-12 h-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
              >
                <div className="absolute inset-0">
                  <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" className="w-full h-full animate-spin">
                    <path
                        d="M40 8L73.3 26V62L40 80L6.7 62V26L40 8Z"
                        fill="none"
                        stroke="#F5D13B"
                        strokeWidth="4"
                        strokeDasharray="200"
                        strokeDashoffset="150"
                        strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 bg-yellow-500 opacity-70 rounded-sm rotate-45"></div>
                </div>
              </motion.div>
            </div>
        ) : getFilteredEntries().length === 0 ? (
            <motion.div
                className="bg-black rounded-xl p-8 text-center shadow-lg border border-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="mb-4 flex justify-center">
                <div className="relative w-16 h-16">
                  <svg
                      width="64"
                      height="64"
                      viewBox="0 0 80 80"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                        d="M40 12L69.3 28V60L40 76L10.7 60V28L40 12Z"
                        fill="#F5D13B"
                        fillOpacity="0.2"
                        stroke="#F5D13B"
                        strokeWidth="2"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-yellow-400">
                    <BookOpen size={24} />
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                {filterType === 'all'
                    ? 'No progress updates yet'
                    : `No ${filterType === 'general' ? 'general progress' : filterType} updates yet`}
              </h3>
              <p className="text-gray-400 mb-4">
                Start sharing your learning journey with the community!
              </p>
              <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-yellow-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors"
              >
                <Plus size={18} className="mr-1" />
                Share Your Progress
              </button>
            </motion.div>
        ) : (
            <AnimatePresence>
              <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
              >
                {getFilteredEntries().map((entry, index) => (
                    <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 * index }}
                        layout
                    >
                      <LearningProgressCard
                          progress={entry}
                          currentUser={currentUser}
                          onLike={handleLike}
                          onComment={handleAddComment}
                          onDeleteComment={handleDeleteComment}
                          onUpdateComment={handleUpdateComment}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          token={currentUser?.token}
                      />
                    </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
        )}

        {/* Edit Progress Modal */}
        {editingProgress && (
            <EditLearningProgressModal
                progressEntry={editingProgress}
                onClose={() => setEditingProgress(null)}
                onProgressUpdated={handleProgressUpdated}
                token={currentUser?.token}
            />
        )}

        {/* Confirmation Modal */}
        <ConfirmModal
            isOpen={modalState.isOpen}
            onClose={closeModal}
            onConfirm={modalState.onConfirm}
            title={modalState.title}
            message={modalState.message}
            confirmText={modalState.confirmText}
            cancelText={modalState.cancelText}
            confirmButtonClass={modalState.confirmButtonClass}
            type={modalState.type}
        />
      </div>
  );
};

export default LearningProgressPage;

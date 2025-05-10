import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { X, Award, BookOpen, Code, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { updateLearningProgress } from "../api/learningProgressAPI";
import toast from "react-hot-toast";

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

const EditLearningProgressModal = ({
                                     progressEntry,
                                     onClose,
                                     onProgressUpdated,
                                     token,
                                   }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(
      progressEntry?.templateType || "general"
  );
  const [selectedStatus, setSelectedStatus] = useState(
      progressEntry?.status || "not_started"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      title: progressEntry?.title || "",
      description: progressEntry?.description || "",
      tutorialName: progressEntry?.tutorialName || "",
      projectName: progressEntry?.projectName || "",
      skillsLearned: progressEntry?.skillsLearned || "",
      challenges: progressEntry?.challenges || "",
      nextSteps: progressEntry?.nextSteps || "",
    },
  });

  const handleTemplateChange = (e) => {
    setSelectedTemplate(e.target.value);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
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
        setIsSubmitting(false);
        return;
      }

      const updatedData = {
        ...data,
        templateType: selectedTemplate,
        status: selectedStatus,
      };

      await updateLearningProgress(progressEntry.id, updatedData, token);
      toast.success("Progress updated successfully");
      onProgressUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating learning progress:", error);
      toast.error("Failed to update progress");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentTemplate = TEMPLATES.find((t) => t.id === selectedTemplate);

  return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50">
        <motion.div
            className="bg-black rounded-xl shadow-xl w-full max-w-md m-4 overflow-hidden border border-gray-500"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center p-4 border-b border-gray-500">
            <h3 className="text-lg font-bold text-white flex items-center">
            <span className="text-yellow-400 mr-2">
              {currentTemplate.icon}
            </span>
              Edit Learning Progress
            </h3>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors rounded-full p-1 hover:bg-black cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Template and Status Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Template
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTemplate}
                      onChange={handleTemplateChange}
                      className="w-full p-2 bg-black rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none pl-8 pr-4"
                    >
                      {TEMPLATES.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                      <span className="text-yellow-400">
                        {TEMPLATES.find(t => t.id === selectedTemplate)?.icon}
                      </span>
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
                      className="w-full p-2 bg-black rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none appearance-none pl-8 pr-4"
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
                        errors.title ? "border-red-500" : "border-gray-700"
                      } text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.title.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Other form fields with consistent styling */}
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
                        errors.description ? "border-red-500" : "border-gray-700"
                      } text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Consistent spacing and styling for all fields */}
                {currentTemplate.fields.includes("skillsLearned") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Skills Learned
                    </label>
                    <textarea
                      {...register("skillsLearned")}
                      placeholder="What skills did you learn or improve?"
                      rows="2"
                      className="w-full p-2 bg-black rounded-lg border border-gray-700 text-white focus:ring-2 focus:ring-yellow-500 focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  type="button"
                  onClick={onClose}
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
                  {isSubmitting ? "Updating..." : "Update Progress"}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
  );
};

export default EditLearningProgressModal;

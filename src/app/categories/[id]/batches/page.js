"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Target,
  Calendar,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function CategoryBatchesPage() {
  const [category, setCategory] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    jobDescription: "",
    requiredSkills: "",
    requiredExperience: "",
    priority: "medium",
    deadline: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const params = useParams();
  const categoryId = params.id;

  useEffect(() => {
    if (categoryId) {
      fetchCategoryBatches();
    }
  }, [categoryId]);

  const fetchCategoryBatches = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:2300/api/categories/${categoryId}/batches?includeStats=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setCategory(response.data.category);
      setBatches(response.data.batches);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching category batches:", error);
      if (error.response?.status === 401) {
        router.push("/auth/login");
      } else {
        setError("Failed to fetch batches");
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const submitData = {
        ...formData,
        categoryId,
        requiredSkills: formData.requiredSkills
          .split(",")
          .map((skill) => skill.trim())
          .filter((skill) => skill),
      };

      const url = editingBatch
        ? `http://localhost:2300/api/batches/${editingBatch._id}`
        : "http://localhost:2300/api/batches";

      const method = editingBatch ? "put" : "post";

      await axios[method](url, submitData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(
        editingBatch
          ? "Batch updated successfully!"
          : "Batch created successfully!"
      );
      setShowCreateModal(false);
      setEditingBatch(null);
      setFormData({
        name: "",
        jobDescription: "",
        requiredSkills: "",
        requiredExperience: "",
        priority: "medium",
        deadline: "",
      });
      fetchCategoryBatches();
    } catch (error) {
      console.error("Error saving batch:", error);
      setError(error.response?.data?.error || "Failed to save batch");
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setFormData({
      name: batch.name,
      jobDescription: batch.jobDescription,
      requiredSkills: batch.requiredSkills.join(", "),
      requiredExperience: batch.requiredExperience,
      priority: batch.priority,
      deadline: batch.deadline
        ? new Date(batch.deadline).toISOString().split("T")[0]
        : "",
    });
    setShowCreateModal(true);
  };

  const handleDelete = async (batchId) => {
    if (
      !confirm(
        "Are you sure you want to delete this batch? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:2300/api/batches/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess("Batch deleted successfully!");
      fetchCategoryBatches();
    } catch (error) {
      console.error("Error deleting batch:", error);
      setError(error.response?.data?.error || "Failed to delete batch");
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingBatch(null);
    setFormData({
      name: "",
      jobDescription: "",
      requiredSkills: "",
      requiredExperience: "",
      priority: "medium",
      deadline: "",
    });
    setError("");
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case "paused":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push("/categories")}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category?.name} Batches
              </h1>
              <p className="mt-2 text-gray-600">
                {category?.description || "Manage batches for this category"}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {batches.length} batch{batches.length !== 1 ? "es" : ""} total
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Batch
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Batches Grid */}
        {batches.length === 0 ? (
          <div className="text-center py-12">
            <Target className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No batches yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first batch to start organizing candidates
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create First Batch
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {batches.map((batch) => (
              <div
                key={batch._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(batch.status)}
                      <h3 className="text-lg font-semibold text-gray-900">
                        {batch.name}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          batch.priority
                        )}`}
                      >
                        {batch.priority}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {batch.jobDescription}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(batch)}
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(batch._id)}
                      className="text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Required Skills */}
                {batch.requiredSkills && batch.requiredSkills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Required Skills:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {batch.requiredSkills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {batch.requiredSkills.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{batch.requiredSkills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Experience */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700">
                    Experience Required:
                  </p>
                  <p className="text-sm text-gray-600">
                    {batch.requiredExperience}
                  </p>
                </div>

                {/* Statistics */}
                {batch.stats && (
                  <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                        <Users className="h-4 w-4" />
                        <span className="text-lg font-semibold">
                          {batch.stats.candidateCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Total</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-lg font-semibold">
                          {batch.stats.fitCandidatesCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Fit</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                        <XCircle className="h-4 w-4" />
                        <span className="text-lg font-semibold">
                          {batch.stats.notFitCandidatesCount}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Not Fit</p>
                    </div>
                  </div>
                )}

                {/* Fit Rate */}
                {batch.stats && batch.stats.candidateCount > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Fit Rate</span>
                      <span className="text-sm font-medium text-gray-900">
                        {batch.stats.fitRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${batch.stats.fitRate}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Deadline */}
                {batch.deadline && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Deadline: {new Date(batch.deadline).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Manage Candidates Button */}
                <button
                  onClick={() => router.push(`/batches/${batch._id}`)}
                  className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Manage Candidates
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingBatch ? "Edit Batch" : "Create New Batch"}
              </h2>

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Senior React Developer"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description *
                  </label>
                  <textarea
                    value={formData.jobDescription}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        jobDescription: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="4"
                    placeholder="Detailed job description and responsibilities..."
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Required Skills
                  </label>
                  <input
                    type="text"
                    value={formData.requiredSkills}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        requiredSkills: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="React, Node.js, TypeScript (comma separated)"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Separate skills with commas
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Experience *
                    </label>
                    <input
                      type="text"
                      value={formData.requiredExperience}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requiredExperience: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 3+ years in React development"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Deadline
                    </label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingBatch ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

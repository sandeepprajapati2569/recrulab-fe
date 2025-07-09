"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import {
  Plus,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  UserPlus,
  UserMinus,
  RefreshCw,
  Target,
  TrendingUp,
  AlertCircle,
  Star,
} from "lucide-react";

export default function BatchManagementPage() {
  const [batch, setBatch] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reassessing, setReassessing] = useState(false);
  const router = useRouter();
  const params = useParams();
  const batchId = params.id;

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
      fetchAvailableCandidates();
    }
  }, [batchId]);

  const fetchBatchDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/auth/login");
        return;
      }

      const response = await axios.get(
        `${process.env.NEXT_APP_API_URL}/api/batches/${batchId}?includeCandidates=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBatch(response.data.batch);
      setCandidates(response.data.candidates || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      if (error.response?.status === 401) {
        router.push("/auth/login");
      } else {
        setError("Failed to fetch batch details");
        setLoading(false);
      }
    }
  };

  const fetchAvailableCandidates = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${process.env.NEXT_APP_API_URL}/api/candidates`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAvailableCandidates(response.data.candidates || []);
    } catch (error) {
      console.error("Error fetching available candidates:", error);
    }
  };

  const handleAddCandidates = async () => {
    if (selectedCandidates.length === 0) {
      setError("Please select at least one candidate");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_APP_API_URL}/api/batches/${batchId}/candidates`,
        {
          candidateIds: selectedCandidates,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(
        `Successfully processed ${response.data.results.added.length} candidates with AI fit assessment`
      );
      setShowAddModal(false);
      setSelectedCandidates([]);
      fetchBatchDetails();
      fetchAvailableCandidates();
    } catch (error) {
      console.error("Error adding candidates:", error);
      setError(error.response?.data?.error || "Failed to add candidates");
    }
  };

  const handleRemoveCandidate = async (candidateId) => {
    if (
      !confirm("Are you sure you want to remove this candidate from the batch?")
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `${process.env.NEXT_APP_API_URL}/api/batches/${batchId}/candidates/${candidateId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Candidate removed from batch successfully");
      fetchBatchDetails();
      fetchAvailableCandidates();
    } catch (error) {
      console.error("Error removing candidate:", error);
      setError(error.response?.data?.error || "Failed to remove candidate");
    }
  };

  const handleReassessCandidate = async (candidateId) => {
    setReassessing(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${process.env.NEXT_APP_API_URL}/api/batches/${batchId}/candidates/${candidateId}/reassess`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess(
        `Candidate reassessed: ${
          response.data.reassessment.statusChanged
            ? "Status changed!"
            : "Status confirmed"
        }`
      );
      fetchBatchDetails();
    } catch (error) {
      console.error("Error reassessing candidate:", error);
      setError(error.response?.data?.error || "Failed to reassess candidate");
    } finally {
      setReassessing(false);
    }
  };

  const getFitStatusIcon = (fitStatus) => {
    switch (fitStatus) {
      case "fit":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "not_fit":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getFitStatusColor = (fitStatus) => {
    switch (fitStatus) {
      case "fit":
        return "bg-green-100 text-green-800";
      case "not_fit":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Batch not found
          </h3>
          <button
            onClick={() => router.push("/categories")}
            className="text-blue-600 hover:text-blue-700"
          >
            Return to Categories
          </button>
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
              onClick={() => router.back()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{batch.name}</h1>
              <p className="mt-2 text-gray-600">{batch.jobDescription}</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Add Candidates
            </button>
          </div>

          {/* Batch Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Candidates</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {candidates.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Fit Candidates</p>
                  <p className="text-2xl font-bold text-green-600">
                    {candidates.filter((c) => c.fitStatus === "fit").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Not Fit</p>
                  <p className="text-2xl font-bold text-red-600">
                    {candidates.filter((c) => c.fitStatus === "not_fit").length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Fit Rate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {candidates.length > 0
                      ? Math.round(
                          (candidates.filter((c) => c.fitStatus === "fit")
                            .length /
                            candidates.length) *
                            100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          {batch.requiredSkills && batch.requiredSkills.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Required Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {batch.requiredSkills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Experience */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Required Experience
            </h3>
            <p className="text-gray-700">{batch.requiredExperience}</p>
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

        {/* Candidates List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Assigned Candidates
            </h2>
          </div>

          {candidates.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No candidates assigned
              </h3>
              <p className="text-gray-600 mb-6">
                Add candidates to this batch to start the screening process
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                Add First Candidate
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {candidates.map((candidate) => (
                <div
                  key={candidate.candidateId}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getFitStatusIcon(candidate.fitStatus)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {candidate.candidate?.name || "Unknown Candidate"}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getFitStatusColor(
                            candidate.fitStatus
                          )}`}
                        >
                          {candidate.fitStatus.replace("_", " ").toUpperCase()}
                        </span>
                        {candidate.fitScore && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span
                              className={`font-semibold ${getScoreColor(
                                candidate.fitScore
                              )}`}
                            >
                              {candidate.fitScore}/100
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            Email: {candidate.candidate?.email || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            Phone: {candidate.candidate?.phone || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">
                            Assigned:{" "}
                            {new Date(
                              candidate.assignedAt
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Status: {candidate.candidate?.status || "Unknown"}
                          </p>
                        </div>
                      </div>

                      {candidate.fitReason && (
                        <div className="bg-gray-50 p-3 rounded-lg mb-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            AI Assessment:
                          </p>
                          <p className="text-sm text-gray-600">
                            {candidate.fitReason}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() =>
                          handleReassessCandidate(candidate.candidateId)
                        }
                        disabled={reassessing}
                        className="text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50"
                        title="Reassess fit"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${
                            reassessing ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          router.push(`/candidate/${candidate.candidateId}`)
                        }
                        className="text-gray-400 hover:text-green-600 transition-colors"
                        title="View details"
                      >
                        <Target className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleRemoveCandidate(candidate.candidateId)
                        }
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove from batch"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Candidates Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Add Candidates to Batch
              </h2>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  Select candidates to add to this batch. AI will automatically
                  assess their fit based on the job requirements.
                </p>
              </div>

              {availableCandidates.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No available candidates found</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                  {availableCandidates
                    .filter(
                      (candidate) =>
                        !candidates.some((c) => c.candidateId === candidate._id)
                    )
                    .map((candidate) => (
                      <div
                        key={candidate._id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCandidates.includes(candidate._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedCandidates([
                                ...selectedCandidates,
                                candidate._id,
                              ]);
                            } else {
                              setSelectedCandidates(
                                selectedCandidates.filter(
                                  (id) => id !== candidate._id
                                )
                              );
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {candidate.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {candidate.email}
                          </p>
                          {candidate.parsedData?.skills && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {candidate.parsedData.skills
                                .slice(0, 3)
                                .map((skill, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              {candidate.parsedData.skills.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{candidate.parsedData.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCandidates([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCandidates}
                  disabled={selectedCandidates.length === 0}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add {selectedCandidates.length} Candidate
                  {selectedCandidates.length !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

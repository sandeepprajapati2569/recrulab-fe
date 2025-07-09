"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import axios from "axios";
import Header from "../../../components/Header";
import {
  Upload,
  FileText,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function BatchUploadPage() {
  const [batch, setBatch] = useState(null);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const batchId = params.id;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    const tenantData = localStorage.getItem("tenant");

    if (!token || !userData || !tenantData) {
      router.push("/auth/login");
      return;
    }

    setUser(JSON.parse(userData));
    setTenant(JSON.parse(tenantData));

    // Set axios default header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    fetchBatchDetails();
  }, [router, batchId]);

  const fetchBatchDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:2300/api/batches/${batchId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setBatch(response.data.batch);
    } catch (error) {
      console.error("Error fetching batch details:", error);
      if (error.response?.status === 401) {
        router.push("/auth/login");
      } else {
        setError("Failed to fetch batch details");
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError("Please select a PDF or Word document");
        return;
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }

      setFile(selectedFile);
      setError("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file to upload");
      return;
    }

    setUploading(true);
    setError("");
    setResults(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("batchId", batchId);

      const response = await axios.post(
        "http://localhost:2300/api/candidates/upload-to-batch",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResults(response.data);
      setFile(null);

      // Reset file input
      const fileInput = document.getElementById("resume-upload");
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      setError(
        error.response?.data?.error || "Failed to upload and process resume"
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange({ target: { files: [droppedFile] } });
    }
  };

  if (!batch) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header user={user} tenant={tenant} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading batch details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} tenant={tenant} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push(`/batches/${batchId}`)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add Candidate to Batch
              </h1>
              <p className="mt-2 text-gray-600">
                Upload resume for:{" "}
                <span className="font-medium">{batch.name}</span>
              </p>
            </div>
          </div>

          {/* Batch Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Batch Requirements
            </h3>
            <div className="text-sm text-blue-800">
              <p className="mb-2">
                <strong>Job Description:</strong> {batch.jobDescription}
              </p>
              <p className="mb-2">
                <strong>Required Experience:</strong> {batch.requiredExperience}
              </p>
              {batch.requiredSkills && batch.requiredSkills.length > 0 && (
                <div>
                  <strong>Required Skills:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {batch.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Upload Resume
          </h2>

          {/* Drag and Drop Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="mb-4">
              <label htmlFor="resume-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-900">
                  {file ? file.name : "Choose a file or drag it here"}
                </span>
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <p className="text-sm text-gray-500">
              Supports PDF, DOC, and DOCX files up to 10MB
            </p>
          </div>

          {/* Upload Button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  Upload & Process Resume
                </>
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="mt-6 space-y-4">
              {/* Success Message */}
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Resume uploaded and processed successfully!
              </div>

              {/* Candidate Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  Candidate Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Name:</strong> {results.candidate.name}
                    </p>
                    <p>
                      <strong>Email:</strong> {results.candidate.email}
                    </p>
                    <p>
                      <strong>Phone:</strong>{" "}
                      {results.candidate.phone || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Experience:</strong>{" "}
                      {results.candidate.parsedData?.experience ||
                        "Not specified"}
                    </p>
                    <p>
                      <strong>Education:</strong>{" "}
                      {results.candidate.parsedData?.education ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                {results.candidate.parsedData?.skills &&
                  results.candidate.parsedData.skills.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium text-gray-700 mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {results.candidate.parsedData.skills.map(
                          (skill, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Fit Assessment */}
              {results.fitAssessment && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    AI Fit Assessment
                  </h3>

                  <div className="flex items-center gap-2 mb-3">
                    {results.fitAssessment.status === "fit" ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span
                      className={`font-medium ${
                        results.fitAssessment.status === "fit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {results.fitAssessment.status === "fit"
                        ? "Good Fit"
                        : "Not a Good Fit"}
                    </span>
                    {results.fitAssessment.score && (
                      <span className="text-gray-600">
                        (Score: {results.fitAssessment.score}/100)
                      </span>
                    )}
                  </div>

                  {results.fitAssessment.reason && (
                    <p className="text-gray-700 text-sm">
                      {results.fitAssessment.reason}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => router.push(`/batches/${batchId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Back to Batch
                </button>
                <button
                  onClick={() => {
                    setResults(null);
                    setFile(null);
                    setError("");
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Upload Another Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

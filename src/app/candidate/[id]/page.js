"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Mail,
  FileText,
  Calendar,
  User,
  Briefcase,
  GraduationCap,
  Star,
  MessageSquare,
  Download,
  Play,
} from "lucide-react";
import axios from "axios";

const API_BASE_URL = `${process.env.NEXT_APP_API_URL}/api`;

export default function CandidateDetails() {
  const params = useParams();
  const router = useRouter();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transcript, setTranscript] = useState(null);
  const [loadingTranscript, setLoadingTranscript] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchCandidate();
    }
  }, [params.id]);

  const fetchCandidate = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/candidates/${params.id}`
      );
      setCandidate(response.data);

      // If candidate has call history, fetch the latest transcript
      if (response.data.callHistory && response.data.callHistory.length > 0) {
        fetchTranscript();
      }
    } catch (error) {
      console.error("Error fetching candidate:", error);
      if (error.response?.status === 404) {
        router.push("/");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTranscript = async () => {
    setLoadingTranscript(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/candidates/${params.id}/transcript`
      );
      setTranscript(response.data);
    } catch (error) {
      console.error("Error fetching transcript:", error);
    } finally {
      setLoadingTranscript(false);
    }
  };

  const initiateCall = async () => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/candidates/${params.id}/call`
      );
      alert(`Call initiated successfully! Call ID: ${response.data.callId}`);
      fetchCandidate(); // Refresh candidate data
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("Failed to initiate call");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "called":
        return "bg-blue-100 text-blue-800";
      case "screened":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderSkills = (skills) => {
    if (!skills || !Array.isArray(skills)) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={index}
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  };

  const renderExperience = (experience) => {
    if (!experience || !Array.isArray(experience)) return null;

    return (
      <div className="space-y-4">
        {experience.map((exp, index) => (
          <div key={index} className="border-l-2 border-blue-200 pl-4">
            <h4 className="font-medium text-gray-900">{exp.position}</h4>
            <p className="text-sm text-gray-600">{exp.company}</p>
            <p className="text-xs text-gray-500">{exp.duration}</p>
          </div>
        ))}
      </div>
    );
  };

  const renderEducation = (education) => {
    if (!education || !Array.isArray(education)) return null;

    return (
      <div className="space-y-4">
        {education.map((edu, index) => (
          <div key={index} className="border-l-2 border-green-200 pl-4">
            <h4 className="font-medium text-gray-900">{edu.degree}</h4>
            <p className="text-sm text-gray-600">{edu.institution}</p>
            <p className="text-xs text-gray-500">{edu.year}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">
          Candidate not found
        </h2>
        <Link href="/" className="mt-4 text-blue-600 hover:text-blue-500">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>

        <div className="mt-4 md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {candidate.name}
            </h1>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4" />
                {candidate.email}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4" />
                {candidate.phone}
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                Applied {new Date(candidate.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="mt-4 flex-shrink-0 flex md:mt-0 md:ml-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                candidate.status
              )}`}
            >
              {candidate.status}
            </span>
            {candidate.status === "pending" && (
              <button
                onClick={initiateCall}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Phone className="h-4 w-4 mr-2" />
                Initiate Call
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Candidate Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Parsed Resume Data */}
          {candidate.parsedData && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2" />
                Resume Summary
              </h3>

              {candidate.parsedData.summary && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Professional Summary
                  </h4>
                  <p className="text-sm text-gray-600">
                    {candidate.parsedData.summary}
                  </p>
                </div>
              )}

              {candidate.parsedData.skills && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </h4>
                  {renderSkills(candidate.parsedData.skills)}
                </div>
              )}

              {candidate.parsedData.experience && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" />
                    Work Experience
                  </h4>
                  {renderExperience(candidate.parsedData.experience)}
                </div>
              )}

              {candidate.parsedData.education && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-1" />
                    Education
                  </h4>
                  {renderEducation(candidate.parsedData.education)}
                </div>
              )}
            </div>
          )}

          {/* Interview Transcript */}
          {candidate.callHistory && candidate.callHistory.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Interview Transcript
              </h3>

              {loadingTranscript ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transcript ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Transcript
                    </h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {transcript.transcript}
                    </p>
                  </div>

                  {transcript.analysis && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        AI Analysis
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">
                            Overall Sentiment:
                          </span>
                          <span className="ml-2 capitalize">
                            {transcript.analysis.overall_sentiment}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Communication:</span>
                          <span className="ml-2 capitalize">
                            {transcript.analysis.communication_skills}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>
                          <span className="ml-2 capitalize">
                            {transcript.analysis.confidence_level}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Score:</span>
                          <span className="ml-2">
                            {transcript.analysis.score}/100
                          </span>
                        </div>
                      </div>

                      {transcript.analysis.key_points && (
                        <div className="mt-4">
                          <span className="font-medium text-sm">
                            Key Points:
                          </span>
                          <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                            {transcript.analysis.key_points.map(
                              (point, index) => (
                                <li key={index}>{point}</li>
                              )
                            )}
                          </ul>
                        </div>
                      )}

                      {transcript.analysis.summary && (
                        <div className="mt-4">
                          <span className="font-medium text-sm">Summary:</span>
                          <p className="mt-1 text-sm text-gray-600">
                            {transcript.analysis.summary}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No transcript available yet.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column - Call History & Actions */}
        <div className="space-y-6">
          {/* Call History */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Call History
            </h3>

            {candidate.callHistory && candidate.callHistory.length > 0 ? (
              <div className="space-y-4">
                {candidate.callHistory.map((call, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        Call #{index + 1}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          call.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : call.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : call.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {call.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {new Date(call.timestamp).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-600">
                      Call ID: {call.callId}
                    </p>
                    {call.recordingPath && (
                      <button className="mt-2 inline-flex items-center text-xs text-blue-600 hover:text-blue-500">
                        <Play className="h-3 w-3 mr-1" />
                        Play Recording
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No calls made yet.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="h-4 w-4 mr-2" />
                Download Resume
              </button>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </button>
              <button className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Star className="h-4 w-4 mr-2" />
                Add to Favorites
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

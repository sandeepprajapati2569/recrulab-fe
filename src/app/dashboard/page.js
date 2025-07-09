"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import Header from "../../components/Header";
import {
  Users,
  Phone,
  CheckCircle,
  Clock,
  FolderOpen,
  Target,
  TrendingUp,
  Plus,
  ArrowRight,
  BarChart3,
} from "lucide-react";

export default function DashboardPage() {
  const [candidates, setCandidates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    pendingCandidates: 0,
    calledCandidates: 0,
    screenedCandidates: 0,
    totalCategories: 0,
    totalBatches: 0,
    fitCandidates: 0,
    averageFitRate: 0,
  });
  const router = useRouter();

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

    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      // Fetch candidates
      const candidatesResponse = await axios.get(
        "http://localhost:2300/api/candidates?limit=5"
      );
      setCandidates(candidatesResponse.data.candidates);

      // Fetch categories with stats
      const categoriesResponse = await axios.get(
        "http://localhost:2300/api/categories?includeStats=true"
      );
      setCategories(categoriesResponse.data.categories);

      // Fetch recent batches
      const batchesResponse = await axios.get(
        "http://localhost:2300/api/batches?limit=5&includeStats=true"
      );
      setRecentBatches(batchesResponse.data.batches);

      // Calculate comprehensive stats
      const total = candidatesResponse.data.pagination.total;
      const pending = candidatesResponse.data.candidates.filter(
        (c) => c.status === "pending"
      ).length;
      const called = candidatesResponse.data.candidates.filter(
        (c) => c.status === "called"
      ).length;
      const screened = candidatesResponse.data.candidates.filter(
        (c) => c.status === "screened"
      ).length;

      // Calculate category and batch stats
      const totalCategories = categoriesResponse.data.categories.length;
      const totalBatches =
        batchesResponse.data.pagination?.total ||
        batchesResponse.data.batches.length;

      // Calculate fit statistics
      const allBatches = batchesResponse.data.batches;
      let totalCandidatesInBatches = 0;
      let totalFitCandidates = 0;

      allBatches.forEach((batch) => {
        if (batch.stats) {
          totalCandidatesInBatches += batch.stats.candidateCount || 0;
          totalFitCandidates += batch.stats.fitCandidatesCount || 0;
        }
      });

      const averageFitRate =
        totalCandidatesInBatches > 0
          ? Math.round((totalFitCandidates / totalCandidatesInBatches) * 100)
          : 0;

      setStats({
        totalCandidates: total,
        pendingCandidates: pending,
        calledCandidates: called,
        screenedCandidates: screened,
        totalCategories,
        totalBatches,
        fitCandidates: totalFitCandidates,
        averageFitRate,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      if (error.response?.status === 401) {
        localStorage.clear();
        router.push("/auth/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const initiateCall = async (candidateId) => {
    try {
      const response = await axios.post(
        `http://localhost:2300/api/voice/call/${candidateId}`,
        {
          voice: "alloy",
          maxDuration: 600,
        }
      );

      alert(`Call initiated successfully! Call ID: ${response.data.callId}`);
      fetchDashboardData(); // Refresh the data
    } catch (error) {
      alert(
        `Failed to initiate call: ${
          error.response?.data?.error || error.message
        }`
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header user={user} tenant={tenant} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Usage Stats */}
        {tenant && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Usage Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Candidates:</span>
                <span className="ml-2 font-medium">
                  {tenant.usage.candidatesAdded} / {tenant.limits.maxCandidates}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Calls Made:</span>
                <span className="ml-2 font-medium">
                  {tenant.usage.callsMade} / {tenant.limits.maxCalls}
                </span>
              </div>
              <div>
                <span className="text-blue-700">Minutes Used:</span>
                <span className="ml-2 font-medium">
                  {Math.round(tenant.usage.minutesUsed)} /{" "}
                  {tenant.limits.maxMinutes}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Candidates
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCandidates}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FolderOpen className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Categories
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalCategories}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Batches
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalBatches}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Avg Fit Rate
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.averageFitRate}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link
                href="/categories"
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                Manage Categories
              </Link>

              <Link
                href="/candidates"
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Users className="mr-2 h-4 w-4" />
                View All Candidates
              </Link>

              <Link
                href="/calls"
                className="inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call History
              </Link>
            </div>
          </div>
        </div>

        {/* Categories Overview */}
        {categories.length > 0 && (
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Categories Overview
                </h3>
                <Link
                  href="/categories"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.slice(0, 3).map((category) => (
                  <div
                    key={category._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h4 className="font-medium text-gray-900 mb-2">
                      {category.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-center">
                        <div className="text-blue-600 font-semibold">
                          {category.stats?.batchCount || 0}
                        </div>
                        <div className="text-gray-500">Batches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-semibold">
                          {category.stats?.fitRate || 0}%
                        </div>
                        <div className="text-gray-500">Fit Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Batches */}
        {recentBatches.length > 0 && (
          <div className="mb-8">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Batches
                </h3>
                <Link
                  href="/categories"
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentBatches.slice(0, 3).map((batch) => (
                  <div
                    key={batch._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {batch.name}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {batch.jobDescription}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <div className="text-blue-600 font-semibold">
                          {batch.stats?.candidateCount || 0}
                        </div>
                        <div className="text-gray-500">Candidates</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 font-semibold">
                          {batch.stats?.fitRate || 0}%
                        </div>
                        <div className="text-gray-500">Fit Rate</div>
                      </div>
                      <Link
                        href={`/batches/${batch._id}`}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Recent Candidates */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Recent Candidates
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {candidates.map((candidate) => (
                  <tr key={candidate._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {candidate.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {candidate.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          candidate.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : candidate.status === "called"
                            ? "bg-blue-100 text-blue-800"
                            : candidate.status === "screened"
                            ? "bg-green-100 text-green-800"
                            : candidate.status === "fit"
                            ? "bg-green-100 text-green-800"
                            : candidate.status === "not_fit"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {candidate.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(candidate.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/candidate/${candidate._id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                      {candidate.status === "pending" && (
                        <button
                          onClick={() => initiateCall(candidate._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Call
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {candidates.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No candidates yet
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Create categories and batches to start adding candidates.
              </p>
              <div className="mt-6">
                <Link
                  href="/categories"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Create Category
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

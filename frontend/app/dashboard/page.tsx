'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUserSession } from '../../lib/auth';
import { userPool } from '../../lib/cognito';
import { AwsClient } from 'aws4fetch';

// Define an interface for the event data for type safety
interface LambdaEvent {
  timestamp: string | number;
  event: Record<string, unknown>;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LambdaEvent[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and fetch data
    getCurrentUserSession().then(session => {
      if (!session) {
        router.replace('/login');
      } else {
        fetchEvents();
      }
    });
    // eslint-disable-next-line
  }, [router]);

  const aws = new AwsClient({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    sessionToken: process.env.NEXT_PUBLIC_AWS_SESSION_TOKEN,
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    service: 'execute-api',
  });

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Replace with your actual API Gateway endpoint (from CDK output)
      const response = await aws.fetch('https://ti7cqgksr2.execute-api.ap-south-1.amazonaws.com/prod/ingest', {
        method: 'GET',
      });
      if (response.ok) {
        const items = await response.json();
        setData(items);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
      setData([]);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut();
      window.location.href = '/login';
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-6">
        <button
          className="mb-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
          onClick={handleLogout}
        >
          Logout
        </button>
        <h1 className="text-2xl font-bold mb-4">Lambda Cold Starts Dashboard</h1>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="border-b p-2">Timestamp</th>
              <th className="border-b p-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {data.length > 0 ? data.map((row, i) => (
              <tr key={i}>
                <td className="border-b p-2">{new Date(row.timestamp).toLocaleString()}</td>
                <td className="border-b p-2">{JSON.stringify(row.event)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={2} className="text-center py-4 text-gray-500">No events found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-2xl shadow-xl text-center"> {/* Added text-center here for better alignment of buttons */}
        <h1 className="text-3xl font-bold mb-6">Welcome to Lambda ColdStart SaaS</h1>
        <div className="flex justify-center"> {/* Added a flex container to keep buttons on the same line */}
          <Link href="/login">
            <span className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold">
              Login to Continue
            </span>
          </Link>
          {/* START: Added Create Account link/button */}
          <Link href="/signup">
            <span className="ml-4 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold">
              Create Account
            </span>
          </Link>
          {/* END: Added Create Account link/button */}
        </div>
      </div>
    </main>
  );
}

export default function AuthCodeErrorPage() {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold text-red-600">Authentication Error</h1>
        <p className="text-gray-700 mt-4">Something went wrong during authentication.</p>
        <a
          href="/signup"
          className="mt-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go Back to Sign Up
        </a>
      </div>
    );
  }
  
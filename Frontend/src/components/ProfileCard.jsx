export default function ProfileCard({ username }) {
  return (
    <div className="bg-white shadow-md rounded-xl p-6 flex justify-between items-center">

      <div>
        <h1 className="text-2xl font-bold">
          Welcome, {username || "User"} 👋
        </h1>
        <p className="text-gray-500">
          Report issues and track status in real time.
        </p>
      </div>

      <div className="bg-blue-100 text-blue-600 px-4 py-2 rounded-full font-semibold">
        INFORMER
      </div>

    </div>
  );
}

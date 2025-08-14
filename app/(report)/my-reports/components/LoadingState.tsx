export default function LoadingState() {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl shadow-2xl p-12 border border-white/10">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-zinc-700 rounded-full animate-spin border-t-white/70"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/80" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold text-white">
            Loading Reports
          </h3>
          <p className="text-zinc-400">
            Retrieving your saved equity research reports...
          </p>
        </div>
      </div>
    </div>
  );
}

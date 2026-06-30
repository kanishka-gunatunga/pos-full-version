export default function DashboardLoading() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#E2E8F0] border-t-[#EA580C]"
            aria-hidden
          />
          <p className="font-['Inter'] text-sm font-medium text-[#62748E]">Loading...</p>
        </div>
      </div>
    </div>
  );
}

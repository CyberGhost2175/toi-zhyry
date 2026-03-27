import { History } from "lucide-react";

export function BookingsHistoryPlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
      <History className="w-14 h-14 mx-auto text-gray-300 mb-4" />
      <h2 className="text-lg font-medium text-[#222222] mb-2">История бронирований</h2>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        Раздел в разработке. Здесь позже появится архив завершённых и прошлых бронирований с фильтрами.
      </p>
    </div>
  );
}

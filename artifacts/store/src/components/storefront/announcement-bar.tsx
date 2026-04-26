import { useGetAnnouncement } from "@workspace/api-client-react";

export function AnnouncementBar() {
  const { data } = useGetAnnouncement();
  if (!data?.enabled || !data?.message) return null;
  return (
    <div className="bg-foreground text-background text-center text-xs uppercase tracking-widest py-2.5 px-4">
      {data.message}
    </div>
  );
}

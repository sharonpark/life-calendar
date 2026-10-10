import { DayDetailContent } from "@/components/day/day-detail-content";

export default async function DayDetailPage({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string }>;
}) {
  const { year, month, day } = await params;
  return (
    <div className="mx-auto max-w-2xl p-4">
      <DayDetailContent year={Number(year)} month={Number(month)} day={Number(day)} />
    </div>
  );
}

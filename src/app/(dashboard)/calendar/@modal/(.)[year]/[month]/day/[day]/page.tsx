import { DayDetailModal } from "@/components/day/day-detail-modal";
import { DayDetailContent } from "@/components/day/day-detail-content";

export default async function DayDetailInterceptedPage({
  params,
}: {
  params: Promise<{ year: string; month: string; day: string }>;
}) {
  const { year, month, day } = await params;
  return (
    <DayDetailModal>
      <DayDetailContent year={Number(year)} month={Number(month)} day={Number(day)} />
    </DayDetailModal>
  );
}

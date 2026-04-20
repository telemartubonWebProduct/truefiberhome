import AdminChatRoom from "@/src/app/dashboard/chat/components/AdminChatRoom";

type DashboardChatSessionPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DashboardChatSessionPage({ params }: DashboardChatSessionPageProps) {
  const { id } = await params;

  return <AdminChatRoom sessionId={id} />;
}

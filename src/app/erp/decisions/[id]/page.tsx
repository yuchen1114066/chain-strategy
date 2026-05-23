import DecisionDetailClient from "./DecisionDetailClient";

export default async function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DecisionDetailClient id={id} />;
}

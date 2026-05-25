import { incomingPOs } from "@/lib/erp/receiving-checklist";
import ReceivingListClient from "./ReceivingListClient";

export default function ReceivingPage() {
  const list = incomingPOs();
  return <ReceivingListClient incoming={list} />;
}

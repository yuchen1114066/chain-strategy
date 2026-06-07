import OrderImpactClient from "./OrderImpactClient";
import { models, today } from "@/lib/erp/seed";

export default function OrderImpactPage() {
  const modelOptions = models.map((m) => ({
    code: m.code,
    name: m.name,
    price: m.stdPrice,
  }));
  return <OrderImpactClient modelOptions={modelOptions} today={today} />;
}

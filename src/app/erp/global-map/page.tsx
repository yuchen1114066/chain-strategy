import GlobalMapClient from "./GlobalMapClient";
import { supplierCountryMap, SCENARIOS } from "@/lib/erp/global-map";

export default function GlobalMapPage() {
  const countries = supplierCountryMap();
  return <GlobalMapClient initialCountries={countries} scenarios={SCENARIOS} />;
}

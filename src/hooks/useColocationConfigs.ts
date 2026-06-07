import { useState, useEffect } from "react";
import { getWithAuth } from "atlas-shared-web";
import { API_BASE, IDENTITY_API_BASE } from "../lib/config";
import { ClientRef } from "../types/common";

export interface ColocationConfigs {
  prices: Record<string, string>;
  specs: Record<string, string>;
  nonTradingApps: Record<string, string>;
  rackTierOptions: Record<string, string>;
  rackTypeOptions: Record<string, string>;
  rackPowerOptions: Record<string, string>;
  rackPrices: Record<string, string>;
  rackSpecs: Record<string, string>;
  allPowerTypes: Record<string, string>;
  clients: ClientRef[];
  isLoading: boolean;
}

export function useColocationConfigs(isInternalUser: boolean = true): ColocationConfigs {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [nonTradingApps, setNonTradingApps] = useState<Record<string, string>>({});
  const [rackTierOptions, setRackTierOptions] = useState<Record<string, string>>({});
  const [rackTypeOptions, setRackTypeOptions] = useState<Record<string, string>>({});
  const [rackPowerOptions, setRackPowerOptions] = useState<Record<string, string>>({});
  const [rackPrices, setRackPrices] = useState<Record<string, string>>({});
  const [rackSpecs, setRackSpecs] = useState<Record<string, string>>({});
  const [allPowerTypes, setAllPowerTypes] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      try {
        // Only fetch clients for internal users
        const fetchPromises: Promise<Response>[] = [
          getWithAuth(`${API_BASE}/network/atlas-configs/v1/CO_LOCATION`),
          getWithAuth(`${API_BASE}/network/atlas-configs/v1/RACK`),
        ];
        if (isInternalUser) {
          fetchPromises.push(getWithAuth(`${IDENTITY_API_BASE}/identity/clients/v1/`));
        }

        const responses = await Promise.all(fetchPromises);
        const coloResponse = responses[0];
        const rackResponse = responses[1];
        const clientsResponse = isInternalUser ? responses[2] : null;

        if (coloResponse.ok) {
          const data = await coloResponse.json();
          const pricesConfig = data.find((c: { field_name: string }) => c.field_name === "PRICES");
          const specsConfig = data.find((c: { field_name: string }) => c.field_name === "SPECS");
          const nonTradingAppsConfig = data.find((c: { field_name: string }) => c.field_name === "NON_TRADING_APPS");
          if (pricesConfig) setPrices(pricesConfig.options);
          if (specsConfig) setSpecs(specsConfig.options);
          if (nonTradingAppsConfig) setNonTradingApps(nonTradingAppsConfig.options);
        }

        if (rackResponse.ok) {
          const data = await rackResponse.json();
          const tierConfig = data.find((c: { field_name: string }) => c.field_name === "RACK_TIER");
          const typeConfig = data.find((c: { field_name: string }) => c.field_name === "RACK_TYPE");
          const powerConfig = data.find((c: { field_name: string }) => c.field_name === "RACK_POWER");
          const pricesConfig = data.find((c: { field_name: string }) => c.field_name === "PRICES");
          const specsConfig = data.find((c: { field_name: string }) => c.field_name === "SPECS");
          const powerTypesConfig = data.find((c: { field_name: string }) => c.field_name === "POWER_TYPES");
          if (tierConfig) setRackTierOptions(tierConfig.options);
          if (typeConfig) setRackTypeOptions(typeConfig.options);
          if (powerConfig) setRackPowerOptions(powerConfig.options);
          if (pricesConfig) setRackPrices(pricesConfig.options);
          if (specsConfig) setRackSpecs(specsConfig.options);
          if (powerTypesConfig) setAllPowerTypes(powerTypesConfig.options);
        }

        if (clientsResponse?.ok) {
          const data = await clientsResponse.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to fetch configs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, [isInternalUser]);

  return {
    prices,
    specs,
    nonTradingApps,
    rackTierOptions,
    rackTypeOptions,
    rackPowerOptions,
    rackPrices,
    rackSpecs,
    allPowerTypes,
    clients,
    isLoading,
  };
}

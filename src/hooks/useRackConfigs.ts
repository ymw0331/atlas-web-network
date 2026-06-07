import { useState, useEffect } from "react";
import { getWithAuth, AtlasConfig } from "atlas-shared-web";
import { API_BASE, IDENTITY_API_BASE } from "../lib/config";
import { ClientRef } from "../types/common";

export interface RackConfigs {
  clients: ClientRef[];
  allPowerTypes: Record<string, string>;
  rackPrices: Record<string, string>;
  tierOptions: Record<string, string>;
  typeOptions: Record<string, string>;
  powerOptions: Record<string, string>;
  isLoading: boolean;
}

export function useRackConfigs(isInternalUser: boolean = true): RackConfigs {
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [allPowerTypes, setAllPowerTypes] = useState<Record<string, string>>({});
  const [rackPrices, setRackPrices] = useState<Record<string, string>>({});
  const [tierOptions, setTierOptions] = useState<Record<string, string>>({});
  const [typeOptions, setTypeOptions] = useState<Record<string, string>>({});
  const [powerOptions, setPowerOptions] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      try {
        // Only fetch clients for internal users
        const fetchPromises: Promise<Response>[] = [
          getWithAuth(`${API_BASE}/network/atlas-configs/v1/RACK`),
        ];
        if (isInternalUser) {
          fetchPromises.unshift(getWithAuth(`${IDENTITY_API_BASE}/identity/clients/v1/`));
        }

        const responses = await Promise.all(fetchPromises);

        if (isInternalUser) {
          const clientsResponse = responses[0];
          const rackResponse = responses[1];

          if (clientsResponse.ok) {
            const data = await clientsResponse.json();
            setClients(data);
          }

          if (rackResponse.ok) {
            const data: AtlasConfig[] = await rackResponse.json();
            const powerTypesConfig = data.find(c => c.field_name === "POWER_TYPES");
            const pricesConfig = data.find(c => c.field_name === "PRICES");
            const tierConfig = data.find(c => c.field_name === "RACK_TIER");
            const typeConfig = data.find(c => c.field_name === "RACK_TYPE");
            const powerConfig = data.find(c => c.field_name === "RACK_POWER");

            if (powerTypesConfig) setAllPowerTypes(powerTypesConfig.options);
            if (pricesConfig) setRackPrices(pricesConfig.options);
            if (tierConfig) setTierOptions(tierConfig.options);
            if (typeConfig) setTypeOptions(typeConfig.options);
            if (powerConfig) setPowerOptions(powerConfig.options);
          }
        } else {
          const rackResponse = responses[0];

          if (rackResponse.ok) {
            const data: AtlasConfig[] = await rackResponse.json();
            const powerTypesConfig = data.find(c => c.field_name === "POWER_TYPES");
            const pricesConfig = data.find(c => c.field_name === "PRICES");
            const tierConfig = data.find(c => c.field_name === "RACK_TIER");
            const typeConfig = data.find(c => c.field_name === "RACK_TYPE");
            const powerConfig = data.find(c => c.field_name === "RACK_POWER");

            if (powerTypesConfig) setAllPowerTypes(powerTypesConfig.options);
            if (pricesConfig) setRackPrices(pricesConfig.options);
            if (tierConfig) setTierOptions(tierConfig.options);
            if (typeConfig) setTypeOptions(typeConfig.options);
            if (powerConfig) setPowerOptions(powerConfig.options);
          }
        }
      } catch (error) {
        console.error("Failed to fetch rack configs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, [isInternalUser]);

  return {
    clients,
    allPowerTypes,
    rackPrices,
    tierOptions,
    typeOptions,
    powerOptions,
    isLoading,
  };
}

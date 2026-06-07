import { useState, useEffect } from "react";
import { getWithAuth } from "atlas-shared-web";
import { API_BASE, IDENTITY_API_BASE } from "../lib/config";
import { ClientRef } from "../types/common";

export interface TimeServiceConfigs {
  prices: Record<string, string>;
  specs: Record<string, string>;
  clients: ClientRef[];
  isLoading: boolean;
}

export function useTimeServiceConfigs(isInternalUser: boolean = true): TimeServiceConfigs {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<ClientRef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      try {
        const fetchPromises: Promise<Response>[] = [
          getWithAuth(`${API_BASE}/network/atlas-configs/v1/TIME_SERVICE`),
        ];
        if (isInternalUser) {
          fetchPromises.push(getWithAuth(`${IDENTITY_API_BASE}/identity/clients/v1/`));
        }

        const responses = await Promise.all(fetchPromises);
        const timeServiceResponse = responses[0];
        const clientsResponse = isInternalUser ? responses[1] : null;

        if (timeServiceResponse.ok) {
          const data = await timeServiceResponse.json();
          const pricesConfig = data.find((c: { field_name: string }) => c.field_name === "PRICES");
          const specsConfig = data.find((c: { field_name: string }) => c.field_name === "SPECS");
          if (pricesConfig) setPrices(pricesConfig.options);
          if (specsConfig) setSpecs(specsConfig.options);
        }

        if (clientsResponse?.ok) {
          const data = await clientsResponse.json();
          setClients(data);
        }
      } catch (error) {
        console.error("Failed to fetch time service configs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, [isInternalUser]);

  return {
    prices,
    specs,
    clients,
    isLoading,
  };
}

import { useState, useEffect } from "react";
import { getWithAuth, AtlasConfig } from "atlas-shared-web";
import { API_BASE } from "../lib/config";

export interface CrossConnectConfigs {
  prices: Record<string, string>;
  isLoading: boolean;
}

export function useCrossConnectConfigs(): CrossConnectConfigs {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchConfigs = async () => {
      setIsLoading(true);
      try {
        const response = await getWithAuth(
          `${API_BASE}/network/atlas-configs/v1/CROSS_CONNECT`
        );

        if (response.ok) {
          const data: AtlasConfig[] = await response.json();
          const pricesConfig = data.find(c => c.field_name === "PRICES");
          if (pricesConfig) setPrices(pricesConfig.options);
        }
      } catch (error) {
        console.error("Failed to fetch cross-connect configs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConfigs();
  }, []);

  return {
    prices,
    isLoading,
  };
}

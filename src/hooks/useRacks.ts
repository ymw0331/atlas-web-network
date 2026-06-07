import { useState, useEffect } from "react";
import { getWithAuth } from "atlas-shared-web";
import { API_BASE } from "../lib/config";

export interface RackOption {
  rack_id: string;
  rack_tier: string;
  rack_type: string;
  power?: string;
  client_id?: string;
  client_name?: string;
}

export function useRacks() {
  const [racks, setRacks] = useState<RackOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRacks = async () => {
      setIsLoading(true);
      try {
        const response = await getWithAuth(`${API_BASE}/network/racks/v1/`);
        if (response.ok) {
          const data = await response.json();
          setRacks(data || []);
        }
      } catch (error) {
        console.error("Failed to fetch racks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRacks();
  }, []);

  return { racks, isLoading };
}

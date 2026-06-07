import { useState, useEffect } from "react";
import { getWithAuth } from "atlas-shared-web";
import { API_BASE } from "../lib/config";

export interface RackInfo {
  rack_id: string;
  rack_tier: string;
  rack_type?: string;
  power?: string;
  client_name?: string;
}

export function useRack(rackId: string | undefined) {
  const [rackInfo, setRackInfo] = useState<RackInfo | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRackInfo = async () => {
      if (!rackId) {
        setRackInfo(undefined);
        return;
      }
      setIsLoading(true);
      try {
        const response = await getWithAuth(`${API_BASE}/network/racks/v1/${rackId}`);
        if (response.ok) {
          const data = await response.json();
          setRackInfo({
            rack_id: data.rack_id,
            rack_tier: data.rack_tier,
            rack_type: data.rack_type,
            power: data.power,
            client_name: data.client_name,
          });
        }
      } catch (error) {
        console.error("Failed to fetch rack info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRackInfo();
  }, [rackId]);

  return { rackInfo, isLoading };
}

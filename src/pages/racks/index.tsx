import React, { useMemo, useState, useEffect, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { themeAlpine, colorSchemeDark } from "ag-grid-community";
import { useTheme } from "next-themes";
import { Button, Tooltip } from "@heroui/react";
import { useAuth, getStatusStyle, getWithAuth } from "atlas-shared-web";
import RackDetailDrawer from "../../components/racks/rack-detail-drawer";
import RackFormDrawer from "../../components/racks/rack-form-drawer";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { API_BASE } from "../../lib/config";
import { Rack } from "../../types/rack";
import { useRackConfigs } from "../../hooks/useRackConfigs";

const StatusCellRenderer = (params: ICellRendererParams<Rack>) => {
  const status = params.value as string;
  const statusKey = status || "";
  return (
    <span className={getStatusStyle(statusKey)}>
      {statusKey.replace(/_/g, " ") || "N/A"}
    </span>
  );
};

const ClientCellRenderer = (params: ICellRendererParams<Rack>) => {
  const data = params.data;
  if (!data) return null;
  if (!data.client_name) {
    return <span className="text-gray-400">Unassigned</span>;
  }
  return <span>{data.client_name}</span>;
};

export default function Racks() {
  const [isClient, setIsClient] = useState(false);
  const [rowData, setRowData] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<string | undefined>(undefined);
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  const [editRackId, setEditRackId] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const isInternalUser = user?.internal ?? false;
  const configs = useRackConfigs(isInternalUser);
  const { resolvedTheme } = useTheme();

  const handleViewRack = useCallback((rackId: string) => {
    setSelectedRackId(rackId);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedRackId(undefined);
  }, []);

  const handleAddRack = useCallback(() => {
    setEditRackId(undefined);
    setIsFormDrawerOpen(true);
  }, []);

  const handleEditRack = useCallback((rackId: string) => {
    setEditRackId(rackId);
    setIsFormDrawerOpen(true);
  }, []);

  const handleCloseFormDrawer = useCallback(() => {
    setIsFormDrawerOpen(false);
    setEditRackId(undefined);
  }, []);

  const handleRackSaved = useCallback(() => {
    fetchRacks();
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchRacks();
  }, []);

  const fetchRacks = async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/racks/v1/`);
      if (response.ok) {
        const data = await response.json();
        setRowData(data);
      }
    } catch (error) {
      console.error("Failed to fetch racks:", error);
    } finally {
      setLoading(false);
    }
  };

  const TierCellRenderer = useCallback((params: ICellRendererParams<Rack>) => {
    const tier = params.value as string;
    return (
      <span className="font-medium">
        {configs.tierOptions[tier] || tier || "N/A"}
      </span>
    );
  }, [configs.tierOptions]);

  const TypeCellRenderer = useCallback((params: ICellRendererParams<Rack>) => {
    const type = params.value as string;
    return (
      <span>{configs.typeOptions[type] || type?.replace(/_/g, " ") || "N/A"}</span>
    );
  }, [configs.typeOptions]);

  const PowerCellRenderer = useCallback((params: ICellRendererParams<Rack>) => {
    const power = params.value as string;
    return (
      <span>{configs.powerOptions[power] || power?.replace(/_/g, " ") || "N/A"}</span>
    );
  }, [configs.powerOptions]);

  const ActionsCellRenderer = useCallback((params: ICellRendererParams<Rack>) => {
    const data = params.data;
    if (!data) return null;
    return (
      <div className="h-full flex items-center gap-2">
        <Tooltip content="View" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => handleViewRack(data.rack_id)}>
            <EyeIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Edit" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => handleEditRack(data.rack_id)}>
            <PencilSquareIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        <Tooltip content="Delete" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="danger">
            <TrashIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
      </div>
    );
  }, [handleViewRack, handleEditRack]);

  const gridTheme = resolvedTheme === "dark" ? themeAlpine.withPart(colorSchemeDark) : themeAlpine;

  const columnDefs = useMemo<ColDef<Rack>[]>(() => [
    { headerName: "Actions", cellRenderer: ActionsCellRenderer, width: 150, minWidth: 150, maxWidth: 150, flex: 0, resizable: false, sortable: false, filter: false, cellClass: "pt-1" },
    { field: "rack_id", headerName: "Rack ID", filter: true, sortable: true, width: 120 },
    { field: "rack_status", headerName: "Status", cellRenderer: StatusCellRenderer, filter: true, sortable: true, width: 150 },
    { field: "rack_tier", headerName: "Tier", cellRenderer: TierCellRenderer, filter: true, sortable: true, width: 180 },
    { field: "rack_type", headerName: "Type", cellRenderer: TypeCellRenderer, filter: true, sortable: true, width: 120 },
    { field: "power", headerName: "Power", cellRenderer: PowerCellRenderer, filter: true, sortable: true, width: 120 },
    { field: "is_800mm_width_full_rack", headerName: "800mm Width", filter: true, sortable: true, width: 120, cellRenderer: (params: ICellRendererParams<Rack>) => params.value ? "Yes" : "" },
    { field: "client_name", headerName: "Client", cellRenderer: ClientCellRenderer, filter: true, sortable: true, width: 200 },
    { field: "update_time", headerName: "Last Updated", filter: true, sortable: true, sort: "desc", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
  ], [ActionsCellRenderer, TierCellRenderer, TypeCellRenderer, PowerCellRenderer]);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 80,
    resizable: true,
  }), []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Racks</h1>
          <p className="text-gray-500 text-sm">Manage data center racks</p>
        </div>
        <Button color="primary" onPress={handleAddRack}>
          Add Rack
        </Button>
      </div>
      {isClient && (
        <div className="flex-1 overflow-hidden">
          <AgGridReact<Rack>
            theme={gridTheme}
            rowData={rowData}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={20}
            loading={loading}
            enableCellTextSelection={true}
            ensureDomOrder={true}
          />
        </div>
      )}
      <RackDetailDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        rackId={selectedRackId}
      />
      <RackFormDrawer
        isOpen={isFormDrawerOpen}
        onClose={handleCloseFormDrawer}
        rackId={editRackId}
        onSaved={handleRackSaved}
        clients={configs.clients}
        allPowerTypes={configs.allPowerTypes}
        rackPrices={configs.rackPrices}
        isInternalUser={isInternalUser}
        userClientId={user?.client_id}
        userClientName={user?.client_name}
      />
    </div>
  );
}

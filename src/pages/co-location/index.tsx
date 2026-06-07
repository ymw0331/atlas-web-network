import { useMemo, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { themeAlpine, colorSchemeDark } from "ag-grid-community";
import { useTheme } from "next-themes";
import { Button, Tooltip } from "@heroui/react";
import { ConfirmModal, AlertModal } from "atlas-shared-web/components";
import { getStatusStyle, getWithAuth, deleteWithAuth } from "atlas-shared-web";
import { EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { API_BASE } from "../../lib/config";
import { CoLocationRes } from "../../types/co-location";

const StatusCellRenderer = (params: ICellRendererParams<CoLocationRes>) => {
  const status = params.value as string;
  const statusKey = status || "";
  return (
    <span className={getStatusStyle(statusKey)}>
      {statusKey.replace(/_/g, " ") || "N/A"}
    </span>
  );
};

const ClientGroupCellRenderer = (params: ICellRendererParams<CoLocationRes>) => {
  const data = params.data;
  if (!data) return null;
  if (!data.client_name) {
    return <span className="text-gray-400">-</span>;
  }
  return <span>{data.client_name}</span>;
};

const RackCountCellRenderer = (params: ICellRendererParams<CoLocationRes>) => {
  const data = params.data;
  if (!data) return null;
  const rackCount = data.rackSpecs?.racks?.length || 0;
  return <span>{rackCount}</span>;
};

export default function CoLocationIndex() {
  const router = useRouter();
    const [isClient, setIsClient] = useState(false);
  const [rowData, setRowData] = useState<CoLocationRes[]>([]);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const handleViewCoLocation = useCallback((id: string) => {
    router.push(`/co-location/view?id=${id}`);
  }, [router]);

  const handleEditCoLocation = useCallback((id: string) => {
    router.push(`/co-location/edit?id=${id}`);
  }, [router]);

  const handleCreateCoLocation = useCallback(() => {
    router.push("/co-location/create");
  }, [router]);

  const handleDeleteCoLocation = useCallback(async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const response = await deleteWithAuth(`${API_BASE}/network/co-locations/v1/${deleteId}`);
      if (response.ok) {
        setRowData((prev) => prev.filter((item) => item.co_location_id !== deleteId));
        setDeleteId(null);
      } else {
        setDeleteId(null);
        setAlertMessage("Failed to delete draft. Please try again.");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      setDeleteId(null);
      setAlertMessage("Failed to delete draft. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteId]);

  useEffect(() => {
    setIsClient(true);
    fetchCoLocations();
  }, []);

  const fetchCoLocations = async () => {
    try {
      const response = await getWithAuth(`${API_BASE}/network/co-locations/v1`);
      if (response.ok) {
        const data = await response.json();
        setRowData(data.items || data || []);
      }
    } catch (error) {
      console.error("Failed to fetch co-locations:", error);
    } finally {
      setLoading(false);
    }
  };

  const ActionsCellRenderer = useCallback((params: ICellRendererParams<CoLocationRes>) => {
    const data = params.data;
    if (!data) return null;
    const isDraft = data.co_location_status?.toLowerCase() === "draft";
    return (
      <div className="h-full flex items-center gap-2">
        <Tooltip content="View" delay={1000}>
          <Button isIconOnly size="sm" variant="flat" color="primary" onPress={() => handleViewCoLocation(data.co_location_id)}>
            <EyeIcon className="w-4 h-4" />
          </Button>
        </Tooltip>
        {isDraft && (
          <>
            <Tooltip content="Edit" delay={1000}>
              <Button isIconOnly size="sm" variant="flat" color="warning" onPress={() => handleEditCoLocation(data.co_location_id)}>
                <PencilSquareIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
            <Tooltip content="Delete" delay={1000}>
              <Button isIconOnly size="sm" variant="flat" color="danger" onPress={() => setDeleteId(data.co_location_id)}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </Tooltip>
          </>
        )}
      </div>
    );
  }, [handleViewCoLocation, handleEditCoLocation]);

  const gridTheme = resolvedTheme === "dark" ? themeAlpine.withPart(colorSchemeDark) : themeAlpine;

  const columnDefs = useMemo<ColDef<CoLocationRes>[]>(() => [
    { headerName: "Action", cellRenderer: ActionsCellRenderer, width: 150, minWidth: 150, maxWidth: 150, flex: 0, resizable: false, sortable: false, filter: false, cellClass: "pt-1" },
    { field: "co_location_id", headerName: "ID", filter: true, sortable: true, width: 120 },
    { field: "co_location_status", headerName: "Status", cellRenderer: StatusCellRenderer, filter: true, sortable: true, width: 150 },
    { field: "client_name", headerName: "Client", cellRenderer: ClientGroupCellRenderer, filter: true, sortable: true, width: 200 },
    { field: "rackSpecs.racks", headerName: "Racks", cellRenderer: RackCountCellRenderer, filter: false, sortable: false, width: 100 },
    { field: "start_date", headerName: "Start Date", filter: true, sortable: true, width: 150 },
    { field: "update_time", headerName: "Last Updated", filter: true, sortable: true, sort: "desc", width: 180, valueFormatter: (params) => params.value ? new Date(params.value).toLocaleString() : "" },
  ], [ActionsCellRenderer]);

  const defaultColDef = useMemo<ColDef>(() => ({
    flex: 1,
    minWidth: 80,
    resizable: true,
  }), []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col overflow-hidden">
      <div className="p-4 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Co-Location</h1>
          <p className="text-gray-500 text-sm">Manage co-location requests</p>
        </div>
        <Button color="primary" onPress={handleCreateCoLocation}>
          New Co-Location Request
        </Button>
      </div>
      {isClient && (
        <div className="flex-1 overflow-hidden">
          <AgGridReact<CoLocationRes>
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
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteCoLocation}
        title="Delete draft?"
        message={`This will permanently delete draft ${deleteId}. This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="danger"
        isLoading={isDeleting}
      />
      <AlertModal
        isOpen={!!alertMessage}
        onClose={() => setAlertMessage(null)}
        title="Error"
        message={alertMessage || ""}
        buttonColor="danger"
      />
    </div>
  );
}

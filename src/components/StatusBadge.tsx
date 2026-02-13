import { Chip } from "@mui/material";

type Status = "mapped" | "missing" | "extension" | "gbif-req" | "gbif-rec";

const statusConfig: Record<Status, { label: string; color: "success" | "error" | "info" | "warning" | "default" }> = {
  mapped: { label: "mapped", color: "success" },
  missing: { label: "missing", color: "error" },
  extension: { label: "extension", color: "info" },
  "gbif-req": { label: "gbif req", color: "warning" },
  "gbif-rec": { label: "gbif rec", color: "default" },
};

export default function StatusBadge({ status }: { status: Status }) {
  const { label, color } = statusConfig[status];
  return <Chip label={label} color={color} size="small" variant="outlined" />;
}

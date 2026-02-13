import { Box, Paper, Typography } from "@mui/material";

interface Stat {
  value: string | number;
  label: string;
}

export default function StatBar({ stats }: { stats: Stat[] }) {
  return (
    <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
      {stats.map(({ value, label }) => (
        <Paper key={label} variant="outlined" sx={{ px: 2, py: 1.5, minWidth: 100 }}>
          <Typography variant="h5" fontWeight={700}>
            {value}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {label}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}

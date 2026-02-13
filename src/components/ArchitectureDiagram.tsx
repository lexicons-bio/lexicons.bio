import { Paper } from "@mui/material";
import { Link } from "react-router-dom";

export default function ArchitectureDiagram() {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 3,
        fontFamily: "monospace",
        fontSize: "0.8rem",
        lineHeight: 1.7,
        overflowX: "auto",
        my: 2,
        whiteSpace: "pre",
        color: "text.secondary",
        "& a": { color: "secondary.main" },
        "& strong": { color: "text.primary" },
      }}
    >
      <Link to="/identification"><strong>identification</strong></Link>{"\n"}
      {"  \u2514\u2500 "}<strong>#taxon</strong>{"              \u2500\u2500references\u2500\u2500\u25B6  "}<Link to="/occurrence"><strong>occurrence</strong></Link>{"\n"}
      {"                                                \u2514\u2500 "}<strong>#location</strong>{"\n"}
      {"                                                \u2514\u2500 "}<strong>#imageEmbed</strong>
    </Paper>
  );
}

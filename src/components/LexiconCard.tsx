import { Card, CardActionArea, CardContent, Typography } from "@mui/material";
import { Link } from "react-router-dom";

interface Props {
  nsid: string;
  title: string;
  description: string;
  meta: string;
  to: string;
}

export default function LexiconCard({ nsid, title, description, meta, to }: Props) {
  return (
    <Card variant="outlined">
      <CardActionArea component={Link} to={to}>
        <CardContent>
          <Typography variant="overline" color="secondary">
            {nsid}
          </Typography>
          <Typography variant="h6">{title}</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            {description}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {meta}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import LoadingButton from "@mui/lab/LoadingButton";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";

interface SampleProps {
  countryName: string;
  countryLabel: string;
  continent: string;
  imageUrl: string;
  loading: boolean;
  onCountryLoad: (countryLabel: string) => void;
}

export default function Sample({
  countryName,
  countryLabel,
  continent,
  imageUrl,
  loading,
  onCountryLoad,
}: SampleProps) {
  return (
    <motion.div whileHover={{ scale: 1.1 }}>
      <Card sx={{ width: 250 }}>
        <CardMedia sx={{ height: 300 }} image={imageUrl} title={countryName} />
        <CardContent>
          <Typography gutterBottom variant="h5" component="div">
            {countryName}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {continent}
          </Typography>
        </CardContent>
        <CardActions>
          <LoadingButton
            size="small"
            variant="contained"
            color="secondary"
            loading={loading}
            loadingPosition="start"
            startIcon={<CloudDownloadIcon />}
            onClick={() => onCountryLoad(countryLabel)}
          >
            Betöltés
          </LoadingButton>
        </CardActions>
      </Card>
    </motion.div>
  );
}

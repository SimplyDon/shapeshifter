import axios from "axios";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { motion } from "framer-motion";

interface SampleProps {
  countryName: string;
  countryLabel: string;
  continent: string;
  imageUrl: string;
  onLoadData: (geojsonData: any) => void;
}

export default function Sample({
  countryName,
  countryLabel,
  continent,
  imageUrl,
  onLoadData,
}: SampleProps) {
  const handleClick = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/load_country/${countryLabel}`
      );
      onLoadData(response.data);
    } catch (error) {
      console.error("HIBA: ", error);
    }
  };

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
          <Button
            size="small"
            variant="contained"
            color="secondary"
            onClick={handleClick}
          >
            Betöltés
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );
}

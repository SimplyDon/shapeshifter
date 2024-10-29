import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Grid from "@mui/material/Grid2";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CachedIcon from "@mui/icons-material/Cached";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Header from "./Header";
import Sample from "./Sample";
import L from "leaflet";
import axios from "axios";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type Country = {
  name: string;
  label: string;
  continent: string;
  imageUrl: string;
};

function shuffleArray(array: Country[]) {
  return array
    .map((item) => ({ ...item, sortKey: Math.random() }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map(({ sortKey, ...item }) => item);
}

const countries: Country[] = [
  {
    name: "Magyarország",
    label: "hungary",
    continent: "Európa",
    imageUrl: "./src/assets/hungary.png",
  },
  {
    name: "Németország",
    label: "germany",
    continent: "Európa",
    imageUrl: "./src/assets/germany.png",
  },
  {
    name: "Egyiptom",
    label: "egypt",
    continent: "Afrika",
    imageUrl: "./src/assets/egypt.png",
  },
  {
    name: "Dél-Korea",
    label: "korea",
    continent: "Ázsia",
    imageUrl: "./src/assets/korea.png",
  },
  {
    name: "Egyesült Államok",
    label: "usa",
    continent: "Amerika",
    imageUrl: "./src/assets/usa.png",
  },
  {
    name: "Egyesült Királyság",
    label: "uk",
    continent: "Európa",
    imageUrl: "./src/assets/uk.png",
  },
  {
    name: "Finnország",
    label: "finland",
    continent: "Európa",
    imageUrl: "./src/assets/finland.png",
  },
];

export default function App() {
  const [data, setData] = useState<any>(null);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [simplifiedData, setSimplifiedData] = useState<any>(null);
  const [bounds, setBounds] = useState<any>(null);
  const [worldMap, setWorldMap] = useState<boolean>(false);
  const [currentTolerance, setCurrentTolerance] = useState<number>(0);
  const [randomCountries, setRandomCountries] = useState<Country[]>(countries);

  const handleDataUpload = (uploadedData: any) => {
    setWorldMap(false);

    setData(uploadedData);

    const geojsonLayer = L.geoJSON(uploadedData);
    const geojsonBounds = geojsonLayer.getBounds();

    setBounds(geojsonBounds);
  };

  const resetData = () => {
    setData(null);
    setSimplifiedData(null);
    setBounds(null);
  };

  const toggleWorldMap = () => {
    setWorldMap((prev: boolean) => !prev);
  };

  const handleSimplify = async (tolerance: number) => {
    setCurrentTolerance(tolerance);
  };

  const toggleSimplification = async (
    availableTolerances: number[],
    algorithm: String
  ) => {
    try {
      const res = await axios.post("http://localhost:5000/api/simplify", {
        geojson: data,
        tolerances: availableTolerances,
        algorithm: algorithm,
      });

      setSimplifiedData(res.data);
    } catch (err) {
      console.error("HIBA:", err);
    }
  };

  const handleLoadDataFromSample = (geojsonData: any) => {
    setData(geojsonData);
    setFileUploaded(true);
    setWorldMap(false);

    const geojsonLayer = L.geoJSON(geojsonData);
    const geojsonBounds = geojsonLayer.getBounds();

    setBounds(geojsonBounds);
  };

  useEffect(() => {
    const shuffled = shuffleArray(countries).slice(0, 3);
    setRandomCountries(shuffled);
  }, [fileUploaded]);

  const reloadCountries = () => {
    const shuffled = shuffleArray(countries).slice(0, 3);
    setRandomCountries(shuffled);
  };

  return (
    <>
      <Header
        onDataUpload={handleDataUpload}
        onResetData={resetData}
        onToggleWorldMap={toggleWorldMap}
        onSimplify={handleSimplify}
        onToggleSimplification={toggleSimplification}
        data={data}
        fileUploaded={fileUploaded}
        setFileUploaded={setFileUploaded}
      />

      {!data && !simplifiedData ? (
        <Container>
          <Typography variant="h3" textAlign="center" marginTop={5}>
            Tölts fel egy .zip fájlt a megfelelő komponensekkel!
          </Typography>
          <Typography variant="h5" textAlign="center" marginTop={2}>
            Vagy válassz egy országot!
          </Typography>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Grid container spacing={2} marginTop={15}>
              {randomCountries.map((item) => (
                <Grid
                  key={item.name}
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  size="grow"
                >
                  <motion.div variants={itemVariants}>
                    <Sample
                      countryName={item.name}
                      countryLabel={item.label}
                      continent={item.continent}
                      imageUrl={item.imageUrl}
                      onLoadData={handleLoadDataFromSample}
                    />
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </motion.div>
          <Grid
            sx={{ display: "flex", justifyContent: "center" }}
            marginTop={5}
          >
            <motion.div
              className="reloadButton"
              onClick={reloadCountries}
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{
                scale: 0.9,
                rotate: -90,
                borderRadius: "100%",
              }}
            >
              <CachedIcon className="reloadIcon" />
            </motion.div>
          </Grid>
          <Container>
            <Grid container></Grid>
          </Container>
        </Container>
      ) : worldMap ? (
        <>
          <MapContainer bounds={bounds}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <GeoJSON
              key={JSON.stringify(
                simplifiedData ? simplifiedData[currentTolerance] : data
              )}
              data={simplifiedData ? simplifiedData[currentTolerance] : data}
            />
          </MapContainer>
        </>
      ) : (
        <MapContainer bounds={bounds}>
          <GeoJSON
            key={JSON.stringify(
              simplifiedData ? simplifiedData[currentTolerance] : data
            )}
            data={simplifiedData ? simplifiedData[currentTolerance] : data}
          />
        </MapContainer>
      )}
    </>
  );
}

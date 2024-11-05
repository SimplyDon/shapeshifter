import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Grid from "@mui/material/Grid2";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import CasinoIcon from "@mui/icons-material/Casino";
import HelpIcon from "@mui/icons-material/Help";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  useMapEvent,
} from "react-leaflet";
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

const mapColor = { color: "#264653", fillColor: "#2a9d8f" };
const simplifiedMapColor1 = { color: "#db5375 ", fillColor: "#ec9192" };
const simplifiedMapColor2 = { color: "#ffffff ", fillColor: "#eeeeee" };

export default function App() {
  const [data, setData] = useState<any>(null);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [simplifiedData1, setSimplifiedData1] = useState<any>(null);
  const [simplifiedData2, setSimplifiedData2] = useState<any>(null);
  const [bounds, setBounds] = useState<any>(null);
  const [worldMapEnabled, setWorldMapEnabled] = useState<boolean>(false);
  const [attributesEnabled, setAttributesEnabled] = useState<boolean>(false);
  const [currentTolerance, setCurrentTolerance] = useState<number>(0);
  const [randomCountries, setRandomCountries] = useState<Country[]>(countries);
  const [infoDialogOpen, setInfoDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAlgorithm1, setSelectedAlgorithm1] = useState<string>("");
  const [selectedAlgorithm2, setSelectedAlgorithm2] = useState<string>("");

  const handleDataUpload = (uploadedData: any) => {
    setWorldMapEnabled(false);
    setAttributesEnabled(false);

    setData(uploadedData);

    const geojsonLayer = L.geoJSON(uploadedData);
    const geojsonBounds = geojsonLayer.getBounds();

    setBounds(geojsonBounds);
  };

  const resetData = () => {
    setData(null);
    setSimplifiedData1(null);
    setSimplifiedData2(null);
    setBounds(null);
    setCurrentTolerance(0);
  };

  const toggleWorldMap = () => {
    setWorldMapEnabled((prev: boolean) => !prev);
  };

  const toggleAttributes = () => {
    setAttributesEnabled((prev: boolean) => !prev);
  };

  const handleSimplify = async (tolerance: number) => {
    if (tolerance === -1) {
      setCurrentTolerance(0);
      setSimplifiedData1(null);
      setSimplifiedData2(null);
      return;
    }

    setCurrentTolerance(tolerance);
  };

  const toggleSimplification = async (
    availableTolerances: number[],
    algorithms: string[]
  ) => {
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:5000/api/simplify", {
        geojson: data,
        tolerances: availableTolerances,
        algorithms: algorithms,
      });

      if (algorithms.length === 1) {
        setSimplifiedData1(res.data[algorithms[0]]);
      } else if (algorithms.length === 2) {
        setSimplifiedData1(res.data[algorithms[0]]);
        setSimplifiedData2(res.data[algorithms[1]]);
      }
    } catch (err) {
      console.error("HIBA:", err);
    } finally {
      if (algorithms.length === 1) {
        setSelectedAlgorithm1(algorithms[0]);
      } else if (algorithms.length === 2) {
        setSelectedAlgorithm1(algorithms[0]);
        setSelectedAlgorithm2(algorithms[1]);
      }

      setLoading(false);
    }
  };

  const handleLoadDataFromSample = (geojsonData: any) => {
    setData(geojsonData);
    setFileUploaded(true);
    setWorldMapEnabled(false);
    setAttributesEnabled(false);

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

  const handleInfoDialogOpen = () => {
    setInfoDialogOpen(true);
  };

  const handleInfoDialogClose = () => {
    setInfoDialogOpen(false);
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties && attributesEnabled) {
      const tooltipContent = Object.entries(feature.properties)
        .map(([key, value]: any) => `<strong>${key}:</strong> ${value}`)
        .join("<br>");

      layer.bindTooltip(tooltipContent, {
        sticky: true,
        direction: "top",
      });
    } else {
      layer.unbindTooltip();
    }
  };

  function SetViewOnClick() {
    const map = useMapEvent("click", (e) => {
      map.setView(e.latlng, map.getZoom(), {
        animate: true,
      });
    });

    return null;
  }

  return (
    <>
      <Header
        data={data}
        setFileUploaded={setFileUploaded}
        onDataUpload={handleDataUpload}
        onResetData={resetData}
        onToggleWorldMap={toggleWorldMap}
        onToggleAttributes={toggleAttributes}
        onSimplify={handleSimplify}
        onToggleSimplification={toggleSimplification}
        fileUploaded={fileUploaded}
        attributesEnabled={attributesEnabled}
        worldmapEnabled={worldMapEnabled}
        loading={loading}
      />

      {!data && !simplifiedData1 ? (
        <Container>
          <Typography variant="h3" textAlign="center" marginTop={5}>
            Tölts fel egy <b>.zip</b> fájlt a megfelelő komponensekkel!
          </Typography>
          <Typography variant="h5" textAlign="center" marginTop={2}>
            Vagy válassz egy neked tetsző országot!
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
          <Grid container spacing={8} display="flex" justifyContent="center">
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
                <CasinoIcon className="reloadIcon" />
              </motion.div>
            </Grid>
            <Grid
              sx={{ display: "flex", justifyContent: "center" }}
              marginTop={5}
            >
              <motion.div
                className="helpButton"
                onClick={handleInfoDialogOpen}
                whileHover={{ scale: 1.2, rotate: 180 }}
                whileTap={{
                  scale: 0.9,
                  rotate: -90,
                  borderRadius: "100%",
                }}
              >
                <HelpIcon className="helpIcon" />
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      ) : worldMapEnabled ? (
        <>
          <MapContainer bounds={bounds}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <SetViewOnClick />
            <LayersControl position="bottomright">
              <LayersControl.Overlay checked name="Eredeti réteg">
                <GeoJSON
                  key={`${JSON.stringify(data)}-${attributesEnabled}`}
                  data={data}
                  onEachFeature={onEachFeature}
                  pathOptions={mapColor}
                />
              </LayersControl.Overlay>
              {simplifiedData1 && (
                <LayersControl.Overlay checked name={selectedAlgorithm1}>
                  <GeoJSON
                    key={`${JSON.stringify(
                      simplifiedData1[currentTolerance]
                    )}-${attributesEnabled}`}
                    data={simplifiedData1[currentTolerance]}
                    onEachFeature={onEachFeature}
                    pathOptions={simplifiedMapColor1}
                  />
                </LayersControl.Overlay>
              )}
              {simplifiedData2 && (
                <LayersControl.Overlay checked name={selectedAlgorithm2}>
                  <GeoJSON
                    key={`${JSON.stringify(
                      simplifiedData2[currentTolerance]
                    )}-${attributesEnabled}`}
                    data={simplifiedData2[currentTolerance]}
                    onEachFeature={onEachFeature}
                    pathOptions={simplifiedMapColor2}
                  />
                </LayersControl.Overlay>
              )}
            </LayersControl>
          </MapContainer>
        </>
      ) : (
        <MapContainer bounds={bounds}>
          <SetViewOnClick />
          <LayersControl position="bottomright">
            <LayersControl.Overlay checked name="Eredeti réteg">
              <GeoJSON
                key={`${JSON.stringify(data)}-${attributesEnabled}`}
                data={data}
                onEachFeature={onEachFeature}
                pathOptions={mapColor}
              />
            </LayersControl.Overlay>
            {simplifiedData1 && (
              <LayersControl.Overlay checked name={selectedAlgorithm1}>
                <GeoJSON
                  key={`${JSON.stringify(
                    simplifiedData1[currentTolerance]
                  )}-${attributesEnabled}`}
                  data={simplifiedData1[currentTolerance]}
                  onEachFeature={onEachFeature}
                  pathOptions={simplifiedMapColor1}
                />
              </LayersControl.Overlay>
            )}
            {simplifiedData2 && (
              <LayersControl.Overlay checked name={selectedAlgorithm2}>
                <GeoJSON
                  key={`${JSON.stringify(
                    simplifiedData2[currentTolerance]
                  )}-${attributesEnabled}`}
                  data={simplifiedData2[currentTolerance]}
                  onEachFeature={onEachFeature}
                  pathOptions={simplifiedMapColor2}
                />
              </LayersControl.Overlay>
            )}
          </LayersControl>
        </MapContainer>
      )}
      <Dialog open={infoDialogOpen} onClose={handleInfoDialogClose}>
        <DialogTitle>{"Szükséges komponensek"}</DialogTitle>
        <DialogContent>
          <DialogContentText variant="h6" component={"span"}>
            A <b>.zip</b> fájlnak kötelezően tartalmaznia kell:
          </DialogContentText>
          <DialogContentText component={"span"}>
            <ul>
              <li>
                <b>.shp</b> - tartalmazza magát a geometriát
              </li>
              <li>
                <b>.shx</b> - a <b>.shp</b> fájlhoz tartozó indexek
              </li>
            </ul>
          </DialogContentText>
          <DialogContentText variant="h6" component={"span"}>
            Opcionális fájlok:
          </DialogContentText>
          <DialogContentText component={"span"}>
            <ul>
              <li>
                <b>.dbf</b> - a geometriá(k)hoz tartozó attribútum(ok)
              </li>
              <li>
                <b>.cpg</b> - a <b>.dbf</b> fájlhoz tartozó karakterkódolás
              </li>
              <li>
                <b>.prj</b> - vetületi rendszer leírása
              </li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            color="success"
            onClick={handleInfoDialogClose}
          >
            Rendben
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

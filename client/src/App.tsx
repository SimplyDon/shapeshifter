import { useState, useEffect } from "react";
import { motion, Variants } from "framer-motion";
import Grid from "@mui/material/Grid2";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import { IconButton, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
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
import Footer from "./Footer";
import Sample from "./Sample";
import L, { LatLngBoundsExpression } from "leaflet";
import { Feature, FeatureCollection } from "geojson";
import axios, { AxiosResponse } from "axios";

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
  complexity: string;
  imageUrl: string;
};

interface Tolerance {
  value: number;
  label: string;
}

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
    complexity: "egyszerű",
    imageUrl: "./src/assets/hungary.png",
  },
  {
    name: "Németország",
    label: "germany",
    continent: "Európa",
    complexity: "közepes",
    imageUrl: "./src/assets/germany.png",
  },
  {
    name: "Egyiptom",
    label: "egypt",
    continent: "Afrika",
    complexity: "egyszerű",
    imageUrl: "./src/assets/egypt.png",
  },
  {
    name: "Dél-Korea",
    label: "korea",
    continent: "Ázsia",
    complexity: "közepes",
    imageUrl: "./src/assets/korea.png",
  },
  {
    name: "Egyesült Államok",
    label: "usa",
    continent: "Amerika",
    complexity: "bonyolult",
    imageUrl: "./src/assets/usa.png",
  },
  {
    name: "Egyesült Királyság",
    label: "uk",
    continent: "Európa",
    complexity: "egyszerű",
    imageUrl: "./src/assets/uk.png",
  },
  {
    name: "Finnország",
    label: "finland",
    continent: "Európa",
    complexity: "bonyolult",
    imageUrl: "./src/assets/finland.png",
  },
];

const mapColor = { color: "#264653", fillColor: "#2a9d8f" };
const simplifiedMapColor1 = { color: "#db5375 ", fillColor: "#ec9192" };
const simplifiedMapColor2 = { color: "#ffffff ", fillColor: "#eeeeee" };

export default function App() {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [simplifiedData1, setSimplifiedData1] =
    useState<Array<FeatureCollection> | null>(null);
  const [simplifiedData2, setSimplifiedData2] =
    useState<Array<FeatureCollection> | null>(null);
  const [bounds, setBounds] = useState<LatLngBoundsExpression | null>(null);
  const [worldMapEnabled, setWorldMapEnabled] = useState<boolean>(false);
  const [attributesEnabled, setAttributesEnabled] = useState<boolean>(false);
  const [tolerances, setTolerances] = useState<Tolerance[]>([]);
  const [currentTolerance, setCurrentTolerance] = useState<number>(0);
  const [numberOfTolerances, setNumberOfTolerances] = useState<number>(0);
  const [randomCountries, setRandomCountries] = useState<Country[]>(countries);
  const [infoDialogOpen, setInfoDialogOpen] = useState<boolean>(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(false);
  const [selectedAlgorithm1, setSelectedAlgorithm1] = useState<string>("");
  const [selectedAlgorithm2, setSelectedAlgorithm2] = useState<string>("");
  const [footerOpen, setFooterOpen] = useState<boolean>(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [currentMemoryUsage, setCurrentMemoryUsage] = useState<number>(0);
  const [peakMemoryUsage, setPeakMemoryUsage] = useState<number>(0);
  const [perimeter, setPerimeter] = useState<number>(0);
  const [pointCounts, setPointCounts] = useState<{
    original: number;
    simplified: Record<string, Record<number, number>>;
  } | null>(null);
  const [positionalErrors, setPositionalErrors] = useState<Record<
    string,
    Record<number, number>
  > | null>(null);

  const handleDataUpload = (uploadedData: FeatureCollection) => {
    setWorldMapEnabled(false);
    setAttributesEnabled(false);
    setFooterOpen(false);

    setData(uploadedData);

    const geojsonLayer = L.geoJSON(uploadedData);
    const geojsonBounds = geojsonLayer.getBounds();

    setBounds(geojsonBounds);
  };

  function centerMap() {
    if (bounds && map) {
      map.fitBounds(bounds);
    }
  }

  const resetData = () => {
    setData(null);
    setSimplifiedData1(null);
    setSimplifiedData2(null);
    setBounds(null);
    setCurrentTolerance(0);
    setFooterOpen(false);
    setPointCounts(null);
    setPositionalErrors(null);
    setPerimeter(0);
  };

  const toggleWorldMap = () => {
    setWorldMapEnabled((prev: boolean) => !prev);
  };

  const toggleAttributes = () => {
    setAttributesEnabled((prev: boolean) => !prev);
  };

  const handleSimplify = async (tolerance: number) => {
    // Disabling simplification
    if (tolerance === -1) {
      setCurrentTolerance(0);
      setSimplifiedData1(null);
      setSimplifiedData2(null);
      setSelectedAlgorithm1("");
      setSelectedAlgorithm2("");
      setFooterOpen(false);
      setElapsedTime(0);
      setCurrentMemoryUsage(0);
      setPeakMemoryUsage(0);
      setPointCounts(null);
      setPositionalErrors(null);
      setPerimeter(0);
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
        setSimplifiedData1(res.data.simplifiedData[algorithms[0]]);
      } else if (algorithms.length === 2) {
        setSimplifiedData1(res.data.simplifiedData[algorithms[0]]);
        setSimplifiedData2(res.data.simplifiedData[algorithms[1]]);
      }

      setElapsedTime(res.data.elapsedTime);
      setCurrentMemoryUsage(res.data.currentMemoryUsage);
      setPeakMemoryUsage(res.data.peakMemoryUsage);
    } catch (err) {
      console.error("HIBA:", err);
    } finally {
      if (algorithms.length === 1) {
        setSelectedAlgorithm1(algorithms[0] + " 🟥");
      } else if (algorithms.length === 2) {
        setSelectedAlgorithm1(algorithms[0] + " 🟥");
        setSelectedAlgorithm2(algorithms[1] + " ⬜️");
      }

      setLoading(false);
    }
  };

  const handleLoadDataFromSample = async (countryLabel: string) => {
    setLoading(true);

    try {
      const response: AxiosResponse = await axios.get(
        `http://localhost:5000/api/load_country/${countryLabel}`
      );

      setData(response.data);
      setFileUploaded(true);
      setWorldMapEnabled(false);
      setAttributesEnabled(false);
      setFooterOpen(false);

      const geojsonLayer = L.geoJSON(response.data);
      const geojsonBounds = geojsonLayer.getBounds();

      setBounds(geojsonBounds);
    } catch (error) {
      console.error("HIBA: ", error);
      setErrorSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
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

  const handleDownload = async (selectedLayer: string) => {
    let layerToDownload;

    if (selectedLayer === "layer0") {
      layerToDownload = data as FeatureCollection;
    } else if (selectedLayer === "layer1" && simplifiedData1) {
      layerToDownload = simplifiedData1[currentTolerance] as FeatureCollection;
    } else if (selectedLayer === "layer2" && simplifiedData2) {
      layerToDownload = simplifiedData2[currentTolerance] as FeatureCollection;
    }

    try {
      const response: AxiosResponse = await axios.post(
        "http://localhost:5000/api/download_shapefile",
        layerToDownload,
        {
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/zip" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = "shapeshifter-export.zip";
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("HIBA:", error);
    }
  };

  const enableMetrics = async () => {
    let selectedAlgorithms: String[] = [];

    if (selectedAlgorithm2) {
      selectedAlgorithms = [
        selectedAlgorithm1.slice(0, -3),
        selectedAlgorithm2.slice(0, -3),
      ]; // Remove color emoji
    } else if (selectedAlgorithm1) {
      selectedAlgorithms = [selectedAlgorithm1.slice(0, -3)]; // Remove color emoji
    }

    if (pointCounts) {
      if (footerOpen) {
        setFooterOpen(false);
        return;
      } else {
        setFooterOpen(true);
        return;
      }
    }

    try {
      setMetricsLoading(true);

      const response: AxiosResponse = await axios.post(
        "http://localhost:5000/api/metrics",
        {
          geojson: data,
          simplifiedData1: simplifiedData1,
          simplifiedData2: simplifiedData2,
          tolerances: tolerances,
          algorithms: selectedAlgorithms,
        }
      );

      setPointCounts(response.data.pointCounts);
      setPositionalErrors(response.data.positionalErrors);
      setPerimeter(response.data.perimeter);
      setFooterOpen(true);
    } catch (error) {
      console.error("HIBA:", error);
    } finally {
      setMetricsLoading(false);
    }
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    if (feature.properties && attributesEnabled) {
      const tooltipContent = Object.entries(feature.properties)
        .map(
          ([key, value]: Array<string>) => `<strong>${key}:</strong> ${value}`
        )
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

  const handleSnackbarClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setErrorSnackbarOpen(false);
  };

  return (
    <>
      <Header
        setFileUploaded={setFileUploaded}
        onDataUpload={handleDataUpload}
        onResetData={resetData}
        onToggleWorldMap={toggleWorldMap}
        onToggleAttributes={toggleAttributes}
        onCenterMap={centerMap}
        onSimplify={handleSimplify}
        onToggleSimplification={toggleSimplification}
        onDownload={handleDownload}
        onEnableMetrics={enableMetrics}
        fileUploaded={fileUploaded}
        attributesEnabled={attributesEnabled}
        worldmapEnabled={worldMapEnabled}
        loading={loading}
        metricsLoading={metricsLoading}
        selectedAlgorithm1={selectedAlgorithm1}
        selectedAlgorithm2={selectedAlgorithm2}
        setNumberOfTolerances={setNumberOfTolerances}
        tolerances={tolerances}
        setTolerances={setTolerances}
      />

      <Footer
        drawerOpen={footerOpen}
        elapsedTime={elapsedTime}
        currentMemoryUsage={currentMemoryUsage}
        peakMemoryUsage={peakMemoryUsage}
        pointCounts={pointCounts}
        positional_errors={positionalErrors}
        perimeter={perimeter}
        currentTolerance={currentTolerance}
        selectedAlgorithm1={selectedAlgorithm1}
        selectedAlgorithm2={selectedAlgorithm2}
        numberOfTolerances={numberOfTolerances}
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
                      complexity={item.complexity}
                      imageUrl={item.imageUrl}
                      loading={loading}
                      onCountryLoad={handleLoadDataFromSample}
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
      ) : (
        <>
          <MapContainer bounds={bounds as LatLngBoundsExpression} ref={setMap}>
            {worldMapEnabled && (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
              />
            )}
            <SetViewOnClick />
            <LayersControl position="topright">
              <LayersControl.Overlay checked name="Eredeti réteg 🟩">
                <GeoJSON
                  key={`${JSON.stringify(data)}-${attributesEnabled}`}
                  data={data as FeatureCollection}
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
      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="error"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          Betöltés sikertelen!
        </Alert>
      </Snackbar>
    </>
  );
}

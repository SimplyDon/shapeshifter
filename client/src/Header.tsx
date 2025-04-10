import React, { useState, useRef } from "react";
import {
  createTheme,
  ThemeProvider,
  PaletteColorOptions,
} from "@mui/material/styles";
import axios from "axios";
import { FeatureCollection } from "geojson";
import { motion } from "framer-motion";
import "./styles.scss";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import LoadingButton from "@mui/lab/LoadingButton";
import Grid from "@mui/material/Grid2";
import Typography from "@mui/material/Typography";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import DoubleArrowIcon from "@mui/icons-material/DoubleArrow";
import SpeedIcon from "@mui/icons-material/Speed";
import FitScreenIcon from "@mui/icons-material/FitScreen";
import Slider from "@mui/material/Slider";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import PentagonIcon from "@mui/icons-material/Pentagon";
import HexagonIcon from "@mui/icons-material/Hexagon";
import DataObjectIcon from "@mui/icons-material/DataObject";
import Stack from "@mui/material/Stack";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { IconButton, Alert } from "@mui/material";
import Snackbar, { SnackbarCloseReason } from "@mui/material/Snackbar";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import PublicIcon from "@mui/icons-material/Public";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import PolylineIcon from "@mui/icons-material/Polyline";
import FormControl from "@mui/material/FormControl";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import TextField from "@mui/material/TextField";

declare module "@mui/material/styles" {
  interface CustomPalette {
    primary: PaletteColorOptions;
    success: PaletteColorOptions;
    gray: PaletteColorOptions;
    brown: PaletteColorOptions;
    yellow: PaletteColorOptions;
    purple: PaletteColorOptions;
    blue: PaletteColorOptions;
    pink: PaletteColorOptions;
  }
  interface Palette extends CustomPalette {}
  interface PaletteOptions extends CustomPalette {}
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    primary: true;
    success: true;
    gray: true;
    brown: true;
    yellow: true;
    purple: true;
    blue: true;
    pink: true;
  }
}

const { palette } = createTheme();
const { augmentColor } = palette;
const createColor = (mainColor: string) =>
  augmentColor({ color: { main: mainColor } });
const theme = createTheme({
  palette: {
    primary: createColor("#3f51b5"),
    success: createColor("#2b9348"),
    gray: createColor("#5c677d"),
    brown: createColor("#c38e70"),
    yellow: createColor("#e9d8a6"),
    purple: createColor("#b56576"),
    blue: createColor("#1976d2"),
    pink: createColor("#e27396"),
  },
});

interface HeaderProps {
  setFileUploaded: React.Dispatch<React.SetStateAction<boolean>>;
  onDataUpload: (data: FeatureCollection) => void;
  onResetData: () => void;
  onToggleWorldMap: () => void;
  onToggleAttributes: () => void;
  onCenterMap: () => void;
  onSimplify: (tolerance: number) => void;
  onToggleSimplification: (
    availableTolerances: number[],
    algorithms: string[]
  ) => void;
  onDownload: (selectedLayer: string) => void;
  onEnableMetrics: () => void;
  fileUploaded: boolean;
  attributesEnabled: boolean;
  worldmapEnabled: boolean;
  loading: boolean;
  metricsLoading: boolean;
  selectedAlgorithm1: string;
  selectedAlgorithm2: string;
  setNumberOfTolerances: React.Dispatch<React.SetStateAction<number>>;
  tolerances: Tolerance[];
  setTolerances: React.Dispatch<React.SetStateAction<Tolerance[]>>;
}

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

interface Option {
  name: string;
  disabled: boolean;
}

const options: Option[] = [
  { name: "Ramer-Douglas-Peucker (beépített)", disabled: false },
  { name: "Ramer-Douglas-Peucker (implementált)", disabled: false },
  { name: "Ramer-Douglas-Peucker (továbbfejlesztett)", disabled: false },
  { name: "Visvaligam-Whyatt", disabled: false },
  { name: "Visvaligam-Whyatt (továbbfejlesztett)", disabled: true },
  { name: "Reumann-Witkam", disabled: false },
  { name: "Merőleges távolság", disabled: false },
  { name: "Sugárirányú távolság", disabled: false },
  { name: "N-edik pont", disabled: false },
  { name: "Véletlenszerű", disabled: false },
  { name: "Lang", disabled: false },
];

interface Tolerance {
  value: number;
  label: string;
}

const Header: React.FC<HeaderProps> = ({
  setFileUploaded,
  onDataUpload,
  onResetData,
  onToggleWorldMap,
  onToggleAttributes,
  onCenterMap,
  onSimplify,
  onToggleSimplification,
  onDownload,
  onEnableMetrics,
  fileUploaded,
  attributesEnabled,
  worldmapEnabled,
  loading,
  metricsLoading,
  selectedAlgorithm1,
  selectedAlgorithm2,
  setNumberOfTolerances,
  tolerances,
  setTolerances,
}: HeaderProps) => {
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);
  const [warningSnackbarOpen, setWarningSnackbarOpen] =
    useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState<boolean>(false);
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
  const [simplificationEnabled, setSimplificationEnabled] =
    useState<boolean>(false);
  const [simplificationDialogOpen, setSimplificationDialogOpen] =
    useState<boolean>(false);
  const [algorithms, setAlgorithms] = useState<Record<string, boolean>>(
    options.reduce((acc: Record<string, boolean>, option: Option) => {
      acc[option.name] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [numberOfSelectedAlgorithms, setNumberOfSelectedAlgorithms] =
    useState<number>(0);

  const [endPoint, setEndPoint] = useState<number>(0.5);
  const [step, setStep] = useState<number>(0.1);
  const tolerancesRef = useRef(tolerances);

  const handleSimplificationDialogChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setAlgorithms({
      ...algorithms,
      [event.target.name]: event.target.checked,
    });
  };

  const selectedItems: number =
    Object.values(algorithms).filter(Boolean).length;

  const simplificationDialogWarning: boolean = selectedItems > 1;

  const simplificationDialogError: boolean =
    selectedItems > 2 ||
    selectedItems == 0 ||
    endPoint <= 0 ||
    endPoint > 2 ||
    step < 0.02 ||
    Number.isNaN(endPoint) ||
    Number.isNaN(step) ||
    endPoint < step;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) {
      console.warn("Nincs kiválasztva fájl!");
      setFileUploaded(false);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData
      );

      onDataUpload(res.data["geojson"]);
      setFileUploaded(true);

      if (res.data["warning"]) {
        setWarningSnackbarOpen(true);
      }
    } catch (error) {
      console.error("HIBA:", error);
      setErrorSnackbarOpen(true);
      setFileUploaded(false);
    }
  };

  const handleSnackbarClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      return;
    }

    setErrorSnackbarOpen(false);
    setWarningSnackbarOpen(false);
  };

  const deleteFile = () => {
    setFileUploaded(false);
    onResetData();
    setSimplificationEnabled(false);
    handleDeleteDialogClose();
  };

  const handleDeleteDialogOpen = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    onSimplify(newValue as number);
  };

  const handleSimplify = (algorithms: string[]) => {
    setSimplificationEnabled((prev: boolean) => !prev);

    // Disabling simplification
    if (simplificationEnabled) {
      onSimplify(-1);
      setNumberOfSelectedAlgorithms(0);
      setEndPoint(0.5);
      setStep(0.1);
      return;
    }

    onToggleSimplification(
      tolerancesRef.current.map((t) => t.value),
      algorithms
    );
  };

  const handleSimplificationDialog = () => {
    if (simplificationEnabled) {
      handleSimplify([]);
      return;
    }

    setSimplificationDialogOpen(true);
  };

  const handleSimplificationDialogClose = () => {
    setSimplificationDialogOpen(false);
    setAlgorithms(
      options.reduce((acc: Record<string, boolean>, option: Option) => {
        acc[option.name] = false;
        return acc;
      }, {} as Record<string, boolean>)
    );

    setEndPoint(0.5);
    setStep(0.1);
  };

  const handleSimplificationDialogSubmit = () => {
    setSimplificationDialogOpen(false);
    setAlgorithms(
      options.reduce((acc: Record<string, boolean>, option: Option) => {
        acc[option.name] = false;
        return acc;
      }, {} as Record<string, boolean>)
    );

    const selectedValues = Object.entries(algorithms)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    generateTolerances(endPoint, step);

    setNumberOfSelectedAlgorithms(selectedValues.length);
    handleSimplify(selectedValues);
  };

  const handleDownloadDialogOpen = () => {
    setDownloadDialogOpen(true);
  };

  const handleDownloadDialogClose = () => {
    setSelectedLayer(null);
    setDownloadDialogOpen(false);
  };

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedLayer(event.target.value);
  };

  const handleDownloadDialogSubmit = () => {
    if (selectedLayer) {
      onDownload(selectedLayer);
    }

    handleDownloadDialogClose();
  };

  const handleEndPointChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: number = parseFloat(event.target.value);
    setEndPoint(value);
  };

  const handleStepChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value: number = parseFloat(event.target.value);
    setStep(value);
  };

  const generateTolerances = (endPoint: number, step: number) => {
    const newTolerances: Tolerance[] = [];

    for (let i = 0; i <= endPoint; i += step) {
      const tolerance: string = i.toFixed(2);

      newTolerances.push({
        value: Number(tolerance),
        label: tolerance,
      });
    }

    setTolerances(newTolerances);
    setNumberOfTolerances(newTolerances.length);

    tolerancesRef.current = newTolerances;
  };

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <AppBar position="static">
          <Toolbar>
            {!fileUploaded && (
              <motion.div
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Button
                  component="label"
                  variant="contained"
                  color="secondary"
                  tabIndex={-1}
                  startIcon={<CloudUploadIcon />}
                >
                  ZIP FELTÖLTÉSE
                  <VisuallyHiddenInput
                    type="file"
                    onChange={handleFileChange}
                    accept=".zip"
                  />
                </Button>
              </motion.div>
            )}

            {fileUploaded && (
              <Stack
                direction="row"
                sx={{ width: "100%" }}
                component={motion.div}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Stack
                  spacing={2}
                  direction="row"
                  sx={{ width: "100%", justifyContent: "flex-start" }}
                >
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    color="success"
                    sx={{ color: "white" }}
                    onClick={handleDownloadDialogOpen}
                    disabled={loading || metricsLoading}
                  >
                    Letöltés
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<FitScreenIcon />}
                    color="blue"
                    sx={{ color: "white" }}
                    onClick={onCenterMap}
                  >
                    Igazítás
                  </Button>
                  <Button
                    variant={worldmapEnabled ? "contained" : "outlined"}
                    startIcon={<PublicIcon />}
                    color="gray"
                    sx={{ color: "white" }}
                    onClick={onToggleWorldMap}
                  >
                    Térkép
                  </Button>
                  <Button
                    variant={attributesEnabled ? "contained" : "outlined"}
                    startIcon={<DataObjectIcon />}
                    color="brown"
                    sx={{ color: "white" }}
                    onClick={onToggleAttributes}
                  >
                    Attribútumok
                  </Button>
                </Stack>

                {loading ? (
                  <Box
                    sx={{
                      width: "70%",
                      marginTop: "15px",
                    }}
                  >
                    <LinearProgress color="secondary" />
                  </Box>
                ) : (
                  simplificationEnabled && (
                    <Stack spacing={2} direction="row">
                      <Box sx={{ width: 450 }}>
                        <Stack
                          spacing={2}
                          direction="row"
                          sx={{ alignItems: "center" }}
                        >
                          <HexagonIcon />
                          <Slider
                            aria-label="Tolerance"
                            min={0}
                            marks={tolerances}
                            max={tolerances[tolerances.length - 1].value}
                            step={null}
                            color="secondary"
                            onChange={handleSliderChange}
                          />
                          <PentagonIcon />
                        </Stack>
                      </Box>
                    </Stack>
                  )
                )}

                <Stack
                  spacing={2}
                  direction="row"
                  sx={{
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <LoadingButton
                    variant="contained"
                    startIcon={<SpeedIcon />}
                    color="pink"
                    sx={{ color: "white" }}
                    onClick={onEnableMetrics}
                    loading={metricsLoading}
                    disabled={loading || !simplificationEnabled}
                    loadingPosition="start"
                  >
                    Metrikák
                  </LoadingButton>
                  <Button
                    variant="contained"
                    startIcon={<PolylineIcon />}
                    color={simplificationEnabled ? "yellow" : "warning"}
                    onClick={handleSimplificationDialog}
                    disabled={loading || metricsLoading}
                  >
                    {simplificationEnabled
                      ? `Egyszerűsítés (${numberOfSelectedAlgorithms} db)`
                      : "Egyszerűsítés"}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={handleDeleteDialogOpen}
                    disabled={loading || metricsLoading}
                  >
                    Törlés
                  </Button>
                </Stack>
              </Stack>
            )}
          </Toolbar>
        </AppBar>
      </Box>
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
          Feltöltés sikertelen!
        </Alert>
      </Snackbar>
      <Snackbar
        open={warningSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="warning"
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
          Az attribútumokat tartalmazó .dbf fájl nem található!
        </Alert>
      </Snackbar>
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>{"Figyelmeztetés"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Térképréteg törlése nem visszavonható művelet.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Mégsem</Button>
          <Button
            onClick={deleteFile}
            autoFocus
            color="error"
            endIcon={<DeleteIcon />}
            variant="contained"
          >
            Törlés
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={simplificationDialogOpen}
        onClose={handleSimplificationDialogClose}
      >
        <DialogTitle>
          Válassz <b>max. 2</b> algoritmust!
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={1}>
            <Grid size={8}>
              <FormControl
                required
                error={simplificationDialogError}
                component="fieldset"
                sx={{ m: 3 }}
                variant="standard"
              >
                <FormGroup>
                  {options.map((option) => (
                    <FormControlLabel
                      key={option.name}
                      control={
                        <Checkbox
                          checked={algorithms[option.name]}
                          onChange={handleSimplificationDialogChange}
                          name={option.name}
                          disabled={option.disabled}
                        />
                      }
                      label={option.name}
                    />
                  ))}
                </FormGroup>
              </FormControl>
            </Grid>
            <Divider orientation="vertical" variant="middle" flexItem />
            <Grid sx={{ flex: 1 }} size={6} margin={1}>
              <Stack spacing={3}>
                <Typography variant="h5">További opciók</Typography>
                <Divider orientation="horizontal" flexItem></Divider>
                <TextField
                  label="Kezdőpont"
                  type="number"
                  defaultValue={0}
                  disabled
                />
                <TextField
                  label="Végpont"
                  type="number"
                  value={endPoint}
                  onChange={handleEndPointChange}
                  inputProps={{ step: ".1" }}
                />
                <TextField
                  label="Lépték"
                  type="number"
                  value={step}
                  onChange={handleStepChange}
                  inputProps={{ step: ".1" }}
                />
              </Stack>
            </Grid>
            {simplificationDialogWarning && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                }}
              >
                <Alert severity="warning">
                  Több algoritmus számolása időigényes lehet.
                </Alert>
              </motion.div>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSimplificationDialogClose} color="primary">
            Mégsem
          </Button>
          <Button
            variant="contained"
            color="success"
            endIcon={<DoubleArrowIcon />}
            onClick={handleSimplificationDialogSubmit}
            disabled={simplificationDialogError}
          >
            Futtatás
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={downloadDialogOpen} onClose={handleDownloadDialogClose}>
        <DialogTitle>Válassz egy réteget!</DialogTitle>
        <DialogContent>
          <FormControl component="fieldset">
            <RadioGroup value={selectedLayer} onChange={handleOptionChange}>
              <FormControlLabel
                value="layer0"
                control={<Radio />}
                label="Eredeti réteg 🟩"
              />

              {numberOfSelectedAlgorithms > 0 && (
                <FormControlLabel
                  value="layer1"
                  control={<Radio />}
                  label={selectedAlgorithm1}
                />
              )}

              {numberOfSelectedAlgorithms > 1 && (
                <FormControlLabel
                  value="layer2"
                  control={<Radio />}
                  label={selectedAlgorithm2}
                />
              )}
            </RadioGroup>
          </FormControl>
          <br />
          <br />
          <Alert severity="info">
            Egyszerűsített réteg az aktuális toleranciával kerül letöltésre.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownloadDialogClose} color="primary">
            Mégsem
          </Button>
          <Button
            onClick={handleDownloadDialogSubmit}
            color="success"
            endIcon={<DownloadIcon />}
            variant="contained"
            disabled={!selectedLayer}
          >
            Letöltés
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default Header;

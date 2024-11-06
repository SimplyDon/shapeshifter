import React, { useState } from "react";
import {
  createTheme,
  ThemeProvider,
  PaletteColorOptions,
} from "@mui/material/styles";
import axios from "axios";
import { motion } from "framer-motion";
import "./styles.scss";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import Slider from "@mui/material/Slider";
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

declare module "@mui/material/styles" {
  interface CustomPalette {
    primary: PaletteColorOptions;
    success: PaletteColorOptions;
    gray: PaletteColorOptions;
    brown: PaletteColorOptions;
    yellow: PaletteColorOptions;
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
  }
}

const { palette } = createTheme();
const { augmentColor } = palette;
const createColor = (mainColor: any) =>
  augmentColor({ color: { main: mainColor } });
const theme = createTheme({
  palette: {
    primary: createColor("#3f51b5"),
    success: createColor("#2b9348"),
    gray: createColor("#5c677d"),
    brown: createColor("#c38e70"),
    yellow: createColor("#e9d8a6"),
  },
});

interface HeaderProps {
  data: () => void;
  setFileUploaded: React.Dispatch<React.SetStateAction<boolean>>;
  onDataUpload: (data: any) => void;
  onResetData: () => void;
  onToggleWorldMap: () => void;
  onToggleAttributes: () => void;
  onSimplify: (tolerance: number) => void;
  onToggleSimplification: (
    availableTolerances: number[],
    algorithms: string[]
  ) => void;
  fileUploaded: boolean;
  attributesEnabled: boolean;
  worldmapEnabled: boolean;
  loading: boolean;
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
  { name: "Ramer-Douglas-Peucker (továbbfejlesztett)", disabled: true },
  { name: "Reumann-Witkam", disabled: false },
  { name: "Visvaligam-Whyatt", disabled: false },
  { name: "Merőleges távolság", disabled: false },
  { name: "Sugárirányú távolság", disabled: false },
  { name: "N-edik pont", disabled: false },
  { name: "Zhao-Saalfeld", disabled: true },
  { name: "Lang", disabled: true },
  { name: "Opheim", disabled: true },
];

interface Tolerance {
  value: number;
  label: string;
}

const availableTolerances: Tolerance[] = [
  {
    value: 0,
    label: "0",
  },
  {
    value: 0.05,
    label: "0.05",
  },
  {
    value: 0.1,
    label: "0.1",
  },
  {
    value: 0.15,
    label: "0.15",
  },
  {
    value: 0.2,
    label: "0.2",
  },
  {
    value: 0.25,
    label: "0.25",
  },
  {
    value: 0.3,
    label: "0.3",
  },
  {
    value: 0.35,
    label: "0.35",
  },
  {
    value: 0.4,
    label: "0.4",
  },
  {
    value: 0.45,
    label: "0.45",
  },
  {
    value: 0.5,
    label: "0.5",
  },
];

const Header: React.FC<HeaderProps> = ({
  data,
  setFileUploaded,
  onDataUpload,
  onResetData,
  onToggleWorldMap,
  onToggleAttributes,
  onSimplify,
  onToggleSimplification,
  fileUploaded,
  attributesEnabled,
  worldmapEnabled,
  loading,
}: HeaderProps) => {
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState<boolean>(false);
  const [warningSnackbarOpen, setWarningSnackbarOpen] =
    useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [simplificationEnabled, setSimplificationEnabled] =
    useState<boolean>(false);
  const [simplificationDialogOpen, setSimplificationDialogOpen] =
    useState<boolean>(false);
  const [algorithms, setAlgorithms] = useState<Record<string, boolean>>(
    options.reduce((acc: any, option: any) => {
      acc[option.name] = false;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const [numberOfSelectedAlgorithms, setNumberOfSelectedAlgorithms] =
    useState<number>(0);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAlgorithms({
      ...algorithms,
      [event.target.name]: event.target.checked,
    });
  };

  const selectedItems: number =
    Object.values(algorithms).filter(Boolean).length;

  const simplificationDialogWarning: boolean = selectedItems == 2;

  const simplificationDialogError: boolean =
    selectedItems > 2 || selectedItems == 0;

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
    } catch (err) {
      console.error("HIBA:", err);
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

    if (simplificationEnabled) {
      onSimplify(-1);
      return;
    }

    onToggleSimplification(
      availableTolerances.map((t) => t.value),
      algorithms
    );
  };

  const handleDownload = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/download_shapefile",
        { geojson: data },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "export.shp");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("HIBA:", error);
    }
  };

  const handleSimplificationDialog = () => {
    if (simplificationEnabled) {
      handleSimplify([]);
      return;
    }

    setSimplificationDialogOpen(true);
  };

  const handleClose = () => {
    setSimplificationDialogOpen(false);
    setAlgorithms(
      options.reduce((acc: any, option: any) => {
        acc[option.name] = false;
        return acc;
      }, {} as Record<string, boolean>)
    );
  };

  const handleSubmit = () => {
    setSimplificationDialogOpen(false);
    setAlgorithms(
      options.reduce((acc: any, option: any) => {
        acc[option.name] = false;
        return acc;
      }, {} as Record<string, boolean>)
    );

    const selectedValues = Object.entries(algorithms)
      .filter(([_, value]) => value)
      .map(([key, _]) => key);

    setNumberOfSelectedAlgorithms(selectedValues.length);
    handleSimplify(selectedValues);
  };

  return (
    <ThemeProvider theme={theme}>
      <Box>
        <AppBar position="static">
          <Toolbar>
            {!fileUploaded && (
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
            )}

            {fileUploaded && (
              <Stack direction="row" sx={{ width: "100%" }}>
                <Stack
                  spacing={2}
                  direction="row"
                  sx={{ width: "100%", justifyContent: "flex-start" }}
                >
                  <Button
                    variant="contained"
                    startIcon={<CloudDownloadIcon />}
                    color="success"
                    sx={{ color: "white" }}
                    onClick={handleDownload}
                    disabled={loading}
                  >
                    Letöltés
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
                            marks={availableTolerances}
                            max={
                              availableTolerances[
                                availableTolerances.length - 1
                              ].value
                            }
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
                  sx={{ width: "100%", justifyContent: "flex-end" }}
                >
                  <Button
                    variant="contained"
                    startIcon={<PolylineIcon />}
                    color={simplificationEnabled ? "yellow" : "warning"}
                    onClick={handleSimplificationDialog}
                    disabled={loading}
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
                    disabled={loading}
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
            variant="contained"
          >
            Törlés
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={simplificationDialogOpen} onClose={handleClose}>
        <DialogTitle>
          Válassz <b>max. 2</b> algoritmust!
        </DialogTitle>
        <DialogContent>
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
                      onChange={handleChange}
                      name={option.name}
                      disabled={option.disabled}
                    />
                  }
                  label={option.name}
                />
              ))}
            </FormGroup>
          </FormControl>
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Mégsem
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={simplificationDialogError}
          >
            Futtatás
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
};

export default Header;

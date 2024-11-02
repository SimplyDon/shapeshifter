import React, { useState } from "react";
import {
  createTheme,
  ThemeProvider,
  PaletteColorOptions,
} from "@mui/material/styles";
import axios from "axios";
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
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import FormControlLabel from "@mui/material/FormControlLabel";

declare module "@mui/material/styles" {
  interface CustomPalette {
    primary: PaletteColorOptions;
    success: PaletteColorOptions;
    beige: PaletteColorOptions;
    brown: PaletteColorOptions;
  }
  interface Palette extends CustomPalette {}
  interface PaletteOptions extends CustomPalette {}
}

declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    primary: true;
    success: true;
    beige: true;
    brown: true;
  }
}

const { palette } = createTheme();
const { augmentColor } = palette;
const createColor = (mainColor: any) =>
  augmentColor({ color: { main: mainColor } });
const theme = createTheme({
  palette: {
    primary: createColor("#3f51b5"),
    success: createColor("#57cc99"),
    beige: createColor("#f0f3bd"),
    brown: createColor("#c38e70"),
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
    algorithm: String
  ) => void;
  fileUploaded: boolean;
  attributesEnabled: boolean;
  worldmapEnabled: boolean;
  loading: boolean;
}

export interface ConfirmationDialogRawProps {
  id: string;
  keepMounted: boolean;
  value: string;
  open: boolean;
  onClose: (value?: string) => void;
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

const options = [
  { name: "Douglas-Peucker (beépített)", disabled: false },
  { name: "Douglas-Peucker (implementált)", disabled: false },
  { name: "Visvaligam-Whyatt", disabled: false },
  { name: "Douglas-Peucker (továbbfejlesztett)", disabled: true },
  { name: "Reumann-Witkam", disabled: true },
  { name: "Lang", disabled: true },
  { name: "Opheim", disabled: true },
];

const availableTolerances = [
  {
    value: 0,
    label: "0",
  },
  {
    value: 0.05,
    label: "0.5",
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

function ConfirmationDialogRaw(props: ConfirmationDialogRawProps) {
  const { onClose, value: valueProp, open, ...other } = props;
  const [value, setValue] = React.useState(valueProp);
  const radioGroupRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    if (!open) {
      setValue(valueProp);
    }
  }, [valueProp, open]);

  const handleEntering = () => {
    if (radioGroupRef.current != null) {
      radioGroupRef.current.focus();
    }
  };

  const handleCancel = () => {
    onClose();
  };

  const handleOk = () => {
    onClose(value);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setValue((event.target as HTMLInputElement).value);
  };

  return (
    <Dialog
      sx={{ "& .MuiDialog-paper": { width: "80%", maxHeight: 435 } }}
      maxWidth="xs"
      TransitionProps={{ onEntering: handleEntering }}
      open={open}
      {...other}
    >
      <DialogTitle>Válassz egy algoritmust!</DialogTitle>
      <DialogContent dividers>
        <RadioGroup
          ref={radioGroupRef}
          aria-label="simplification-algorithms"
          name="simplification-algorithms"
          value={value}
          onChange={handleChange}
        >
          {options.map((option) => (
            <FormControlLabel
              value={option.name}
              disabled={option.disabled}
              key={option.name}
              control={<Radio />}
              label={option.name}
            />
          ))}
        </RadioGroup>
      </DialogContent>
      <DialogActions>
        <Button autoFocus onClick={handleCancel}>
          Mégsem
        </Button>
        <Button onClick={handleOk} variant="contained" color="success">
          Futtatás
        </Button>
      </DialogActions>
    </Dialog>
  );
}

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
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [simplificationEnabled, setSimplificationEnabled] =
    useState<boolean>(false);
  const [simplificationDialogOpen, setSimplificationDialogOpen] =
    useState<boolean>(false);
  const [simplificationDialogValue, setSimplificationDialogValue] =
    useState<string>("");

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

      onDataUpload(res.data);
      setFileUploaded(true);
    } catch (err) {
      console.error("HIBA:", err);
      setSnackbarOpen(true);
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

    setSnackbarOpen(false);
  };

  const deleteFile = () => {
    setFileUploaded(false);
    onResetData();
    setSimplificationEnabled(false);
    setSimplificationDialogValue("");
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

  const handleSimplify = (algorithm: string) => {
    setSimplificationEnabled((prev: boolean) => !prev);

    if (simplificationEnabled) {
      onSimplify(0);
    }

    onToggleSimplification(
      availableTolerances.map((t) => t.value),
      algorithm
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
      handleSimplify("");
      setSimplificationDialogValue("");
      return;
    }

    setSimplificationDialogOpen(true);
  };

  const handleClose = (newValue?: string) => {
    setSimplificationDialogOpen(false);

    if (newValue) {
      setSimplificationDialogValue(newValue);

      handleSimplify(newValue);
    }
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
                    onClick={handleDownload}
                    disabled={loading}
                  >
                    Letöltés
                  </Button>
                  <Button
                    variant={worldmapEnabled ? "contained" : "outlined"}
                    startIcon={<PublicIcon />}
                    color="beige"
                    onClick={onToggleWorldMap}
                  >
                    Térkép
                  </Button>
                  <Button
                    variant={attributesEnabled ? "contained" : "outlined"}
                    startIcon={<DataObjectIcon />}
                    color="brown"
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
                    color="warning"
                    onClick={handleSimplificationDialog}
                    disabled={loading}
                  >
                    {simplificationDialogValue == ""
                      ? "Egyszerűsítés"
                      : simplificationDialogValue}
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
        open={snackbarOpen}
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
      <ConfirmationDialogRaw
        id="simplification-menu"
        keepMounted
        open={simplificationDialogOpen}
        onClose={handleClose}
        value={simplificationDialogValue}
      />
    </ThemeProvider>
  );
};

export default Header;

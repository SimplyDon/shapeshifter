import React, { useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { indigo, purple } from "@mui/material/colors";
import axios from "axios";
import "./styles.scss";
import { styled } from "@mui/material/styles";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import DashboardIcon from "@mui/icons-material/Dashboard";
import Slider from "@mui/material/Slider";
import PentagonIcon from "@mui/icons-material/Pentagon";
import HexagonIcon from "@mui/icons-material/Hexagon";
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

const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: purple,
  },
});

interface HeaderProps {
  data: () => void;
  onDataUpload: (data: any) => void;
  onResetData: () => void;
  onToggleWorldMap: () => void;
  onSimplify: (tolerance: number) => void;
  onToggleSimplification: (
    availableTolerances: number[],
    algorithm: String
  ) => void;
  fileUploaded: boolean;
  setFileUploaded: React.Dispatch<React.SetStateAction<boolean>>;
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
  { name: "Douglas-Peucker", disabled: false },
  { name: "Visvaligam-Whyatt", disabled: true },
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
    value: 0.03,
    label: "0.03",
  },
  {
    value: 0.06,
    label: "0.06",
  },
  {
    value: 0.09,
    label: "0.09",
  },
  {
    value: 0.12,
    label: "0.12",
  },
  {
    value: 0.15,
    label: "0.15",
  },
  {
    value: 0.18,
    label: "0.18",
  },
  {
    value: 0.21,
    label: "0.21",
  },
  {
    value: 0.24,
    label: "0.24",
  },
  {
    value: 0.27,
    label: "0.27",
  },
  {
    value: 0.3,
    label: "0.3",
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
          Cancel
        </Button>
        <Button onClick={handleOk}>Ok</Button>
      </DialogActions>
    </Dialog>
  );
}

const Header: React.FC<HeaderProps> = ({
  data,
  onDataUpload,
  onResetData,
  onToggleWorldMap,
  onSimplify,
  onToggleSimplification,
  fileUploaded,
  setFileUploaded,
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
    if (!data) {
      return;

      //TODO
    }

    try {
      const response = await axios.post(
        "http://localhost:5000/api/download_shapefile",
        { geojson: data },
        {
          responseType: "blob", // Important for handling binary data
        }
      );

      // Create a URL for the blob response
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "map_shapefile.shp"); // Define file name
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading shapefile:", error);
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
                  >
                    Letöltés
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<PublicIcon />}
                    color="info"
                    onClick={onToggleWorldMap}
                  >
                    Térkép
                  </Button>
                </Stack>
                {simplificationEnabled && (
                  <Stack
                    spacing={2}
                    direction="row"
                    sx={{ justifyContent: "" }}
                  >
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
                            availableTolerances[availableTolerances.length - 1]
                              .value
                          }
                          step={null}
                          color="secondary"
                          onChange={handleSliderChange}
                        />
                        <PentagonIcon />
                      </Stack>
                    </Box>
                  </Stack>
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
                  >
                    {simplificationDialogValue == ""
                      ? "Egyszerűsítés"
                      : simplificationDialogValue}
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DashboardIcon />}
                    color="success"
                    // onClick={}
                  >
                    Egyesítés
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DeleteIcon />}
                    color="error"
                    onClick={handleDeleteDialogOpen}
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
        id="ringtone-menu"
        keepMounted
        open={simplificationDialogOpen}
        onClose={handleClose}
        value={simplificationDialogValue}
      />
    </ThemeProvider>
  );
};

export default Header;

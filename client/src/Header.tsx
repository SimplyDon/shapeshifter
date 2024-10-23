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

const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: purple,
  },
});

interface HeaderProps {
  onDataUpload: (data: any) => void;
  onResetData: () => void;
  onToggleWorldMap: () => void;
  onSimplify: (tolerance: number) => void;
  onToggleSimplification: (availableTolerances: number[]) => void;
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

const Header: React.FC<HeaderProps> = ({
  onDataUpload,
  onResetData,
  onToggleWorldMap,
  onSimplify,
  onToggleSimplification,
}) => {
  const [fileUploaded, setFileUploaded] = useState<boolean>(false);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [simplificationEnabled, setSimplificationEnabled] =
    useState<boolean>(false);

  const availableTolerances = [
    {
      value: 0,
      label: "0",
    },
    {
      value: 0.02,
      label: "0.02",
    },
    {
      value: 0.04,
      label: "0.04",
    },
    {
      value: 0.06,
      label: "0.06",
    },
    {
      value: 0.08,
      label: "0.08",
    },
    {
      value: 0.1,
      label: "0.1",
    },
  ];

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
    handleClose();
  };

  const handleClickOpen = () => {
    setDialogOpen(true);
  };

  const handleClose = () => {
    setDialogOpen(false);
  };

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    onSimplify(newValue as number);
  };

  const handleSimplify = () => {
    setSimplificationEnabled((prev: boolean) => !prev);

    if (simplificationEnabled) {
      onSimplify(0);
    }

    onToggleSimplification(availableTolerances.map((t) => t.value));
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
                    // onClick={}
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
                    <Box sx={{ width: 350 }}>
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
                    onClick={handleSimplify}
                  >
                    Egyszerűsítés
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
                    onClick={handleClickOpen}
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
      <Dialog open={dialogOpen} onClose={handleClose}>
        <DialogTitle>{"Figyelmeztetés"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Térképréteg törlése nem visszavonható művelet.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Mégsem</Button>
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
    </ThemeProvider>
  );
};

export default Header;

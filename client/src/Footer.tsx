import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import SpeedIcon from "@mui/icons-material/Speed";
import FunctionsIcon from "@mui/icons-material/Functions";
import HubIcon from "@mui/icons-material/Hub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";
import LayersIcon from "@mui/icons-material/Layers";

interface FooterProps {
  drawerOpen: boolean;
  elapsedTime: number;
  pointCounts: {
    original: number;
    simplified: Record<string, Record<number, number>>;
  } | null;
  positional_errors: Record<string, Record<number, number>> | null;
  currentTolerance: number;
  selectedAlgorithm1: string;
  selectedAlgorithm2: string;
  numberOfTolerances: number;
}

const Footer: React.FC<FooterProps> = ({
  drawerOpen,
  elapsedTime,
  pointCounts,
  positional_errors,
  currentTolerance,
  selectedAlgorithm1,
  selectedAlgorithm2,
  numberOfTolerances,
}: FooterProps) => {
  let originalPointCount: number = 0;
  let simplifiedPointCount1: number = 0;
  let simplifiedPointCount2: number = 0;
  let formattedText1: string = "";
  let formattedText2: string = "";
  let pos_error1: number = 0;
  let pos_error2: number = 0;
  // let numberOfTolerances: number = 0;

  if (pointCounts && positional_errors) {
    originalPointCount = pointCounts["original"];

    if (selectedAlgorithm1 !== "") {
      selectedAlgorithm1 = selectedAlgorithm1.slice(0, -3); // Remove color emoji

      simplifiedPointCount1 =
        pointCounts.simplified[selectedAlgorithm1][currentTolerance];

      pos_error1 = positional_errors[selectedAlgorithm1][currentTolerance];

      const percentageDecrease: string = (
        ((originalPointCount - simplifiedPointCount1) /
          Math.abs(originalPointCount)) *
        100
      ).toFixed(2);

      formattedText1 = `<span style="color: lime;">${originalPointCount}</span>
      / <span style="color: red;">${simplifiedPointCount1}</span>
      (<span style="color: red;">-${percentageDecrease}%</span>)`;
      formattedText2 = `<span style="color: red;">${pos_error1.toFixed(
        3
      )}</span>`;
    }

    if (selectedAlgorithm2 !== "") {
      selectedAlgorithm2 = selectedAlgorithm2.slice(0, -3); // Remove color emoji

      simplifiedPointCount2 =
        pointCounts.simplified[selectedAlgorithm2][currentTolerance];

      pos_error2 = positional_errors[selectedAlgorithm2][currentTolerance];

      numberOfTolerances *= 2;

      const percentageDecrease1: string = (
        ((originalPointCount - simplifiedPointCount1) /
          Math.abs(originalPointCount)) *
        100
      ).toFixed(2);

      const percentageDecrease2: string = (
        ((originalPointCount - simplifiedPointCount2) /
          Math.abs(originalPointCount)) *
        100
      ).toFixed(2);

      formattedText1 = `<span style="color: lime;">${originalPointCount}</span>
      / <span style="color: red;">${simplifiedPointCount1}</span>
      / <span style="color: white;">${simplifiedPointCount2}</span>
      (<span style="color: red;">-${percentageDecrease1}%</span>
      / <span style="color: white;">-${percentageDecrease2}%</span>)`;
      formattedText2 = `<span style="color: red;">${pos_error1.toFixed(
        3
      )}</span> / <span style="color: white;">${pos_error2.toFixed(3)}</span>`;
    }
  }

  return (
    <div>
      <Drawer open={drawerOpen} variant="persistent" anchor="bottom">
        <Grid
          container
          display="flex"
          direction="row"
          justifyContent="space-evenly"
          margin={1}
        >
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <SpeedIcon />
              &nbsp;Átlagos futásidő
            </Typography>
            <Divider flexItem />
            <Typography
              variant="h5"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {(elapsedTime / numberOfTolerances).toFixed(3)}
              &nbsp;(
              <FunctionsIcon />
              {elapsedTime.toFixed(3)}) másodperc
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <LayersIcon />
              &nbsp;Rétegek száma
            </Typography>
            <Divider flexItem />
            <Typography
              variant="h5"
              sx={{ display: "flex", alignItems: "center" }}
            >
              {numberOfTolerances}
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <HubIcon />
              &nbsp;Csúcspontok száma
            </Typography>
            <Divider flexItem />
            <Typography variant="h5">
              <div dangerouslySetInnerHTML={{ __html: formattedText1 }}></div>
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <SquareFootIcon />
              &nbsp;Pozicionális hiba
            </Typography>
            <Divider flexItem />
            <Typography variant="h5">
              <div dangerouslySetInnerHTML={{ __html: formattedText2 }}></div>
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <SquareFootIcon />
              &nbsp;TBD
            </Typography>
            <Divider flexItem />
            <Typography variant="h5">0%</Typography>
          </Stack>
        </Grid>
      </Drawer>
    </div>
  );
};

export default Footer;

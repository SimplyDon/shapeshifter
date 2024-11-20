import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import SpeedIcon from "@mui/icons-material/Speed";
import HubIcon from "@mui/icons-material/Hub";
import SquareFootIcon from "@mui/icons-material/SquareFoot";

interface FooterProps {
  drawerOpen: boolean;
  elapsedTime: number;
  pointCounts: {
    original: number;
    simplified: Record<string, Record<number, number>>;
  } | null;
  currentTolerance: number;
  selectedAlgorithm1: string;
  selectedAlgorithm2: string;
}

const Footer: React.FC<FooterProps> = ({
  drawerOpen,
  elapsedTime,
  pointCounts,
  currentTolerance,
  selectedAlgorithm1,
  selectedAlgorithm2,
}: FooterProps) => {
  let originalPointCount: number = 0;
  let simplifiedPointCount1: number = 0;
  let simplifiedPointCount2: number = 0;
  let formattedText: string = "";

  if (pointCounts) {
    originalPointCount = pointCounts["original"];

    if (selectedAlgorithm1 !== "") {
      selectedAlgorithm1 = selectedAlgorithm1.slice(0, -3); // Remove color emoji

      simplifiedPointCount1 =
        pointCounts.simplified[selectedAlgorithm1][currentTolerance];

      const percentageDecrease: string = (
        ((originalPointCount - simplifiedPointCount1) /
          Math.abs(originalPointCount)) *
        100
      ).toFixed(2);

      formattedText = `${originalPointCount} / ${simplifiedPointCount1} (-${percentageDecrease}%)`;
    }

    if (selectedAlgorithm2 !== "") {
      selectedAlgorithm2 = selectedAlgorithm2.slice(0, -3); // Remove color emoji

      simplifiedPointCount2 =
        pointCounts.simplified[selectedAlgorithm2][currentTolerance];

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

      formattedText = `${originalPointCount} / ${simplifiedPointCount1} / ${simplifiedPointCount2}
      (-${percentageDecrease1}% / -${percentageDecrease2}%)`;
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
              &nbsp;Futásidő
            </Typography>
            <Divider flexItem />
            <Typography variant="h5">
              {elapsedTime.toFixed(2)} másodperc
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <HubIcon />
              &nbsp;Csúcspontok száma
            </Typography>
            <Divider flexItem />
            <Typography variant="h5">{formattedText}</Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} alignItems="center">
            <Typography variant="h4">
              <SquareFootIcon />
              &nbsp;Pozicionális hiba
            </Typography>
            <Divider flexItem />
            <Typography variant="h5">0%</Typography>
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

import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid2";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

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
  let originalPointCount = 0;
  let simplifiedPointCount1 = 0;
  let simplifiedPointCount2 = 0;
  let formattedText;

  if (pointCounts) {
    originalPointCount = pointCounts["original"];

    if (selectedAlgorithm1 !== "") {
      selectedAlgorithm1 = selectedAlgorithm1.slice(0, -3); // Remove color emoji

      simplifiedPointCount1 =
        pointCounts.simplified[selectedAlgorithm1][currentTolerance];

      const percentageDecrease = Math.round(
        (((originalPointCount - simplifiedPointCount1) /
          Math.abs(originalPointCount)) *
          100 *
          100) /
          100
      );

      formattedText = `${originalPointCount} / ${simplifiedPointCount1} (-${percentageDecrease}%)`;
    }

    if (selectedAlgorithm2 !== "") {
      selectedAlgorithm2 = selectedAlgorithm2.slice(0, -3); // Remove color emoji

      simplifiedPointCount2 =
        pointCounts.simplified[selectedAlgorithm2][currentTolerance];

      const percentageDecrease1 = Math.round(
        (((originalPointCount - simplifiedPointCount1) /
          Math.abs(originalPointCount)) *
          100 *
          100) /
          100
      );

      const percentageDecrease2 = Math.round(
        (((originalPointCount - simplifiedPointCount2) /
          Math.abs(originalPointCount)) *
          100 *
          100) /
          100
      );

      formattedText = `${originalPointCount} / ${simplifiedPointCount1} / ${simplifiedPointCount2}
      (-${percentageDecrease1}% / -${percentageDecrease2}%)`;
    }
  }

  return (
    <div>
      <Drawer open={drawerOpen} variant="persistent" anchor="bottom">
        <Grid display="flex" direction="row" justifyContent="space-evenly">
          {/* <Stack direction="row" spacing={2} margin={2}> */}
          <Stack spacing={1} marginRight={3}>
            <Typography variant="h4">Futásidő</Typography>
            <Divider flexItem />
            <Typography variant="h5">
              {Math.round(elapsedTime * 100) / 100} másodperc
            </Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          <Stack spacing={1} marginRight={3}>
            <Typography variant="h4">Csúcspontok száma</Typography>
            <Divider flexItem />
            <Typography variant="h5">{formattedText}</Typography>
          </Stack>
          <Divider orientation="vertical" variant="middle" flexItem />
          {/* </Stack> */}
        </Grid>
      </Drawer>
    </div>
  );
};

export default Footer;

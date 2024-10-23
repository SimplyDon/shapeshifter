import { useState } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Header from "./Header";
import L from "leaflet";
import axios from "axios";

export default function App() {
  const [data, setData] = useState<any>(null);
  const [simplifiedData, setSimplifiedData] = useState<any>(null);
  const [bounds, setBounds] = useState<any>(null);
  const [worldMap, setWorldMap] = useState<boolean>(false);
  const [currentTolerance, setCurrentTolerance] = useState<number>(0);

  const handleDataUpload = (uploadedData: any) => {
    setWorldMap(false);

    setData(uploadedData);

    const geojsonLayer = L.geoJSON(uploadedData);
    const geojsonBounds = geojsonLayer.getBounds();

    setBounds(geojsonBounds);
  };

  const resetData = () => {
    setData(null);
    setSimplifiedData(null)
    setBounds(null);
  };

  const toggleWorldMap = () => {
    setWorldMap((prev: boolean) => !prev);
  };

  const handleSimplify = async (tolerance: number) => {
    setCurrentTolerance(tolerance);
  };

  const toggleSimplification = async (availableTolerances: number[]) => {
    try {
      const res = await axios.post("http://localhost:5000/api/simplify", {
        geojson: data,
        tolerances: availableTolerances,
      });

      setSimplifiedData(res.data);
    } catch (err) {
      console.error("HIBA:", err);
    }
  };

  return (
    <>
      <Header
        onDataUpload={handleDataUpload}
        onResetData={resetData}
        onToggleWorldMap={toggleWorldMap}
        onSimplify={handleSimplify}
        onToggleSimplification={toggleSimplification}
      />

      {!data && !simplifiedData ? (
        <h1 style={{ textAlign: "center", marginTop: "50px" }}>
          Tölts fel egy .zip fájlt a megfelelő komponensekkel!
        </h1>
      ) : worldMap ? (
        <>
          <MapContainer bounds={bounds}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            <GeoJSON
              key={JSON.stringify(
                simplifiedData ? simplifiedData[currentTolerance] : data
              )}
              data={simplifiedData ? simplifiedData[currentTolerance] : data}
            />
          </MapContainer>
        </>
      ) : (
        <MapContainer bounds={bounds}>
          <GeoJSON
            key={JSON.stringify(
              simplifiedData ? simplifiedData[currentTolerance] : data
            )}
            data={simplifiedData ? simplifiedData[currentTolerance] : data}
          />
        </MapContainer>
      )}
    </>
  );
}

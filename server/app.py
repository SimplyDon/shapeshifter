from flask import Flask, request, jsonify
import geopandas as gpd
from flask_cors import CORS
import os
import tempfile
from flask import send_file
import zipfile
import json
from simplification.douglas import simplify_geometries

app = Flask(__name__)
cors = CORS(app, origins="*")

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        
        if not file.filename.endswith('.zip'):
            return jsonify({"hiba": "A feltöltött fájl nem .zip fájl."}), 400

        with tempfile.TemporaryDirectory() as tmpdirname:
            zip_path = os.path.join(tmpdirname, file.filename)
            file.save(zip_path)

            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(tmpdirname)

            shp_file = None
            for root, dirs, files in os.walk(tmpdirname):
                for f in files:
                    if f.endswith('.shp'):
                        shp_file = os.path.join(root, f)
                        break
            
            if shp_file is None:
                return jsonify({"hiba": "Nem található .shp fájl."}), 400

            gdf = gpd.read_file(shp_file)
            
            geojson_data = gdf.to_json()
            
            return jsonify(json.loads(geojson_data))

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400
    
    
@app.route('/api/simplify', methods=['POST'])
def simplify_shape():
    try:
        data = request.get_json()
        geojson = data['geojson']
        tolerances = data['tolerances']
        algorithm = data["algorithm"]

        gdf = gpd.GeoDataFrame.from_features(geojson['features'])

        simplified_geojsons = {}

        for tolerance in tolerances:
            simplified_gdf = gdf
            
            if algorithm == "Douglas-Peucker (implementált)":
                simplified_gdf = simplify_geometries(gdf, tolerance)
            elif algorithm == "Douglas-Peucker (beépített)":
                simplified_gdf = gdf.simplify(tolerance=tolerance)
            elif algorithm == "Visvaligam-Whyatt":
                # simplified_gdf = simplify_geometries_vw(gdf, tolerance)
                pass
            
            geojson_data = simplified_gdf.to_json()
            simplified_geojsons[tolerance] = json.loads(geojson_data)

        return jsonify(simplified_geojsons)

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400
    
    
    
@app.route('/api/download_shapefile', methods=['POST'])
def download_shapefile():
    try:
        data = request.get_json()
        geojson = data['geojson']

        gdf = gpd.GeoDataFrame.from_features(geojson['features'])

        shapefile_path = "current_map_shapefile.shp"
        gdf.to_file(shapefile_path, driver="ESRI Shapefile")

        return send_file(
            shapefile_path,
            as_attachment=True,
            download_name="export.shp",
            mimetype="application/octet-stream"
        )

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400
    
    
ZIP_FOLDER = "./samples"

@app.route('/api/load_country/<country_name>', methods=['GET'])
def load_country_shapefile(country_name):
    try:
        zip_path = os.path.join(ZIP_FOLDER, f"{country_name}.zip")
        
        if not os.path.isfile(zip_path):
            return jsonify({"hiba": "Fájl nem található"}), 404

        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(ZIP_FOLDER)
            shapefile_path = [f for f in zip_ref.namelist() if f.endswith('.shp')][0]
            shapefile_full_path = os.path.join(ZIP_FOLDER, shapefile_path)

        gdf = gpd.read_file(shapefile_full_path)
        geojson_data = gdf.to_json()

        for file in zip_ref.namelist():
            os.remove(os.path.join(ZIP_FOLDER, file))

        return jsonify(json.loads(geojson_data))

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400
    
    
if __name__ == '__main__':
    app.run(debug=True)
    
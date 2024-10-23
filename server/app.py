from flask import Flask, request, jsonify
import geopandas as gpd
from flask_cors import CORS
import os
import tempfile
import zipfile
import json

app = Flask(__name__)
cors = CORS(app, origins="*")

@app.route('/api/upload', methods=['POST'])
def upload_file():
    try:
        file = request.files['file']
        
        if not file.filename.endswith('.zip'):
            return jsonify({"error": "Uploaded file is not a ZIP archive."}), 400

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
                return jsonify({"error": "No .shp file found in the ZIP archive."}), 400

            gdf = gpd.read_file(shp_file)
            
            geojson_data = gdf.to_json()
            
            return jsonify(json.loads(geojson_data))

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    
@app.route('/api/simplify', methods=['POST'])
def simplify_shape():
    try:
        data = request.get_json()
        geojson = data['geojson']
        tolerances = data['tolerances']

        gdf = gpd.GeoDataFrame.from_features(geojson['features'])

        simplified_geojsons = {}

        for tolerance in tolerances:
            simplified_gdf = gdf.simplify(tolerance=tolerance)
            geojson_data = simplified_gdf.to_json()
            simplified_geojsons[tolerance] = json.loads(geojson_data)

        return jsonify(simplified_geojsons)

    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
    
if __name__ == '__main__':
    app.run(debug=True)
    
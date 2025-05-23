"""Backend endpoints"""
import os
import io
import time
import tracemalloc
import tempfile
import zipfile
import json
import math
from concurrent.futures import ThreadPoolExecutor
import geopandas as gpd
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from simplification.utils import count_vertices, calculate_positional_error, traverse_geometries
from simplification.douglas import douglas_peucker
from simplification.douglas_improved import improved_douglas_peucker
from simplification.visvalingam import visvalingam_whyatt
from simplification.reumann import reumann_witkam
from simplification.perpendicular_distance import pd
from simplification.radial_distance import radial_distance
from simplification.nth_point import nth_point
from simplification.lang import lang
from simplification.random import simplify_random


app = Flask(__name__)
cors = CORS(app, origins="*")

ZIP_FOLDER = "./samples"


@app.route('/api/upload', methods=['POST'])
def upload_file():
    """Endpoints for uploading .zip file"""
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
            dbf_file_missing = True

            for root, dirs, files in os.walk(tmpdirname):
                for f in files:
                    if f.endswith('.shp'):
                        shp_file = os.path.join(root, f)

                    if f.endswith('.dbf'):
                        dbf_file_missing = False

            if shp_file is None:
                return jsonify({"hiba": "Nem található .shp fájl."}), 400

            gdf = gpd.read_file(shp_file)

            geojson_data = gdf.to_json()

            response_data = {
                "geojson": json.loads(geojson_data),
                "warning": dbf_file_missing
            }

            return jsonify(response_data)

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400


@app.route('/api/simplify', methods=['POST'])
def simplify_shape():
    """Endpoint for running the simplification algorithm(s)"""
    try:
        start_time = time.time()
        tracemalloc.start()

        data = request.get_json()
        geojson = data['geojson']
        tolerances = data['tolerances']
        algorithms = data["algorithms"]

        gdf = gpd.GeoDataFrame.from_features(geojson['features'])

        simplified_geojsons = {algorithm: {} for algorithm in algorithms}

        def simplify_task(algorithm, tolerance):
            simplified_gdf = gdf.copy()

            simplify_funcs = {
                "Ramer-Douglas-Peucker (implementált)": lambda: traverse_geometries(gdf, tolerance, douglas_peucker),
                "Ramer-Douglas-Peucker (beépített)": lambda: gdf.simplify(tolerance),
                "Ramer-Douglas-Peucker (továbbfejlesztett)": lambda: traverse_geometries(gdf, tolerance, improved_douglas_peucker),
                "Visvaligam-Whyatt": lambda: traverse_geometries(gdf, tolerance / 10, visvalingam_whyatt),
                "Reumann-Witkam": lambda: traverse_geometries(gdf, tolerance, reumann_witkam),
                "Merőleges távolság": lambda: traverse_geometries(gdf, tolerance / 100, pd),
                "Sugárirányú távolság": lambda: traverse_geometries(gdf, tolerance, radial_distance),
                "N-edik pont": lambda: traverse_geometries(gdf, math.ceil(tolerance * 10), nth_point),
                "Lang": lambda: traverse_geometries(gdf, tolerance, lang),
                "Véletlenszerű": lambda: traverse_geometries(gdf, tolerance, simplify_random)
            }

            simplified_gdf = simplify_funcs[algorithm]()

            geojson_data = simplified_gdf.to_json()
            return algorithm, tolerance, json.loads(geojson_data)

        with ThreadPoolExecutor() as executor:
            tasks = [
                executor.submit(simplify_task, algorithm, tolerance)
                for algorithm in algorithms
                for tolerance in tolerances
            ]

            for future in tasks:
                algorithm, tolerance, geojson_data = future.result()
                simplified_geojsons[algorithm][tolerance] = geojson_data

        end_time = time.time()
        elapsed_time = end_time - start_time

        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        return jsonify({
            "simplifiedData": simplified_geojsons,
            "elapsedTime": elapsed_time,
            "currentMemoryUsage": current,
            "peakMemoryUsage": peak,
        })

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400


@app.route('/api/download_shapefile', methods=['POST'])
def download_shapefile():
    """Endpoint for downloading the layer"""
    try:
        data = request.get_json()

        gdf = gpd.GeoDataFrame.from_features(data['features'])

        temp_dir = tempfile.TemporaryDirectory()
        shapefile_path = os.path.join(temp_dir.name, "shapeshifter-export.shp")

        gdf.to_file(shapefile_path, driver="ESRI Shapefile")

        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
            for filename in os.listdir(temp_dir.name):
                file_path = os.path.join(temp_dir.name, filename)
                zip_file.write(file_path, arcname=filename)

        zip_buffer.seek(0)

        return send_file(zip_buffer, as_attachment=True, download_name="shapeshifter-export.zip", mimetype="application/zip")

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400


@app.route('/api/metrics', methods=['POST'])
def enable_metrics():
    """Endpoint for enabling metrics"""
    try:
        data = request.get_json()

        geojson = data['geojson']
        simplified_data1 = data['simplifiedData1']
        simplified_data2 = data['simplifiedData2']
        tolerances = data['tolerances']
        algorithms = data["algorithms"]

        gdf = gpd.GeoDataFrame.from_features(geojson['features'])
        original_point_count = count_vertices(gdf)

        simplified_point_counts = {algorithm: {} for algorithm in algorithms}
        positional_errors = {algorithm: {} for algorithm in algorithms}

        for algorithm in enumerate(algorithms):
            for tolerance in tolerances:
                if algorithm[0] == 0:
                    simplified_gdf = gpd.GeoDataFrame.from_features(simplified_data1[str(tolerance["value"])])
                else:
                    simplified_gdf = gpd.GeoDataFrame.from_features(simplified_data2[str(tolerance["value"])])

                simplified_point_counts[algorithm[1]][str(tolerance["value"])] = count_vertices(simplified_gdf)
                positional_errors[algorithm[1]][str(tolerance["value"])] = calculate_positional_error(gdf, simplified_gdf)

        return jsonify({
            "pointCounts": {
                "original": original_point_count,
                "simplified": simplified_point_counts
            },
            "positionalErrors": positional_errors,
            "perimeter": sum(gdf.length)
        })

    except Exception as e:
        return jsonify({"hiba": str(e)}), 400


@app.route('/api/load_country/<country_name>', methods=['GET'])
def load_country_shapefile(country_name):
    """Endpoint for loading country presets"""
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

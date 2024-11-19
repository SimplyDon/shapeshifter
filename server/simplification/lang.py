from shapely.geometry import LineString, Polygon, MultiPolygon
from simplification.utils import perpendicular_distance
import numpy as np


def lang(coords, tolerance, lookahead):
    simplified_coords = [coords[0]]  # Start with the first point)

    i = 0

    while i < len(coords) - 1:
        # Define the lookahead window
        end_index = min(i + lookahead, len(coords) - 1)
        segment_start = np.array(coords[i])
        segment_end = np.array(coords[end_index])

        max_distance = 0
        max_index = -1
        for j in range(i + 1, end_index):
            dist = perpendicular_distance(coords[j], segment_start, segment_end)
            if dist > max_distance:
                max_distance = dist
                max_index = j

        if max_distance > tolerance:
            # If the max distance exceeds tolerance, shorten the window
            i = max_index
            simplified_coords.append(coords[i])
        else:
            # Otherwise, accept the segment and move to the next point
            i = end_index
            simplified_coords.append(segment_end)

    return np.array(simplified_coords)


def simplify_geometries_lang(gdf, tolerance, lookahead):
    simplified_geometries = []

    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = lang(coords, tolerance, lookahead)
            simplified_geometries.append(LineString(simplified_coords))

        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = lang(exterior_coords, tolerance, lookahead)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = lang(interior_coords, tolerance, lookahead)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))

        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = lang(exterior_coords, tolerance, lookahead)

                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = lang(interior_coords, tolerance, lookahead)
                    if len(simplified_interior) > 2:
                        simplified_interiors.append(LineString(simplified_interior))

                simplified_polys.append(Polygon(simplified_exterior, simplified_interiors))

            if simplified_polys:
                simplified_geometries.append(MultiPolygon(simplified_polys))
            else:
                simplified_geometries.append(None)

        else:
            simplified_geometries.append(geom)

    gdf_simplified = gdf.copy()
    gdf_simplified['geometry'] = simplified_geometries
    return gdf_simplified

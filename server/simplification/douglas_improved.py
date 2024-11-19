from shapely.geometry import LineString, Polygon, MultiPolygon
from simplification.douglas import douglas_peucker
from simplification.utils import calculate_angle
import numpy as np


def select_segment_points(coords, angle_threshold, distance_threshold):
    # Always include the first point
    segment_points = [coords[0]]

    for i in range(1, len(coords) - 1):
        angle = calculate_angle(coords[i - 1], coords[i], coords[i + 1])
        if angle < angle_threshold:
            if np.linalg.norm(np.array(coords[i]) - np.array(segment_points[-1])) >= distance_threshold:
                segment_points.append(coords[i])

    # Always include the last point
    segment_points.append(coords[-1])

    return segment_points


def improved_douglas_peucker(coords, tolerance, angle_threshold, distance_threshold):
    segment_points = select_segment_points(coords, angle_threshold, distance_threshold)

    simplified_coords = []

    for i in range(len(segment_points) - 1):
        start_idx = coords.index(segment_points[i])
        end_idx = coords.index(segment_points[i + 1]) + 1
        segment = coords[start_idx:end_idx]

        # Apply Douglas-Peucker to segment
        simplified_segment = douglas_peucker(segment, tolerance)

        # Append the simplified segment, omitting the last point to avoid duplication
        simplified_coords.extend(simplified_segment[:-1])

    # Always include the last point
    simplified_coords.append(segment_points[-1])

    return simplified_coords


def simplify_geometries_rdp_improved(gdf, angle_threshold, distance_threshold, tolerance):
    simplified_geometries = []

    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = improved_douglas_peucker(coords, angle_threshold, distance_threshold, tolerance)
            simplified_geometries.append(LineString(simplified_coords))

        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = improved_douglas_peucker(exterior_coords, angle_threshold, distance_threshold, tolerance)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = improved_douglas_peucker(interior_coords, angle_threshold, distance_threshold, tolerance)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))

        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = improved_douglas_peucker(exterior_coords, angle_threshold, distance_threshold, tolerance)

                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = improved_douglas_peucker(interior_coords, angle_threshold, distance_threshold, tolerance)
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

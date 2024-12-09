from shapely.geometry import Polygon, MultiPolygon, LineString, MultiLineString, Point, MultiPoint, GeometryCollection
import geopandas as gpd
import numpy as np


def perpendicular_distance(point, start, end) -> float:
    if np.all(start == end):
        return np.linalg.norm(point - start)

    line_vec = end - start
    point_vec = point - start
    line_len = np.dot(line_vec, line_vec)

    if line_len == 0:
        return np.linalg.norm(point_vec)

    projection = np.dot(point_vec, line_vec) / line_len
    projection = max(0, min(1, projection))

    closest_point = start + projection * line_vec
    distance = np.linalg.norm(closest_point - point)

    return distance


def triangle_area(p1, p2, p3) -> float:
    return abs((p1[0] * (p2[1] - p3[1]) + 
                p2[0] * (p3[1] - p1[1]) + 
                p3[0] * (p1[1] - p2[1])) / 2.0)


def calculate_angle(p1, p2, p3) -> np.ndarray:
    v1 = np.array(p1) - np.array(p2)
    v2 = np.array(p3) - np.array(p2)
    dot_product = np.dot(v1, v2)
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)

    if norm_v1 == 0 or norm_v2 == 0:
        return np.pi  # Pi = 180 degrees (straight line)

    cos_angle = dot_product / (norm_v1 * norm_v2)

    return np.arccos(np.clip(cos_angle, -1.0, 1.0))


def count_vertices(gdf: gpd.GeoDataFrame) -> int:
    total_vertices = 0

    for geom in gdf.geometry:
        if (geom is not None):
            if geom.is_empty:
                continue

            if isinstance(geom, Polygon):
                total_vertices += len(geom.exterior.coords)
                total_vertices += sum(len(ring.coords) for ring in geom.interiors)

            elif isinstance(geom, MultiPolygon):
                for part in geom.geoms:
                    total_vertices += len(part.exterior.coords)
                    total_vertices += sum(len(ring.coords) for ring in part.interiors)

            elif isinstance(geom, LineString):
                total_vertices += len(geom.coords)

            elif isinstance(geom, MultiLineString):
                for part in geom.geoms:
                    total_vertices += len(part.coords)

            elif isinstance(geom, GeometryCollection):
                for sub_geom in geom.geoms:
                    if isinstance(sub_geom, Polygon):
                        total_vertices += len(sub_geom.exterior.coords)
                        total_vertices += sum(len(ring.coords) for ring in sub_geom.interiors)
                    elif isinstance(sub_geom, LineString):
                        total_vertices += len(sub_geom.coords)

            elif isinstance(geom, (Point, MultiPoint)):
                total_vertices += 1 if isinstance(geom, Point) else len(geom.geoms)

    return total_vertices


def positional_error(original_points, simplified_points) -> float:
    total_error = 0.0
    simplified_index = 0

    for point in original_points:
        point_array = np.array(point)

        segment_start = np.array(simplified_points[simplified_index])
        segment_end = np.array(simplified_points[simplified_index + 1])

        distance = perpendicular_distance(point_array, segment_start, segment_end)
        total_error += distance

        if np.array_equal(point_array, segment_end):
            simplified_index += 1
            if simplified_index >= len(simplified_points) - 1:
                break

    return total_error


def calculate_positional_error(gdf, simplified_gdf) -> float:
    total_error = 0.0

    for geom, simplified_geom in zip(gdf.geometry, simplified_gdf.geometry):
        if geom and simplified_geom:
            if geom.geom_type == 'LineString':
                coords = list(geom.coords)
                simplified_coords = list(simplified_geom.coords)
                total_error += positional_error(coords, simplified_coords)

            elif geom.geom_type == 'Polygon':
                    exterior_coords = list(geom.exterior.coords)
                    simplified_exterior_coords = list(simplified_geom.exterior.coords)
                    total_error += positional_error(exterior_coords, simplified_exterior_coords)

                    for interior, simplified_interior in zip(geom.interiors, simplified_geom.interiors):
                        interior_coords = list(interior.coords)
                        simplified_interior_coords = list(simplified_interior.coords)
                        total_error += positional_error(interior_coords, simplified_interior_coords)

            elif geom.geom_type == 'MultiPolygon':
                for polygon, simplified_polygon in zip(geom.geoms, simplified_geom.geoms):
                    exterior_coords = list(polygon.exterior.coords)
                    simplified_exterior_coords = list(simplified_polygon.exterior.coords)
                    total_error += positional_error(exterior_coords, simplified_exterior_coords)

                    for interior, simplified_interior in zip(polygon.interiors, simplified_polygon.interiors):
                        interior_coords = list(interior.coords)
                        simplified_interior_coords = list(simplified_interior.coords)
                        total_error += positional_error(interior_coords, simplified_interior_coords)

    return total_error

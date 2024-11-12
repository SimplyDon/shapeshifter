from shapely.geometry import LineString, Polygon, MultiPolygon
from simplification.utils import perpendicular_distance
import numpy as np


def douglas_peucker(coords, tolerance):
    if len(coords) < 3:
        return coords

    start = coords[0]
    end = coords[-1]
    max_distance = 0
    index = 0

    for i in range(1, len(coords) - 1):
        distance = perpendicular_distance(np.array(coords[i]), np.array(start), np.array(end))
        if distance > max_distance:
            max_distance = distance
            index = i

    if max_distance > tolerance:
        left = douglas_peucker(coords[:index + 1], tolerance)
        right = douglas_peucker(coords[index:], tolerance)

        return left[:-1] + right
    else:
        return [start, end]


def simplify_geometries_rdp(gdf, tolerance):
    simplified_geometries = []

    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = douglas_peucker(coords, tolerance)
            simplified_geometries.append(LineString(simplified_coords))

        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = douglas_peucker(exterior_coords, tolerance)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = douglas_peucker(interior_coords, tolerance)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))

        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = douglas_peucker(exterior_coords, tolerance)

                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = douglas_peucker(interior_coords, tolerance)
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

from shapely.geometry import LineString, Polygon, MultiPolygon
import random


def simplify_random(points, tolerance):
    # Always include the first point
    simplified_points = [points[0]]

    num_points_to_remove = int(len(points) * tolerance)

    if num_points_to_remove > 0:
        indices_to_remove = set(random.sample(range(1, len(points) - 1), num_points_to_remove))
    else:
        indices_to_remove = set()

    simplified_points += [point for i, point in enumerate(points[1:-1], 1)
                          if i not in indices_to_remove]

    # Always include the last point
    simplified_points.append(points[-1])

    return simplified_points


def simplify_geometries_random(gdf, tolerance):
    simplified_geometries = []

    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = simplify_random(coords, tolerance)
            simplified_geometries.append(LineString(simplified_coords))

        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = simplify_random(exterior_coords, tolerance)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = simplify_random(interior_coords, tolerance)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))

        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = simplify_random(exterior_coords, tolerance)

                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = simplify_random(interior_coords, tolerance)
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

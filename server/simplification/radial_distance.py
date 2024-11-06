from shapely.geometry import LineString, Polygon, MultiPolygon
import numpy as np

def radial_distance(points, tolerance):
    simplified_points = [points[0]]
    last_key_point = np.array(points[0])

    for point in points[1:-1]:
        current_point = np.array(point)
        
        distance = np.linalg.norm(current_point - last_key_point)
        
        if distance > tolerance:
            simplified_points.append(point)
            last_key_point = current_point

    simplified_points.append(points[-1])
    
    return simplified_points


def simplify_geometries_rd(gdf, tolerance):
    simplified_geometries = []
    
    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = radial_distance(coords, tolerance)
            simplified_geometries.append(LineString(simplified_coords))
        
        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = radial_distance(exterior_coords, tolerance)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = radial_distance(interior_coords, tolerance)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))
        
        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = radial_distance(exterior_coords, tolerance)
                
                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = radial_distance(interior_coords, tolerance)
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

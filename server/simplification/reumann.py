from shapely.geometry import LineString, Polygon, MultiPolygon
from simplification.utils import perpendicular_distance
import numpy as np

def reumann_witkam(points, tolerance):
    simplified_points = [points[0]]
    anchor = np.array(points[0])
    
    for point in points[1:]:
        point = np.array(point)
        prev_point = np.array(simplified_points[-1])
        
        distance = perpendicular_distance(point, anchor, prev_point)
        
        if distance > tolerance:
            simplified_points.append(tuple(point))
            anchor = point
    
    # Always include the last point
    if points[-1] != simplified_points[-1]:
        simplified_points.append(points[-1])
    
    return np.array(simplified_points)

def simplify_geometries_rw(gdf, tolerance):
    simplified_geometries = []
    
    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = reumann_witkam(coords, tolerance)
            simplified_geometries.append(LineString(simplified_coords))
        
        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = reumann_witkam(exterior_coords, tolerance)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = reumann_witkam(interior_coords, tolerance)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))
        
        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = reumann_witkam(exterior_coords, tolerance)
                
                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = reumann_witkam(interior_coords, tolerance)
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

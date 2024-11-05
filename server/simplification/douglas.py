from shapely.geometry import LineString, Polygon, MultiPolygon
import numpy as np

def perpendicular_distance(point, start, end):
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

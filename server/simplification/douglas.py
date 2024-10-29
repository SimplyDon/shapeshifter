import geopandas as gpd
import numpy as np
from shapely.geometry import LineString, Polygon, MultiPolygon

# Function to calculate the perpendicular distance from a point to a line segment
def perpendicular_distance(point, start, end):
    """Calculate the perpendicular distance from a point to a line segment."""
    if np.all(start == end):
        return np.linalg.norm(point - start)
    
    line_vec = end - start
    point_vec = point - start
    line_len = np.dot(line_vec, line_vec)
    if line_len == 0:
        return np.linalg.norm(point_vec)
    
    projection = np.dot(point_vec, line_vec) / line_len
    projection = max(0, min(1, projection))  # Ensure the projection is within the segment
    
    closest_point = start + projection * line_vec
    distance = np.linalg.norm(closest_point - point)
    return distance

# Implementing the Douglas-Peucker algorithm
def douglas_peucker(coords, tolerance):
    """Simplify the given list of coordinates using the Douglas-Peucker algorithm."""
    if len(coords) < 3:
        return coords
    
    start, end = coords[0], coords[-1]
    max_distance = 0
    index = 0
    
    # Find the point with the maximum distance from the line connecting the start and end
    for i in range(1, len(coords) - 1):
        distance = perpendicular_distance(np.array(coords[i]), np.array(start), np.array(end))
        if distance > max_distance:
            max_distance = distance
            index = i
    
    # If the maximum distance is greater than the tolerance, recursively simplify
    if max_distance > tolerance:
        # Recursively simplify the two segments
        left = douglas_peucker(coords[:index + 1], tolerance)
        right = douglas_peucker(coords[index:], tolerance)
        
        # Combine the results, excluding the duplicate point at the junction
        return left[:-1] + right
    else:
        return [start, end]

# Simplify geometry in a GeoDataFrame
def simplify_geometries(gdf, tolerance):
    simplified_geometries = []
    
    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = douglas_peucker(coords, tolerance)
            simplified_geometries.append(LineString(simplified_coords))
            
        elif geom.geom_type == 'Polygon':
            # Simplify the exterior ring
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = douglas_peucker(exterior_coords, tolerance)
            
            # Check if the exterior ring is valid
            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)  # Mark as None if invalid
                continue
            
            # Simplify each interior ring (hole) in the polygon
            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = douglas_peucker(interior_coords, tolerance)
                if len(simplified_interior) > 2:  # Only keep if valid
                    simplified_interiors.append(LineString(simplified_interior))
            
            # Create the simplified polygon with exterior and interiors
            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))
        
        elif geom.geom_type == 'MultiPolygon':
            # Handle MultiPolygon by simplifying each Polygon
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = douglas_peucker(exterior_coords, tolerance)

                # Check if the exterior ring is valid
                if len(simplified_exterior) < 4:
                    simplified_polys.append(None)  # Mark as None if invalid
                    continue

                # Simplify each interior ring
                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = douglas_peucker(interior_coords, tolerance)
                    if len(simplified_interior) > 2:  # Only keep if valid
                        simplified_interiors.append(LineString(simplified_interior))

                simplified_polys.append(Polygon(simplified_exterior, simplified_interiors))
            simplified_geometries.append(MultiPolygon(simplified_polys))
        
        else:
            # For unsupported geometry types, retain original geometry
            simplified_geometries.append(geom)
    
    # Create a new GeoDataFrame with simplified geometries
    gdf_simplified = gdf.copy()
    gdf_simplified['geometry'] = simplified_geometries
    return gdf_simplified

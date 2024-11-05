from shapely.geometry import LineString, Polygon, MultiPolygon

def triangle_area(p1, p2, p3):
    return abs((p1[0] * (p2[1] - p3[1]) + 
                p2[0] * (p3[1] - p1[1]) + 
                p3[0] * (p1[1] - p2[1])) / 2.0)

def visvalingam_whyatt(coords, tolerance):
    if len(coords) < 3:
        return coords

    areas = []
    for i in range(1, len(coords) - 1):
        area = triangle_area(coords[i - 1], coords[i], coords[i + 1])
        areas.append((area, i))

    min_area, min_idx = min(areas, key=lambda x: x[0])
    
    if min_area >= tolerance:
        return coords
    
    coords = coords[:min_idx] + coords[min_idx + 1:]

    return visvalingam_whyatt(coords, tolerance)


def simplify_geometries_vw(gdf, tolerance):
    simplified_geometries = []
    
    for geom in gdf.geometry:
        if geom.geom_type == 'LineString':
            coords = list(geom.coords)
            simplified_coords = visvalingam_whyatt(coords, tolerance)
            simplified_geometries.append(LineString(simplified_coords))
        
        elif geom.geom_type == 'Polygon':
            exterior_coords = list(geom.exterior.coords)
            simplified_exterior = visvalingam_whyatt(exterior_coords, tolerance)

            if len(simplified_exterior) < 4:
                simplified_geometries.append(None)
                continue

            simplified_interiors = []
            for interior in geom.interiors:
                interior_coords = list(interior.coords)
                simplified_interior = visvalingam_whyatt(interior_coords, tolerance)
                if len(simplified_interior) > 2:
                    simplified_interiors.append(LineString(simplified_interior))

            simplified_geometries.append(Polygon(simplified_exterior, simplified_interiors))
        
        elif geom.geom_type == 'MultiPolygon':
            simplified_polys = []
            for polygon in geom.geoms:
                exterior_coords = list(polygon.exterior.coords)
                simplified_exterior = visvalingam_whyatt(exterior_coords, tolerance)
                
                if len(simplified_exterior) < 4:
                    continue

                simplified_interiors = []
                for interior in polygon.interiors:
                    interior_coords = list(interior.coords)
                    simplified_interior = visvalingam_whyatt(interior_coords, tolerance)
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

"""Visvalingam-Whyatt algorithm"""
from simplification.utils import triangle_area


def visvalingam_whyatt(coords, tolerance):
    """Visvalingam-Whyatt algorithm"""
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

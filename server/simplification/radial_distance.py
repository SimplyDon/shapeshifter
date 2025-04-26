"""Radial distance algorithm"""
import numpy as np


def radial_distance(points, tolerance):
    """Radial distance algorithm"""
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

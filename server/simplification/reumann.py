"""Reumann-Witkam algorithm"""
from simplification.utils import perpendicular_distance
import numpy as np


def reumann_witkam(points, tolerance):
    """Reumann-Witkam algorithm"""
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

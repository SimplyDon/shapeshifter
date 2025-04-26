"""Perpendicular distance algorithm"""
from simplification.utils import perpendicular_distance
import numpy as np


def pd(points, tolerance):
    """Perpendicular distance algorithm"""
    simplified_points = [points[0]]

    for i in range(1, len(points) - 1):
        prev_point = np.array(points[i - 1])
        curr_point = np.array(points[i])
        next_point = np.array(points[i + 1])

        distance = perpendicular_distance(curr_point, prev_point, next_point)

        if distance >= tolerance:
            simplified_points.append(curr_point)

    # Always include the last point
    simplified_points.append(points[-1])

    return simplified_points

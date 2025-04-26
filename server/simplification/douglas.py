"""Douglas-Peucker algorithm"""
from simplification.utils import perpendicular_distance
import numpy as np


def douglas_peucker(coords, tolerance):
    """Douglas-Peucker algorithm"""
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

    return [start, end]

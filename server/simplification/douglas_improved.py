"""Improved Douglas-Peucker algorithm"""
from simplification.douglas import douglas_peucker
from simplification.utils import calculate_angle
import numpy as np

ANGLE_THRESHOLD = np.radians(60)
DISTANCE_THRESHOLD = 10.0

def select_segment_points(coords, angle_threshold, distance_threshold):
    """Select segment points"""
    # Always include the first point
    segment_points = [coords[0]]

    for i in range(1, len(coords) - 1):
        angle = calculate_angle(coords[i - 1], coords[i], coords[i + 1])
        if angle < angle_threshold:
            if np.linalg.norm(np.array(coords[i]) - np.array(segment_points[-1])) >= distance_threshold:
                segment_points.append(coords[i])

    # Always include the last point
    segment_points.append(coords[-1])

    return segment_points


def improved_douglas_peucker(coords, tolerance):
    """Improved Douglas-Peucker algorithm"""
    segment_points = select_segment_points(coords, ANGLE_THRESHOLD, DISTANCE_THRESHOLD)

    simplified_coords = []

    for i in range(len(segment_points) - 1):
        start_idx = coords.index(segment_points[i])
        end_idx = coords.index(segment_points[i + 1]) + 1
        segment = coords[start_idx:end_idx]

        # Apply Douglas-Peucker to segment
        simplified_segment = douglas_peucker(segment, tolerance)

        # Append the simplified segment, omitting the last point to avoid duplication
        simplified_coords.extend(simplified_segment[:-1])

    # Always include the last point
    simplified_coords.append(segment_points[-1])

    return simplified_coords

"""Lang algorithm"""
from simplification.utils import perpendicular_distance
import numpy as np

LOOKAHEAD = 4


def lang(coords, tolerance):
    """Lang algorithm"""
    simplified_coords = [coords[0]]  # Start with the first point)

    i = 0

    while i < len(coords) - 1:
        # Define the lookahead window
        end_index = min(i + LOOKAHEAD, len(coords) - 1)
        segment_start = np.array(coords[i])
        segment_end = np.array(coords[end_index])

        max_distance = 0
        max_index = -1
        for j in range(i + 1, end_index):
            dist = perpendicular_distance(coords[j], segment_start, segment_end)
            if dist > max_distance:
                max_distance = dist
                max_index = j

        if max_distance > tolerance:
            # If the max distance exceeds tolerance, shorten the window
            i = max_index
            simplified_coords.append(coords[i])
        else:
            # Otherwise, accept the segment and move to the next point
            i = end_index
            simplified_coords.append(segment_end)

    return np.array(simplified_coords)

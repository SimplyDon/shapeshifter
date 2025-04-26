"""Random algorithm"""
import random


def simplify_random(points, tolerance):
    """Random algorithm"""
    # Always include the first point
    simplified_points = [points[0]]

    num_points_to_remove = int(len(points) * tolerance)

    if num_points_to_remove > 0:
        indices_to_remove = set(random.sample(range(1, len(points) - 1), num_points_to_remove))
    else:
        indices_to_remove = set()

    simplified_points += [point for i, point in enumerate(points[1:-1], 1)
                          if i not in indices_to_remove]

    # Always include the last point
    simplified_points.append(points[-1])

    return simplified_points

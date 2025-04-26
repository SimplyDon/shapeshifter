"""Nth point algorithm"""
def nth_point(points, n):
    """Nth point algorithm"""
    if n <= 1:
        return points

    # Always include the first point
    simplified_points = [points[0]]

    for i in range(n, len(points) - 1, n):
        simplified_points.append(points[i])

    # Always include the last point
    simplified_points.append(points[-1])

    return simplified_points

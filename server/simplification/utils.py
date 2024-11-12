import numpy as np


def perpendicular_distance(point, start, end):
    if np.all(start == end):
        return np.linalg.norm(point - start)

    line_vec = end - start
    point_vec = point - start
    line_len = np.dot(line_vec, line_vec)

    if line_len == 0:
        return np.linalg.norm(point_vec)

    projection = np.dot(point_vec, line_vec) / line_len
    projection = max(0, min(1, projection))

    closest_point = start + projection * line_vec
    distance = np.linalg.norm(closest_point - point)

    return distance


def triangle_area(p1, p2, p3):
    return abs((p1[0] * (p2[1] - p3[1]) + 
                p2[0] * (p3[1] - p1[1]) + 
                p3[0] * (p1[1] - p2[1])) / 2.0)

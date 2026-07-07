// Pattern Matcher using a simplified 2D path normalization algorithm
// inspired by the $1 Gesture Recognizer. This ensures scale and translation
// invariance while maintaining rotation and direction sensitivity.

export interface Point {
  x: number;
  y: number;
}

const NUM_POINTS = 32;
const BOUNDING_BOX_SIZE = 150; // normalized square size

// 1. Calculate path length
function pathLength(points: Point[]): number {
  let d = 0;
  for (let i = 1; i < points.length; i++) {
    d += distance(points[i - 1], points[i]);
  }
  return d;
}

// 2. Euclidean distance between two points
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

// 3. Re-sample path to N equidistant points
function resample(points: Point[], n: number): Point[] {
  if (points.length === 0) return [];
  if (points.length === 1) {
    const res: Point[] = [];
    for (let i = 0; i < n; i++) res.push({ ...points[0] });
    return res;
  }

  const I = pathLength(points) / (n - 1); // interval length
  let D = 0;
  const newPoints: Point[] = [{ ...points[0] }];
  const tempPoints = [...points];

  for (let i = 1; i < tempPoints.length; i++) {
    const p1 = tempPoints[i - 1];
    const p2 = tempPoints[i];
    const d = distance(p1, p2);

    if (D + d >= I) {
      const qx = p1.x + ((I - D) / d) * (p2.x - p1.x);
      const qy = p1.y + ((I - D) / d) * (p2.y - p1.y);
      const q = { x: qx, y: qy };
      newPoints.push(q);
      // insert q as the next point in tempPoints to continue from it
      tempPoints.splice(i, 0, q);
      D = 0;
    } else {
      D += d;
    }
  }

  // Handle rounding issues to ensure we have exactly n points
  while (newPoints.length < n) {
    newPoints.push({ ...points[points.length - 1] });
  }
  if (newPoints.length > n) {
    newPoints.length = n;
  }

  return newPoints;
}

// 4. Scale path to a bounding box square
function scaleTo(points: Point[], size: number): Point[] {
  if (points.length === 0) return [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const width = maxX - minX;
  const height = maxY - minY;
  
  // Prevent division by zero for single points or straight axis-aligned lines
  const scaleX = width === 0 ? 1 : size / width;
  const scaleY = height === 0 ? 1 : size / height;

  return points.map(p => ({
    x: (p.x - minX) * scaleX,
    y: (p.y - minY) * scaleY
  }));
}

// 5. Centroid (center of mass) of the path
function centroid(points: Point[]): Point {
  let x = 0, y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

// 6. Translate path to the origin
function translateTo(points: Point[], origin: Point): Point[] {
  const c = centroid(points);
  return points.map(p => ({
    x: p.x - c.x + origin.x,
    y: p.y - c.y + origin.y
  }));
}

// 7. Full normalization pipeline
export function normalizePath(points: Point[]): Point[] {
  if (points.length < 2) return points;
  let res = resample(points, NUM_POINTS);
  res = scaleTo(res, BOUNDING_BOX_SIZE);
  res = translateTo(res, { x: 0, y: 0 });
  return res;
}

// 8. Calculate average distance between corresponding points of two normalized paths
function pathDistance(path1: Point[], path2: Point[]): number {
  let d = 0;
  const len = Math.min(path1.length, path2.length);
  if (len === 0) return Infinity;
  for (let i = 0; i < len; i++) {
    d += distance(path1[i], path2[i]);
  }
  return d / len;
}

// 9. Match score between raw point lists (returns similarity percentage [0 - 100])
export function matchPattern(rawPath1: Point[], rawPath2: Point[]): number {
  if (rawPath1.length < 2 || rawPath2.length < 2) return 0;
  
  const norm1 = normalizePath(rawPath1);
  const norm2 = normalizePath(rawPath2);
  
  const distForward = pathDistance(norm1, norm2);
  
  // Also check reversed stroke order (user drawn end-to-start)
  const norm2Reversed = [...norm2].reverse();
  const distReversed = pathDistance(norm1, norm2Reversed);
  
  const avgDist = Math.min(distForward, distReversed);
  
  // Map average distance to a score. Since the bounding box is size 150,
  // maximum distance between any two points is around 212.
  // We increase maxAcceptableDist from 60 to 75 to make the verification more tolerant and robust
  const maxAcceptableDist = 75; 
  const similarity = Math.max(0, 100 * (1 - avgDist / maxAcceptableDist));
  
  return parseFloat(similarity.toFixed(1));
}

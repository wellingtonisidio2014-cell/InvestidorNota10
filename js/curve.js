// Shape-preserving cubic interpolation: passes through each observation and
// uses horizontal tangents at turning points, avoiding invented peaks/troughs.
export function monotonePath(points) {
  if (!points.length) return '';
  const start = `M ${points[0].x} ${points[0].y}`;
  if (points.length === 1) return start;
  const slopes = points.slice(1).map((point,i) => (point.y-points[i].y)/(point.x-points[i].x));
  const tangents = points.map((_,i) => {
    if (!i) return slopes[0];
    if (i === points.length-1) return slopes.at(-1);
    const left=slopes[i-1],right=slopes[i];
    if (left*right <= 0) return 0;
    const before=points[i].x-points[i-1].x,after=points[i+1].x-points[i].x;
    const a=2*after+before,b=after+2*before;
    return (a+b)/(a/left+b/right);
  });
  return start + points.slice(1).map((point,i) => {
    const previous=points[i],step=(point.x-previous.x)/3;
    return ` C ${previous.x+step} ${previous.y+tangents[i]*step} ${point.x-step} ${point.y-tangents[i+1]*step} ${point.x} ${point.y}`;
  }).join('');
}

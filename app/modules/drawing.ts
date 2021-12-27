export function fillRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  // The main idea is to render two rectangles with four circles on the corners.
  const aX = x + radius;
  const aY = y;
  const aWidth = width - radius * 2;
  const aHeight = height;

  const bX = x;
  const bY = y + radius;
  const bWidth = width;
  const bHeight = height - radius * 2;

  ctx.fillRect(aX, aY, aWidth, aHeight);
  ctx.fillRect(bX, bY, bWidth, bHeight);

  fillCircle(ctx, aX, bY, radius);
  fillCircle(ctx, aX + aWidth, bY, radius);
  fillCircle(ctx, aX, bY + bHeight, radius);
  fillCircle(ctx, aX + aWidth, bY + bHeight, radius);
}

export function fillCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.fill();
}

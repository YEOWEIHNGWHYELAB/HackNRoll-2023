class Road {
  /**
   * Draw the road on the canvas
   * 
   * @param x coordinate of the center of the road
   * @param width width of each lane
   * @param laneCount number of lanes
   */
  constructor(x, width, laneCount = 3) {
    this.x = x;
    this.width = width;
    this.laneCount = laneCount;

    this.left = x - width / 2;
    this.right = x + width / 2;

    // Approximate infinite values 
    const approxInfinity = 1000000;
    this.top = -approxInfinity;
    this.bottom = approxInfinity;

    const topLeft = { x: this.left, y: this.top };
    const topRight = { x: this.right, y: this.top };
    const bottomLeft = { x: this.left, y: this.bottom };
    const bottomRight = { x: this.right, y: this.bottom };

    // Road borders
    this.borders = [
      [topLeft, bottomLeft],
      [topRight, bottomRight],
    ];
  }

  /**
   * Compute the coordinates of the selected lane
   * 
   * @param laneIndex the index of the lane selected 
   * @returns coordinate of the given lane center 
   */
  getLaneCenter(laneIndex) {
    const laneWidth = this.width / this.laneCount;
    return (this.left + laneWidth / 2 + Math.min(laneIndex, this.laneCount - 1) * laneWidth);
  }

  /**
   * Draws the lane marking onto canvas
   */
  draw(ctx) {
    /**
     * Lane Dividers
     */
    ctx.setLineDash([25, 20]); // array to specify alternating line, gap, line, gap...
    ctx.lineWidth = 5;
    ctx.strokeStyle = "yellow";

    for (let i = 1; i <= this.laneCount - 1; i++) {
      const x = lerp(this.left, this.right, i / this.laneCount);

      ctx.beginPath();
      ctx.moveTo(x, this.top);
      ctx.lineTo(x, this.bottom);
      ctx.stroke();
    }

    /**
     * Road Borders
     */
    ctx.setLineDash([]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = "red";

    this.borders.forEach((border) => {
      ctx.beginPath();
      ctx.moveTo(border[0].x, border[0].y);
      ctx.lineTo(border[1].x, border[1].y);
      ctx.stroke();
    });
  }
}

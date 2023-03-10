class Sensor {
    constructor(car, sensorNum) {
        this.car = car;

        // Number of sensor, sensor range, sensor spread
        this.rayCount = sensorNum;
        this.rayLength = sensorLength;
        this.raySpread = ((sensorSpread / 90.0) * Math.PI) / 2;

        this.rays = [];
        this.readings = [];
    }

    update(roadBorders, traffic, agentTraffic) {
        this.#castRays();
        this.readings = [];

        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(this.#getReading(this.rays[i], roadBorders, traffic, agentTraffic));
        }
    }

    #getReading(ray, roadBorders, traffic, agentTraffic) {
        let touches = [];

        // Sensor collision with road border
        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(ray[0], ray[1], roadBorders[i][0], roadBorders[i][1]);

            if (touch) {
                touches.push(touch);
            }
        }

        // Sensor collision with traffic NPC
        for (let i = 0; i < traffic.length; i++) {
            const poly = traffic[i].polygon;

            for (let j = 0; j < poly.length; j++) {
                const value = getIntersection(ray[0], ray[1], poly[j], poly[(j + 1) % poly.length]);

                if (value) {
                    touches.push(value);
                }
            }
        }

        if (isCollideAgentTraffic) {
            // Sensor collision with traffic Agents
            for (let i = 0; i < agentTraffic.length; i++) {
                const poly = agentTraffic[i].polygon;

                for (let j = 0; j < poly.length; j++) {
                    const value = getIntersection(ray[0], ray[1], poly[j], poly[(j + 1) % poly.length]);

                    if (value) {
                        touches.push(value);
                    }
                }
            }
        }

        // Get the minimum offsets of the collision with obstacles else return null
        if (touches.length == 0) {
            return null;
        } else {
            const offsets = touches.map((e) => e.offset);
            const minOffset = Math.min(...offsets);

            return touches.find((e) => e.offset == minOffset);
        }
    }

    // Draw the sensor ray on car
    #castRays() {
        this.rays = [];

        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(this.raySpread / 2, -this.raySpread / 2, this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)) + this.car.angle;

            const start = { x: this.car.x, y: this.car.y };
            const end = {
                x: this.car.x - Math.sin(rayAngle) * this.rayLength,
                y: this.car.y - Math.cos(rayAngle) * this.rayLength,
            };

            this.rays.push([start, end]);
        }
    }

    draw(ctx) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1];

            if (this.readings[i]) {
                end = this.readings[i];
            }

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "white";
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
        }
    }
}

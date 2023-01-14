class Car {

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} width 
     * @param {number} height 
     * @param {string} controlType 
     * @param {number} maxSpeed 
     * @param {string} color 
     */
    constructor(x, y, width, height, controlType, maxSpeed = 3, color = "blue") {
        /**
         * Where to draw the car and the size
         */
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        /**
         * Car initial state
         */
        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;

        this.damaged = false;
        this.useBrain = (controlType == "AI");
        this.controls = new Controls(controlType);
        this.polygon;

        /**
         * Only add sensor and neural network to car if it is not "NPC"
         */
        if (controlType == "AI") {
            this.sensor = new Sensor(this);
            this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
        }

        /**
         * Drawing the Agent & NPC
         */
        this.img = new Image();
        this.img.src = "/image/car-top-down.png";
        this.mask = document.createElement("canvas");
        this.mask.width = width;
        this.mask.height = height;
        const maskCtx = this.mask.getContext("2d");
        this.img.onload = () => {
            maskCtx.fillStyle = color;
            maskCtx.rect(0, 0, this.width, this.height);
            maskCtx.fill();

            maskCtx.globalCompositeOperation = "destination-atop";
            maskCtx.drawImage(this.img, 0, 0, this.width, this.height);
        };
    }

    update(roadBorders, trafficNPC) {
        // Car can only move if it is not damage
        if (!this.damaged) {
            this.#move();

            this.polygon = this.#draw_polygon();
            this.damaged = this.#check_damage(roadBorders, trafficNPC);
        }

        if (this.sensor) {
            this.sensor.update(roadBorders, trafficNPC);

            // Array of offset showing the values of sensor
            // 0 -> Far, value increases showing obstacle closer to car
            const offsets = this.sensor.readings.map((s) =>
                s == null ? 0 : 1 - s.offset
            );

            const outputs = NeuralNetwork.feedForward(offsets, this.brain);

            // Control the car using neural network
            if (this.useBrain) {
                this.controls.forward = outputs[0];
                this.controls.left = outputs[1];
                this.controls.right = outputs[2];
                this.controls.reverse = outputs[3];
            }
        }
    }

    /**
     * To check for damage, we have to check against the road border and the 
     * NPC which are the only obstacles that the car can collide with
     *  
     * @param {*} roadBorders 
     * @param {*} trafficNPC 
     * @returns boolean on whether did the car get damage
     */
    #check_damage(roadBorders, trafficNPC) {
        // Iteratively check if any polygons intersects

        for (let i = 0; i < roadBorders.length; i++) {
            if (polygonIntersect(this.polygon, roadBorders[i])) {
                return true;
            }
        }

        for (let i = 0; i < trafficNPC.length; i++) {
            if (polygonIntersect(this.polygon, trafficNPC[i].polygon)) {
                return true;
            }
        }

        return false;
    }

    #draw_polygon() {
        const points = [];

        const rad = Math.hypot(this.width, this.height) / 2;
        const alpha = Math.atan2(this.width, this.height);

        // Gets all the 4 corners of the car
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
        });

        return points;
    }

    #move() {
        // Forward & Reverse
        if (this.controls.forward) {
            this.speed += this.acceleration;
        }
        if (this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        // Speed governor
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }

        // Limit the reverse speed to half the max speed
        if (this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        // Friction
        if (this.speed > 0) {
            this.speed -= this.friction;
        }
        if (this.speed < 0) {
            this.speed += this.friction;
        }

        // Debouncing the car when it is at low speed
        if (Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        if (this.speed != 0) {
            // To correct the reversing steering
            const flip = this.speed > 0 ? 1 : -1;

            if (this.controls.left) {
                this.angle += 0.03 * flip;
            }

            if (this.controls.right) {
                this.angle -= 0.03 * flip;
            }
        }

        // Translate the center of the car
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    // Draw car & Sensor
    draw(ctx, drawSensor = false) {
        if (this.sensor && drawSensor) {
            this.sensor.draw(ctx);
        }

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(-this.angle);

        if (!this.damaged) {
            ctx.drawImage(
                this.mask,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );

            ctx.globalCompositeOperation = "multiply";
        }

        ctx.drawImage(
            this.img,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );

        ctx.restore();
    }
}
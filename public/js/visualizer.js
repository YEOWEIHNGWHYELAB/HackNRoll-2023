class Visualizer {
    static drawNetwork(ctx, network) {
        const margin = 50;
        const left = margin;
        const top = margin;
        const width = ctx.canvas.width - margin * 2;
        const height = ctx.canvas.height - margin * 2;

        const levelHeight = height / network.levels.length;

        // Draw in reverse if not can't see the biasses due to overlapping
        for (let i = network.levels.length - 1; i >= 0; i--) {
            const levelTop = top + lerp(height - levelHeight, 0, network.levels.length == 1 ? 0.5 : i / (network.levels.length - 1));

            ctx.setLineDash([6, 4]);

            // Draw the network itereatively 
            Visualizer.drawLevel(
                ctx,
                network.levels[i],
                left,
                levelTop,
                width,
                levelHeight,
                i == network.levels.length - 1 ? ["🠉", "🠈", "🠊", "🠋"] : [] // Only last level have output control
            );
        }
    }

    /**
     * Red indicates negative connection while green indicates positive connection
     * Dotted arc in the node is the bias
     * The smaller node within a node indicates the input or output value in the node
     */
    static drawLevel(ctx, level, left, top, width, height, outputLabels) {
        const right = left + width;
        const bottom = top + height;

        const { inputs, outputs, weights, biases } = level;

        // Draw the edges from node to node
        for (let i = 0; i < inputs.length; i++) {
            for (let j = 0; j < outputs.length; j++) {
                ctx.beginPath();
                ctx.moveTo(Visualizer.#getNodeX(inputs, i, left, right), bottom);
                ctx.lineTo(Visualizer.#getNodeX(outputs, j, left, right), top);
                ctx.lineWidth = 2;
                ctx.strokeStyle = visualizerEdge(weights[i][j]); // Draw weight of edge
                ctx.stroke();
            }
        }

        const nodeRadius = 15;

        for (let i = 0; i < inputs.length; i++) {
            // Get the x coordinate of where to draw
            const x = Visualizer.#getNodeX(inputs, i, left, right);

            ctx.beginPath();
            ctx.arc(x, bottom, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, bottom, nodeRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = visualizerEdge(inputs[i]); // Get the value from sensor
            ctx.fill();
        }

        for (let i = 0; i < outputs.length; i++) {
            const x = Visualizer.#getNodeX(outputs, i, left, right);

            ctx.beginPath();
            ctx.arc(x, top, nodeRadius, 0, Math.PI * 2);
            ctx.fillStyle = "black";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, top, nodeRadius * 0.6, 0, Math.PI * 2);
            ctx.fillStyle = visualizerEdge(outputs[i]);
            ctx.fill();

            ctx.beginPath();
            ctx.lineWidth = 2;
            ctx.arc(x, top, nodeRadius * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = visualizerEdge(biases[i]);
            ctx.setLineDash([3, 3]);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw the arrow at the output to indicate control
            if (outputLabels[i]) {
                ctx.beginPath();
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "black";
                ctx.strokeStyle = "white";
                ctx.font = nodeRadius * 1.5 + "px Arial";
                ctx.fillText(outputLabels[i], x, top + nodeRadius * 0.1);
                ctx.lineWidth = 0.5;
                ctx.strokeText(outputLabels[i], x, top + nodeRadius * 0.1);
            }
        }
    }

    static #getNodeX(nodes, index, left, right) {
        // We need to check if there will be zero division
        return lerp(left, right, nodes.length == 1 ? 0.5 : index / (nodes.length - 1));
    }
}

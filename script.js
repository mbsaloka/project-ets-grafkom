"use strict";

var gl;
var colorLoc;

var positions = [];
var numPositions = 6;

var shapeChoosen = "SQUARE";
var objectSize = 0.2;

var color = vec4(1.0, 0.0, 0.0, 1.0);
var lineColor = vec4(0.0, 0.0, 1.0, 1.0);
var aColor;

var uModelViewMatrix;
var uProjectionMatrix;
var uThetaLoc;

var translation = 0.0;
var translationSpeed = 0.0;

var simulationState = "RESET";

var deltaTime = 0.032;
var gravity = -9.81;

var boundX = 14.5;
var boundY = 4.8;

var velocityX = 0.0, newVelocityX = 0.0;
var velocityY = 0.0, newVelocityY = 0.0;

var initialX = 0.0;
var initialY = 0.0;

var x = 0.0;
var y = 0.0;

var mass = 1, newMass = 1;
var mu = 0.3, newMu = 0.3;

var bounceFactor = 0.5, newBounceFactor = 0.5;
var totalBounce = 0;

var isUsingForce = true;
var F = 0, newF = 0;
var theta = 0, newTheta = 0;

var forceX;
var forceY;

init();

function init()
{
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    var ratio = canvas.width / canvas.height;

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer );
    processVerticesPositions();
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    aColor = gl.getUniformLocation(program, "aColor");
    gl.uniform4fv(aColor, color);

    uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(ortho(-ratio * 5, ratio * 5, -5, 5, -100, 100)));

    uThetaLoc = gl.getUniformLocation(program, "uTheta");

    var startButton = document.getElementById("start-button");
    startButton.addEventListener("click", function() {
        updateSimulationParameters();
        simulationState = "START";
    });

    var stopButton = document.getElementById("stop-button");
    stopButton.addEventListener("click", function() {
        simulationState = "STOP";
    });

    var resetButton = document.getElementById("reset-button");
    resetButton.addEventListener("click", function() {
        simulationState = "RESET";
    });

    var massInput = document.getElementById("input-mass");
    massInput.addEventListener("input", function() {
        newMass = parseFloat(massInput.value);
    });

    var muInput = document.getElementById("input-mu");
    muInput.addEventListener("input", function() {
        newMu = parseFloat(muInput.value);
    });

    var velocityXInput = document.getElementById("input-vx");
    velocityXInput.addEventListener("input", function() {
        newVelocityX = parseFloat(velocityXInput.value);
    });

    var velocityYInput = document.getElementById("input-vy");
    velocityYInput.addEventListener("input", function() {
        newVelocityY = parseFloat(velocityYInput.value);
    });

    var forceInput = document.getElementById("input-force");
    forceInput.addEventListener("input", function() {
        newF = parseFloat(forceInput.value);
    });

    var bounceFactorInput = document.getElementById("input-bounce-factor");
    bounceFactorInput.addEventListener("input", function() {
        newBounceFactor = parseFloat(bounceFactorInput.value);
    });

    var gravityCheckbox = document.getElementById("checkbox-gravity");
    gravityCheckbox.addEventListener("change", function() {
        if (gravityCheckbox.checked) {
            gravity = -0.981;
        } else {
            gravity = 0;
        }
    });

    var frictionCheckbox = document.getElementById("checkbox-friction");
    frictionCheckbox.addEventListener("change", function() {
        if (!frictionCheckbox.checked) {
            mu = 0.0;
            newMu = 0.0;
        } else {
            mu = muInput.value;
            newMu = muInput.value;
        }
    });

    var forceCheckbox = document.getElementById("checkbox-force");
    forceCheckbox.addEventListener("change", function() {
        if (forceCheckbox.checked) {
            velocityXInput.disabled = true;
            velocityYInput.disabled = true;
            forceInput.disabled = false;
            isUsingForce = true;
        } else {
            velocityXInput.disabled = false;
            velocityYInput.disabled = false;
            forceInput.disabled = true;
            isUsingForce = false;
        }
    });

    var thetaValueDisplay = document.getElementById("theta-value");
    var thetaInput = document.getElementById("slider-theta");
    thetaInput.addEventListener("input", function() {
        newTheta = parseFloat(thetaInput.value);
        thetaValueDisplay.innerHTML = thetaInput.value + "°";
    });

    var shapeSelect = document.getElementById("shape-select");
    shapeSelect.addEventListener("change", function() {
        shapeChoosen = shapeSelect.value;
        processVerticesPositions();
    });

    var colorSelect = document.getElementById("color-select");
    colorSelect.addEventListener("change", function() {
        switch (colorSelect.value) {
            case "RED":
                color = vec4(1.0, 0.0, 0.0, 1.0);
                break;
            case "GREEN":
                color = vec4(0.0, 1.0, 0.0, 1.0);
                break;
            case "BLUE":
                color = vec4(0.0, 0.0, 1.0, 1.0);
                break;
            case "ORANGE":
                color = vec4(1.0, 0.5, 0.0, 1.0);
                break;
            case "PURPLE":
                color = vec4(0.5, 0.0, 1.0, 1.0);
                break;
            case "YELLOW":
                color = vec4(1.0, 1.0, 0.0, 1.0);
                break;
        }
    });

    var objectSizeSlider = document.getElementById("object-size");
    objectSizeSlider.addEventListener("input", function() {
        objectSize = parseFloat(objectSizeSlider.value);
        processVerticesPositions();
        boundX = 15 - objectSize * 1.2;
        boundY = 5 - objectSize;
    });

    render();
};

function processVerticesPositions() {
    positions = [];
    switch (shapeChoosen) {
        case "SQUARE":
            positions.push(
                vec4(-objectSize, -objectSize,  0, 1.0),
                vec4(-objectSize,  objectSize,  0, 1.0),
                vec4(objectSize,  objectSize,  0, 1.0),
                vec4(-objectSize, -objectSize,  0, 1.0),
                vec4(objectSize, -objectSize,  0, 1.0),
                vec4(objectSize,  objectSize,  0, 1.0)
            )
            numPositions = 6;
            break;
        case "CIRCLE":
            var n = 50
            var previousPos = vec4(objectSize, 0.0, 0.0, 1.0);

            for (var i = 1; i <= n; i++) {
                var angle = 2 * Math.PI * i / n;
                var x = objectSize * Math.cos(angle);
                var y = objectSize * Math.sin(angle);
                var currentPos = vec4(x, y, 0.0, 1.0);

                positions.push(previousPos);
                positions.push(vec4(0.0, 0.0, 0.0, 1.0));
                positions.push(currentPos);

                previousPos = currentPos;
            }
            numPositions = n * 3;
            break;
    }

    positions.push(
        vec4(0.0, 0.0, 0, 1.0),
        vec4(objectSize + 2.0, 0.0, 0, 1.0)
    );

    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    switch (simulationState) {
        case "START":
            processSimulation();
            break;
        case "RESET":
            resetSimulation();
            break;
    }

    var translationMatrix = translate(x, y, 0.0);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(translationMatrix));

    gl.uniform4fv(aColor, color);
    gl.uniform1f(uThetaLoc, -1.0);
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    if (isUsingForce && velocityX == 0 && velocityY == 0) {
        gl.uniform4fv(aColor, lineColor);
        gl.uniform1f(uThetaLoc, newTheta);
        gl.drawArrays(gl.LINES, numPositions, 2);
    }

    requestAnimationFrame(render);
}

function processSimulation() {
    var friction = mu * mass * -gravity;

    if (y <= -boundY && velocityY <= 0) {
        y = -boundY;

        if (velocityY < 0) {
            totalBounce++;
            velocityY = -velocityY * Math.pow(bounceFactor, totalBounce);
            y += velocityY * deltaTime;
        }

        if (y == -boundY && Math.abs(velocityY) < 0.1) {
            velocityY = 0;
            totalBounce = 0;
        }

        if (velocityX > 0) {
            if (Math.abs(velocityX) >= friction / mass * deltaTime) {
                velocityX -= friction / mass * deltaTime;
            } else {
                velocityX = 0;
            }
        } else if (velocityX < 0) {
            if (Math.abs(velocityX) >= friction / mass * deltaTime) {
                velocityX += friction / mass * deltaTime;
            } else {
                velocityX = 0;
            }
        }
    } else if (y > -boundY) {
        velocityY += gravity * deltaTime * Math.pow(bounceFactor, totalBounce);
        y += velocityY * deltaTime;
    }

    if (y == -boundY && velocityY > 0) {
        velocityY += gravity * deltaTime * Math.pow(bounceFactor, totalBounce);
        y += velocityY * deltaTime;
    }

    if (x < boundX && x > -boundX) {
        x += velocityX * deltaTime;
    } else {
        if (x >= boundX) {
            x = boundX;
            if (velocityX > 0) {
                velocityX = -velocityX;
                x += velocityX * deltaTime;
            }
        } else if (x <= -boundX) {
            x = -boundX;
            if (velocityX < 0) {
                velocityX = -velocityX;
                x += velocityX * deltaTime;
            }
        }
    }
}

function resetSimulation() {
    x = initialX;
    y = initialY;
    velocityY = 0.0;
    velocityX = 0.0;
    totalBounce = 0;
    bounceFactor = 0.5;
    mu = 0.3;
    mass = 1;
    gravity = -9.81;
    F = 0;
    theta = 0;
    forceX = 0;
    forceY = 0;
    simulationState = "STOP";
}

function updateSimulationParameters() {
    mass = newMass;
    mu = newMu;
    bounceFactor = newBounceFactor;

    if (isUsingForce) {
        F = newF;
        theta = newTheta * (Math.PI / 180);
        forceX = F * Math.cos(theta);
        forceY = F * Math.sin(theta);
        velocityX = forceX / mass;
        velocityY = forceY / mass;
    } else {
        velocityX = newVelocityX;
        velocityY = newVelocityY;
    }

}
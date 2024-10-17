"use strict";

var gl;
var colorLoc;

var program;
var cBuffer;
var vBuffer;
var positionLoc;

var positions = [];
var numPositions = 6;
var numTrajectoryPoints = 0;
var numGridLine = 0;

var shapeChoosen = "SQUARE";
var objectSize = 0.5;

var cubeVertices = [
    vec4(-objectSize, -objectSize, objectSize, 1.0),
    vec4(-objectSize, objectSize, objectSize, 1.0),
    vec4(objectSize, objectSize, objectSize, 1.0),
    vec4(objectSize, -objectSize, objectSize, 1.0),
    vec4(-objectSize, -objectSize, -objectSize, 1.0),
    vec4(-objectSize, objectSize, -objectSize, 1.0),
    vec4(objectSize, objectSize, -objectSize, 1.0),
    vec4(objectSize, -objectSize, -objectSize, 1.0),
];

var limasVertices = [
    vec4(-objectSize, -objectSize, objectSize, 1.0),
    vec4(-objectSize, -objectSize, -objectSize, 1.0),
    vec4(objectSize, -objectSize, -objectSize, 1.0),
    vec4(objectSize, -objectSize, objectSize, 1.0),
    vec4(0.0, objectSize, 0.0, 1.0)
];

var color = vec4(1.0, 0.0, 0.0, 1.0);
var lineColor = vec4(0.0, 0.0, 1.0, 1.0);
var trajectoryColor = vec4(0.0, 0.3, 0.3, 1.0);
var gridColor = vec4(0.1, 0.1, 0.1, 0.5);
var groundColor = vec4(0.5, 0.8, 0.5, 0.8);
var colorsArray = [];
var uColor;

var vertexColors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(1.0, 1.0, 1.0, 1.0),  // white
];

var vertexColorsBall = [
    vec4(1.0, 0.5, 0.0, 1.0), // orange
    vec4(1.0, 0.5, 0.0, 1.0), // orange
    vec4(1.0, 0.5, 0.0, 1.0), // orange
    vec4(1.0, 0.5, 0.0, 1.0), // orange
    vec4(1.0, 0.0, 1.0, 1.0), // pink
    vec4(1.0, 0.0, 1.0, 1.0), // pink
    vec4(1.0, 0.0, 1.0, 1.0), // pink
    vec4(1.0, 0.0, 1.0, 1.0) // pink
];

var isDrawTrajectory = true;

var uModelViewMatrix;
var uProjectionMatrix;
var uThetaLoc;

var translation = 0.0;
var translationSpeed = 0.0;

var simulationState = "RESET";

var deltaTime = 0.032;
var gravity = -9.81;

var boundX = 14;
var boundY = 8;
var boundZ = 5;

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

var isUsePerspective = false;
var near = 0.3;
var far = 30;
var radius = 18.0;
var thetaProjection = 0.0;
var phi = 0.0;
var dr = 5.0 * Math.PI/180.0;

var fovy = 60.0;
var aspect;

var modelViewMatrixLoc, projectionMatrixLoc;
var modelViewMatrix, projectionMatrix;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

init();

function init()
{
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    aspect = canvas.width / canvas.height;

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    processVerticesPositions();

    cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    uColor = gl.getUniformLocation(program, "uColor");
    gl.uniform4fv(uColor, color);

    uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");

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

    var clearButton = document.getElementById("clear-button");
    clearButton.addEventListener("click", function() {
        clearTrajectory();
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

    var trajectoryCheckbox = document.getElementById("checkbox-trajectory");
    trajectoryCheckbox.addEventListener("change", function() {
        if (trajectoryCheckbox.checked) {
            isDrawTrajectory = true;
        } else {
            isDrawTrajectory = false;
            clearTrajectory();
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
        setBufferData();
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
    var objectSizeValue = document.getElementById("object-size-value");
    objectSizeSlider.addEventListener("input", function() {
        objectSizeValue.innerHTML = objectSizeSlider.value;
        objectSize = parseFloat(objectSizeSlider.value);
        for (var v in cubeVertices) {
            for (var i = 0; i < 3; i++) {
                cubeVertices[v][i] = cubeVertices[v][i] > 0 ? objectSize : -objectSize;
            }
        }
        processVerticesPositions();
        setBufferData();
    });

    var nearSlider = document.getElementById("slider-near");
    var nearValue = document.getElementById("near-value");
    nearSlider.addEventListener("input", function() {
        nearValue.innerHTML = nearSlider.value;
        near = parseFloat(nearSlider.value);
    });

    var farSlider = document.getElementById("slider-far");
    var farValue = document.getElementById("far-value");
    farSlider.addEventListener("input", function() {
        farValue.innerHTML = farSlider.value;
        far = parseFloat(farSlider.value);
    });

    var radiusSlider = document.getElementById("slider-radius");
    var radiusValue = document.getElementById("radius-value");
    radiusSlider.addEventListener("input", function() {
        radiusValue.innerHTML = radiusSlider.value;
        radius = parseFloat(radiusSlider.value);
    });

    var thetaProjectionSlider = document.getElementById("slider-theta-projection");
    var thetaProjectionValue = document.getElementById("theta-projection-value");
    thetaProjectionSlider.addEventListener("input", function() {
        thetaProjectionValue.innerHTML = thetaProjectionSlider.value + "°";
        thetaProjection = parseFloat(thetaProjectionSlider.value) * Math.PI / 180.0;
    });

    var phiSlider = document.getElementById("slider-phi");
    var phiValue = document.getElementById("phi-value");
    phiSlider.addEventListener("input", function() {
        phiValue.innerHTML = phiSlider.value + "°";
        phi = parseFloat(phiSlider.value) * Math.PI / 180.0;
    });

    var fovySlider = document.getElementById("slider-fovy");
    var fovyValue = document.getElementById("fovy-value");
    fovySlider.addEventListener("input", function() {
        fovyValue.innerHTML = fovySlider.value + "°";
        fovy = parseFloat(fovySlider.value);
    });

    var resetPerspectiveButton = document.getElementById("reset-perspective");
    resetPerspectiveButton.addEventListener("click", function() {
        resetPerspective();
        nearSlider.value = near;
        farSlider.value = far;
        radiusSlider.value = radius;
        thetaProjectionSlider.value = thetaProjection * 180 / Math.PI;
        phiSlider.value = phi * 180 / Math.PI;
        fovySlider.value = fovy;
        nearValue.innerHTML = near;
        farValue.innerHTML = far;
        radiusValue.innerHTML = radius;
        thetaProjectionValue.innerHTML = thetaProjectionSlider.value + "°";
        phiValue.innerHTML = phiSlider.value + "°";
        fovyValue.innerHTML = fovy;
    });

    var perspectiveCheckbox = document.getElementById("checkbox-perspective");
    perspectiveCheckbox.addEventListener("change", function() {
        if (perspectiveCheckbox.checked) {
            isUsePerspective = true;
            nearSlider.disabled = false;
            farSlider.disabled = false;
            radiusSlider.disabled = false;
            thetaProjectionSlider.disabled = false;
            phiSlider.disabled = false;
            fovySlider.disabled = false;
            resetPerspectiveButton.disabled = false;
        } else {
            isUsePerspective = false;
            nearSlider.disabled = true;
            farSlider.disabled = true;
            radiusSlider.disabled = true;
            thetaProjectionSlider.disabled = true;
            phiSlider.disabled = true;
            fovySlider.disabled = true;
            resetPerspectiveButton.disabled = true;
        }
        processVerticesPositions();
        setBufferData();
    });

    render();
};

function processVerticesPositions() {
    var trajectoryTemp = positions.slice(6 + numGridLine + numPositions + 2, positions.length);
    positions = [];

    // Ground Vertices
    positions.push(
        vec4(-boundX, -boundY, boundZ, 1.0),
        vec4(boundX, -boundY, boundZ, 1.0),
        vec4(-boundX, -boundY, -boundZ, 1.0),
        vec4(boundX, -boundY, boundZ, 1.0),
        vec4(boundX, -boundY, -boundZ, 1.0),
        vec4(-boundX, -boundY, -boundZ, 1.0)
    );

    // Grid Vertices
    numGridLine = 0;
    for (var i = -boundX; i <= boundX; i++) {
        positions.push(
            vec4(i, -boundY * 1.5, 0.0, 1.0),
            vec4(i, boundY * 1.5, 0.0, 1.0)
        );
        numGridLine += 2;
    }

    for (var i = -boundY; i <= boundY + 4; i++) {
        positions.push(
            vec4(-boundX, i, 0.0, 1.0),
            vec4(boundX, i, 0.0, 1.0)
        );
        numGridLine += 2;
    }

    // Grid Z Vertices
    for (var i = -boundZ; i <= boundZ; i++) {
        positions.push(
            vec4(-boundX, -boundY, i, 1.0),
            vec4(boundX, -boundY, i, 1.0)
        );
        numGridLine += 2;
    }

    for (var i = -boundX; i <= boundX; i++) {
        positions.push(
            vec4(i, -boundY, -boundZ, 1.0),
            vec4(i, -boundY, boundZ, 1.0)
        );
        numGridLine += 2;
    }

    colorsArray = new Array(6 + numGridLine).fill(vec4(0.0, 0.0, 0.0, 1.0));

    // Object Vertices
    switch (shapeChoosen) {
        case "SQUARE":
            quad(1, 0, 3, 2);
            quad(2, 3, 7, 6);
            quad(3, 0, 4, 7);
            quad(6, 5, 1, 2);
            quad(4, 5, 6, 7);
            quad(5, 4, 0, 1);
            numPositions = 36;
            break;
        case "CIRCLE":
            if (!isUsePerspective) {
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
            } else {
                var n = 50;
                var m = 50;

                var tempPositions = [];
                for (var i = 0; i <= n; i++) {
                    var theta = 2 * Math.PI * i / n;

                    for (var j = 0; j <= m; j++) {
                        var phi = Math.PI * j / m;

                        var x = objectSize * Math.sin(phi) * Math.cos(theta);
                        var y = objectSize * Math.sin(phi) * Math.sin(theta);
                        var z = objectSize * Math.cos(phi);

                        tempPositions.push(vec4(x, y, z, 1.0));
                    }
                }

                for (var i = 0; i < n; i++) {

                    for (var j = 0; j < m; j++) {
                        var p1 = i * (m + 1) + j;
                        var p2 = p1 + m + 1;

                        positions.push(
                            tempPositions[p1],
                            tempPositions[p2],
                            tempPositions[p1 + 1],
                            tempPositions[p1 + 1],
                            tempPositions[p2],
                            tempPositions[p2 + 1]
                        );
                        colorsArray.push(
                            vertexColorsBall[i % 8],
                            vertexColorsBall[i % 8],
                            vertexColorsBall[i % 8],
                            vertexColorsBall[i % 8],
                            vertexColorsBall[i % 8],
                            vertexColorsBall[i % 8]
                        );
                        numPositions += 6;
                    }
                }
            }
            break;
        case "LIMAS":
            quad2(0, 1, 2, 3);
            triangle(4, 0, 1);
            triangle(1, 2, 4);
            triangle(2, 3, 4);
            triangle(3, 0, 4);

            numPositions = 18;
    }

    // Arrow Vertices
    positions.push(
        vec4(0.0, 0.0, 0, 1.0),
        vec4(objectSize + 2.0, 0.0, 0, 1.0)
    );
    colorsArray.push(lineColor, lineColor);

    positions = positions.concat(trajectoryTemp);
}

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    switch (simulationState) {
        case "START":
            processSimulation();
            if (isDrawTrajectory) {
                drawTrajectory();
            }
            break;
        case "RESET":
            resetSimulation();
            break;
    }


    var translationMatrix = translate(x, y, 0.0);
    var modelViewMatrixTranslate;
    if (isUsePerspective) {
        eye = vec3(radius*Math.sin(thetaProjection)*Math.cos(phi),
        radius*Math.sin(thetaProjection)*Math.sin(phi), radius*Math.cos(thetaProjection));
        modelViewMatrix = lookAt(eye, at , up);
        projectionMatrix = perspective(fovy, aspect, near, far);
        modelViewMatrixTranslate = mult(modelViewMatrix, translationMatrix);
    } else {
        projectionMatrix = ortho(-aspect * 7.94, aspect * 7.94, -7.94, 7.94, -100, 100);
        modelViewMatrix = mat4();
        modelViewMatrixTranslate = translationMatrix;
    }

    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(projectionMatrix));

    // Draw Grid
    gl.uniform4fv(uColor, gridColor);
    gl.uniform1f(uThetaLoc, -1.0);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINES, 6, numGridLine);

    // Draw Ground
    gl.uniform4fv(uColor, groundColor);
    gl.uniform1f(uThetaLoc, -1.0);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLES, 0, 6);

    // Draw Trajectory
    if (isDrawTrajectory) {
        gl.uniform4fv(uColor, trajectoryColor);
        gl.uniform1f(uThetaLoc, -1.0);
        gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.LINES, 6 + numGridLine + numPositions + 2, numTrajectoryPoints);
    }

    // Draw Object
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(modelViewMatrixTranslate));
    if (!isUsePerspective) {
        gl.uniform4fv(uColor, color);
    } else {
        gl.uniform4fv(uColor, vec4(0.0, 0.0, 0.0, 0.0));
    }
    gl.uniform1f(uThetaLoc, -1.0);
    gl.drawArrays(gl.TRIANGLES, 6 + numGridLine, numPositions);

    // Draw Arrow
    if ((isUsingForce && velocityX == 0 && velocityY == 0)) {
        gl.uniform4fv(uColor, lineColor);
        gl.uniform1f(uThetaLoc, newTheta);
        gl.drawArrays(gl.LINES, 6 + numGridLine + numPositions, 2);
    }

    requestAnimationFrame(render);
}

function processSimulation() {
    var friction = mu * mass * -gravity;

    if (y <= -(boundY - objectSize) && velocityY <= 0) {
        y = -(boundY - objectSize);

        if (velocityY < 0) {
            totalBounce++;
            velocityY = -velocityY * Math.pow(bounceFactor, totalBounce);
            y += velocityY * deltaTime;
        }

        if (y == -(boundY - objectSize) && Math.abs(velocityY) < 0.1) {
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
    } else if (y > -(boundY - objectSize)) {
        velocityY += gravity * deltaTime * Math.pow(bounceFactor, totalBounce);
        y += velocityY * deltaTime;
    }

    if (y == -(boundY - objectSize) && velocityY > 0) {
        velocityY += gravity * deltaTime * Math.pow(bounceFactor, totalBounce);
        y += velocityY * deltaTime;
    }

    if (x < (boundX - objectSize) && x > -(boundX - objectSize)) {
        x += velocityX * deltaTime;
    } else {
        if (x >= (boundX - objectSize)) {
            x = (boundX - objectSize);
            if (velocityX > 0) {
                velocityX = -velocityX;
                x += velocityX * deltaTime;
            }
        } else if (x <= -(boundX - objectSize)) {
            x = -(boundX - objectSize);
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
    clearTrajectory();
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

function drawTrajectory() {
    if (velocityX != 0 || velocityY != 0) {
        numTrajectoryPoints++;
        positions.push(vec4(x, y, 0.0, 1.0));
        gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
    }
}

function clearTrajectory() {
    numTrajectoryPoints = 0;
    positions = positions.slice(0, 6 + numGridLine + numPositions + 2);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
}

function quad(a, b, c, d) {
    positions.push(cubeVertices[a]);
    colorsArray.push(vertexColors[a]);
    positions.push(cubeVertices[b]);
    colorsArray.push(vertexColors[a]);
    positions.push(cubeVertices[c]);
    colorsArray.push(vertexColors[a]);
    positions.push(cubeVertices[a]);
    colorsArray.push(vertexColors[a]);
    positions.push(cubeVertices[c]);
    colorsArray.push(vertexColors[a]);
    positions.push(cubeVertices[d]);
    colorsArray.push(vertexColors[a]);
}

function quad2(a, b, c, d) {
    positions.push(limasVertices[a]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[b]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[c]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[a]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[c]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[d]);
    colorsArray.push(vertexColors[a]);
}

function triangle(a, b, c) {
    positions.push(limasVertices[a]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[b]);
    colorsArray.push(vertexColors[a]);
    positions.push(limasVertices[c]);
    colorsArray.push(vertexColors[a]);
}

function resetPerspective() {
    near = 0.3;
    far = 30;
    radius = 18.0;
    thetaProjection = 0.0;
    phi = 0.0;
    fovy = 60.0;
}

function setBufferData() {
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);
}
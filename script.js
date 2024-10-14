"use strict";

var gl;
var colorLoc;

var positions = [];
var numPositions = 6;
var vertices = [
	vec4(-0.2, -0.2,  0, 1.0),
	vec4(-0.2,  0.2,  0, 1.0),
	vec4(0.2,  0.2,  0, 1.0),
	vec4(0.2, -0.2,  0, 1.0)
];

var color = vec4(1.0, 0.0, 0.0, 1.0);

var uModelViewMatrix;
var uProjectionMatrix;

var translation = 0.0;
var translationSpeed = 0.0;
var translationLoc;

var simulationState = "STOP";

var time = 0.0;
var deltaTime = 0.016;
var gravity = -9.81;

var boundX = 4.9;
var boundY = 4.8;

var velocityX = 2.0;
var velocityY = 0.0;

var x = 0.0
var y = 0.0;

var massa = 1;
var mu = 0.1;

init();

function init()
{
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    var ratio = canvas.width / canvas.height;
    for (var vertex of vertices) {
      vertex[0] = vertex[0] / ratio;
    }

    positions.push(vertices[0]);
    positions.push(vertices[1]);
    positions.push(vertices[2]);
    positions.push(vertices[0]);
    positions.push(vertices[3]);
    positions.push(vertices[2]);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var aColor = gl.getUniformLocation(program, "aColor");
    gl.uniform4fv(aColor, color);

    uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(ortho(-5, 5, -5, 5, -100, 100)));

	// var slider = document.getElementById("SampleSlide");
	// slider.addEventListener("input", function() {
	// 	translationSpeed = parseFloat(slider.value);
	// });

    var startButton = document.getElementById("start-button");
    startButton.addEventListener("click", function() {
        simulationState = "START";
    });

    var stopButton = document.getElementById("stop-button");
    stopButton.addEventListener("click", function() {
        simulationState = "STOP";
    });

    var restartButton = document.getElementById("restart-button");
    restartButton.addEventListener("click", function() {
        simulationState = "RESTART";
    });

    translationLoc = gl.getUniformLocation(program, "translation");

    render();
};

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (simulationState == "START") {
        time += deltaTime;
    } else if (simulationState == "RESTART") {
        time = 0.0;
        y = 0.0;
        x = 0.0;
        velocityY = 0.0;
        velocityX = 2.0;
        simulationState = "STOP";
    }

    var friction = mu * massa * -gravity;

    if (y > -boundY) {
        y = 0.0 + velocityY * time + 0.5 * gravity * time * time;
    }

    if (velocityX > 0 && y <= -boundY) {
        if (Math.abs(velocityX) >= friction / massa) {
            velocityX -= friction / massa * deltaTime;
        } else {
            velocityX = 0;
        }
    } else if (velocityX < 0 && y <= -boundY) {
        if (Math.abs(velocityX) >= friction / massa) {
            velocityX += friction / massa * deltaTime;
        } else {
            velocityX = 0;
        }
    }

    if (y <= -boundY) {
        velocityY = 0;
        y = -boundY;
    }

    if (Math.abs(velocityX) > 0) {
        if (x <= boundX && x >= -boundX) {
            x = 0.0 + velocityX * time;
            console.log(velocityX);
        }
    }

    var translationMatrix = translate(x, y, 0.0);
    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(translationMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    requestAnimationFrame(render);
}
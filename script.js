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

// var colors = [
//   vec4(1.0, 0.0, 0.0, 1.0),  // merah
//   vec4(0.0, 1.0, 0.0, 1.0),  // hijau
//   vec4(0.0, 0.0, 1.0, 1.0),  // biru
//   vec4(1.0, 1.0, 0.0, 1.0)   // kuning
// ];
// var vertexColors = [];
var color = vec4(1.0, 0.0, 0.0, 1.0);

var uModelViewMatrix;
var uProjectionMatrix;
var translation = 0.0;
var translationSpeed = 0.0;

init();

function init()
{
    var canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    var ratio = canvas.width / canvas.height;
    console.log(ratio);

    console.log(vertices);

    for (var vertex of vertices) {
      vertex[0] = vertex[0] / ratio;
    }

    console.log(vertices);

    positions.push(vertices[0]);
    positions.push(vertices[1]);
    positions.push(vertices[2]);
    positions.push(vertices[0]);
    positions.push(vertices[3]);
    positions.push(vertices[2]);

    // vertexColors.push(colors[0]);
    // vertexColors.push(colors[1]);
    // vertexColors.push(colors[2]);
    // vertexColors.push(colors[0]);
    // vertexColors.push(colors[3]);
    // vertexColors.push(colors[2]);

    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer );
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // var cBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    // var colorLoc = gl.getAttribLocation(program, "aColor");
    // gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    // gl.enableVertexAttribArray(colorLoc);

    var aColor = gl.getUniformLocation(program, "aColor");
    gl.uniform4fv(aColor, color);

    uModelViewMatrix = gl.getUniformLocation(program, "uModelViewMatrix");
    uProjectionMatrix = gl.getUniformLocation(program, "uProjectionMatrix");
    gl.uniformMatrix4fv(uProjectionMatrix, false, flatten(ortho(-5, 5, -5, 5, -100, 100)));

	// var slider = document.getElementById("SampleSlide");
	// slider.addEventListener("input", function() {
	// 	translationSpeed = -parseFloat(slider.value);
	// });

    render();
};


var gravity = -0.00098;
var velocityY = 0.0;
var positionY = 1.0;
var floorY = -1.0;
var leftBoundary = -1.0;
var rightBoundary = 1.0;

function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Update kecepatan vertikal dengan gravitasi
    velocityY += gravity;

    // Update posisi vertikal objek dengan kecepatan
    positionY += velocityY;

    // Batasi objek agar tidak keluar dari batas bawah (canvas floor)
    if (positionY < floorY) {
        positionY = floorY;
        velocityY = 0.0;
    }

    // Update posisi horizontal dengan kecepatan slider
    // translation += translationSpeed;

    // Batasi posisi horizontal agar tidak keluar dari canvas
    // if (translation > rightBoundary) {
    //     translation = rightBoundary;
    // } else if (translation < leftBoundary) {
    //     translation = leftBoundary;
    // }

    // Buat matriks translasi berdasarkan posisi saat ini
    var translationMatrix = translate(translation, positionY, 0.0);

    gl.uniformMatrix4fv(uModelViewMatrix, false, flatten(translationMatrix));

    // Render objek
    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    requestAnimationFrame(render);
}


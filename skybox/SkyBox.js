// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'attribute vec2 a_TexCoord;\n' +
    'uniform mat4 u_MvpMatrix;\n' +
    'varying vec2 v_TexCoord;\n' +
    'attribute float a_Face;\n' +    //立方体面标记
    'varying float v_Face;\n' +
    'void main() {\n' +
    '  gl_Position = u_MvpMatrix * a_Position;\n' +
    '  v_TexCoord = a_TexCoord;\n' +
    '  v_Face = a_Face;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    '#ifdef GL_ES\n' +
    'precision mediump float;\n' +
    '#endif\n' +
    'uniform sampler2D u_front;\n' +
    'uniform sampler2D u_right;\n' +
    'uniform sampler2D u_up;\n' +
    'uniform sampler2D u_left;\n' +
    'uniform sampler2D u_down;\n' +
    'uniform sampler2D u_back;\n' +
    'varying float v_Face;\n' +
    'varying vec2 v_TexCoord;\n' +
    'void main() {\n' +
    //  从对应的取样器（图片）抽取纹素赋值给内置变量
    '  if(v_Face < 0.1) gl_FragColor = texture2D(u_front,v_TexCoord);\n' +
    '    else if(v_Face < 1.1) gl_FragColor = texture2D(u_right,v_TexCoord);\n' +
    '    else if(v_Face < 2.1) gl_FragColor = texture2D(u_up,v_TexCoord);\n' +
    '    else if(v_Face < 3.1) gl_FragColor = texture2D(u_left,v_TexCoord);\n' +
    '    else if(v_Face < 4.1) gl_FragColor = texture2D(u_down,v_TexCoord);\n' +
    '    else gl_FragColor = texture2D(u_back,v_TexCoord);\n' +
    '}\n';

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set the vertex information
    var n = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Get the storage locations of uniform variables 模型视图投影矩阵地址
    var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix');
    if (!u_MvpMatrix) {
        console.log('Failed to get the storage location of uniform variable');
        return;
    }

    // Calculate the view projection matrix
    var viewProjMatrix = new Matrix4();
    viewProjMatrix.setPerspective(60.0, canvas.width / canvas.height, 1.0, 10000.0);
    viewProjMatrix.lookAt(0.0, 0.0, 0.0, 0.0, 0.0, -1000.0, 0.0, 1.0, 0.0);

    // Register the event handler
    var currentAngle = [0.0, 0.0]; // Current rotation angle ([x-axis, y-axis] degrees)
    initEventHandlers(canvas, currentAngle);
    var eye = [0.0, 0.0, 0.0], at = [0.0, 0.0, -1000.0];
    window.onkeydown = function (ev) {
        var motion = 4.0;
        var key = String.fromCharCode(ev.keyCode); //将键盘接收的Unicode(ASCII)码转为字符串
        var flag = false;
        console.log(eye, at);
        switch (key) {
            case 'w':
            case 'W':
                eye[2] -= motion;
                at[2] -= motion;
                flag = true;
                break;
            case 's':
            case 'S':
                eye[2] += motion;
                at[2] += motion;
                flag = true;
                break;
            case 'a':
            case 'A':
                eye[0] -= motion;
                at[0] -= motion;
                flag = true;
                break;
            case 'd':
            case 'D':
                eye[0] += motion;
                at[0] += motion;
                flag = true;
                break;
            default :
                break;
        }
        if (flag) {
            //更新视图投影矩阵
            console.log(eye, at);
            viewProjMatrix.setPerspective(60.0, canvas.width / canvas.height, 1.0, 10000.0);
            viewProjMatrix.lookAt(eye[0], eye[1], eye[2], at[0], at[1], at[2], 0.0, 1.0, 0.0);
        }
        flag = false;
    };

    // Set texture
    var path = ['fr', 'rt', 'up', 'lf', 'dn', 'bk'];
    var samplers = ['u_front', 'u_right', 'u_up', 'u_left', 'u_down', 'u_back'];
    for (var i = 0; i < 6; i++) {
        if (!initTextures(gl, samplers[i], 'chenwu_' + path[i] + '.jpg', i)) {
            console.log('Failed to intialize the ' + i + ' texture.');
            return;
        }
    }


    var tick = function () {   // Start drawing
        draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle);
        requestAnimationFrame(tick, canvas);
    };
    tick();
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Vertex coordinates
        1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0, 1.0,    // v0-v1-v2-v3 front
        1.0, 1.0, 1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, 1.0, 1.0, -1.0,    // v0-v3-v4-v5 right
        1.0, 1.0, 1.0, 1.0, 1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
        -1.0, 1.0, 1.0, -1.0, 1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0,    // v1-v6-v7-v2 left
        -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,    // v7-v4-v3-v2 down
        1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0     // v4-v7-v6-v5 back
    ]);

    var texCoords = new Float32Array([   // Texture coordinates
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,    // v0-v1-v2-v3 front
        0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0,    // v0-v3-v4-v5 right
        1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,    // v0-v5-v6-v1 up
        1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,    // v1-v6-v7-v2 left
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,    // v7-v4-v3-v2 down
        0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0     // v4-v7-v6-v5 back
    ]);

    var FaceData = new Float32Array([  //标记六个面
        0.0, 0.0, 0.0, 0.0,      //front face
        1.0, 1.0, 1.0, 1.0,      //right face
        2.0, 2.0, 2.0, 2.0,      //up face
        3.0, 3.0, 3.0, 3.0,      //left face
        4.0, 4.0, 4.0, 4.0,      //down face
        5.0, 5.0, 5.0, 5.0      //back face
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // right
        8, 9, 10, 8, 10, 11,    // up
        12, 13, 14, 12, 14, 15,    // left
        16, 17, 18, 16, 18, 19,    // down
        20, 21, 22, 20, 22, 23     // back
    ]);

    // Write vertex information to buffer object
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, 'a_Position')) return -1; // Vertex coordinates
    if (!initArrayBuffer(gl, texCoords, 2, gl.FLOAT, 'a_TexCoord')) return -1;// Texture coordinates
    if (!initArrayBuffer(gl, FaceData, 1, gl.FLOAT, 'a_Face')) return -1;// Texture coordinates

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Create a buffer object
    var indexBuffer = gl.createBuffer();

    if (!indexBuffer) {
        return -1;
    }
    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    return indices.length;
}

function initEventHandlers(canvas, currentAngle) {
    var dragging = false;         // Dragging or not
    var lastX = -1, lastY = -1;   // Last position of the mouse

    canvas.onmousedown = function (ev) {   // Mouse is pressed
        var x = ev.clientX, y = ev.clientY;
        // Start dragging if a moue is in <canvas>
        var rect = ev.target.getBoundingClientRect();
        if (rect.left <= x && x < rect.right && rect.top <= y && y < rect.bottom) {
            lastX = x;
            lastY = y;
            dragging = true;
        }
    };

    canvas.onmouseup = function (ev) {
        dragging = false;
    }; // Mouse is released

    canvas.onmousemove = function (ev) { // Mouse is moved
        var x = ev.clientX, y = ev.clientY;
        if (dragging) {
            var factor = 100 / canvas.height; // The rotation ratio
            var dx = factor * (x - lastX);
            var dy = factor * (y - lastY);
            // Limit x-axis rotation angle to -90 to 90 degrees
            currentAngle[0] = Math.max(Math.min(currentAngle[0] + dy, 90.0), -90.0);
            currentAngle[1] = (currentAngle[1] + dx) % 350;
        }
        lastX = x, lastY = y;
    };
}

var boxSizeX = 1000;
var boxSizeZ = 1000;

function isBoundary(eye, at) {
    var xBound = boxSizeX * 0.95;
    var xLim = boxSizeX * 0.95;
    var xDir = at[0] - eye[0];
    if (eye[0] < -xBound) {
        eye[0] = -xLim;
        at[0] = eye[0] + xDir;
    }

    else if (eye[0] > xBound) {
        eye[0] = xLim;
        at[0] = eye[0] + xDir;
    }


    //场景边界
    var zBound = boxSizeZ * 0.95;
    var zLim = boxSizeZ * 0.95;
    var zDir = at[2] - eye[2];
    if (eye[2] < -zBound) {
        eye[2] = -zLim;
        at[2] = eye[2] + zDir;
    }

    else if (eye[2] > zBound) {
        eye[2] = zLim;
        at[2] = eye[2] + zDir;
    }

}

var g_MvpMatrix = new Matrix4(); // Model view projection matrix
function draw(gl, n, viewProjMatrix, u_MvpMatrix, currentAngle) {
    // Caliculate The model view projection matrix and pass it to u_MvpMatrix
    g_MvpMatrix.set(viewProjMatrix);
    g_MvpMatrix.rotate(currentAngle[0], 1.0, 0.0, 0.0); // Rotation around x-axis
    g_MvpMatrix.rotate(currentAngle[1], 0.0, 1.0, 0.0); // Rotation around y-axis
    g_MvpMatrix.scale(1000, 800, 1000);
    gl.uniformMatrix4fv(u_MvpMatrix, false, g_MvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     // Clear buffers
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
}

function initArrayBuffer(gl, data, num, type, attribute) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    var a_attribute = gl.getAttribLocation(gl.program, attribute);
    if (a_attribute < 0) {
        console.log('Failed to get the storage location of ' + attribute);
        return false;
    }
    gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
    // Enable the assignment to a_attribute variable
    gl.enableVertexAttribArray(a_attribute);

    return true;
}

function initTextures(gl, u_Sampler, name, i) {
    // Create a texture object
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Get the storage location of u_Sampler
    var u_Sampler = gl.getUniformLocation(gl.program, u_Sampler);
    if (!u_Sampler) {
        console.log('Failed to get the storage location of ' + samplers);
        return false;
    }

    // Create the image object
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called when image loading is completed
    image.onload = function () {
        loadTexture(gl, texture, u_Sampler, image, i);
    };
    // Tell the browser to load an Image
    image.src = '../src/chenwu_textures/' + name;

    return true;
}

function loadTexture(gl, texture, u_Sampler, image, i) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    // Activate texture unit0
    gl.activeTexture(gl.TEXTURE0 + i);
    //gl.activeTexture(eval('gl.TEXTURE'+i));
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the image to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to u_Sampler
    gl.uniform1i(u_Sampler, i);

}

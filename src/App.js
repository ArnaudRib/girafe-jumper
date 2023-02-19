import React, { useEffect, useState } from "react";
import "./styles.css";

export const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.msRequestAnimationFrame;

export const cancelAnimationFrame =
  window.cancelAnimationFrame || window.mozCancelAnimationFrame;

export const useCanvas = (
  contextType = "2d",
  contextAttributes = undefined,
  store = {}
) => {
  const canvasRef = React.useRef(null);
  let canvas, context, animationFrameId, tracer;

  const updateContext = () => {
    canvas = canvasRef.current;
    if (canvas) {
      context = canvas.getContext(contextType, contextAttributes);
      setupCanvas(canvas);
      animationFrameId = requestAnimationFrame(renderFrame);
    }
  };

  const setTracer = (tracerFn) => {
    tracer = tracerFn;
    return updateContext;
  };

  function renderFrame() {
    try {
      animationFrameId = requestAnimationFrame(renderFrame);
      tracer(context, canvas, store);
    } catch (error) {
      console.error("err", error);
    }
  }

  React.useEffect(() => {
    try {
      updateContext();
    } catch (err) {
      console.error("error", err);
    }
    return () => cancelAnimationFrame(animationFrameId);
  }, [store]);

  return [canvasRef, setTracer];
};

function loadImage(url, width = 60, height = 45) {
  const image = new Image(width, height); // Using optional size for image
  image.onload = () => {}; // Draw when image has loaded

  // Load an image of intrinsic size 300x227 in CSS pixels
  image.src = url;

  return image;
}

const backgroundImg = loadImage("background.png");
const giraffeeImgFramesNew = loadImage("running-giraffee-ratio-very-smoll.png");
const deadGiraffeeImg = loadImage("dead.png");
const bushImg = loadImage("bush.png");

const GIRAFFE_RUNNING_IMG_FRAMES = 30;
const GIRAFFE_RUNNING_IMG_WIDTH = 120;
const GIRAFFE_RUNNING_IMG_HEIGHT = 120;
const WIDTH = 600 * 1.5;
const HEIGHT = 300 * 1.5;
const GIRAFFE_SIZE = 120;

const BUSH_SIZE = 60;
const ground_giraffe = HEIGHT - GIRAFFE_SIZE;
const jumpHeight = GIRAFFE_SIZE * 2;
const BACKGROUND_WIDTH = 1200;
const BACKGROUND_HEIGHT = 700;

const DEFAULT_DIFFICULTY = 1;
const DEFAULT_JUMP_SPEED = 10;
const DEFAULT_WALK_SPEED = 6;

const MAX_DIFFICULTY = 15;
const JUMP_SPEED_COEF = 0;
const WALK_SPEED_COEF = 1.5;

let tick = 0;
let bushes = [];
let backgroundX = 0;

let giraffeeJumpDirection = "";
let giraffeeY = ground_giraffe;

let difficulty = DEFAULT_DIFFICULTY;
let jumpSpeed = DEFAULT_JUMP_SPEED + difficulty * JUMP_SPEED_COEF;
let walkSpeed = DEFAULT_WALK_SPEED + difficulty * WALK_SPEED_COEF;

let score = 0;
let bestScore = 0;

function reset() {
  tick = 0;
  bushes = [];

  giraffeeJumpDirection = "";
  giraffeeY = ground_giraffe;

  difficulty = DEFAULT_DIFFICULTY;
  jumpSpeed = DEFAULT_JUMP_SPEED + difficulty * JUMP_SPEED_COEF;
  walkSpeed = DEFAULT_WALK_SPEED + difficulty * WALK_SPEED_COEF;

  score = 0;
}

let i = 0;
/**
 * @param gl {CanvasRenderingContext2D}
 */
function animateGiraffe(gl, giraffeY, walkSpeed) {
  // dont walk when jump
  if (giraffeeJumpDirection === "") {
    const frameSpeed = Math.floor(1 * walkSpeed * 0.2);
    i = (i + frameSpeed) % GIRAFFE_RUNNING_IMG_FRAMES;
  }

  gl.drawImage(
    giraffeeImgFramesNew,
    // crop giraffe in list of frames
    GIRAFFE_RUNNING_IMG_WIDTH * i,
    0,
    GIRAFFE_RUNNING_IMG_WIDTH,
    GIRAFFE_RUNNING_IMG_HEIGHT,
    -20,
    giraffeY,
    GIRAFFE_SIZE,
    GIRAFFE_SIZE
  );
}

function generateRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * @param gl {CanvasRenderingContext2D}
 */
function drawSlidingBg(gl, status) {
  if (gameIsRunning(status)) {
    backgroundX = Math.floor(backgroundX - walkSpeed / 4) % BACKGROUND_WIDTH;
  }

  gl.drawImage(
    backgroundImg,
    backgroundX,
    -10,
    BACKGROUND_WIDTH,
    BACKGROUND_HEIGHT
  );
  gl.drawImage(
    backgroundImg,
    backgroundX + BACKGROUND_WIDTH,
    -10,
    BACKGROUND_WIDTH,
    BACKGROUND_HEIGHT
  );
}

function setupCanvas(canvas) {
  // Get the device pixel ratio, falling back to 1.
  var dpr = window.devicePixelRatio || 1;
  // Get the size of the canvas in CSS pixels.
  var rect = canvas.getBoundingClientRect();
  // Give the canvas pixel dimensions of their CSS
  // size * the device pixel ratio.
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  var ctx = canvas.getContext("2d");
  // Scale all drawing operations by the dpr, so you
  // don't have to worry about the difference.
  ctx.scale(dpr, dpr);
  return ctx;
}

/**
 * @param gl {CanvasRenderingContext2D}
 */
function drawScore(gl) {
  gl.font = "28px sans-serif";

  const scoreBeaten = bestScore !== 0 && score > bestScore;
  if (scoreBeaten) {
    gl.fillStyle = "white";
  }
  const labelToDisplay =
    "Score: " +
    score +
    (bestScore ? " (Record " + bestScore + ")" : "") +
    (scoreBeaten ? " Record Battu !" : "");
  gl.fillText(labelToDisplay, 10, 30);
  gl.fillStyle = "black";
  gl.fillText("Difficulté : " + difficulty, 10, 60);
}

function gameIsRunning(status) {
  return status === "running";
}

function Game() {
  const [status, setStatus] = useState("running");
  const [canvasRef, tracer] = useCanvas("2d", null, {
    status,
  });

  useEffect(() => {
    canvasRef.current.focus();
  }, []);
  tracer((/** @type {CanvasRenderingContext2D} */ gl, canvas, store) => {
    gl.clearRect(0, 0, WIDTH, HEIGHT);

    drawSlidingBg(gl, store.status);
    drawScore(gl);

    if (!gameIsRunning(store.status)) {
      gl.drawImage(deadGiraffeeImg, 10, giraffeeY, GIRAFFE_SIZE, GIRAFFE_SIZE);
      return;
    }

    tick += 1;
    // gl.fillRect(0, giraffeeY, 0.55 * GIRAFFE_SIZE, GIRAFFE_SIZE);
    if (
      ground_giraffe - giraffeeY < BUSH_SIZE - 20 &&
      bushes.some((b) => b.x <= 0.55 * GIRAFFE_SIZE && b.x > 0)
    ) {
      if (score > bestScore) {
        bestScore = score;
      }

      setStatus("failed");
      return;
    }

    // Increase difficulty
    if (score > 0 && tick % 500 === 0 && difficulty < MAX_DIFFICULTY) {
      difficulty++;
      walkSpeed += WALK_SPEED_COEF;
      jumpSpeed += JUMP_SPEED_COEF;
    }

    // Spawn bushes
    if (tick % (75 - difficulty * 3) === 0) {
      const randomDistance = generateRandomNumber(0.7, 1) * GIRAFFE_SIZE * 15;
      bushes.push({ x: WIDTH + randomDistance });
    }

    // Jump animation
    if (giraffeeJumpDirection === "up") {
      giraffeeY -= jumpSpeed;
      if (giraffeeY <= ground_giraffe - jumpHeight) {
        giraffeeJumpDirection = "down";
      }
    } else if (giraffeeJumpDirection === "down") {
      giraffeeY += jumpSpeed;
      if (giraffeeY >= ground_giraffe) {
        giraffeeJumpDirection = "";
      }
    }

    score += tick % 3 === 0 ? 1 : 0;

    // gl.fillRect(10, giraffeeY, GIRAFFE_SIZE, GIRAFFE_SIZE);
    // gl.drawImage(giraffeeImg, 10, giraffeeY, GIRAFFE_SIZE, GIRAFFE_SIZE);
    animateGiraffe(gl, giraffeeY, walkSpeed);

    bushes = bushes
      .map((b) => {
        b.x -= walkSpeed;
        // gl.fillRect(b.x, HEIGHT - BUSH_SIZE + 15, BUSH_SIZE, BUSH_SIZE);

        gl.drawImage(
          bushImg,
          b.x,
          HEIGHT - BUSH_SIZE + 15,
          BUSH_SIZE,
          BUSH_SIZE
        );
        return b;
      })
      .filter((b) => b.x > -100);
  });

  return (
    <div>
      <canvas
        id="canvas"
        tabIndex={1000}
        onKeyDown={(e) => {
          e.preventDefault();
          if (e.code === "Space" && !Boolean(giraffeeJumpDirection)) {
            giraffeeJumpDirection = "up";
          }
        }}
        onKeyUp={(e) => {
          e.preventDefault();
          if (e.code === "Space" && giraffeeJumpDirection === "up") {
            giraffeeJumpDirection = "down";
          }
        }}
        style={{
          border: "1px solid gray",
          outline: "none",
          transform: "translate3d(0,0,0)",
          width: WIDTH,
          height: HEIGHT,
        }}
        ref={canvasRef}
      />
      <div>
        {status === "failed" && (
          <>
            <button
              onClick={() => {
                reset();
                canvasRef.current.focus();
                setStatus("running");
              }}
            >
              Start again
            </button>
            <br />
            <button
              onClick={() => {
                const canvas = document.getElementById("canvas");

                navigator.clipboard
                  .write([
                    new ClipboardItem({
                      "image/png": new Promise((resolve) =>
                        canvas.toBlob((blob) => resolve(blob))
                      ),
                    }),
                  ])
                  .then(() => {
                    console.log("Copied ! :D");
                    alert("Copied in your clipboard successfully !");
                  })
                  .catch((error) => {
                    console.log(error);
                    const img = canvas.toDataURL("image/png");
                    const link = document.createElement("a");
                    link.href = img;
                    link.download = `girafe-${new Date().getTime()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  });
              }}
            >
              Share
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="App">
      <Game />
    </div>
  );
}

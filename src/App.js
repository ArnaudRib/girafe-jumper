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

function loadImage(url) {
  const image = new Image(60, 45); // Using optional size for image
  image.onload = () => {}; // Draw when image has loaded

  // Load an image of intrinsic size 300x227 in CSS pixels
  image.src = url;

  return image;
}

const giraffeeImg = loadImage("giraffe.png");
const deadGiraffeeImg = loadImage("dead-giraffe.png");
const bushImg = loadImage("bush.png");

const WIDTH = 600 * 1.5;
const HEIGHT = 300 * 1.5;
const GIRAFFE_SIZE = 120;
const BUSH_SIZE = 60;
const ground_giraffe = HEIGHT - GIRAFFE_SIZE;
const jumpHeight = GIRAFFE_SIZE * 2;

const DEFAULT_DIFFICULTY = 1;
const DEFAULT_JUMP_SPEED = 10;
const DEFAULT_WALK_SPEED = 6;

const MAX_DIFFICULTY = 10;
const JUMP_SPEED_COEF = 0;
const WALK_SPEED_COEF = 1;

let tick = 0;
let bushes = [];

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

function generateRandomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function Game() {
  const [status, setStatus] = useState("running");
  const [canvasRef, tracer] = useCanvas("2d", null, {
    status
  });

  useEffect(() => {
    canvasRef.current.focus();
  }, []);
  tracer((/** @type {CanvasRenderingContext2D} */ gl, canvas, store) => {
    gl.clearRect(0, 0, WIDTH, HEIGHT);
    gl.font = "28px sans-serif";
    const labelToDisplay =
      "Score: " + score + (bestScore && " (Record " + bestScore + ")");
    gl.fillText(labelToDisplay, 10, 30);
    gl.fillText("Difficulté : " + difficulty, 10, 60);

    if (store.status !== "running") {
      gl.drawImage(deadGiraffeeImg, 10, giraffeeY, GIRAFFE_SIZE, GIRAFFE_SIZE);
      return;
    }

    tick += 1;
    if (
      ground_giraffe - giraffeeY < BUSH_SIZE - 20 &&
      bushes.some((b) => b.x <= 0.69 * GIRAFFE_SIZE && b.x > 0)
    ) {
      if (score > bestScore) {
        bestScore = score;
      }

      setStatus("failed");
      return;
    }

    // Increase difficulty
    if (score > 0 && tick % 1000 === 0 && difficulty < MAX_DIFFICULTY) {
      difficulty++;
      walkSpeed += WALK_SPEED_COEF;
      jumpSpeed += JUMP_SPEED_COEF;
    }

    // Spawn bushes
    if (tick % 100 === 0) {
      const randomDistance = generateRandomNumber(0.6, 1) * GIRAFFE_SIZE * 15;
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
    gl.drawImage(giraffeeImg, 10, giraffeeY, GIRAFFE_SIZE, GIRAFFE_SIZE);

    bushes = bushes
      .map((b) => {
        b.x -= walkSpeed;
        // gl.fillRect(b.x, HEIGHT - BUSH_SIZE + 10, BUSH_SIZE, BUSH_SIZE);

        gl.drawImage(
          bushImg,
          b.x,
          HEIGHT - BUSH_SIZE + 10,
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
        style={{ border: "1px solid gray" }}
        width={WIDTH}
        height={HEIGHT}
        ref={canvasRef}
      />
      <div>
        {status === "failed" && (
          <button
            onClick={() => {
              reset();
              canvasRef.current.focus();
              setStatus("running");
            }}
          >
            Start again
          </button>
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

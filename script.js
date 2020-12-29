let model; 
let inputElement; 
let waitSpan; 
let displayResult;
let canvas;
let mousePoint = null; 
let touchPoint = null; 
let ctx; 
let strokeWidth = 1; 
let smallCanvas;
let smallCtx; 
let listStroke = []; 
let currentStroke = []; 
let minX; 
let maxX = 0;
let minY;
let maxY = 0; 
let button; 
let div;  
let divPredict; 
let resizeBoard; 

function handleLoad(){
  loadModel();
  // line 5 happens immediately and run the async function in parallel 
  inputElement = document.getElementById('input');
  inputElement.addEventListener('change', handleFile);
  waitSpan = document.getElementById('loading');
  displayResult = document.getElementById('prediction'); 
  button = document.getElementById('clearButton'); 
  button.addEventListener('click', handleClear); 
  div = document.getElementById('drawSide'); 
  divPredict = document.getElementById('predictionContainer');

  resizeBoard = document.getElementById('resizeCanvas');
  resizeCtx = resizeBoard.getContext('2d');


  canvas = document.getElementById('drawBoard');
  canvas.addEventListener('mousedown', handleMouseDown);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('mouseup', handleMouseUp);
  // classifyDigit when you move your mouse up 
  ctx = canvas.getContext('2d');
 
 // Initialize minX and minY
  minX = canvas.width;
  minY = canvas.height; 

  canvas.addEventListener('touchstart', handleTouchStart);
  canvas.addEventListener('touchmove', handleTouchMove);
  canvas.addEventListener('touchend', handleTouchEnd); 

  smallCanvas = document.getElementById('smallBoard');
  smallCtx = smallCanvas.getContext('2d');
  smallCtx.strokeStyle = 'white'; 
  smallCtx.lineWidth = 2; 
 

}
// here is the predict in JavaScript

async function loadModel(){
  model = await tf.loadLayersModel('model.json');
  //async meaning that we dont need to wait for such function to execute
  // async is hard to debug as it does not throw error 
  // await can only be used in function that is async
  waitSpan.classList.toggle('hide');
  inputElement.classList.toggle('hide');
  div.classList.toggle('hide'); 
  // toggling if the class exist then remove, if the class does not exist then add it ( work like switch)
}

function handleFile(){
  // Preprocessing from images to tf here is the code for when the image upload is already in 28x28 MNIST 
  // let file = inputElement.files[0];
  // let image = new Image();
  // image.src = URL.createObjectURL(file);
  // image.addEventListener('load', () => classifyDigit(image));
  // displayImage();

  // Handling resize so that it will work with all size of image 
  let file = inputElement.files[0];
  let image = new Image();
  image.src = URL.createObjectURL(file); 
  image.addEventListener('load', () => {
    resizeCtx.drawImage(image, 0, 0, 28,28);
    classifyDigit(resizeBoard); 
  }); 
}

async function classifyDigit(pixels){
  // variable pixels is expected to be canvas or html elements 
  // displayResult.classList.remove('wait');
  divPredict.classList.remove('wait'); 
  let inputTensor = tf.browser.fromPixels(pixels);
  // make the image black and white 
  inputTensor = inputTensor.mean(-1);

  // reshape
  inputTensor = inputTensor.reshape([1,28,28,1]);

  let output = await model.predict(inputTensor).argMax(1).data(); 

  //Show prediction
  setTimeout(()=>{displayResult.textContent = 'The prediction is ' + output[0];}, 1000);
  
}

function displayImage(event){
  let image = document.getElementById('inputImage');
  image.src = URL.createObjectURL(inputElement.files[0]);
}

function eventToPoint(event){
  let rect = canvas.getBoundingClientRect();
  return [
    (event.clientX - rect.left) * canvas.width / rect.width,
    (event.clientY - rect.top) * canvas.height / rect.height
  ];
}

function eventToTouchPoint(event){
  return eventToPoint(event.touches[event.touches.length - 1]); 
}

function handleMouseMove(event){
  if(mousePoint != null){
    let newPoint = eventToPoint(event);
    ctx.beginPath();
    ctx.moveTo(...mousePoint);
    ctx.lineTo(...newPoint);
    ctx.stroke();

    mousePoint = newPoint; // update the coordinates 
    currentStroke.push(mousePoint); 
  }
  smallCtx.fillStyle = 'black'; 
  smallCtx.fillRect(-1,-1,30,30);
  drawImage(); 
  
   
}

function handleMouseDown(event){
  mousePoint = eventToPoint(event);
  ctx.beginPath();
  ctx.arc(...mousePoint, strokeWidth / 2, 0, 2 * Math.PI);
  ctx.fill(); 
  // ctx.fillRect(...mousePoint,1,1); 
  // spread the mouse point, equivalent to mousePoint[0], mousePoint[1]

  currentStroke.push(mousePoint); 

}

function handleMouseUp(){
  mousePoint = null; 
  listStroke.push(currentStroke);
  currentStroke = []; 

  // Predicting
  smallCtx.fillStyle = 'black'; 
  smallCtx.fillRect(-1,-1,30,30);
  drawImage();
  console.log(tf.browser.fromPixels(smallCanvas).shape);
  classifyDigit(smallCanvas); 
}

function handleTouchMove(event){
  event.preventDefault();
  if(touchPoint != null){
    let newTouchPoint = eventToTouchPoint(event);
    ctx.beginPath();
    ctx.moveTo(...touchPoint);
    ctx.lineTo(...newTouchPoint);
    ctx.stroke();
 
    touchPoint = newTouchPoint; // update the coordinates 
    currentStroke.push(touchPoint); 
  }
  smallCtx.fillStyle = 'black'; 
  smallCtx.fillRect(-1,-1,30,30);
  drawImage();
  
}

function handleTouchStart(event){
  event.preventDefault(); // this is to turn off the default handle with touch screen 
  touchPoint = eventToTouchPoint(event);
  ctx.beginPath();
  ctx.arc(...touchPoint, strokeWidth / 2, 0, 2 * Math.PI);
  ctx.fill(); 

  currentStroke.push(touchPoint); 
}

function handleTouchEnd(){
  touchPoint = null; 
  listStroke.push(currentStroke);
  currentStroke = []; 

  // Predicting
  smallCtx.fillStyle = 'black'; 
  smallCtx.fillRect(-1,-1,30,30);
  drawImage();
  console.log(tf.browser.fromPixels(smallCanvas).shape);
  classifyDigit(smallCanvas);
}

// Resize the image to 28x28 px
function drawImage(){
  if (listStroke.length == 0){
    return; 
  }
  changeCoordinatesStroke(); 
}


function  maxMinX(){ 
  for (let i = 0; i < listStroke.length; i++){
    for (let j = 0; j < listStroke[i].length; j++ ){
      if (listStroke[i][j][0] < minX){
        minX = listStroke[i][j][0]; 
      }

      if (listStroke[i][j][0] > maxX){
        maxX = listStroke[i][j][0]; 
      }
    }
  }
}

function maxMinY(){
  for (let i = 0; i < listStroke.length; i++){
    for (let j = 0; j < listStroke[i].length; j++ ){
      if (listStroke[i][j][1] < minY){
        minY = listStroke[i][j][1]; 
      }

      if (listStroke[i][j][1] > maxY){
        maxY = listStroke[i][j][1]; 
      }
    }
  }
}

function changeCoordinatesStroke(){
  maxMinX();
  maxMinY(); 

  let dx = (maxX - minX); 
  let dy = (maxY - minY); 
  let middleX = (maxX + minX)/2; 
  let middleY = (maxY + minY)/2; 

  let padding = 1/6; 

  let max_X = maxX + dx* padding; 
  let min_X = minX - dx*padding;
  let max_Y = maxY + dy* padding; 
  let min_Y = minY - dy*padding;
  let aX = 28/(max_X - min_X);
  let bX = -28/(max_X - min_X) * min_X;
  let aY = 28/(max_Y - min_Y);
  let bY = -28/(max_Y - min_Y) * min_Y; 
  // Pick a and b
  if (aX > aY){
    aX = aY; 
    bX = 14 - (max_X + min_X)/2 * aX;
  } 
  else{
    aY = aX; 
    bY = 14 - (max_Y + min_Y)/2 * aY;
  }
  
  for (let i = 0; i< listStroke.length; i++ ){
    smallCtx.beginPath();
    let firstPoint = listStroke[i][0]; 
    let x0 = aX * firstPoint[0] + bX;
    let y0 = aY * firstPoint[1] + bY;
    smallCtx.moveTo(x0,y0);
    for (let j = 0; j < listStroke[i].length -1; j++){
      let nextPoint = listStroke[i][j+1];
      // compute the x and y of the point and nextPoint
      let x2 = aX * nextPoint[0] + bX;
      let y2 = aY * nextPoint[1] + bY; 

      smallCtx.lineTo(x2, y2);
      
      
    }
    smallCtx.stroke();
  }
}

function handleClear(){
    ctx.clearRect(0,0,400,400); 
    smallCtx.fillStyle = 'black'; 
    smallCtx.fillRect(-1,-1,30,30);
    listStroke = [];
    // reset 
    minX = canvas.width;
    minY = canvas.height;
    maxX = 0; 
    maxY = 0;
    
    // Hide the prediction
    divPredict.classList.add('wait'); 
  }

window.addEventListener("load", handleLoad);
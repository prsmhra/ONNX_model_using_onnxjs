

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const imageSize = 224;
const photo = document.getElementById('photo');
const stopVideoButton = document.querySelector('#stop-button')
let captureInterval;
// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}
//runing the inferencing in async function using onnx.js
async function runExample(image) {
    // Create an ONNX inference session with WebGL backend.
    const session = new onnx.InferenceSession({ backendHint: 'webgl' });
  
    // Load an ONNX model. This model is SqueezeNet that takes a 1*3*224*224 image and classifies it.
    await session.loadModel("./mobilenet_model_opset_10.onnx");
  
    // load image.
    const imageLoader = new ImageLoader(imageSize, imageSize);
    // const imageData = await imageLoader.getImageData('E:/facepose/onnxjs-master/examples/browser/mobilenet/A_01_+15.Jpg');
    const imageData = await imageLoader.getImageData(image);
    // console.log(imageData)
    // preprocess the image data to match input dimension requirement, which is 1*3*224*224
    const width = imageSize;
    const height = imageSize;
    const preprocessedData = preprocess(imageData.data, width, height);
    // console.log(preprocessedData)
    const inputTensor = new onnx.Tensor(preprocessedData, 'float32', [1, width, height, 3]);
    // console.log(inputTensor)
    // Run model with Tensor inputs and get the result.
    const outputMap = await session.run([inputTensor]);
    const outputData = outputMap.values().next().value.data;
  
    // Render the output result in html.
    // console.log(outputData)
    printMatches(outputData);
}
function preprocess(data, width, height) {
    const dataFromImage = ndarray(new Float32Array(data), [width, height, 4]);
    // console.log(dataFromImage)
    const dataProcessed = ndarray(new Float32Array(width * height * 3), [1, height, width, 3]);
    // console.log(dataProcessed)
  
    // Normalize 0-255 to (-1)-1
    ndarray.ops.subseq(dataFromImage.pick(2, null, null), 103.939);
    ndarray.ops.subseq(dataFromImage.pick(1, null, null), 116.779);
    ndarray.ops.subseq(dataFromImage.pick(0, null, null), 123.68);
    // console.log(dataProcessed)
    // Realign imageData from [224*224*4] to the correct dimension [1*3*224*224].
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 0), dataFromImage.pick(null, null, 2));
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 1), dataFromImage.pick(null, null, 1));
    ndarray.ops.assign(dataProcessed.pick(0, null, null, 2), dataFromImage.pick(null, null, 0));
    // console.log(dataProcessed)
    return dataProcessed.data;
}
// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  const enableWebcamButton = document.getElementById('webcamButton');
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}


// // Enable the live webcam view and start classification.
function enableCam(event) {
  
  // Hide the button.
  event.target.classList.add('removed');  
  
  // getUsermedia parameters.
  const constraints = {
    video: true
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.onplaying=()=>console.log('video is playing stream: ', video.srcObject);
    video.srcObject = stream;
    // streaming = true;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext('2d')

    //grabing the image after x seconds for inferenceing
    const interval = 500;
    captureInterval = setInterval(async()=>{
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0);
      var jpegFile = canvas.toDataURL("image/jpeg");
      // console.log(jpegFile);
      runExample(jpegFile);
    },interval);
    
  });
}

// getting the result and displaying in webpage
function printMatches(data) {
    const cars = ["Front", "Left", "Right"];
    const max = Math.max(...data);
    const idx = data.indexOf(max);
    // console.log(idx);
    const results = cars[idx];
    // console.log("results :" , results)
    predictions.innerHTML = '<h2>'+results+'</h2>';
  }


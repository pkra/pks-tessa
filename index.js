
// image input -- via https://web.dev/media-capturing-images/

fileInput.addEventListener("change", (e) =>
  doSomethingWithFiles(e.target.files)
);

function doSomethingWithFiles(fileList) {
  let file = null;

  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].type.match(/^image\//)) {
      file = fileList[i];
      break;
    }
  }

  if (file !== null) {
    output.src = URL.createObjectURL(file);
    // tesseract (loaded via script)
    // https://github.com/naptha/tesseract.js/blob/master/examples/browser/image-processing.html
    Tesseract.recognize(file, "deu", {
      corePath: './tesseract-core-simd.wasm.js',
      workerPath: "./worker.min.js",
      logger: (m) => console.log(m)
    }).then(
      ({ data: { text } }) => {
        // console.log(text);
        tessOutput.innerHTML = text;
        Speakable.init({
          multivoice: true,
          l18n: {
            play: "Text vorlesen",
            pause: "Pause",
            progress: "Fortschritt",
            stop: "Schließen"
          }
        });
      }
    );
  }
}

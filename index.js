
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
    tessOutput.innerHTML = '';
    // tesseract (loaded via script)
    // https://github.com/naptha/tesseract.js/blob/master/examples/browser/image-processing.html
    Tesseract.recognize(file, "deu", {
      corePath: './tesseract-core-simd.wasm.js',
      workerPath: "./worker.min.js",
      logger: (m) => console.log(m)
    }).then(
      ({ data: { text } }) => {
        if (!text) return;
        // console.log(text);
        text.split('\n').forEach(substring => {
          tessOutput.insertAdjacentHTML('beforeend', `<p>${substring}</p>`);
        })

        tessOutput.querySelectorAll('p').forEach(p => {
          const substring = p.innerHTML;
          p.innerHTML = '';
          substring.split(' ').forEach(word => { if (word) p.insertAdjacentHTML('beforeend', `<span>${word}</span> `) })
        })

      }
    );
  }
}

let ssu = new SpeechSynthesisUtterance();
ssu.lang = "de";

let controller;

const manualMove = (forward) => {
  const increment = forward ? +1 : -1
  const spans = [...tessOutput.querySelectorAll('span')];
  const currentIndex = spans.findIndex(node => node.hasAttribute('style'));
  if (forward && (currentIndex === spans.length - 1)) {
    if (play.checked) play.click()
    return;
  }
  const next = spans[currentIndex + increment] || spans[0];
  // console.log(next)
  next.style.backgroundColor = 'yellow';
  spans[currentIndex]?.removeAttribute('style');
  window.speechSynthesis.cancel();
  ssu.text = next.textContent;
  window.speechSynthesis.speak(ssu);
}
vor.addEventListener('click', manualMove.bind(null, true));
zurück.addEventListener('click', manualMove.bind(null, false));


const automaticMove = () => {
  if (play.checked) {
    controller = new AbortController;
    ssu.addEventListener('end', () => { manualMove(true) }, { signal: controller.signal });
    manualMove(true);
  }
  else {
    controller.abort();
  }
}
play.addEventListener('click', automaticMove);


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

const play = (forward) => {
  const increment = forward ? +1 : -1
  const spans = [...tessOutput.querySelectorAll('span')];
  const currentIndex = spans.findIndex(node => node.hasAttribute('style'));
  const next = spans[currentIndex + increment] || spans[0];
  // console.log(next)
  next.style.backgroundColor = 'yellow';
  spans[currentIndex]?.removeAttribute('style');
  window.speechSynthesis.cancel();
  let ssu = new SpeechSynthesisUtterance(next.textContent);
  ssu.lang = "de";

  window.speechSynthesis.speak(ssu);
}
vor.addEventListener('click', play.bind(null, true));
zurück.addEventListener('click', play.bind(null, false));


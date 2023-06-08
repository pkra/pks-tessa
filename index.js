
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
    
    // Indicate processing
    // Spinner SVG copyright (c) Utkarsh Verma under MIT License (MIT), https://github.com/n3r4zzurr0/svg-spinners/blob/abfa05c49acf005b8b1e0ef8eb25a67a7057eb20/svg-smil/bars-scale.svg#LL1C1-L1C1

    tessOutput.innerHTML = 'Texterkennung arbeitet <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="6" width="2.8" height="12"><animate id="spinner_CcmT" begin="0;spinner_IzZB.end-0.1s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="0;spinner_IzZB.end-0.1s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="5.8" y="6" width="2.8" height="12"><animate begin="spinner_CcmT.begin+0.1s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.1s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="10.6" y="6" width="2.8" height="12"><animate begin="spinner_CcmT.begin+0.2s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.2s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="15.4" y="6" width="2.8" height="12"><animate begin="spinner_CcmT.begin+0.3s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.3s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="20.2" y="6" width="2.8" height="12"><animate id="spinner_IzZB" begin="spinner_CcmT.begin+0.4s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.4s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect></svg>';
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
        // clear output
        tessOutput.innerHTML = '';
        // Add tesseract results
        text.split('\n').forEach(substring => {
          tessOutput.insertAdjacentHTML('beforeend', `<p>${substring}</p>`);
        })

        tessOutput.querySelectorAll('p').forEach(p => {
          const substring = p.innerHTML;
          p.innerHTML = '';
          substring.split(' ').forEach(word => { if (word) p.insertAdjacentHTML('beforeend', `<span>${word}</span> `) })
        })

        // enable UI
        document.querySelectorAll('[disabled]').forEach(node => node.removeAttribute('disabled'))
        document.querySelectorAll('[hidden]').forEach(node => node.removeAttribute('hidden'));
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

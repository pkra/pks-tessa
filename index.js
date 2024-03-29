if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js", {
    scope: "./",
  });
}

// image input -- via https://web.dev/media-capturing-images/

fileInput.addEventListener("change", (e) =>
  doSomethingWithFiles(e.target.files)
);

async function doSomethingWithFiles(fileList) {
  let file = null;

  for (let i = 0; i < fileList.length; i++) {
    if (fileList[i].type.match(/^image\//)) {
      file = fileList[i];
      break;
    }
  }

  if (file !== null) {
    output.src = URL.createObjectURL(file);

    const wrappers = document.querySelectorAll('.wrapper');
    wrappers[0].setAttribute('hidden', '');

    // Indicate processing
    // Spinner SVG copyright (c) Utkarsh Verma under MIT License (MIT), https://github.com/n3r4zzurr0/svg-spinners/blob/abfa05c49acf005b8b1e0ef8eb25a67a7057eb20/svg-smil/bars-scale.svg#LL1C1-L1C1

    const spinner = document.createElement('div');
    spinner.classList.add('wrapper');
    spinner.innerHTML = 'Bitte warten <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="6" width="2.8" height="12"><animate id="spinner_CcmT" begin="0;spinner_IzZB.end-0.1s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="0;spinner_IzZB.end-0.1s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="5.8" y="6" width="2.8" height="12"><animate begin="spinner_CcmT.begin+0.1s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.1s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="10.6" y="6" width="2.8" height="12"><animate begin="spinner_CcmT.begin+0.2s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.2s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="15.4" y="6" width="2.8" height="12"><animate begin="spinner_CcmT.begin+0.3s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.3s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect><rect x="20.2" y="6" width="2.8" height="12"><animate id="spinner_IzZB" begin="spinner_CcmT.begin+0.4s" attributeName="y" calcMode="spline" dur="0.6s" values="6;1;6" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/><animate begin="spinner_CcmT.begin+0.4s" attributeName="height" calcMode="spline" dur="0.6s" values="12;22;12" keySplines=".36,.61,.3,.98;.36,.61,.3,.98"/></rect></svg>'
    wrappers[0].insertAdjacentElement('afterend', spinner);

    // run tesseract (loaded via script)
    const worker = await Tesseract.createWorker("deu", 1, {
      workerPath: './tesseract/worker.min.js',
      langPath: '.',
      corePath: './tesseract',
    });
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
        spinner.remove()
        if (!text) {
          tessOutput.innerHTML = '😞 Es tut mir leid, da ist etwas schief gegangen. <br> Bitte versuche es noch einmal oder frage um Hilfe.'
          return;
        }
        // console.log(text);
        // toggle instruction step highlight to Step 2
        document.querySelectorAll('.instruction').forEach(node => node.classList.toggle('instruction--active'));
        step2.focus();

        // clear output
        tessOutput.innerHTML = '';
        // Add tesseract results
        text.split('\n').forEach(substring => {
          tessOutput.insertAdjacentHTML('beforeend', `<p>${substring}</p>`);
        })

        tessOutput.querySelectorAll('p').forEach(p => {
          const substring = p.innerHTML;
          p.innerHTML = '';
          substring.split(' ').forEach(word => { if (word) p.insertAdjacentHTML('beforeend', `<span tabindex="0">${word}</span> `) })
        })

        // enable UI
        document.querySelectorAll('[disabled]').forEach(node => node.removeAttribute('disabled'))
        wrappers[1].removeAttribute('hidden');
        document.querySelector('details[hidden]').removeAttribute('hidden');
      }
}

let ssu = new SpeechSynthesisUtterance();
ssu.lang = "de";

let controller;

const presentWord = (wordElement) => {
  // clear old word if any
  tessOutput.querySelector('span[data-currentWord]')?.removeAttribute('data-currentWord');
  
  // set current word and speak t
  wordElement.setAttribute('data-currentWord', '');
  window.speechSynthesis.cancel();
  ssu.text = wordElement.textContent;
  window.speechSynthesis.speak(ssu);

}

const manualMove = (forward) => {
  const increment = forward ? +1 : -1
  const spans = [...tessOutput.querySelectorAll('span')];
  const currentIndex = spans.findIndex(node => node.hasAttribute('data-currentWord'));
  if (forward && (currentIndex === spans.length - 1)) {
    if (play.checked) play.click()
    return;
  }
  const next = spans[currentIndex + increment] || spans[0];
  next.focus();
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

// enable click/touch to read
document.body.addEventListener('focusin', (event) => {
  const ocrWord = event.target.closest('span[tabindex="0"]');
  if (ocrWord) presentWord(ocrWord);
})


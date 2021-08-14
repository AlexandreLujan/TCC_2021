function handleFileSelect(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    try {
        var files = evt.dataTransfer.files;
    } catch (e) {
        var files = evt.target.files;
    }

    var output = [];
    for (var i = 0, f; f = files[i]; i++) {
        var reader = new FileReader();

        reader.onload = (function (o) {
            return function (e) {
                // Get the image file as a buffer
                var buf = new Uint8Array(e.currentTarget.result);

                // Get the RAW metadata
                var metadata = dcraw(buf, { verbose: true, identify: true }).split('\n').filter(String);

                // Create the display elements
                var id = btoa(o.name).replace(/=/g, '');
                //var id = window.btoa(encodeURIComponent(o.name).replace(/=/g, ''));
                //var id = Buffer.from(o.name, 'base64').replace(/=/g, '');
                var elem = `
                    <div class="mdl-cell mdl-cell--4-col mdl-card mdl-shadow--2dp">
                        <div class="mdl-card__title mdl-card--expand">
                        <h2 class="mdl-card__title-text">${o.name}</h2>
                        </div>
                        <div class="mdl-card__media">
                            <img class="thumbnail" id="${'thumb-' + id}">
                        </div>
                        <div class="mdl-card__supporting-text">
                        <ul><li>${metadata.join('</li><li>')}</li></ul>
                        </div>
                    </div>
                    `;

                document.getElementById('list').innerHTML += elem;

                // Extract the thumbnail
                var thumbnail = dcraw(buf, { extractThumbnail: true });

                // Create thumbnail
                var blob = new Blob([thumbnail], { type: "image/jpeg" });
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(blob);
                var img = document.querySelector("#thumb-" + id);
                img.src = imageUrl;
            };
        })(f);

        reader.readAsArrayBuffer(f);
    }
}

function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
}

// Setup listeners.
var dropZone = document.getElementById('drop');
dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);

var fileInput = document.getElementById('files');
fileInput.addEventListener('change', handleFileSelect, false);
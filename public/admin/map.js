document.addEventListener('DOMContentLoaded', function() {
    var mapBtn = document.getElementById('show-map-btn');
    var mapModal = document.getElementById('map-modal');
    var closeBtn = document.getElementsByClassName('close-btn')[0];
    var mapContent = document.getElementsByClassName('map-content')[0];

    mapBtn.onclick = function() {
        mapModal.style.display = 'block';
    }

    closeBtn.onclick = function() {
        mapModal.style.display = 'none';
    }

    window.onclick = function(event) {
        if (event.target == mapModal) {
            mapModal.style.display = 'none';
        }
    }

    mapContent.onclick = function() {
        if (mapContent.classList.contains('zoomed')) {
            mapContent.classList.remove('zoomed');
            mapContent.style.transform = 'scale(1)';
        } else {
            mapContent.classList.add('zoomed');
            mapContent.style.transform = 'scale(2)';
        }
    }
});

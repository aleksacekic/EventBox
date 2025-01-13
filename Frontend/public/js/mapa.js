function initMap() {

  
  var mapOptions = {
    center: { lat: 44.2107675, lng: 20.9224158}, // Pocetni centar mape
    zoom: 7, // Pocetni nivo zumiranja mape(namesteno da se vidi SRBIJA)
  };

  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Dodavanje oznacavanja mesta dogadjaja na klik mape
  map.addListener("click", function (event) {
    placeMarker(event.latLng, map);
  });

  // Oznacavanje mesta dogadjaja
  function placeMarker(latLng, map) {
    var marker = new google.maps.Marker({
      position: latLng,
      map: map,
    });

    // Cuvanje koordinata oznacenog mesta u promenljivoj (ili bazi podataka kasnij)
    var latitude = latLng.lat();
    var longitude = latLng.lng();

    // ovde ide obrada oznacenog mesta npr slanje podataka serveru
    
  }
}

// Pozivanje funkcije za inicijalizaciju mape
initMap();


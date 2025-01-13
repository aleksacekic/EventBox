function prikaziTekstOstalo() {
  var formOstalo = document.getElementById("form-ostalo");
  formOstalo.style.display = "block";
}

function sakrijTekstOstalo() {
  var formOstalo = document.getElementById("form-ostalo");
  formOstalo.style.display = "none";
}

function prikaziPopupFormu(event) {
  event.preventDefault();

  var overlay = document.getElementById("popup-overlay");
  var form = document.getElementById("popup-form");

  overlay.style.display = "block";
  form.style.display = "block";
}

function sakrijPopupFormu() {
  sakrijTekstOstalo(); 
  var overlay = document.getElementById("popup-overlay");
  var form = document.getElementById("popup-form");

  overlay.style.display = "none";
  form.style.display = "none";
}

function otkaziPrijavu() {
  sakrijPopupFormu();
}

function submitForm() {
  var selectedOption = document.querySelector('input[name="opcija"]:checked').value;
  var tekstOstalo = document.getElementById("tekst-ostalo").value;

  
  // ovde moze da se doda kod za obradu prijave
  console.log("Odabrana opcija:", selectedOption);
  console.log("Unesen tekst (Ostalo):", tekstOstalo);
  
  sakrijPopupFormu();
}





// Dodali smo event listener na promenu odabira opcije
var options = document.querySelectorAll('input[name="opcija"]');
options.forEach(function(option) {
  option.addEventListener("change", function() {
    if (option.value !== "ostalo") {
      sakrijTekstOstalo();
    }
  });
});


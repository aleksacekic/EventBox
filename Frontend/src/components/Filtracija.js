import React from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import {useEffect,useState} from 'react'
import { registerLocale } from "react-datepicker"
import srLatn from "date-fns/locale/sr-Latn";
import { format } from 'date-fns';
import Dogadjaj from './Dogadjaj'
import Cookies from 'js-cookie'

function Filtracija() {
//#region 
// FUNKCIJA ZA OTVARANJE-ZATVARANJE radio-buttona KOD FILTRIRANJA !
 function toggleDiv(id) {
  var div = document.getElementById(id);
  var otherDiv = (id === 'div1') ? 'div2' : 'div1';
  
  if (div.style.display === 'block') { 
    div.style.display = 'none';
  } else {
    div.style.display = 'block';
    document.getElementById(otherDiv).style.display = 'none';
  }
}
//#endregion

const [filtriraniDogadjaji, setFiltriraniDogadjaji] = useState([]);

  const [date, setDate] = useState(new Date());
  const [brojPosiljke, setBrojPosiljke] = useState(1);
  const [ukupnoElemenata, setUkupnoElemenata] = useState(0);

    const pretraziDogadjaje = async (e) => {
      try {
        const formattedDate = format(date, 'yyyy-MM-dd');
        const url = `http://localhost:5153/Dogadjaj/VratiDogadjajePoDatumu/${formattedDate}/${brojPosiljke}/${ukupnoElemenata}`;
  
        const response = await fetch(url);
        //console.log(response);
        const data = await response.json();
       // console.log(data);
        setFiltriraniDogadjaji(data.dogadjaji);
      } catch (error) {
        console.error(error);
      }
    };


return (
    <div>
      <div className="radio-div">
                        <p className="filtriraj">Filtriraj sve dogadjaje po:</p>
                        <label className="radio-label radio-label1" htmlFor="radio1">
                          <img src="images/date32.ico" />
                          <input type="radio" className="radio-input" name="exampleRadios" id="radio1" defaultValue="option1" onClick={() => toggleDiv('div1')} />Datum
                        </label>
                        <label className="radio-label radio-label2" htmlFor="radio2">
                          <img src="images/abc96.png" />
                          <input type="radio" className="radio-input" name="exampleRadios" id="radio2" defaultValue="option2" onClick={() => toggleDiv('div2')} />Naziv
                        </label>
                      </div>
                      <div id="div1" style={{display: 'none'}}>
                        <h2 />
                        <div className="pretrazivanje-datum">
                          <div className="div-naslov">
                            <h3>Pretrazi po datumu:</h3>
                          </div>
                          <div className="suggestion-usd">
                          <div>
                          <DatePicker
                              locale="sr-Latn" //srpski jezik
                              minDate={new Date()}
                              dateFormat="dd.MM.yyyy" // ormat datuma(01.01.2001)
                              dayClassName={(date) =>
                                date.getDay() === 0 || date.getDay() === 6 ? "weekend-day" : ""
                              } 
                              //value={datum} onChange=//{handleDatumChange}
                              selected={date}
                              onChange={(date) => setDate(date)}
                              placeholderText="Izaberite datum"
                              // inline
                          />                      
                          
                          </div>
                          </div>
                          <button className="pretrazi-button" onClick={pretraziDogadjaje}>Pretrazi</button>		
                        </div>
                        <p />
                      </div>
                      <div id="div2" style={{display: 'none'}}>
                        <h2 />
                       <div className="pretrazivanje-naziv">
                          <div className="div-naslov">
                            <h3>Pretrazi po nazivu:</h3>
                            
                          </div>
                          <p className="suggestion-usd">
                            <input className="datum-input" type="text" />
                          </p>
                          <button className="pretrazi-button" type="submit">Pretrazi</button>		
                        </div> 
                        <p />
                      </div>
                      {filtriraniDogadjaji.length > 0 ? (
        <Dogadjaj filtriraniDogadjaji={filtriraniDogadjaji} pretraziDogadjaje={pretraziDogadjaje}/>
      ) : (
        <p>No filtered events found.</p>
      )}
                    
    </div>
  );
}

export default Filtracija
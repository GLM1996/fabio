//import { timeFrame } from "./util.js";

const servidor = 'https://backendembededapp.onrender.com'
//const servidor = 'http://localhost:5500'


let agents = [];
let agentSelected = [];
let calls


const selectAgent = document.getElementById("select_agent");
const tbody = document.getElementById('tablaDatos')
const tbodyModal = document.getElementById('tablaDatosModal')
const spinner = document.getElementById('spinner')

const textTime = Number(document.getElementById('text_time').value)
const wrapUp = Number(document.getElementById('wrap_up').value)
const ringTime = Number(document.getElementById('ring_time').value)


//TODO-----------------------------------------------------Funciones al cargar la pagina-------------------------------

document.addEventListener("DOMContentLoaded", async () => {
  let fecha = new Date();
  //fecha.setDate(fecha.getDate() - 1); // Restar un día

  let mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Asegurar dos dígitos en el mes
  let dia = String(fecha.getDate()).padStart(2, '0'); // Asegurar dos dígitos en el día

  document.getElementById('start_date').value = `${fecha.getFullYear()}-${mes}-${dia}`;

  agents = await getAgents();
  cargarSelectAgent();
});

async function getAgents() {
  const url = `${servidor}/api/reportingFabio/searchAgents`
  try {
    const response = await fetch(url)
    if (!response.ok) {
      console.log('Error')
    }
    const data = await response.json()
    return data
  } catch (error) {

  }
}

function cargarSelectAgent() {
  for (let i = 0; i < agents.length; i++) {
    const option = document.createElement("option");

    option.setAttribute("id", agents[i].id);
    option.textContent = agents[i].name;

    selectAgent.appendChild(option);
  }
}

//TODO-----------------------------------------------------Funciones al cargar la pagina-------------------------------

//!--------------------------------------------------------Funciones de los addEventlistener---------------------------

let enlaces = document.querySelectorAll('.nav-link');

enlaces.forEach(enlace => {
  enlace.addEventListener('click', () => {

    let enlaceActivo = document.querySelector('.nav-link.active'); // Aseguramos que sea un .nav-link

    if (enlaceActivo) {
      enlaceActivo.classList.remove('active'); // Solo si existe
    }
    if(enlace.textContent === 'Reportes'){
      document.getElementById('sheetReports').hidden = false
      document.getElementById('sheetAgents').hidden = true
    }else{
      document.getElementById('sheetReports').hidden = true
      document.getElementById('sheetAgents').hidden = false
    }
    enlace.classList.add('active');
  });
});

document.getElementById("search").addEventListener("click", async () => {

  tbody.innerHTML = ''
  document.getElementById('summary').hidden = false

  spinner.hidden = false

  let timeZone = '-08:00'
  let callFilters = []
  let calls = await buscar();

  //Llenando datos summary
  let callMade = 0
  let callReceived = 0
  let callConnected = 0
  let callConversation = 0
  let callMissed = 0
  let talkTime = 0

  let banderaCall = true

  let timeFrame = hoursArray(Number(document.getElementById('start_hours').value), Number(document.getElementById('end_hours').value))

  for (let i = 0; i < timeFrame.length; i++) {

    let countTimeCall = 0
    const uniquePersons = new Set();
    let clientTarget = 0
    let callFind = []
    let textMessages = []

    let start_date = new Date(convertirDateUTC(document.getElementById('start_date').value, timeFrame[i].start_date, timeZone))
    let end_date = new Date(convertirDateUTC(document.getElementById('start_date').value, timeFrame[i].end_date, timeZone))

    let remainingCall = []

    for (const call of calls) {
      if (call.isIncoming === false) {
        const callDate = new Date(call.created);

        if (callDate >= start_date && callDate < end_date) {
          callFind.push(call);
          countTimeCall += call.duration;
          uniquePersons.add(call.personId);
          //textMessages = await cargarText(call.personId, start_date, end_date); // Esperar el resultado

          if (call.duration >= 90) {
            clientTarget++;
          }
        } else {
          remainingCall.push(call)
        }
        if (banderaCall) {
          callMade++
          if (call.duration >= 60) {
            callConnected++
          }
          if (call.duration >= 120) {
            callConversation++
          }
          talkTime += call.duration


        }
      } else {
        if (banderaCall) {
          callReceived++
          if (call.duration >= 60) {
            callConnected++
          }
          if (call.duration >= 120) {
            callConversation++
          }
          talkTime += call.duration

          if (call.duration === 0) {
            callMissed++
          }
        }
      }
    }
    //textMessages = await cargarText(uniquePersons, start_date, end_date); // Esperar el resultado
    //let cantTextMessages = textMessages.reduce((acc, currentValue) => acc + currentValue, 0);
    const clientIntent = uniquePersons.size;

    callFilters.push({
      'agent': selectAgent.value,
      'timeFrame': timeFrame[i].start_date + ' - ' + timeFrame[i].end_date,
      'timeCall': countTimeCall,
      'calls': callFind,
      'clientIntent': clientIntent,
      'clientTarget': clientTarget,
      'textMessages': 0
    })

    calls = remainingCall

    banderaCall = false
  }
  document.getElementById('call_made').textContent = callMade
  document.getElementById('call_received').textContent = callReceived
  document.getElementById('call_connected').textContent = callConnected
  document.getElementById('call_conversations').textContent = callConversation
  document.getElementById('call_talk_time').textContent = formatTime(talkTime)
  document.getElementById('call_missed').textContent = callMissed

  renderizarDatos(callFilters)

  spinner.hidden = true
});

//!--------------------------------------------------------Funciones de los addEventlistener---------------------------

//TODO--------------------------------------------------------Funciones utiles---------------------------

function convertirDateUTC(fecha, hours, timeZone) {

  let formatDate = fecha + 'T' + hours + timeZone
  const localDate = new Date(formatDate); // '-06:00' especifica que la hora es UTC-6

  // Convertir a UTC
  const utcDate = localDate.toISOString(); // Esto te da la fecha en formato UTC (ISO 8601)

  return utcDate
}
function convertUTCToLocal(dateUTC) {
  const date = new Date(dateUTC); // Interpretar la fecha como UTC

  const hours = date.getUTCHours().toString().padStart(2, '0'); // Asegurar dos dígitos
  const mins = date.getUTCMinutes().toString().padStart(2, '0'); // Asegurar dos dígitos
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');

  return `${hours - 8}:${mins}:${seconds}`;
}


let hoursArray = (hourStart, hourEnd) => {
  let result = [];

  for (let i = hourStart; i < hourEnd; i++) {
    result.push({
      start_date: i.toString().padStart(2, '0') + ":00:00", // Agrega un '0' si es necesario
      end_date: (i + 1).toString().padStart(2, '0') + ":00:00"
    });
  }

  return result;
};
function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

//TODO--------------------------------------------------------Funciones utiles---------------------------

//!-----------------------------------------------------------Funciones renderizar datos---------------------------

function renderizarDatos(data) {

  data.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.agent /*Name Agente*/}</td>
        <td>${item.timeFrame /*Horario del Dia*/}</td>
        <td>${formatTime(item.timeCall) /*Tiempo de Llamada*/}</td>
        <td>${item.calls.length /*Intentos*/}</td>
        <td>${item.clientIntent /*Clientes Intentados*/}</td>
        <td>${item.clientTarget /*Clientes Alcanzados*/}</td> 
        <td>${item.textMessages /*Contador de mensajes*/}</td> 
        <td>${item.clientIntent > 0 ? (item.calls.length / item.clientIntent).toFixed(2) : 0 /*Intentos x clientes*/}</td>
        <td>${item.clientIntent > 0 && item.clientTarget > 0 ? (item.clientTarget / item.clientIntent).toFixed(2) : 0 /*Contactabilidad */}</td> 
        <td>${((item.calls.length * ringTime) + (item.clientIntent * wrapUp) + (0 * textTime) + (item.timeCall / 60)).toFixed(2)/*Tiempo de gestion */}</td>
        <td>Not Yet</td>
    `;

    row.addEventListener('click', () => {
      renderizarDatosModal(item.timeFrame, item.calls)
      const modal = new bootstrap.Modal(document.getElementById('exampleModal'));
      modal.show();
    })
    row.style.cursor = 'pointer'
    tbody.appendChild(row);
  });
}

function renderizarDatosModal(timeFrame, data) {
  tbodyModal.innerHTML = ''
  document.getElementById('modalTitle').textContent = `Horario: ${timeFrame}`
  data.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><a href="https://homelasvegasnevada.followupboss.com/2/people/view/${item.personId}" target="_blank">${item.name}</a></td>
        <td>${item.duration}</td>
        <td>${item.startedAt ? convertUTCToLocal(item.startedAt) : ''}</td>
    `;
    tbodyModal.appendChild(row);
  });

}

//!-----------------------------------------------------------Funciones renderizar datos---------------------------

async function buscar() {
  // Obtener la opción seleccionada y la fecha
  const optionSelected = selectAgent.options[selectAgent.selectedIndex];
  let selectedDate = document.getElementById("start_date").value;

  let calls = [];

  // Definir el día específico y la zona horaria
  const diaEspecifico = selectedDate;
  const zonaHoraria = 6; // Ajuste de zona horaria  

  // Crear fechas de inicio y fin del día en UTC
  const inicioDia = new Date(`${diaEspecifico}T00:00:00Z`);
  const finDia = new Date(`${diaEspecifico}T23:59:59Z`);

  // Ajustar las fechas según la zona horaria
  const inicioAjustado = new Date(
    inicioDia.getTime() + (zonaHoraria * 60 * 60 * 1000)
  );
  const finAjustado = new Date(
    finDia.getTime() + (zonaHoraria * 60 * 60 * 1000)
  );

  // Convertir a formato ISO (UTC)
  const inicioUTC = inicioAjustado.toISOString();
  const finUTC = finAjustado.toISOString();

  const bodyData = {
    id: Number(optionSelected.id),
    inicioUTC: inicioUTC,
    finUTC: finUTC
  }
  const url = `${servidor}/api/reportingFabio/searchCalls`
  const options = {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify(bodyData), // Enviar el cuerpo de la solicitud
  };

  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error al buscar llamadas:", error);
    throw error;
  }
  /*const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Basic " + btoa(API_KEY + ":"),
    },
  };
  try {
    let url = `https://api.followupboss.com/v1/calls?sort=-created&createdAfter=${inicioUTC}&createdBefore=${finUTC}&limit=100`;

    while (url) {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error("Error al obtener las llamadas");
      }

      const result = await response.json();
      const data = result.calls;

      // Agregar los datos al array de llamadas
      calls.push(...data.filter(call => call.userId === Number(optionSelected.id)
      ));

      // Obtener la URL de la próxima página
      url = result._metadata.nextLink;
    }
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error al obtener las llamadas: " + error.message);
  }

  return calls; // Retornar las llamadas para su uso posterior*/
}

async function cargarTextPerson(personId, start_date, end_date) {

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Basic " + btoa(API_KEY + ":"),
    },
  };

  try {
    let url = `https://api.followupboss.com/v1/textMessages?personId=${personId}?sort=-created&createdAfter=${start_date}&createdBefore=${end_date}`;

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error("Error al obtener los texts");
    }
    const result = await response.json();

    return result

  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error al obtener las llamadas: " + error.message);
  }


}
async function cargarText(listPeerson, start_date, end_date) {


  let listId = [...listPeerson]

  if (listId.length !== 0) {
    // Usar Promise.all() para hacer las solicitudes en paralelo
    const textMessages = await Promise.all(listId.map(async (personId) => {
      let cantidad = 0; // Definir cantidad antes de usarla

      if (personId) {
        // Esperar a que la función cargarTextPerson se resuelva
        const textmessages = await cargarTextPerson(personId, start_date, end_date);

        // Asegurarse de que textmessages tiene la propiedad _metadata y verificar el total
        if (textmessages._metadata && textmessages._metadata.total !== 0) {
          // Filtrar los mensajes donde el userId sea igual al selectAgent.id
          const filteredMessages = textmessages.filter(message => message.userId === selectAgent.id);

          // Asignar la cantidad de mensajes filtrados
          cantidad = filteredMessages.length;
        }
      }
      // Retornar la cantidad de mensajes filtrados
      return cantidad;
    }));
    // Mostar el resultado final
    return textMessages
  } else {
    return [0]
  }
}


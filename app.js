const servidor = 'https://backendembededapp.onrender.com'
//const servidor = 'http://localhost:5500'

var config;
var ctx_bar = document.getElementById('grafica_barra').getContext('2d');
var miGrafica_bar = new Chart(ctx_bar, config);

let agents = [];
let agentSelected = [];
let calls

const selectAgent = document.getElementById("select_agent");
const selectTimeZona = document.getElementById("time_zone");
const selectAgentGrphic = document.getElementById("select_agent_graphic")

const tbody = document.getElementById('tablaDatos')
const tbodyModal = document.getElementById('tablaDatosModal')
const spinner = document.getElementById('spinner')

let textTime = Number(document.getElementById('text_time').value)
let wrapUp = Number(document.getElementById('wrap_up').value)
let ringTime = Number(document.getElementById('ring_time').value)

let timeZone = selectTimeZona.value

//TODO-----------------------------------------------------Funciones al cargar la pagina-------------------------------

//Se ejecuta al cargar el HTML
document.addEventListener("DOMContentLoaded", async () => {
  let fecha = new Date();
  //fecha.setDate(fecha.getDate() - 1); // Restar un día

  let mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Asegurar dos dígitos en el mes
  let dia = String(fecha.getDate()).padStart(2, '0'); // Asegurar dos dígitos en el día

  document.getElementById('start_date').value = `${fecha.getFullYear()}-${mes}-${dia}`;

  agents = await getAgents();
  cargarSelectAgent();
  await getReport()
});
//Obtiene los agentes de Follow Boss del Grupo VA
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
//Llena los select con los nombres de los Agentes
function cargarSelectAgent() {
  for (let i = 0; i < agents.length; i++) {
    const option = document.createElement("option");

    option.setAttribute("id", agents[i].id);
    option.textContent = agents[i].name;

    const option1 = document.createElement("option");

    option1.setAttribute("id", agents[i].id);
    option1.textContent = agents[i].name;

    selectAgent.appendChild(option);
    selectAgentGrphic.appendChild(option1);
  }
}
//Optiene la configuracion guardada de H start, H end .... desde Mongo DB
async function getReport() {
  try {
    // Petición GET al servidor
    const url = `${servidor}/api/mongoose/agentReport/getReport`
    const response = await fetch(url);
    const result = await response.json();

    if (response.ok) {
      // Rellenar los inputs con los datos recibidos
      document.getElementById("start_hours").value = result.hoursStart;
      document.getElementById("end_hours").value = result.hoursEnd;
      document.getElementById("text_time").value = result.textTime;
      document.getElementById("wrap_up").value = result.wrapUp;
      document.getElementById("ring_time").value = result.ringTime;
      document.getElementById("time_zone").value = result.timeZone;

      document.getElementById("start_hours_config").value = result.hoursStart;
      document.getElementById("end_hours_config").value = result.hoursEnd;
      document.getElementById("text_time_config").value = result.textTime;
      document.getElementById("wrap_up_config").value = result.wrapUp;
      document.getElementById("ring_time_config").value = result.ringTime;
      document.getElementById("time_zone_config").value = result.timeZone;

    } else {
      console.log("No se encontró el reporte.");
    }
  } catch (error) {
    console.log("Error al obtener el reporte: " + error.message);
  }
}

//TODO-----------------------------------------------------Funciones al cargar la pagina-------------------------------

//!--------------------------------------------------------Funciones de los addEventlistener---------------------------

//Para controlar el comportamiento de los link del menu
let enlaces = document.querySelectorAll('.nav-link');

enlaces.forEach(enlace => {
  enlace.addEventListener('click', () => {

    let enlaceActivo = document.querySelector('.nav-link.active'); // Aseguramos que sea un .nav-link

    if (enlaceActivo) {
      enlaceActivo.classList.remove('active'); // Solo si existe
    }
    if (enlace.textContent === 'Reportes') {
      document.getElementById('sheetReports').hidden = false
      document.getElementById('sheetAgents').hidden = true

    } else {
      document.getElementById('sheetReports').hidden = true
      document.getElementById('sheetAgents').hidden = false
    }
    enlace.classList.add('active');
  });
});
//Se encarga de realizar las busquedas
document.getElementById("search").addEventListener("click", async () => {

  tbody.innerHTML = ''
  document.getElementById('summary').hidden = false

  spinner.hidden = false


  //let timeZone = '-08:00'
  let callFilters = []
  let calls = await buscar();

  timeZone = selectTimeZona.value
  textTime = Number(document.getElementById('text_time').value)
  wrapUp = Number(document.getElementById('wrap_up').value)
  ringTime = Number(document.getElementById('ring_time').value)

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
    let dataTime = ajustarFechaTimeFrame(timeFrame[i])
    if (uniquePersons.size !== 0) {
      let listId = [...uniquePersons]
      try {
        const url = `${servidor}/api/reportingFabio/searchTextMessages`
        const options = {
          method: 'POST',
          headers: {
            accept: 'application/json',
            'content-type': 'application/json'
          }, body: JSON.stringify({
            listId: listId,
            inicioUTC: dataTime.inicioUTC,
            finUTC: dataTime.finUTC
          })
        };
        const response = await fetch(url, options)
        if (!response.ok) {
          throw new Error(`Error en la solicitud: ${response.statusText}`);
        }
        const data = await response.json();
        textMessages = data
      } catch (error) {
        console.error("Error al buscar textMessages:", error);
        throw error;
      }
    } else {
      textMessages = []
    }

    const clientIntent = uniquePersons.size;

    callFilters.push({
      'agent': selectAgent.value,
      'timeFrame': timeFrame[i].start_date + ' - ' + timeFrame[i].end_date,
      'timeCall': countTimeCall,
      'calls': callFind,
      'clientIntent': clientIntent,
      'clientTarget': clientTarget,
      'textMessages': textMessages
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
  //const localDate = new Date(formatDate); // '-06:00' especifica que la hora es UTC-6

  // Convertir a UTC
  //const utcDate = localDate.toISOString(); // Esto te da la fecha en formato UTC (ISO 8601)

  return formatDate
}
function convertUTCToLocal(dateUTC) {
  const date = new Date(dateUTC); // Interpretar la fecha como UTC

  const hours = date.getUTCHours().toString().padStart(2, '0'); // Asegurar dos dígitos
  const mins = date.getUTCMinutes().toString().padStart(2, '0'); // Asegurar dos dígitos
  const seconds = date.getUTCSeconds().toString().padStart(2, '0');
  const selectedOption = selectTimeZona.options[selectTimeZona.selectedIndex];
  const zonaHoraria = Number(selectedOption.getAttribute("data-zona"));
  return `${hours - zonaHoraria}:${mins}:${seconds}`;
}
//Crea los time frame o horarios Ej: 09:00:00 - 10:00:00
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
//Convierte de segundos a minutos
function formatTime(seconds) {
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
//Ajusta la fecha a formato UTC
function ajustarFecha() {
  // Obtener la opción seleccionada y la fecha
  let selectedDate = document.getElementById("start_date").value;

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

  return { inicioUTC: inicioUTC, finUTC: finUTC }
}
function ajustarFechaTimeFrame(timeFrame) {
  // Obtener la opción seleccionada y la fecha

  let selectedDate = document.getElementById("start_date").value;

  // Definir el día específico y la zona horaria
  const diaEspecifico = selectedDate;
  //const zonaHoraria = 8; // Ajuste de zona horaria  
  const selectedOption = selectTimeZona.options[selectTimeZona.selectedIndex];
  const zonaHoraria = Number(selectedOption.getAttribute("data-zona"));
  //const zonaHoraria = document.getElementById('time_zone')
  // Crear fechas de inicio y fin del día en UTC
  const inicioDia = new Date(`${diaEspecifico}T${timeFrame.start_date}Z`);
  const finDia = new Date(`${diaEspecifico}T${timeFrame.end_date}Z`);

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

  return { inicioUTC: inicioUTC, finUTC: finUTC }
}

//TODO--------------------------------------------------------Funciones utiles---------------------------

//!-----------------------------------------------------------Funciones renderizar datos---------------------------

//Llena los datos de la tabla principal
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
        <td>${item.textMessages.length /*Contador de mensajes*/}</td> 
        <td>${item.clientIntent > 0 ? (item.calls.length / item.clientIntent).toFixed(2) : 0 /*Intentos x clientes*/}</td>
        <td>${item.clientIntent > 0 && item.clientTarget > 0 ? (item.clientTarget / item.clientIntent).toFixed(2) : 0 /*Contactabilidad */}</td> 
        <td>${((item.calls.length * ringTime) + (item.clientIntent * wrapUp) + (item.textMessages.length * textTime) + (item.timeCall / 60)).toFixed(2)/*Tiempo de gestion */}</td>
        <td>${(((item.calls.length * ringTime) + (item.clientIntent * wrapUp) + (item.textMessages.length * textTime) + (item.timeCall / 60)) / 0.6).toFixed(2)/*Ocupancy */} %</td>
    `;

    row.addEventListener('click', () => {
      renderizarDatosModal(item.timeFrame, item.calls, item.textMessages)
      const modal = new bootstrap.Modal(document.getElementById('exampleModal'));
      modal.show();
    })
    row.style.cursor = 'pointer'
    tbody.appendChild(row);
  });
}
//Llena los datos de la tabla del modal
function renderizarDatosModal(timeFrame, data, dataMessages) {

  tbodyModal.innerHTML = ''
  document.getElementById('modalTitle').textContent = `Horario: ${timeFrame}`

  let dataMessagesSet = new Set()

  data.forEach(item => {
    let messages = [];

    // Verificamos si ya hemos procesado este `personId`
    if (!dataMessagesSet.has(item.personId)) {
      dataMessagesSet.add(item.personId); // Agregar el `personId` al `Set`
      messages = dataMessages.filter(msg => msg.personId === item.personId);
    } else {
      messages = [];
    }
    const row = document.createElement("tr");
    row.innerHTML = `
        <td><a href="https://homelasvegasnevada.followupboss.com/2/people/view/${item.personId}" target="_blank">${item.name}</a></td>
        <td>${item.duration}</td>
        <td>${item.startedAt ? convertUTCToLocal(item.startedAt) : ''}</td>
        <td>${messages.length ? messages.length : 0}</td>
    `;
    tbodyModal.appendChild(row);
  });

}

//!-----------------------------------------------------------Funciones renderizar datos---------------------------

//funcion que busca las calls solicitando al servidor
async function buscar() {
  const optionSelected = selectAgent.options[selectAgent.selectedIndex];
  let data = ajustarFecha()
  let inicioUTC = data.inicioUTC
  let finUTC = data.finUTC

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

}

//TODO------------------------------------------Graficas---------------------------------------------

//Metodod para graficar
function GraficBara(ctx_bar) {
  const labels = ['a', 'b', 'b'];

  const data = {
    labels: labels,
    datasets: [{
      label: 'My First Dataset',
      data: [65, 59, 80, 81, 56, 55, 40],
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 205, 86, 0.2)',
        'rgba(75, 192, 192, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(201, 203, 207, 0.2)'
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(255, 205, 86)',
        'rgb(75, 192, 192)',
        'rgb(54, 162, 235)',
        'rgb(153, 102, 255)',
        'rgb(201, 203, 207)'
      ],
      borderWidth: 1
    }]
  };

  const config = {
    type: 'bar',
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      }
    },
  };

  return new Chart(ctx_bar, config);;
}

document.getElementById('graphic').addEventListener('click', () => {
  let timeFrame = hoursArray(Number(document.getElementById('start_hours_graphic').value), Number(document.getElementById('end_hours_graphic').value))

  miGrafica_bar.destroy()
  miGrafica_bar = GraficBara(ctx_bar);
})

//TODO------------------------------------------Graficas---------------------------------------------

//*---------------------------------------------MONGO DB----------------------------------------------

//Salva la nueva configuracion en Mongo DB
let saveConfig = document.getElementById('save_config')

saveConfig.addEventListener("click", async () => {
  // Capturar valores de los inputs
  const data = {
    hoursStart: parseFloat(document.getElementById("start_hours_config").value),
    hoursEnd: parseFloat(document.getElementById("end_hours_config").value),
    textTime: parseFloat(document.getElementById("text_time_config").value),
    wrapUp: parseFloat(document.getElementById("wrap_up_config").value),
    ringTime: parseFloat(document.getElementById("ring_time_config").value),
    timeZone: (document.getElementById("time_zone_config").value)
  };
  
  try {
    // Petición POST al servidor
    const url = `${servidor}/api/mongoose/agentReport/update`
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    }
    const response = await fetch(url, options);

    if (response.ok) {
      showToast('Config saved', 0)
    } else {
      showToast(`Error: ${response.status} Error: ${response.statusText}`, 1)
    }
  } catch (error) {
    alert("Error al enviar los datos: " + error.message);
  }
});
//Muestra el mensaje 
function showToast(message, valor) {
  const toast = document.getElementById('text-oculto');
  toast.textContent = message;
  toast.style.display = 'flex';

  if (valor === 0) {
    toast.style.color = 'green'
  } else {
    toast.style.color = 'darkred'
  }

  // Desvanecer y ocultar el toast después de 3 segundos
  setTimeout(() => {
    toast.style.opacity = '0'; // Desvanecer el toast
    setTimeout(() => {
      toast.style.display = 'none'; // Ocultar el toast completamente
      toast.style.opacity = '1'; // Restablecer la opacidad para el siguiente uso
    }, 300); // Tiempo de la animación de desvanecimiento
  }, 3000); // Mostrar durante 3 segundos
}

//*---------------------------------------------MONGO DB----------------------------------------------


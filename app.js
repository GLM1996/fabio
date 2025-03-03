//import { timeFrame } from "./util.js";

const API_KEY = "fka_0fIGCHDzG4WXvR0orU2B6eal6VhS8Sx29N";
let agents = [];
let agentSelected = [];
let calls

const selectAgent = document.getElementById("select_agent");
const tbody = document.getElementById('tablaDatos')
const tbodyModal = document.getElementById('tablaDatosModal')
const spinner = document.getElementById('spinner')

const textTime = document.getElementById('text_time').value
const wrapUp = document.getElementById('wrap_up').value
const ringTime = document.getElementById('ring_time').value

let enlaces = document.querySelectorAll('.nav-link');

enlaces.forEach(enlace => {
  enlace.addEventListener('click', () => {
    let enlaceActivo = document.querySelector('.nav-link.active'); // Aseguramos que sea un .nav-link

    if (enlaceActivo) {
      enlaceActivo.classList.remove('active'); // Solo si existe
    }

    enlace.classList.add('active');
  });
});



document.addEventListener("DOMContentLoaded", async () => {
  let fecha = new Date();
  let mes = String(fecha.getMonth() + 1).padStart(2, '0'); // Sumar 1 y asegurar dos dígitos
  let dia = String(fecha.getDate()).padStart(2, '0'); // Asegurar dos dígitos
  document.getElementById('start_date').value = `${fecha.getFullYear()}-${mes}-${dia}`;

  agents = await getAgent();
  cargarSelectAgent();
});

async function getTeam() {
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Basic " + btoa(API_KEY + ":"),
    },
  };
  const url =
    "https://api.followupboss.com/v1/teams/2";

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("Consulta incorrecta");
  }
  const data = await response.json();
  return data;
}

async function getAgent() {

  let listUsersId = await getTeam()
  console.log(listUsersId.userIds)

  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: "Basic " + btoa(API_KEY + ":"),
    },
  };
  const url =
    "https://api.followupboss.com/v1/users?limit=100&offset=0&role=Agent&includeDeleted=false";

  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error("Consulta incorrecta");
  }
  const data = await response.json();

  const filteredData = data.users.filter(item => listUsersId.userIds.includes(item.id));

  return filteredData;
}

function cargarSelectAgent() {
  for (let i = 0; i < agents.length; i++) {
    const option = document.createElement("option");

    option.setAttribute("id", agents[i].id);
    option.textContent = agents[i].name;

    selectAgent.appendChild(option);
  }
}

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


  const options = {
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
      calls.push(...data.filter(call => call.isIncoming === false && call.userId === Number(optionSelected.id)
      ));


      // Obtener la URL de la próxima página
      url = result._metadata.nextLink;
    }
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error al obtener las llamadas: " + error.message);
  }
  return calls; // Retornar las llamadas para su uso posterior
}

function convertirDateUTC(fecha, hours, timeZone) {

  let formatDate = fecha + 'T' + hours + timeZone
  const localDate = new Date(formatDate); // '-06:00' especifica que la hora es UTC-6

  // Convertir a UTC
  const utcDate = localDate.toISOString(); // Esto te da la fecha en formato UTC (ISO 8601)

  return utcDate
}
function convertUTCToLocal(dateUTC) {
  const date = new Date(dateUTC); // Convierte la fecha UTC en un objeto Date 

  // Ajusta la fecha para la zona horaria
  date.setHours(date.getHours());

  return date;
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

async function cargarText(personId, start_date, end_date) {

  let calls = [];
  let cantidad = 0

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
    console.log(result)
    cantidad = result._metadata.total
    // console.log(cantidad)
    return cantidad
  } catch (error) {
    console.error("Error:", error);
    throw new Error("Error al obtener las llamadas: " + error.message);
  }
}

document.getElementById("search").addEventListener("click", async () => {

  tbody.innerHTML = ''

  spinner.hidden = false

  let timeZone = '-06:00'
  let callFilters = []
  calls = await buscar();

  let timeFrame = hoursArray(Number(document.getElementById('start_hours').value), Number(document.getElementById('end_hours').value))

  for (let i = 0; i < timeFrame.length; i++) {

    let countTimeCall = 0
    const uniquePersons = new Set();
    let clientTarget = 0
    let callFind = []
    let textMessages

    let start_date = new Date(convertirDateUTC(document.getElementById('start_date').value, timeFrame[i].start_date, timeZone))
    let end_date = new Date(convertirDateUTC(document.getElementById('start_date').value, timeFrame[i].end_date, timeZone))

    /*calls.forEach(call => {
      const callDate = new Date(call.created);

      if (callDate >= start_date && callDate < end_date) {
        callFind.push(call)
        countTimeCall += call.duration
        uniquePersons.add(call.personId)
       const  text = await cargarText(call.personId, start_date, end_date)
        if (call.duration >= 90) {
          clientTarget++
        }
      }
    })*/
    for (const call of calls) {
      const callDate = new Date(call.created);

      if (callDate >= start_date && callDate < end_date) {
        callFind.push(call);
        countTimeCall += call.duration;
        uniquePersons.add(call.personId);
        //textMessages = await cargarText(call.personId, start_date, end_date); // Esperar el resultado
        if (call.duration >= 90) {
          clientTarget++;
        }
      }
    }

    const clientIntent = uniquePersons.size;

    callFilters.push({
      'agent': selectAgent.value,
      'timeFrame': timeFrame[i].start_date + ' - ' + timeFrame[i].end_date,
      'timeCall': countTimeCall,
      'calls': callFind,
      'clientIntent': clientIntent,
      'clientTarget': clientTarget
      //'textMessages': textMessages
    })
  }
  renderizarDatos(callFilters)

  spinner.hidden = true
});

function renderizarDatos(data) {

  data.forEach(item => {
    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${item.agent}</td>
        <td>${item.timeFrame}</td>
        <td>${(item.timeCall / 60).toFixed(2)}</td>
        <td>${item.calls.length}</td>
        <td>${item.clientIntent}</td>
        <td>${item.clientTarget}</td> 
        <td>${item.clientTarget}</td> 
        <td>${ item.clientIntent > 0 ? (item.calls.length / item.clientIntent).toFixed(2) : 0}</td>
        <td>${ item.clientIntent > 0 && item.clientTarget > 0 ? (item.clientTarget / item.clientIntent).toFixed(2) : 0}</td>       
    `;
    row.addEventListener('click', () => {
      renderizarDatosModal(item.timeFrame, item.calls)
      const modal = new bootstrap.Modal(document.getElementById('exampleModal'));
      modal.show();
    })
    row.style.cursor = 'pointer'
    tbody.appendChild(row);
  });
  //resumen
 /* const row = document.createElement("tr");
  row.innerHTML = `
        <td>Resumen</td>
        <td>${calls.length}</td>
        <td>${calls.length}</td>
        <td>${calls.length}</td>
    `;
  row.className = 'fila_resumen'
  tbody.appendChild(row);*/

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
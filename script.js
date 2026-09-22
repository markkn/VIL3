// VIL Trivia Game Script
// Assumes elements: #addTeam, #teamList, #csvInput, #jeopardyBoard, #modal, #modalContent

let teams = [
  { name: "Team 1", points: 0 },
  { name: "Team 2", points: 0 }
];

let questions = [];
let headers = [];
let currentQuestion = null;
let showingAnswer = false;
let selectedTeams = new Set();

// TEAM RENDERING
function renderTeams() {
  const teamList = document.getElementById('teamList');
  teamList.innerHTML = '';

  teams.forEach((team, index) => {
    const div = document.createElement('div');
    div.className = 'team';

    const input = document.createElement('input');
    input.value = team.name;

    input.addEventListener('change', e => {
      team.name = e.target.value;
    });

    // Points row (number and buttons inline)
    const pointsRow = document.createElement('div');
    pointsRow.className = 'team-points-row';

    const points = document.createElement('span');
    points.textContent = team.points;

    const add = document.createElement('button');
    add.textContent = '+';
    add.onclick = () => {
      team.points += 100;
      renderTeams();
    };

    const sub = document.createElement('button');
    sub.textContent = '-';
    sub.onclick = () => {
      team.points -= 100;
      renderTeams();
    };

    pointsRow.appendChild(points);
    pointsRow.appendChild(add);
    pointsRow.appendChild(sub);

    div.appendChild(input);
    div.appendChild(pointsRow);

    teamList.appendChild(div);
  });
}

document.getElementById('addTeam').onclick = () => {
  teams.push({
    name: `Team ${teams.length + 1}`,
    points: 0
  });

  renderTeams();
};

renderTeams();


// CSV PARSING AND BOARD BUILDING
function parseCSV(text) {
  // Simple CSV parser
  const rows = text
    .trim()
    .split(/\r?\n/)
    .map(r => r.split(','));

  headers = rows[0].map(h => h.trim());

  const qArr = [];

  for (let i = 0; i < headers.length; i++) {
    qArr[i] = [];
  }

  for (let i = 1; i < rows.length; i += 2) {
    const qRow = rows[i];
    const aRow = rows[i + 1];

    if (!aRow) continue; // skip incomplete

    for (let j = 0; j < headers.length; j++) {
      qArr[j].push({
        category: headers[j],
        question: qRow[j] ? qRow[j].trim() : '',
        answer: aRow[j] ? aRow[j].trim() : '',
        value: ((i - 1) / 2 + 1) * 100,
        used: false
      });
    }
  }

  questions = qArr;
}


function buildBoard() {
  const table = document.getElementById('jeopardyBoard');
  table.innerHTML = '';

  // Header Row
  const tr = document.createElement('tr');

  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    tr.appendChild(th);
  });

  table.appendChild(tr);

  // Find max number of questions per category
  const maxRows = Math.max(...questions.map(qs => qs.length));

  // Build question rows
  for (let i = 0; i < maxRows; i++) {
    const row = document.createElement('tr');

    for (let j = 0; j < headers.length; j++) {
      const cell = document.createElement('td');
      const qObj = questions[j][i];

      if (qObj && qObj.question) {
        cell.textContent = qObj.used ? "" : qObj.value;

        if (qObj.used) {
          cell.classList.add('used');
        }

        cell.addEventListener('click', () => {
          if (!qObj.used) {
            currentQuestion = qObj;
            showingAnswer = false;
            showModal(currentQuestion.question);
          }
        });
      } else {
        cell.textContent = '';
        cell.classList.add('disabled');
      }

      row.appendChild(cell);
    }

    table.appendChild(row);
  }
}


// CSV UPLOAD HANDLER
document.getElementById('csvInput').addEventListener('change', function(e) {
  const file = e.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(event) {
    parseCSV(event.target.result);
    buildBoard();
  };

  reader.readAsText(file);
});


// MODAL FUNCTIONALITY
function showModal(content) {
  showingAnswer = false;
  selectedTeams.clear();

  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');

  modal.classList.remove('hidden');
  modalContent.innerHTML = content;

  modal.onclick = () => {
    if (!showingAnswer) {
      showingAnswer = true;
      showAnswerScreen();
    }
  };
}


function showAnswerScreen() {
  const modalContent = document.getElementById('modalContent');

  modalContent.innerHTML = '';

  const answer = document.createElement('div');
  answer.textContent =
    currentQuestion && currentQuestion.answer
      ? currentQuestion.answer
      : 'No answer available.';

  modalContent.appendChild(answer);

  const teamSelect = document.createElement('div');
  teamSelect.className = 'teamSelect';

  teams.forEach((team, index) => {
    const button = document.createElement('button');

    button.textContent = team.name;
    button.dataset.teamIndex = index;

    button.onclick = event => {
      event.stopPropagation();
      toggleTeam(index, button);
    };

    teamSelect.appendChild(button);
  });

  modalContent.appendChild(teamSelect);

  const submitButton = document.createElement('button');
  submitButton.textContent = 'Submit';
  submitButton.className = 'submitAnswer';

  submitButton.onclick = event => {
    event.stopPropagation();
    submitAnswer();
  };

  modalContent.appendChild(submitButton);
}


// TEAM SELECTION
function toggleTeam(index, button) {
  if (!teams[index]) return;

  if (selectedTeams.has(index)) {
    selectedTeams.delete(index);
    button.classList.remove('selected');
  } else {
    selectedTeams.add(index);
    button.classList.add('selected');
  }
}


// SUBMIT ANSWER
function submitAnswer() {
  if (!currentQuestion) return;

  selectedTeams.forEach(index => {
    if (teams[index]) {
      teams[index].points += currentQuestion.value;
    }
  });

  currentQuestion.used = true;

  renderTeams();
  buildBoard();
  closeModal();
}


// CLOSE MODAL
function closeModal() {
  document.getElementById('modal').classList.add('hidden');

  showingAnswer = false;
  selectedTeams.clear();
}


// ESCAPE MODAL WITH ESC KEY
document.addEventListener('keydown', function(e) {
  if (e.key === "Escape") {
    closeModal();
  }
});

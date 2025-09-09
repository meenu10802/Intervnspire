console.log('Concepts script loaded');

// Store Chart.js instance and totalQuestions globally
let chartInstance = null;
let totalQuestions = 0;

async function loadConcepts() {
    const questionList = document.getElementById('question-list');
    questionList.innerHTML = '<li>Loading...</li>';
    try {
        console.log(`Fetching questions for topic '${topic}'`);
        const response = await fetch(`/api/${topic.toUpperCase()}/questions`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        console.log('Concepts response:', response.status, 'URL:', `/api/${topic.toUpperCase()}/questions`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fetch failed:', response.status, errorText);
            if (response.status === 401) {
                questionList.innerHTML = '<li>Please log in to view secrets</li>';
                return;
            }
            if (response.status === 500) {
                questionList.innerHTML = '<li>Server error: ' + errorText + '</li>';
                return;
            }
            throw new Error(`HTTP error: ${response.status} - ${errorText}`);
        }
        const questions = await response.json();
        console.log('Questions fetched:', questions.length, 'Sample:', questions.slice(0, 3));
        questionList.innerHTML = '';
        if (questions.length === 0) {
            console.log('No questions returned from server');
            questionList.innerHTML = '<li>No questions found for this topic.</li>';
            return;
        }

        totalQuestions = questions.length; // Store totalQuestions globally
        console.log('Total questions set to:', totalQuestions);

        questions.forEach((q, index) => {
            const isCompleted = q.completedBy ? q.completedBy.includes(getUserId()) : false;
            const note = q.notes && q.notes.find(n => n.userId === getUserId()) ? q.notes.find(n => n.userId === getUserId()).content : '';
            const li = document.createElement('li');
            li.className = 'question-item';
            li.innerHTML = `
                <div class="question-header">
                    <div class="question-left">
                        <input type="checkbox" id="complete-${q._id}" ${isCompleted ? 'checked' : ''} onchange="markCompleted('${q._id}', this)">
                        <span onclick="toggleAnswer(${index})">${q.question}</span>
                    </div>
                    <div class="question-right">
                        <label for="complete-${q._id}" id="label-${q._id}" class="${isCompleted ? 'completed' : ''}">${isCompleted ? 'Completed' : 'Complete'}</label>
                        <button class="note-toggle" onclick="toggleNoteEditor('${q._id}')">Note</button>
                    </div>
                </div>
                <div class="answer" id="answer-${index}" style="display: none;">${q.answer}</div>
                <div class="note-editor" id="note-editor-${q._id}" style="display: none;">
                    <textarea id="note-${q._id}" placeholder="Write your notes...">${note}</textarea>
                    <button onclick="saveNote('${q._id}')">Save Note</button>
                </div>
            `;
            questionList.appendChild(li);
        });

        await updateProgress(totalQuestions);
    } catch (err) {
        console.error('Error loading questions:', err.message, err.stack);
        questionList.innerHTML = '<li>Error: Failed to load questions. ' + err.message + '</li>';
    }
}

function toggleAnswer(index) {
    console.log(`Toggling answer ${index}`);
    const answerDiv = document.getElementById(`answer-${index}`);
    answerDiv.style.display = answerDiv.style.display === 'none' ? 'block' : 'none';
}

function toggleNoteEditor(questionId) {
    console.log(`Toggling note editor for question ${questionId}`);
    const noteEditor = document.getElementById(`note-editor-${questionId}`);
    noteEditor.style.display = noteEditor.style.display === 'none' ? 'block' : 'none';
    noteEditor.classList.toggle('active', noteEditor.style.display === 'block');
}

async function markCompleted(questionId, checkbox) {
    console.log(`Marking question ${questionId} as completed: ${checkbox.checked}`);
    const label = document.getElementById(`label-${questionId}`);
    try {
        const response = await fetch('/api/questions/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ questionId, topic: topic.toUpperCase(), completed: checkbox.checked }),
        });
        const responseText = await response.text();
        console.log('Mark complete response:', response.status, responseText);
        if (!response.ok) {
            console.error('Mark complete failed:', response.status, responseText);
            throw new Error(`Failed to mark as completed: ${responseText}`);
        }
        const data = JSON.parse(responseText);
        console.log('Progress received:', data.progress);
        document.getElementById('progress-bar').value = data.progress;
        document.getElementById('progress-text').textContent = `Progress: ${Math.round(data.progress * 1000) / 10}%`;

        label.textContent = checkbox.checked ? 'Completed' : 'Complete';
        console.log('Before toggle:', label.classList.contains('completed'));
        label.classList.toggle('completed', checkbox.checked);
        console.log('After toggle:', label.classList.contains('completed'));
        updateChart(totalQuestions, data.progress);
    } catch (err) {
        console.error('Error marking completed:', err.message);
        checkbox.checked = !checkbox.checked;
        label.textContent = checkbox.checked ? 'Completed' : 'Complete';
        console.log('Before toggle (error):', label.classList.contains('completed'));
        label.classList.toggle('completed', checkbox.checked);
        console.log('After toggle (error):', label.classList.contains('completed'));
    }
}

async function saveNote(questionId) {
    console.log(`Saving note for question ${questionId}`);
    try {
        const content = document.getElementById(`note-${questionId}`).value;
        const response = await fetch('/api/questions/save-note', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ questionId, content }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Save note failed:', errorText);
            throw new Error('Failed to save note');
        }
        console.log('Note saved successfully');
    } catch (err) {
        console.error('Error saving note:', err.message);
    }
}

async function updateProgress(totalQuestions) {
    try {
        const response = await fetch(`/api/questions/progress/${topic.toUpperCase()}`, {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Fetch progress failed:', errorText);
            throw new Error('Failed to fetch progress');
        }
        const data = await response.json();
        console.log('Update progress received:', data.progress);
        document.getElementById('progress-bar').value = data.progress;
        document.getElementById('progress-text').textContent = `Progress: ${Math.round(data.progress * 10) / 10}%`;
        updateChart(totalQuestions, data.progress);
    } catch (err) {
        console.error('Error fetching progress:', err.message);
    }
}

function updateChart(totalQuestions, progress) {
    if (!totalQuestions || !progress || totalQuestions <= 0) {
        console.error('Invalid chart data: Total:', totalQuestions, 'Progress:', progress);
        return;
    }
    const completedQuestions = Math.round(progress * totalQuestions);

    console.log('Updating chart: Total:', totalQuestions, 'Completed:', completedQuestions, 'Progress:', progress);
    const canvas = document.getElementById('completion-chart');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Failed to get canvas context');
        return;
    }
    // Destroy previous chart instance if it exists
    if (chartInstance) {
        console.log('Destroying previous chart instance');
        chartInstance.destroy();
    }
    try {
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Remaining'],
                datasets: [{
                    data: [completedQuestions, totalQuestions - completedQuestions],
                    backgroundColor: ['#00b7eb', '#4682b4'],
                    borderColor: ['#ffffff', '#ffffff'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: { family: 'Roboto Slab', size: 14 },
                            color: '#fff'
                        }
                    }
                }
            }
        });
        console.log('New chart instance created');
    } catch (err) {
        console.error('Error creating chart:', err.message);
    }
}

// Initialize
loadConcepts();